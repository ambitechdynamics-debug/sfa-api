# Migration vers Neon Auth — Guide

## Vue d'ensemble

Tous les nouveaux comptes passent désormais par **Neon Auth** (Better Auth provider).
Le backend Express vérifie les tokens JWT émis par Neon via la **JWKS publique** —
aucun secret partagé, conforme à OIDC.

| | Avant (legacy JWT) | Après (Neon Auth) |
|---|---|---|
| Service auth | Express `/api/auth/*` (bcrypt + jsonwebtoken) | Neon Auth (Better Auth) |
| UI signin/signup | Formulaires custom | Formulaires custom (design préservé) appelant `authClient.signIn.email()` |
| Vérification token | `jwt.verify(token, JWT_SECRET)` | `jose.jwtVerify(token, JWKS, { issuer })` |
| Persistance user | Table `User` Postgres | Table `User` Postgres + colonne `stackUserId` (lie au compte Neon Auth) |
| Stockage password | bcrypt dans `User.password` | Géré par Neon Auth |

## Mécanisme de migration des comptes existants

**Aucun script bulk n'est nécessaire** — le binding se fait à la volée dans
`authMiddleware`. Quand un user existant se réinscrit avec le même email :

```typescript
// src/middlewares/auth.middleware.ts (extrait)
let user = await prisma.user.findUnique({ where: { stackUserId } })
if (!user) {
  if (claimEmail) {
    const byEmail = await prisma.user.findUnique({ where: { email: claimEmail } })
    if (byEmail) {
      // ← Re-bind automatique : conserve role, credits, projets, mémoires, etc.
      await prisma.user.update({
        where: { id: byEmail.id },
        data: { stackUserId },
      })
      return byEmail
    }
  }
  // Sinon : nouveau compte → création
  user = await prisma.user.create({ ... })
}
```

## Communication aux utilisateurs existants

Avant la mise en prod, envoyer un email type :

> Suite à une mise à jour de notre système d'authentification, vous devrez
> définir un nouveau mot de passe lors de votre prochaine connexion.
>
> 👉 Rendez-vous sur https://votre-app.com/register et utilisez **votre adresse
> email habituelle** — vos projets, vos crédits et votre historique seront
> automatiquement retrouvés.

## Vérification post-migration

```sql
-- 1. Compter les comptes liés à Neon Auth
SELECT COUNT(*) FROM "User" WHERE "stackUserId" IS NOT NULL;

-- 2. Comptes en attente de migration (n'ont pas encore re-loggué)
SELECT id, email, "createdAt"
  FROM "User"
 WHERE "stackUserId" IS NULL;

-- 3. Vérifier que l'admin a bien été re-binded après son premier login
SELECT email, role, "stackUserId" IS NOT NULL AS migrated
  FROM "User"
 WHERE role = 'ADMIN';
```

## Désactivation du legacy JWT (post-migration)

Quand 100 % des comptes ont `stackUserId IS NOT NULL`, le code legacy peut
être retiré :

1. Supprimer le module `src/modules/auth/` (login/register/me legacy)
2. Retirer `app.use('/api/auth', authRoutes)` de `src/app.ts`
3. Supprimer la branche `authenticateWithLegacyJwt` dans `auth.middleware.ts`
4. Supprimer le champ `password` de `User` (Prisma + `db push`)
5. Désinstaller `bcrypt` et `jsonwebtoken`

## Rollback d'urgence

Si un problème critique nécessite un retour temporaire au legacy JWT :

```env
# .env
NEON_AUTH_ENABLED=false   # → bascule sur l'ancien middleware JWT
```

Le serveur recharge via ts-node-dev. Aucune perte de données — les comptes
existants gardent leur `password` bcrypt original tant qu'ils n'ont pas
re-loggué via Neon Auth.
