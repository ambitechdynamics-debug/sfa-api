# STUDIO FLYER AI Backend

Backend de départ pour le SaaS **STUDIO FLYER AI / POSTER AI**.

Cette première phase met en place une API Express.js modulaire avec TypeScript, Prisma, PostgreSQL, JWT, bcrypt et Zod. Elle ne contient pas encore d'appel réel à Claude, ChatGPT, Gemini ou Nano Banana.

## Fonctionnalités

- Authentification JWT : register, login, me
- Gestion utilisateur connecté
- CRUD projets protégés par propriétaire
- CRUD des mémoires métier :
  - `M_SMS`
  - `M_QT1`
  - `M_QT2`
  - `M_MD`
  - `M_ID`
  - `M_BA`
  - `M_PROMPT1`
- Métadonnées fichiers compatibles stockage cloud futur
- Base artistique avec lecture publique et mutations admin
- Validation Zod
- Erreurs JSON standardisées
- Seed admin optionnel

## Installation

```bash
npm install
```

Copier `.env.example` vers `.env`, puis renseigner au minimum :

```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/studio_flyer_ai
JWT_SECRET=replace-with-a-long-secret
JWT_EXPIRES_IN=7d
APP_URL=http://localhost:3000
```

## Base de données

Générer le client Prisma :

```bash
npm run prisma:generate
```

Créer les tables :

```bash
npm run prisma:migrate
```

Créer ou mettre à jour un administrateur depuis les variables `ADMIN_*` :

```bash
npm run prisma:seed
```

## Lancement

Développement :

```bash
npm run dev
```

Production :

```bash
npm run build
npm start
```

## Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Users

- `GET /api/users/me`
- `PATCH /api/users/me`

### Projects

- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:projectId`
- `PATCH /api/projects/:projectId`
- `DELETE /api/projects/:projectId`

### Memory

- `POST /api/projects/:projectId/memory`
- `GET /api/projects/:projectId/memory`
- `GET /api/projects/:projectId/memory/:type`
- `PATCH /api/projects/:projectId/memory/:type`
- `DELETE /api/projects/:projectId/memory/:type`

### Files

- `POST /api/projects/:projectId/files`
- `GET /api/projects/:projectId/files`
- `DELETE /api/files/:fileId`

Le module fichiers stocke uniquement les métadonnées dans cette phase :

```json
{
  "fileUrl": "https://cdn.example.com/logo.png",
  "fileType": "image/png",
  "originalName": "logo.png",
  "usageType": "LOGO"
}
```

### Artistic Base

- `POST /api/admin/artistic-resources`
- `GET /api/artistic-resources`
- `GET /api/artistic-resources/search`
- `GET /api/artistic-resources/:resourceId`
- `PATCH /api/admin/artistic-resources/:resourceId`
- `DELETE /api/admin/artistic-resources/:resourceId`

## Format de réponse

Succès :

```json
{
  "success": true,
  "message": "",
  "data": {}
}
```

Erreur :

```json
{
  "success": false,
  "message": "",
  "errors": []
}
```
