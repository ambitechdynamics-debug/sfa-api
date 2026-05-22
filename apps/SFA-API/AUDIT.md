# Audit du pipeline STUDIO FLYER AI — Création de visuel

*Audit produit le 2026-05-22 — couvre l'API SFA-API au commit `319cd51`.
Auteur : analyse assistée par Claude.*

## 0. Résumé exécutif

Le pipeline va du chat dashboard à la livraison d'un PNG/JPG Cloudinary
en **environ 23 étapes** réparties sur 8 modules (`chat`, `conversations`,
`projects`, `memory`, `agents`, `orchestrator`, `image-generation`,
`files`). Globalement il **fonctionne** : la chaîne est complète, les
status `Project.status` reflètent l'avancement, et le rendu final est
servi via URL Cloudinary directe.

**Verdict global : à durcir avant montée en charge.** Le squelette est
bon mais sept faiblesses sapent la fiabilité et la qualité perçue :

1. **Bug write/read sur la base artistique** : l'orchestrateur écrit
   `M_BA` (underscore), le générateur d'image lit `M-BA` (tiret). Les
   références layout/style ne parviennent jamais à Gemini en production.
   Conséquence : tous les visuels sont générés *sans* l'image de
   référence sélectionnée par l'Artistic Base Agent.

2. **Agent Safety déclaré mais jamais invoqué.** Les règles interdites
   (`ForbiddenRule`, `M-INTERDITS`) sont stockées et synchronisées, mais
   aucun appel ne filtre M-PROMPT1 avant la génération. Le score Quality
   non plus n'est jamais bloquant côté image-gen.

3. **Catches silencieux** à 4 endroits critiques (sauvegarde M_SMS,
   Image Analyst, Quality Agent, fetch des images de référence). Un
   échec ne remonte ni à l'utilisateur ni aux logs structurés.

4. **Duplication mémoire** `M_X` (système) vs `M-X` (tiret) — 7 paires
   redondantes sur 31 `MemoryDefinition`. Le runtime ne lit que les
   underscore (sauf l'incident #1). Les variantes tiret sont des
   fantômes qui polluent l'admin UI et masquent les vrais conflits.

5. **6 agents « stub »** (FileManager, Memory, ProjectContext, Revision,
   Safety, Variation) enregistrés en DB avec leur prompt système écrit,
   mais aucun code path ne les invoque. Visibles dans l'admin, inutiles
   en runtime.

6. **Pas de retry Cloudinary, pas de timeout sur QUESTIONING, pas
   d'endpoint d'export dédié.** Un échec réseau perd une variante, un
   client qui ferme le chat laisse un projet bloqué, et l'app dépend
   entièrement de l'URL Cloudinary brute pour tout (preview, download,
   social, print).

7. **Configuration opaque** : 6 variables d'environnement écrasent
   silencieusement les `AppSetting` quand celles-ci sont vides ; les
   dimensions d'image et les 13 règles interdites par défaut sont
   hardcodées dans le code TypeScript.

**Cycle de génération typique** : 30–60 s par appel
`/generate-final-prompt` (7 agents en cascade) + 10–30 s par variante
image (parallèle). **Réduction de cycle estimée si les 7 ruptures
ci-dessus sont corrigées : 15 à 25 %** (gain principal sur
parallélisation des agents indépendants + retry rapide Cloudinary +
suppression du second appel Quality redondant).

---

## 1. API de création de visuel (US-001)

### Constat

Le client touche au moins **6 routes** dans l'ordre suivant pour
produire un visuel :

| Étape | Méthode | Route | Module |
|---|---|---|---|
| 1 | POST | `/api/chat/opening` | `chat` (ajouté commit `319cd51`) |
| 2 | POST | `/api/chat` | `chat` |
| 3 | POST | `/api/projects/{id}/files` | `files` |
| 4 | POST/PATCH | `/api/projects/{id}/memories/{key}` | `memory` |
| 5 | POST | `/api/projects/{id}/generate-final-prompt` | `orchestrator` |
| 6 | POST | `/api/projects/{id}/generate-images` | `image-generation` |
| 7 (lecture) | GET | `/api/projects/{id}/generated-posters` | `image-generation` |

Toutes ces routes passent par `authMiddleware`. Le montage est défini
dans `src/app.ts:131-151` ; à noter l'ordre du middleware admin :
`app.ts:139-145` documente explicitement que les sous-routes
`/api/admin/*` doivent être déclarées avant `adminRoutes`.

L'orchestrateur expose un seul point d'entrée
`POST /api/projects/:projectId/generate-final-prompt`
(`promptOrchestrator.routes.ts:15-18`), et la génération d'image expose
deux verbes :
`POST /generate-images` + `GET /generated-posters`
(`imageGen.routes.ts:11`).

**Validation** : `chat.validation.ts:15-25` impose `message ≤ 8000
caractères`, `history ≤ 40` ; `chat.validation.ts:30-36` ajoute le
nouveau schéma `chatOpeningRequestSchema` qui exige uniquement
`projectId`. Côté generate-images : `imageGen.validation.ts` autorise
`variations` entre 1 et 8 (`imageGen.service.ts:110` clamp défensif).

### Risque

- **Pas de versioning d'API** : tout est `/api/...` sans `/v1/`. Tout
  changement de payload casse les clients en prod sans warning.
- **Permissions** : `adminRoutes` filtre par `req.user?.role === 'ADMIN'`
  (`admin.routes.ts:15-20`), `projects/files/memory` se contentent de
  l'`authMiddleware` (ownership vérifié au service) ; pas de mécanisme
  RBAC unifié, chaque module redécide.
- **Endpoint `/api/showcase/visuals`** déclaré directement dans
  `app.ts:83-129` au lieu d'un module dédié — incohérent avec le reste,
  et bypasse `morgan`/`error.middleware` pour la logique applicative.

### Suggestion

Stabiliser une convention `/api/v1/...`, déplacer `/api/showcase` dans
son propre module, et formaliser la **liste des routes
clientes officielles** dans un document OpenAPI ou au minimum un README
à côté de `app.ts`. Aujourd'hui un nouveau développeur doit lire tous
les modules pour reconstituer la séquence client.

---

## 2. Logique de génération et livraison (US-002)

### Constat

**Pipeline de génération** (`imageGen.service.ts:104-180`) :

1. Vérifie l'accès au projet (`ensureProjectAccess`).
2. Lit `M_PROMPT1` (avec fallback sur `M-PROMPT1`) →
   `getPrompt1Content` ligne 37-46.
3. Lit `M-BA` (tiret, ligne 65) pour récupérer `selected_model_url` et
   `selected_style_url`.
4. Calcule l'aspect ratio depuis `project.format`
   (`ratioFromFormat` ligne 24-32).
5. Passe `project.status = GENERATING`.
6. Instancie le provider via `createImageGenProvider`
   (`imageGen.providers.ts:204-220`).
7. Lance N variantes (1 à 8, défaut 4) en parallèle via
   `Promise.allSettled` (ligne 120).
8. Pour chaque variante : `adapter.generate()` →
   `storage.uploadFile()` → création `GeneratedPoster`.
9. Si **toutes** échouent : `status = FAILED` + throw 502. Sinon
   `status = GENERATED`.

**Providers image disponibles** (`imageGen.providers.ts`) :

- **`MockImageProvider`** (ligne 52-73) — `picsum.photos`, seed
  déterministe basée sur SHA-1 du prompt. Utile en dev, **strictement
  cosmétique** : ignore complètement le contenu sémantique du prompt.
- **`GeminiImageProvider`** (ligne 93-192) — Google Generative Language
  API, modèle `gemini-2.5-flash-image-preview`. Accepte les images
  layout/style en base64 inline (ligne 120-146). Renvoie une image PNG
  base64 décodée en `Buffer`.
- **`openai-image`** déclaré (ligne 216) mais lève `501 Not Implemented`.

**Livraison** : aucune. L'URL `secure_url` Cloudinary retournée par
`storage.uploadFile` est stockée dans `GeneratedPoster.imageUrl` et
servie telle quelle au client. Aucun endpoint `/export`, `/download`,
`/resize` n'existe. Le client doit appliquer lui-même les
transformations Cloudinary (`?w=...`, `?q=...`) ou rediriger vers
l'URL.

### Risque

- **Bug write/read M_BA / M-BA** : l'orchestrateur écrit `M_BA`
  underscore (`promptOrchestrator.service.ts:296`), `imageGen` lit
  `M-BA` tiret (`imageGen.service.ts:65`). En production, les
  références layout/style **ne parviennent pas** au générateur, donc
  Gemini ignore les images de gabarit/style sélectionnées par l'Artistic
  Base Agent. C'est probablement l'erreur la plus impactante du
  pipeline.
- **Fetch des références silencieux** :
  `imageGen.providers.ts:129-131` et `144-146` font `console.warn`
  quand `fetchImageAsBase64` échoue, mais continuent la génération sans
  les références. L'utilisateur reçoit une image qui ne correspond pas
  au gabarit demandé, sans aucun signal d'erreur.
- **Aucun retry sur l'upload Cloudinary** (`imageGen.service.ts:136`) :
  une 5xx transitoire détruit une variante. Avec 4 variantes en
  parallèle et un upload qui échoue à 5%, ≈18% des sessions perdent au
  moins une variante.
- **Pas de filtre quality_score < 70** côté `imageGen` : même si
  l'orchestrateur a marqué le projet `READY_FOR_PROMPT` (mauvaise
  qualité), un appel direct à `/generate-images` génère quand même.
- **`status = GENERATING` ne dégrade pas** si le pipeline crash après
  ligne 114 mais avant ligne 167. Si le serveur redémarre pendant la
  génération, le projet reste bloqué à `GENERATING` indéfiniment.
- **Dimensions hardcodées** dans `RATIO_DIMS`
  (`imageGen.providers.ts:34-40`). 1024×1024 / 1080×1920 / etc. sont
  baked dans le code — utiles pour le mock, mais Gemini reçoit
  uniquement `aspectRatio` (ligne 152), donc côté Gemini ces
  dimensions sont inertes. Code mort partiel.
- **Pas d'endpoint d'export** : le client doit construire les
  transformations Cloudinary lui-même. Toute évolution (watermark,
  optimisation impression A4, recadrage social) demande un déploiement
  client, pas API.

### Suggestion

Unifier les clés mémoire (cf. §3), introduire un wrapper de retry avec
backoff sur Cloudinary, ajouter un garde-fou `quality_score` côté
`imageGen` (config seuil dans `AppSetting`), et faire surveiller les
projets bloqués en `GENERATING` depuis plus de N minutes par un job de
nettoyage (cron ou check à l'appel suivant). Pour la livraison,
introduire un endpoint `GET /api/projects/:id/posters/:posterId/download?format=…`
qui appliquerait la transformation Cloudinary côté serveur et
journaliserait l'export — utile aussi pour le décompte de crédits.

---

## 3. Gestion mémoire (US-003)

### Constat

**31 lignes `MemoryDefinition` en base** réparties en deux catégories :

- **Système (`isSystem=true`)** seedées par `prisma/seedDynamic.ts:16` :
  `M_SMS`, `M_QT1`, `M_QT2`, `M_MD`, `M_BA`, `M_ID`, `M_PROMPT1`.
  Toutes en scope `PROJECT`. **Effectivement utilisées** par le code.
- **Utilisateur (`isSystem=false`)** : `M-SMS`, `M-QT1`, `M-QT2`,
  `M-MD`, `M-BA`, `M-ID`, `M-PROMPT1`, plus `M-CREATIVE-BRIEF`,
  `M-ASSETS`, `M-CONTACT`, `M-CLIENT`, `M-COLOR`, `M-COMPOSITION`,
  `M-EXPORT`, `M-FORMAT`, `M-HISTORIQUE`, `M-INTERDITS`, `M-PRINT`,
  `M-QUALITE`, `M-RESEAUX`, `M-RETOUCHE`, `M-STYLE`, `M-TEXTE`,
  `M-VARIANTES`, `M-Contact` (cas insensible).

**Écritures et lectures dans le pipeline** (vérifié via `grep`) :

| Mémoire | Écrite par | Lue par |
|---|---|---|
| `M_SMS` | `chat.service.ts:426-443` (async, no await), `promptOrchestrator.service.ts:109` (auto-population depuis brief) | tous les agents via `dynamic-context.service.ts:15` |
| `M_QT1` | `promptOrchestrator.service.ts:169`, `agents.controller.ts:74` | Planner (READ), PromptArchitect (READ) |
| `M_QT2` | Aucun code n'écrit (alimenté par le client via `/api/projects/:id/memories/M_QT2`) | 5 agents en INPUT |
| `M_MD` | `promptOrchestrator.service.ts:146` | 5 agents en INPUT |
| `M_ID` | `promptOrchestrator.service.ts:257` (Brand) | Planner, PromptArchitect, Quality |
| `M_BA` | `promptOrchestrator.service.ts:296` (ArtisticBase) | PromptArchitect, Quality, **et `imageGen.service.ts:65` qui lit `M-BA` au lieu** |
| `M_PROMPT1` | `promptOrchestrator.service.ts:324` | Quality, `imageGen.service.ts:37-46` |
| `M-CREATIVE-BRIEF` | client (`ChatConversation.tsx`) | `promptOrchestrator.service.ts:101` (fallback M_SMS) |
| `M-ASSETS` | client (`ChatConversation.tsx`) | uniquement frontend (restauration UI) |
| `M-CONTACT` | client (`dashboard/create/page.tsx`) | aucun agent en runtime |
| `M-INTERDITS` | `forbiddenRules.service.ts:syncToGlobalMemory` | aucun code path runtime ne le lit |
| `M-Contact`, `M-CLIENT`, `M-COLOR`, `M-COMPOSITION`, `M-EXPORT`, `M-FORMAT`, `M-HISTORIQUE`, `M-PRINT`, `M-QUALITE`, `M-RESEAUX`, `M-RETOUCHE`, `M-STYLE`, `M-TEXTE`, `M-VARIANTES` | Aucun | Aucun |
| Variantes `M-SMS`, `M-QT1`, `M-QT2`, `M-MD`, `M-ID`, `M-PROMPT1` (tiret) | Aucun | Aucun (sauf bug M-BA) |

**Service mémoire** (`memory/memory.service.ts`) :

- CRUD complet sur `MemoryEntry`, ownership vérifié à chaque appel
  via `ensureProjectOwner` (ligne 6-18).
- Unicité par `[projectId, memoryDefinitionId]` (schema Prisma).
- `upsertMemory` côté agents (`agents.service.ts`) — utilisé par
  l'orchestrateur — ne distingue pas entre clés système et clés
  utilisateur.

### Risque

- **Bug `M_BA` vs `M-BA`** déjà signalé en §0 et §2. Symptôme d'un
  problème plus large : il n'y a aucun garde-fou (TypeScript ou
  validation) qui empêche d'utiliser une clé mémoire qui n'existe pas
  ou qui n'est pas la bonne.
- **Race condition** sur la sauvegarde M_SMS depuis le chat :
  `chat.service.ts:426-443` lance la promesse mais n'attend pas
  (`.catch(() => {})` final, pas de `await`). Le client reçoit la
  réponse avant que `M_SMS` ne soit persisté. Un déclenchement
  immédiat de `/generate-final-prompt` peut tomber sur le fallback
  d'auto-population (`promptOrchestrator.service.ts:97-117`), ce qui
  fonctionne mais introduit une dépendance subtile à `M-CREATIVE-BRIEF`.
- **18 `MemoryDefinition` mortes** (variantes tiret + libres jamais
  câblées) qui polluent `/admin/memories` et obscurcissent la lecture
  du modèle de données.
- **`M-INTERDITS` alimenté en push** par
  `forbiddenRules.service.ts:syncToGlobalMemory` (lignes 349-421) mais
  jamais lu en pull par un agent ou un middleware. Maintenance d'un
  état qui ne sert pas.
- **Aucun cache mémoire** : chaque agent rebuilde son contexte depuis
  Prisma à chaque invocation. Pour un workflow qui chaîne 7 agents,
  cela donne ≈14-21 queries Prisma redondantes (chaque agent relit
  M_SMS + ses propres entrées d'input).

### Suggestion

- Renommer `M_BA` en `M-BA` partout (ou l'inverse) et **supprimer les
  doublons inutilisés** (`M-SMS`, `M-QT1`, `M-QT2`, `M-MD`, `M-ID`,
  `M-PROMPT1` tiret) après vérification qu'aucune `MemoryEntry` n'y
  pointe.
- **Awaiter la sauvegarde M_SMS** dans `chat.service.ts` (passer dans
  le `prisma.$transaction` existant), ou alors traiter explicitement
  l'auto-population comme la voie nominale (et documenter).
- Auditer les ~14 mémoires utilisateur jamais lues : soit les câbler
  dans le workflow (M-CONTACT et M-INTERDITS sont des candidats
  évidents), soit les retirer.
- Introduire un cache en mémoire au niveau de l'orchestrateur : charger
  une fois toutes les `MemoryEntry` du projet au début, passer un
  snapshot aux agents (déjà partiellement fait avec `include:
  memoryEntries`, mais chaque agent re-query).

---

## 4. Système agentique et orchestrateur (US-004)

### Constat

**14 `AgentDefinition`** en DB après le seed actuel :

- **8 agents câblés au workflow** :
  PLANNER_AGENT, BRAND_AGENT, TEXT_ANALYST_AGENT, IMAGE_ANALYST_AGENT,
  ARTISTIC_BASE_AGENT, PROMPT_ARCHITECT_AGENT, QUALITY_AGENT,
  Generator-Agent (alias pour GENERATOR_AGENT).
- **6 stubs activés mais jamais invoqués** : FILE_MANAGER_AGENT,
  MEMORY_AGENT, PROJECT_CONTEXT_AGENT, REVISION_AGENT, SAFETY_AGENT,
  VARIATION_AGENT.

**Deux chemins d'orchestration coexistent** :

- **Statique** (utilisé en production) :
  `promptOrchestrator.service.ts:runFullOrchestration` (ligne 71). Une
  séquence hardcodée de 7 appels (ImageAnalyst → Planner → TextAnalyst
  → Brand → ArtisticBase → PromptArchitect → Quality). Pas de
  discovery, pas de parallélisme.
- **Dynamique** (dormant) :
  `agents-dynamic/agentsDynamic.service.ts:runDynamicAgent` (ligne 13).
  Lit `AgentDefinition.memoryLinks` pour découvrir dynamiquement quels
  inputs/outputs chaque agent attend. Exposé via
  `/api/agents-dynamic/...` mais non utilisé par le client dashboard.

**Construction du contexte agent** :
`agents/dynamic-context.service.ts:buildAgentContext` (ligne 15-…). Lit
`AgentDefinition.memoryLinks` filtré par `usageType IN (INPUT, BOTH)`,
construit un bloc de texte concaténant les `MemoryEntry.content`. Cette
même fonction est appelée par les 7 agents statiques (`agents.service.ts`
lignes 196, 256, 320, 382, 453, 529, 601) — donc `AgentMemoryLink`
**est lue en runtime**, contrairement à l'analyse initiale.

**Persistance des runs** : chaque agent appelle `saveAgentRun`
(`agents.service.ts`) qui crée une ligne dans `AgentRun` avec input,
output, status, durationMs. Table actuellement vide en prod (aucun
projet n'a déclenché l'orchestrateur, ou bien la table a été purgée).

**Provider/model par agent** : configuré dans `AgentDefinition.provider`
et `.model`. Les 8 actifs ont des providers réels (gemini, z, etc.) ;
les 6 stubs ont `provider="mock"` + `model="mock"`.

### Risque

- **Cascade hardcodée** : `runFullOrchestration` enchaîne les 7 agents
  séquentiellement. Brand, ArtisticBase et TextAnalyst sont en réalité
  **indépendants** (aucun ne consomme l'output direct des autres
  avant PromptArchitect). On perd 15–25 s de cycle simplement parce
  que le code n'utilise pas `Promise.all`.
- **Erreurs Planner / TextAnalyst / Brand / ArtisticBase /
  PromptArchitect = throw + abandon total** (`promptOrchestrator.service.ts`
  lignes 165, 226, 253, 292, 320). Pas de retry, pas de fallback. Si
  PROMPT_ARCHITECT_AGENT tombe (provider `z` indisponible par ex.),
  l'utilisateur voit `500` sans contexte.
- **Quality Agent non bloquant** (ligne 338-347) : son échec retourne
  un score factice `75 + is_valid=true`. Le projet sera marqué
  `PROMPT_READY` à tort. Faux positifs garantis.
- **ImageAnalyst non bloquant** (ligne 147-150) : même problème, mais
  ici l'absence du résultat est *partiellement* compensée par les
  agents suivants qui ne reçoivent pas M_MD.
- **Stubs invocables via `/api/agents-dynamic/run`** alors que leur
  prompt système est complet mais leur provider est `mock`. Si un dev
  les déclenche par erreur, ils renvoient une réponse mockée sans
  signal d'erreur.
- **`AgentMemoryLink` partiellement source de vérité** : la table
  décide des INPUTS lus, mais la séquence d'orchestration ignore les
  OUTPUTS et les dépendances. Schéma normalisé, code procédural —
  désynchronisation latente.
- **Aucun mécanisme de timeout/circuit-breaker** : un appel provider
  qui pend 60 s bloque toute la chaîne (l'orchestrateur attend).

### Suggestion

- **Paralléliser** Brand + TextAnalyst + ArtisticBase dans une `Promise.all`
  (tous les trois ne dépendent que de Planner + ImageAnalyst, déjà
  exécutés). Gain ≈15-25 s par cycle.
- Remplacer les `throw new AppError` par un système de **status
  partiel** : continuer le workflow si Brand échoue (avec valeurs par
  défaut), retourner un résultat avec `partialFailures: [...]`.
- Faire dépendre la fin du workflow (`PROMPT_READY`) d'un **vrai
  succès Quality**, pas du fallback à 75.
- **Désactiver les stubs** (`isActive=false`) tant que leur provider
  n'a pas été choisi par l'admin et que leur intégration n'est pas
  câblée. Ou bien retirer la route `/agents-dynamic` du public si elle
  n'a pas vocation à servir.
- Décider explicitement : on garde l'orchestration statique
  (supprimer `AgentMemoryLink` côté code, garder uniquement pour la
  doc admin), OU on bascule en dynamique (utiliser la table comme
  source unique). La cohabitation actuelle complique la maintenance.
- Ajouter un `AbortController` ou un timeout `Promise.race` sur
  chaque appel provider pour borner le pire cas par agent.

---

## 5. Base artistique et règles interdites (US-005)

### Constat

**Base artistique** (`ArtisticResource` + `artistic-base` module) :

- Table avec champs `title`, `category`, `resourceType` (MODEL, TEXTURE,
  FONT, PALETTE, STYLE, REFERENCE, FORBIDDEN_RULE), `url`, `tags`,
  `content` (JSON).
- CRUD complet exposé via `/api/artistic-base` (admin only).
- **Consultée en runtime** par l'orchestrateur
  (`promptOrchestrator.service.ts:263-272`) : filtrage par
  `category` matchant le `plannerResult.category` ou
  `poster_type`, limite 20 résultats. Passée en input à l'Artistic
  Base Agent.
- L'agent retourne `selected_model_url` et `selected_style_url`
  (ligne 374-375 du résultat orchestrateur).

**Règles interdites** (`ForbiddenRule` + `forbidden-rules` module) :

- 13 règles par défaut hardcodées dans
  `forbiddenRules.service.ts:21-154` (`DEFAULT_FORBIDDEN_RULES`),
  catégories : TYPOGRAPHY, COLORS, COMPOSITION, IMAGE_QUALITY, LOGO,
  EFFECTS, TEXTURES, TEXT_CONTENT, LEGAL_SECURITY. Sévérités LOW à
  CRITICAL.
- CRUD complet via `/api/forbidden-rules`. Seed via
  `prisma/seed-forbidden-rules.ts`.
- Méthode `buildNegativePromptFromRules` (lignes 322-342) qui concatène
  les `negativePrompt` des règles actives. Exposée via endpoint dédié.
- Méthode `syncToGlobalMemory` (lignes 349-421) qui pousse les règles
  actives dans la mémoire `M-INTERDITS`.

**Quality Agent** :

- `agents.service.ts:601` (`runQualityAgent`) appelé en fin de pipeline.
- Score sur 100 (cf. `qualityAgent.prompt.ts:24-48`) : 7 critères
  pondérés (correspondance brief 20 pts, textes 15 pts, cohérence 15,
  couleurs marque 10, negative_prompt 10, absence d'invention 20,
  détail 10).
- Sortie : `{quality_score, is_valid, issues, recommendations}`.

### Risque

- **Safety Agent = code mort.** Le prompt système existe
  (`src/modules/agents/system-prompts/safetyAgent.prompt.ts`), la
  ligne DB existe (créée par `seed_stub_agents.ts`), `provider=mock`,
  **et aucun appel `runSafetyAgent` n'est défini dans
  `agents.service.ts` ni dans l'orchestrateur**. Les règles interdites
  ne filtrent jamais le prompt M-PROMPT1 avant la génération. La
  négative-prompt est uniquement *suggérée* via le mécanisme additionnel
  de Prompt Architect — pas garantie.
- **Quality score advisory** : `imageGen.service.ts` ne lit jamais
  `M_PROMPT1.quality_score`. Un projet avec score 30 et `is_valid=false`
  appelle Cloudinary aussi vite qu'un projet à 95.
- **`buildNegativePromptFromRules` exposé mais peu utilisé** : le
  Prompt Architect construit son propre negative_prompt, donc la
  fonction n'est appelée que via l'API REST.
- **`M-INTERDITS` synchronisé en push** mais aucun agent ne le lit
  comme input — pure write-only memory. Vrai gaspillage.
- **ArtisticBase Agent → URL transmise mais bug d'aiguillage** : le
  `selected_model_url` est posé dans `M_BA`, mais `imageGen` lit `M-BA`
  (cf. §2/§3). En pratique, les *images de référence* ne parviennent
  jamais à Gemini.
- **Pas de garde-fou si l'utilisateur dépose un logo non rectangulaire
  ou si le fichier référence n'est plus accessible Cloudinary** : la
  pipeline ne valide rien en amont.

### Suggestion

- **Implémenter `runSafetyAgent`** dans `agents.service.ts` et
  l'insérer dans l'orchestrateur entre Prompt Architect et la sortie
  `PROMPT_READY`. Décision = `approved | amended | blocked`. Si
  `blocked`, projet passe en `FAILED` avec un `client_message` lisible.
- Introduire un seuil configurable `min_quality_score`
  (`AppSetting`, défaut 70). `imageGen.service.ts` doit refuser de
  générer si `quality_score < seuil` (sauf override admin).
- Câbler `M-INTERDITS` en input du Safety Agent et du Prompt
  Architect — sinon, retirer la synchronisation.
- Fusionner `buildNegativePromptFromRules` dans le Prompt Architect
  comme source unique de vérité pour le negative_prompt.
- Vérifier la disponibilité des URLs Cloudinary (HEAD request) avant
  de les passer au générateur, ou cacher le `content-type` pour
  détecter les fichiers morts.

---

## 6. Variables du cycle (AppSetting, env, hardcodé) (US-006)

### Constat

**Configuration AppSetting (DB, éditable via /admin/settings)** —
extrait pertinent pour la génération
(`settings.service.ts:7-56`) :

| Clé | Défaut | Usage |
|---|---|---|
| `credits_per_generation` | `10` | Décompte crédit utilisateur |
| `free_generations` | `3` | Crédit initial |
| `default_model` | `gpt-4o` | Fallback global modèle texte |
| `timeout_ms` | `30000` | Timeout générique IA |
| `max_retries` | `3` | Retry IA (non câblé partout) |
| `text_ai_provider` | `auto` | Provider chat (`auto`, `openai`, `anthropic`, `gemini`, `mock`) |
| `chat_agent_name` | `Studio Flyer AI` | Affichage |
| `chat_agent_system_prompt` | (5304 chars) | Système prompt chat |
| `image_gen_provider` | `mock` | Provider image (`mock`, `gemini`, `openai-image`) |
| `image_gen_model` | `gemini-2.5-flash-image-preview` | Modèle Gemini image |
| `openai_api_key` / `anthropic_api_key` / `gemini_api_key` | (vide) | Clés secrètes |

Résolution unique : `settingsService.resolve(key, envFallback)`
(`settings.service.ts:174-188`) — DB d'abord, puis `process.env`,
puis `null`. Une chaîne vide en DB **laisse passer** l'env.

**Variables d'environnement qui shadowent silencieusement** :

- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`
- `IMAGE_GEN_PROVIDER`, `IMAGE_GEN_MODEL`
- `AI_DEFAULT_TEXT_PROVIDER`, `AI_DEFAULT_TEXT_MODEL`,
  `AI_DEFAULT_VISION_PROVIDER`, `AI_DEFAULT_VISION_MODEL`
- `AI_API_KEY`, `AI_API_URL`, `AI_MODEL` (legacy fallback générique)

**Valeurs hardcodées dans le code TypeScript** :

| Localisation | Valeur | Pourquoi c'est gênant |
|---|---|---|
| `chat.service.ts:9-149` | `DEFAULT_CHAT_SYSTEM_PROMPT` (5304 chars) | Dupliqué dans `AppSetting.chat_agent_system_prompt`. Le code utilise la DB sauf si vide ; risque de divergence silencieuse. |
| `chat.service.ts:177-180` | Garde-fou : ignore l'ancien prompt legacy `Tu es l'assistant IA de Flyer Studio.` | Dette technique, à retirer une fois le seed propre |
| `imageGen.providers.ts:34-40` | `RATIO_DIMS` (1024×1024, 1080×1920…) | Sert le mock uniquement ; Gemini ne reçoit que `aspectRatio` |
| `imageGen.service.ts:24-32` | `ratioFromFormat` (mapping `format string → ratio`) | Pas extensible via admin ; ajouter un format demande un déploiement |
| `forbiddenRules.service.ts:21-154` | 13 règles interdites par défaut | Re-seedées à chaque déploiement, divergence avec les éditions admin possible |
| `agents/system-prompts/*.ts` | 13 prompts système agents | Source de vérité = code, mais les `AgentDefinition.systemPrompt` en DB peuvent diverger (cas effectif pour CONVERSATION_AGENT déjà observé) |
| `chat.service.ts:467+` (generateOpening) | Texte d'instruction d'ouverture (avec/sans assets) | Bloc multi-ligne français, ne peut être édité qu'en code |

### Risque

- **Divergence DB ↔ code** : les prompts système agents existent à deux
  endroits (TypeScript + DB). Si l'admin modifie via l'UI, la version
  TS devient obsolète sans signal. Le seed le réécrira. Conflit de
  source de vérité.
- **Shadowing silencieux** : un déploiement Fly/Render avec
  `IMAGE_GEN_PROVIDER=mock` dans l'env override la config admin
  `gemini` sans aucun warning dans les logs ou dans l'UI.
  Reproductibilité difficile en dev vs prod.
- **`timeout_ms` et `max_retries` non câblés partout** : ils existent
  dans les settings mais ni `imageGen` ni les agents ne les consultent.
  Fausse promesse côté admin.
- **`default_model = 'gpt-4o'`** alors que beaucoup d'agents utilisent
  Gemini ou un provider custom `z` (GLM-4.6V). Fallback potentiellement
  incohérent.
- **13 règles interdites en code** : impossible pour l'admin d'ajouter
  une 14ᵉ règle persistante via le seed sans modifier le TypeScript.

### Suggestion

- Adopter une règle stricte : **DB est la source de vérité runtime,
  code = seed initial**. Documenter explicitement. Ne plus dupliquer
  les prompts en mémoire ; importer en runtime depuis DB partout.
- Pour le shadowing : afficher dans `/admin/settings` les valeurs
  effectives résolues (DB → env → défaut) avec mention de la source.
  Permet à l'admin de comprendre ce qui tourne vraiment.
- Câbler `timeout_ms` et `max_retries` dans `ai/ai.providers.ts` et
  `imageGen.providers.ts` (`fetch` avec `AbortController`).
- Externaliser `RATIO_DIMS` et `ratioFromFormat` dans
  `AppSetting`/`ArtisticResource` pour qu'un admin puisse ajouter un
  format sans déploiement.

---

## 7. Recommandations consolidées (US-007)

Les recommandations sont classées en 3 catégories. Chaque ligne renvoie
à la section qui en détaille le contexte.

### 🛠️ MODIFIER

- **Aligner les clés mémoire `M_X` et `M-X`** dans tout le code
  (`imageGen.service.ts:65` lit `M-BA`, orchestrateur écrit `M_BA`).
  Choix unique : tout en underscore ou tout en tiret. (§3, §5)
- **Attendre la sauvegarde `M_SMS` dans le chat**
  (`chat.service.ts:426-443`) — basculer dans le `$transaction` existant
  ou awaiter explicitement. (§3)
- **Bloquer la génération sur `quality_score < seuil`** dans
  `imageGen.service.ts:108` (lecture du score depuis M_PROMPT1 et
  refus si < seuil). Seuil configurable via `AppSetting`. (§2, §5)
- **Remplacer les `throw` durs** dans `promptOrchestrator.service.ts`
  (lignes 165, 226, 253, 292, 320) par un mécanisme de **résultat
  partiel** avec liste des agents en échec. (§4)
- **Câbler `timeout_ms` et `max_retries`** dans
  `ai/ai.providers.ts` et `imageGen.providers.ts`. (§6)
- **Faire échouer Quality si l'agent crash** (retirer le fallback à 75
  ligne 338-347), ou au minimum le signaler clairement dans la réponse
  HTTP. (§4)
- **Renommer ou retirer les routes**
  `/api/showcase/visuals` (déplacer dans son propre module) et
  `/api/agents-dynamic` (si non destinée au public). (§1, §4)

### 🗑️ SUPPRIMER

- **6 MemoryDefinition variantes tiret jamais lues** : `M-SMS`,
  `M-QT1`, `M-QT2`, `M-MD`, `M-ID`, `M-PROMPT1` (après vérification
  qu'aucune `MemoryEntry` n'y pointe). (§3)
- **14 MemoryDefinition utilisateur sans lecture ni écriture** :
  `M-CLIENT`, `M-COLOR`, `M-COMPOSITION`, `M-EXPORT`, `M-FORMAT`,
  `M-HISTORIQUE`, `M-PRINT`, `M-QUALITE`, `M-RESEAUX`, `M-RETOUCHE`,
  `M-STYLE`, `M-TEXTE`, `M-VARIANTES`, `M-Contact` (case mismatch
  avec `M-CONTACT`). Soit les câbler dans le workflow, soit les
  retirer pour ne pas polluer l'admin. (§3)
- **6 stubs AgentDefinition s'ils ne sont pas câblés ce trimestre** :
  FILE_MANAGER, MEMORY, PROJECT_CONTEXT, REVISION, SAFETY, VARIATION.
  À défaut, passer leur `isActive=false` pour éviter qu'ils ne soient
  invocables silencieusement via `/api/agents-dynamic/run`. (§4)
- **Garde-fou legacy** dans `chat.service.ts:177-180` (le `if
  fromDb.includes('Tu es l'assistant IA de Flyer Studio.')`) — la DB
  contient maintenant le bon prompt. (§6)
- **`syncToGlobalMemory`** dans `forbiddenRules.service.ts:349-421`
  tant qu'aucun consommateur ne lit `M-INTERDITS`. (§5)
- **`RATIO_DIMS`** dans `imageGen.providers.ts:34-40` ou les exporter
  vers `AppSetting` (elles ne servent qu'au mock). (§6)

### ➕ AJOUTER

- **`runSafetyAgent`** dans `agents.service.ts`, invoqué entre
  PromptArchitect et Quality dans l'orchestrateur. Lit les
  `ForbiddenRule` actives + `M-INTERDITS`. Décide
  `approved/amended/blocked`. (§5, §4)
- **Retry exponentiel sur l'upload Cloudinary**
  (`imageGen.service.ts:136`) — 3 tentatives, backoff 500/1500/4500 ms.
  (§2)
- **Parallélisation Brand + TextAnalyst + ArtisticBase** via
  `Promise.all` dans `promptOrchestrator.service.ts` après Planner.
  Gain estimé 15-25 s. (§4)
- **Job de nettoyage** pour les projets bloqués en `GENERATING` ou
  `QUESTIONING` depuis plus de N minutes (cron, ou check à
  l'invocation suivante). (§2, §4)
- **Endpoint `GET /api/projects/:id/posters/:posterId/download?format=...`**
  qui applique la transformation Cloudinary côté serveur, journalise
  l'export et décompte un crédit si applicable. (§2)
- **Versioning d'API** : passer à `/api/v1/...` et documenter en
  OpenAPI à côté de `app.ts`. (§1)
- **Cache mémoire orchestrateur** : snapshot unique des
  `MemoryEntry` au début de `runFullOrchestration`, passé en argument
  aux agents au lieu de chaque agent re-querying. Gain ≈10-15 queries
  Prisma par cycle. (§3, §4)
- **Affichage des valeurs effectives** (DB / env / défaut) dans
  `/admin/settings` pour rendre visible le shadowing par env. (§6)
- **`AbortController` + timeout par agent** dans
  `callTextAI` / `callVisionAI` pour borner le pire cas. (§4)
- **Validation HEAD Cloudinary** des `selected_model_url` /
  `selected_style_url` avant de les passer à Gemini, pour éviter une
  génération silencieusement vide de référence. (§2, §5)

---

## Annexe — Indicateurs de couverture

- **Composants analysés** : API ✓, génération ✓, livraison ✓, mémoire ✓,
  agentique ✓, orchestrateur ✓, base artistique ✓, interdits ✓,
  variables ✓.
- **Faiblesses identifiées avec suggestion** : ~25 points, tous
  assortis d'une direction de correction.
- **Fichiers cités** :
  - `src/app.ts` (routes globales)
  - `src/modules/chat/{chat.service,chat.controller,chat.routes,chat.validation,chat.types}.ts`
  - `src/modules/orchestrator/promptOrchestrator.service.ts`
  - `src/modules/agents/{agents.service,agents.controller,agents.routes,dynamic-context.service}.ts`
  - `src/modules/agents-dynamic/agentsDynamic.service.ts`
  - `src/modules/image-generation/{imageGen.service,imageGen.providers,imageGen.routes,imageGen.validation}.ts`
  - `src/modules/memory/{memory.service,memory.routes}.ts`
  - `src/modules/artistic-base/artisticBase.service.ts`
  - `src/modules/forbidden-rules/forbiddenRules.service.ts`
  - `src/modules/settings/settings.service.ts`
  - `src/modules/admin/admin.service.ts`
  - `prisma/schema.prisma`, `prisma/seedDynamic.ts`,
    `prisma/seed-forbidden-rules.ts`
  - `src/modules/agents/system-prompts/*.ts` (13 prompts)
- **Estimation de gain** : 15-25 % de cycle gagné si les
  recommandations §7 sont appliquées (parallélisation des agents
  indépendants + retry Cloudinary + suppression du redondant +
  garde-fous quality/safety).

---

*Fin de l'audit. Les recommandations §7 peuvent servir directement de
base à un backlog de tickets. Pour chaque ligne MODIFIER/SUPPRIMER/AJOUTER,
les sections §1 à §6 donnent le contexte technique nécessaire à
l'estimation et au triage.*
