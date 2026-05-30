// Generates a Clerk one-time sign-in ticket for the test user, so Playwright
// can bypass the Google OAuth wall. Reads CLERK_SECRET_KEY from the backend
// .env. Prints the ticket to stdout.
//
// Usage: node e2e/get-clerk-ticket.mjs <email>

import { readFileSync } from 'node:fs'
import { createClerkClient } from '@clerk/backend'

const email = process.argv[2] || 'ambitechdynamics@gmail.com'

function readEnv(filePath, key) {
  const txt = readFileSync(filePath, 'utf8')
  const m = txt.match(new RegExp(`^${key}\\s*=\\s*(.+)$`, 'm'))
  return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : null
}

const apiEnv = 'C:/Users/AMBITECH DYNAMICS/OneDrive/Documents/Projects/Studio Flyer AI/apps/SFA-API/.env'
const secretKey = process.env.CLERK_SECRET_KEY || readEnv(apiEnv, 'CLERK_SECRET_KEY')
const publishableKey = process.env.CLERK_PUBLISHABLE_KEY || readEnv(apiEnv, 'CLERK_PUBLISHABLE_KEY')

if (!secretKey) {
  console.error('CLERK_SECRET_KEY not found')
  process.exit(1)
}

const clerk = createClerkClient({ secretKey, publishableKey })

const users = await clerk.users.getUserList({ emailAddress: [email] })
const list = Array.isArray(users) ? users : users.data
if (!list || list.length === 0) {
  console.error(`No Clerk user found for ${email}`)
  process.exit(2)
}
const user = list[0]

const ticket = await clerk.signInTokens.createSignInToken({
  userId: user.id,
  expiresInSeconds: 60 * 30,
})

console.log(JSON.stringify({
  userId: user.id,
  email,
  token: ticket.token,
}))
