# Déploiement du backend Express

Le backend utilise Express + ts-node-dev en local et compile en JS via `tsc`
pour la production. Il a besoin d'un host **long-running** (pas serverless) :
il maintient la connexion DB, exécute des seeds au démarrage, orchestre des
chaînes de 7 agents IA pouvant durer 30s+.

## Options recommandées (par ordre de simplicité)

### 1. Render.com (recommandé — gratuit)

Le fichier `render.yaml` à la racine est prêt à l'emploi.

```bash
# 1. Push le repo sur GitHub
# 2. Aller sur https://render.com → "New" → "Blueprint"
# 3. Connecter le repo, Render détecte render.yaml
# 4. Remplir les variables marquées "Add value" :
#    - DATABASE_URL    (depuis console.neon.tech)
#    - JWT_SECRET       (générer 32+ chars random)
#    - APP_URL          (URL du frontend client Vercel)
#    - CLOUDINARY_*     (depuis cloudinary.com console)
#    - NEON_AUTH_*      (depuis neonctl projects integrations)
#    - GEMINI_API_KEY   (si IMAGE_GEN_PROVIDER=gemini)
# 5. "Create Blueprint" → build + déploiement automatique
```

Limites free tier :
- 750h/mois (suffisant pour 1 service)
- **Sleep après 15 min d'inactivité** (cold start ~30s au premier hit)
- 512 Mo RAM
- Pour rester réveillé 24/7 → upgrade Starter ($7/mois)

### 2. Fly.io (gratuit, plus rapide en cold start)

```bash
# 1. Installer flyctl : https://fly.io/docs/hands-on/install-flyctl/
# 2. Depuis le dossier racine du projet :
fly auth login
fly launch --no-deploy           # crée l'app, ne déploie pas encore
fly secrets set \
  DATABASE_URL="postgresql://..." \
  JWT_SECRET="random-32-chars" \
  APP_URL="https://your-client.vercel.app" \
  CLOUDINARY_CLOUD_NAME="..." \
  CLOUDINARY_API_KEY="..." \
  CLOUDINARY_API_SECRET="..." \
  NEON_AUTH_ISSUER="https://...neonauth.../neondb/auth" \
  NEON_AUTH_JWKS_URL="https://...neonauth.../neondb/auth/.well-known/jwks.json"

fly deploy
```

Free tier : 3 machines partagées 256 Mo RAM, scale-to-zero. Le `fly.toml` est
configuré pour scale-to-zero automatique.

### 3. Railway.app (payant à partir de $5/mois)

```bash
# 1. https://railway.app → New Project → Deploy from GitHub
# 2. Sélectionner le repo, root = "/" (pas un sous-dossier)
# 3. Railway détecte le Dockerfile
# 4. Variables d'env : copier-coller dans le panneau "Variables"
```

Pas de cold start, plus simple mais payant.

## Variables d'environnement complètes

Copier-coller dans la console du host choisi :

```env
NODE_ENV=production
PORT=5000

# Database (depuis console.neon.tech)
DATABASE_URL=postgresql://neondb_owner:****@ep-blue-night-akk7bv95.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require

# JWT — uniquement utilisé en mode legacy (rollback de Neon Auth)
JWT_SECRET=          # générer : openssl rand -base64 32
JWT_EXPIRES_IN=7d

# CORS — URL(s) frontend Vercel
APP_URL=https://your-client.vercel.app

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_FOLDER=studio-flyer-ai

# Neon Auth — vérification JWT via JWKS
NEON_AUTH_ENABLED=true
NEON_AUTH_ISSUER=https://ep-blue-night-akk7bv95.neonauth.c-3.us-west-2.aws.neon.tech/neondb/auth
NEON_AUTH_JWKS_URL=https://ep-blue-night-akk7bv95.neonauth.c-3.us-west-2.aws.neon.tech/neondb/auth/.well-known/jwks.json
NEON_AUTH_AUDIENCE=

# AI providers (laisser vide en mode mock)
AI_DEFAULT_TEXT_PROVIDER=mock
AI_DEFAULT_VISION_PROVIDER=mock
AI_DEFAULT_TEXT_MODEL=gpt-4o
AI_DEFAULT_VISION_MODEL=gpt-4o
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=

# Image generation (Nano Banana)
IMAGE_GEN_PROVIDER=mock           # mock | gemini
IMAGE_GEN_MODEL=gemini-2.5-flash-image-preview
```

## Vérification post-déploiement

Backend actuel : `https://sfa-api.onrender.com`.

```bash
# 1. Ping santé
curl https://sfa-api.onrender.com/api/health
# → { success: true, message: "STUDIO FLYER AI backend is running" }

# 2. Vérifier auth Neon (sans token → 401)
curl -X POST https://sfa-api.onrender.com/api/users/me
# → 401 Unauthorized

# 3. Mettre à jour les frontends Vercel :
# Dashboard Vercel → admin-dashboard → Settings → Environment Variables :
#   NEXT_PUBLIC_API_URL = https://sfa-api.onrender.com
# Idem pour frontend-client.
# Puis redeploy chaque frontend (Deployments → Redeploy).

# 4. Première utilisation — déclencher les seeds manuellement
# Connecté en admin (Neon Auth signup avec un email puis SET role='ADMIN' en DB) :
curl -X POST https://sfa-api.onrender.com/api/admin/forbidden-rules/seed \
  -H "Authorization: Bearer <stack-jwt>"
curl -X POST https://sfa-api.onrender.com/api/admin/settings/seed \
  -H "Authorization: Bearer <stack-jwt>"
```

## Mise à jour CORS dans `src/app.ts`

Actuellement `app.ts` n'autorise qu'une seule origine. Pour accepter plusieurs
URLs (admin + client), modifier :

```ts
app.use(cors({
  origin: env.APP_URL.split(',').map(s => s.trim()),  // accepte plusieurs URLs
  credentials: true,
}))
```

Et définir `APP_URL` ainsi :
```env
APP_URL=https://your-admin.vercel.app,https://your-client.vercel.app
```
