#!/usr/bin/env node
/**
 * Vérifie que la même CLERK_SECRET_KEY est utilisée par chaque backend
 * (local + prod Render) — ou détecte rapidement laquelle est désynchronisée.
 *
 * Usage :
 *   node scripts/check-clerk-auth.mjs
 *   node scripts/check-clerk-auth.mjs https://staging.example.com
 *
 * Le script :
 *   1. Lit CLERK_SECRET_KEY et CLERK_PUBLISHABLE_KEY depuis .env (apps/SFA-API/.env)
 *   2. Mint un session token Clerk pour l'utilisateur admin (ADMIN_EMAIL)
 *   3. Frappe /api/users/me sur chaque backend avec ce token
 *   4. Rapport : 200 = la clé Render correspond ; 401 = à corriger
 *
 * Si 401 sur prod : aller dans Render Dashboard → Service → Environment et
 * coller la même CLERK_SECRET_KEY que celle du .env local.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createClerkClient } from '@clerk/backend'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env')

function readEnv(key) {
  const raw = readFileSync(envPath, 'utf8')
  const m = raw.match(new RegExp(`^${key}\\s*=\\s*(.+)$`, 'm'))
  return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : null
}

const secretKey = process.env.CLERK_SECRET_KEY || readEnv('CLERK_SECRET_KEY')
const publishableKey = process.env.CLERK_PUBLISHABLE_KEY || readEnv('CLERK_PUBLISHABLE_KEY')
const adminEmail = readEnv('ADMIN_EMAIL') || 'ambitechdynamics@gmail.com'

if (!secretKey) {
  console.error('CLERK_SECRET_KEY introuvable (ni env, ni .env).')
  process.exit(1)
}

const TARGETS = [
  'http://localhost:5000',
  'https://sfa-api.onrender.com',
  ...process.argv.slice(2),
]

const clerk = createClerkClient({ secretKey, publishableKey })

console.log(`Clerk instance (local .env): ${publishableKey?.slice(0, 30)}...`)
const users = await clerk.users.getUserList({ emailAddress: [adminEmail] })
const list = Array.isArray(users) ? users : users.data
const user = list?.[0]
if (!user) {
  console.error(`Aucun utilisateur Clerk pour ${adminEmail}.`)
  process.exit(2)
}
console.log(`Test user: ${user.id} (${adminEmail})`)

const session = await clerk.sessions.createSession({ userId: user.id })
const tokenObj = await clerk.sessions.getToken(session.id, '')
const token = tokenObj.jwt
console.log(`Token minted, expires in 60 s\n`)

let allOk = true
for (const base of TARGETS) {
  process.stdout.write(`→ ${base.padEnd(40)} `)
  try {
    const res = await fetch(`${base}/api/users/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
    const txt = await res.text()
    const ok = res.status === 200
    if (!ok) allOk = false
    const detail = ok ? 'OK' : `FAIL · ${txt.slice(0, 120)}`
    console.log(`[${res.status}] ${detail}`)
  } catch (err) {
    allOk = false
    console.log(`UNREACHABLE · ${err instanceof Error ? err.message : err}`)
  }
}

console.log(
  allOk
    ? '\n✅  Tous les backends valident la même CLERK_SECRET_KEY.'
    : '\n❌  Au moins un backend rejette le token. Cible 401 = CLERK_SECRET_KEY différente. Corrige côté Render → Service → Environment.',
)
process.exit(allOk ? 0 : 3)
