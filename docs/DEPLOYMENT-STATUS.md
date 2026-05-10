# État du déploiement

## ✅ Frontends déployés sur Vercel (production)

| Service | URL production | Status | Variables d'env Vercel |
|---|---|---|---|
| Admin dashboard | https://studio-flyer-ai-admin.vercel.app | 🟢 Live | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_NEON_AUTH_URL`, `NEXT_PUBLIC_USE_MOCK=false` |
| Frontend client | https://studio-flyer-ai-client.vercel.app | 🟢 Live | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_NEON_AUTH_URL` |

**Team Vercel** : `ambitechdynamics-debugs-projects`
**Projets** : `studio-flyer-ai-admin`, `studio-flyer-ai-client`

## 🟡 Backend — à déployer manuellement

Le backend Express n'est pas adapté à Vercel (long-running, auto-seed,
orchestration 7-agents qui dépasse les timeouts serverless). Il doit être
déployé sur un host PaaS classique. **Tous les artefacts sont prêts** :

| Fichier | Rôle |
|---|---|
| `Dockerfile` | Multi-stage build (node:20-alpine), prod-ready, non-root |
| `.dockerignore` | Exclut `node_modules`, frontends, etc. |
| `render.yaml` | Blueprint Render.com (free tier) — 1-clic depuis GitHub |
| `fly.toml` | Configuration Fly.io (cdg region, scale-to-zero) |
| `docs/BACKEND-DEPLOYMENT.md` | Guide complet 3 options (Render / Fly / Railway) |

### Quick start — Render.com (recommandé, gratuit)

```bash
# 1. Push du repo sur GitHub
git push origin main

# 2. Render.com → New Blueprint → choisir le repo
# 3. Remplir les variables manquantes dans le panneau Render :
#    DATABASE_URL, JWT_SECRET, APP_URL, CLOUDINARY_*, NEON_AUTH_*, GEMINI_API_KEY (optionnel)
```

Voir `docs/BACKEND-DEPLOYMENT.md` pour le détail.

## ⚠️ Action requise après déploiement backend

Une fois le backend en ligne (récupère son URL, ex. `https://studio-flyer-ai-backend.onrender.com`) :

### 1. Mettre à jour CORS sur le backend

```env
# Dans le panneau du host backend (Render/Fly/Railway)
APP_URL=https://studio-flyer-ai-admin.vercel.app,https://studio-flyer-ai-client.vercel.app
```

(Le code accepte déjà la liste séparée par virgules — voir `src/app.ts`.)

### 2. Mettre à jour `NEXT_PUBLIC_API_URL` sur Vercel

Les deux frontends pointent actuellement sur un placeholder
`https://studio-flyer-ai-backend.onrender.com`. Si l'URL réelle diffère,
remplacer :

```bash
# Admin
cd admin-dashboard
vercel env rm NEXT_PUBLIC_API_URL production --yes
echo "https://YOUR-REAL-BACKEND.onrender.com" | vercel env add NEXT_PUBLIC_API_URL production --yes
vercel deploy --prod --yes

# Client
cd ../frontend-client
vercel env rm NEXT_PUBLIC_API_URL production --yes
echo "https://YOUR-REAL-BACKEND.onrender.com" | vercel env add NEXT_PUBLIC_API_URL production --yes
vercel deploy --prod --yes
```

(Les variables `NEXT_PUBLIC_*` sont inlinées au build → un redéploiement est
nécessaire pour les voir prises en compte.)

### 3. Lancer les seeds initiaux

Une fois le backend live, déclencher manuellement les seeds (auto-seed au
démarrage marche déjà sur Render long-running, mais à exécuter une fois pour
être sûr) :

```bash
# Connecté en admin via Neon Auth, récupérer un Bearer token puis :
curl -X POST https://YOUR-BACKEND.onrender.com/api/admin/forbidden-rules/seed \
  -H "Authorization: Bearer <token>"
curl -X POST https://YOUR-BACKEND.onrender.com/api/admin/settings/seed \
  -H "Authorization: Bearer <token>"
```

## Vérifications end-to-end après backend live

```bash
# 1. Health
curl https://YOUR-BACKEND.onrender.com/api/health

# 2. CORS (depuis le navigateur, ouvrir studio-flyer-ai-client.vercel.app)
#    DevTools → Network → vérifier qu'aucun appel API n'est bloqué CORS

# 3. Auth flow
#    a. Aller sur https://studio-flyer-ai-client.vercel.app/register
#    b. Créer un compte (Better Auth) → redirection /dashboard
#    c. Vérifier en DB : SELECT email, "stackUserId" FROM "User" → ligne créée
#    d. /api/users/me retourne {role:"USER", credits:0}

# 4. Admin
#    a. SET role='ADMIN' WHERE email='admin@..' (manuellement en SQL)
#    b. Login sur https://studio-flyer-ai-admin.vercel.app/login
#    c. Vérifier accès aux pages /admin/*
```

## URLs récap

```
🌍 Frontend client    https://studio-flyer-ai-client.vercel.app
🛠  Admin dashboard    https://studio-flyer-ai-admin.vercel.app
🔌 Backend API         À déployer → Render/Fly/Railway
🔑 Neon Auth           https://ep-blue-night-akk7bv95.neonauth.c-3.us-west-2.aws.neon.tech/neondb/auth
🗄  Database            ep-blue-night-akk7bv95.c-3.us-west-2.aws.neon.tech
```
