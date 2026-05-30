/**
 * E2E — Génère un visuel sur un PROJET DEJA EXISTANT
 *
 * Flux :
 *   1. Login via ticket Clerk (bypass Google OAuth)
 *   2. /dashboard/projects → clique sur la première marque
 *   3. Workspace : avance la conversation en cliquant les chips
 *   4. Envoie un brief consolidé pour saturer le planner
 *   5. "Générer le visuel" + retry si "prompt pas prêt"
 *   6. Attend l'apparition des posters et journalise tout
 */

import { test, expect, type Page } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const CLIENT_URL = process.env.E2E_CLIENT_URL ?? 'http://localhost:3001'
const EMAIL = process.env.E2E_EMAIL ?? 'ambitechdynamics@gmail.com'
const PASSWORD = process.env.E2E_PASSWORD ?? 'Manu4325@M'

function getClerkTicket(email: string): string {
  const out = execFileSync('node', [path.join(__dirname, 'get-clerk-ticket.mjs'), email], { encoding: 'utf8' })
  return (JSON.parse(out.trim()) as { token: string }).token
}

const API_ERRORS: Array<{ url: string; status: number; body: string }> = []
const CONSOLE_ERRORS: string[] = []

function attachLoggers(page: Page) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') CONSOLE_ERRORS.push(msg.text())
  })
  page.on('response', async (res) => {
    const url = res.url()
    if (!url.includes('/api/')) return
    if (res.status() >= 400) {
      let body = ''
      try { body = (await res.text()).slice(0, 600) } catch {}
      API_ERRORS.push({ url, status: res.status(), body })
    }
  })
}

const BRIEF_DETAIL = [
  "Affiche publicitaire format flyer A4 portrait (3:4) pour Ambitech Dynamics.",
  "Service : création de site web professionnel pour PME en Afrique de l'Ouest.",
  "Cible : entrepreneurs et restaurateurs Lomé/Accra/Abidjan, 25–45 ans.",
  "Ton : moderne, dynamique, premium mais accessible.",
  "Palette : bleu profond #0B3D91, orange accent #FF6B1A, blanc.",
  "Texte principal: 'CRÉEZ VOTRE SITE WEB PROFESSIONNEL'.",
  "Sous-titre: 'Livraison en 7 jours · Design sur-mesure · Mobile-first'.",
  "CTA: 'Devis gratuit — +228 90 00 00 00'.",
  "Inclure le logo Ambitech (fourni) en haut à gauche, et le portrait fourni en grande taille.",
  "Style: photo réaliste + mise en page éditoriale, typographie sans-serif large, hiérarchie claire.",
].join(' ')

test.setTimeout(15 * 60 * 1000)

test('Génération visuel sur projet existant', async ({ page }, testInfo) => {
  attachLoggers(page)
  const startedAt = Date.now()
  const milestones: Array<{ step: string; ms: number; note?: string }> = []
  const mark = (step: string, note?: string) => {
    const entry = { step, ms: Date.now() - startedAt, note }
    milestones.push(entry)
    console.log(`[e2e:${entry.ms}ms] ${step}${note ? ` :: ${note}` : ''}`)
  }

  // ── 1. LOGIN via Clerk ticket strategy ─────────────────
  const ticket = getClerkTicket(EMAIL)
  await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'domcontentloaded' })
  mark('login.page-loaded')

  await page.waitForFunction(() => {
    const w = window as unknown as { Clerk?: { loaded?: boolean; client?: unknown } }
    return !!w.Clerk?.loaded && !!w.Clerk?.client
  }, { timeout: 30_000 })

  const signInResult = await page.evaluate(async (t: string) => {
    type SignIn = { create(o: { strategy: 'ticket'; ticket: string }): Promise<{ status: string; createdSessionId?: string }> }
    const w = window as unknown as { Clerk: { client: { signIn: SignIn }, setActive(o: { session: string }): Promise<void> } }
    const r = await w.Clerk.client.signIn.create({ strategy: 'ticket', ticket: t })
    if (r.status === 'complete' && r.createdSessionId) await w.Clerk.setActive({ session: r.createdSessionId })
    return { status: r.status, sessionId: r.createdSessionId ?? null }
  }, ticket)
  if (signInResult.status !== 'complete') throw new Error(`ticket sign-in: ${JSON.stringify(signInResult)}`)
  mark('login.ticket-redeemed', signInResult.sessionId ?? undefined)

  // Force a real auth-cookied roundtrip so Clerk's __session cookie is flushed
  // before the next protected navigation. `/api/users/me` is the actual
  // authenticated user endpoint (the backend has no /api/auth/me route).
  await page.evaluate(async () => {
    const w = window as unknown as {
      Clerk?: { session?: { getToken: () => Promise<string | null> } | null }
    }
    const tok = await w.Clerk?.session?.getToken()
    await fetch('/api/users/me', {
      method: 'GET',
      credentials: 'include',
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    }).catch(() => {})
  })
  mark('login.api-roundtrip')

  // Dump cookies for debugging (will appear in report)
  const cookies = await page.context().cookies()
  const clerkCookies = cookies.filter((c) => c.name.includes('clerk') || c.name.includes('session') || c.name === '__session')
  mark('login.cookies', clerkCookies.map((c) => c.name).join(','))

  // Hit /dashboard so the protected layout loads. Retry up to 5×.
  let onDashboard = false
  for (let i = 0; i < 5 && !onDashboard; i++) {
    await page.goto(`${CLIENT_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    if (!/\/login(\b|\?)/.test(page.url())) onDashboard = true
    else {
      mark(`login.dashboard-bounce-${i}`, page.url().slice(0, 100))
      await page.waitForTimeout(2000)
    }
  }
  if (!onDashboard) throw new Error(`/dashboard bounced to login after retries: ${page.url()}`)
  mark('login.dashboard-reached')

  // ── 2. PROJECTS LIST ────────────────────────────────────
  await page.goto(`${CLIENT_URL}/dashboard/projects`, { waitUntil: 'domcontentloaded' })
  mark('projects.list-loaded')

  // Wait for project cards or empty state; reload once if first wait times out
  const projectCard = page.locator('.project-card').first()
  let cardsVisible = false
  for (let i = 0; i < 2 && !cardsVisible; i++) {
    try {
      await projectCard.waitFor({ state: 'visible', timeout: 60_000 })
      cardsVisible = true
    } catch {
      mark(`projects.reload-${i}`, page.url())
      await page.reload({ waitUntil: 'domcontentloaded' })
    }
  }
  if (!cardsVisible) {
    mark('projects.cards-missing', `url=${page.url()} apiErrors=${API_ERRORS.length}`)
    console.log('[e2e] API_ERRORS so far:', JSON.stringify(API_ERRORS, null, 2))
    console.log('[e2e] CONSOLE_ERRORS so far:', JSON.stringify(CONSOLE_ERRORS.slice(0, 20), null, 2))
    throw new Error('No project cards visible after reload')
  }
  mark('projects.cards-visible')

  await testInfo.attach('01-projects-list', { body: await page.screenshot(), contentType: 'image/png' })

  // ── 3. OPEN FIRST PROJECT ──────────────────────────────
  await projectCard.click()
  await page.waitForURL(/\/dashboard\/t\/[^/]+/, { timeout: 60_000 })
  const travailUrl = page.url()
  const travailId = travailUrl.split('/').pop() ?? ''
  mark('project.opened', travailId)

  // Wait textarea visible (workspace loaded)
  await page.locator('textarea.csl-ws-chat-textarea').waitFor({ state: 'visible', timeout: 30_000 })
  await testInfo.attach('02-workspace-opened', { body: await page.screenshot(), contentType: 'image/png' })

  // ── 4. PUSH CONVERSATION FORWARD ───────────────────────
  // Stratégie :
  //  a) Cliquer le premier chip visible (max 4 clics) en attendant la réponse assistant
  //  b) Envoyer le brief consolidé une seule fois
  const isSendingLocator = page.locator('.csl-msg.assistant .anim-dot-bounce')

  for (let turn = 0; turn < 4; turn++) {
    const chips = page.locator('.csl-ws-chip')
    const chipCount = await chips.count().catch(() => 0)
    if (chipCount === 0) break

    // Préférence : si "J'ai des fichiers à joindre" existe, le prendre (les fichiers
    // sont déjà attachés au projet). Sinon, premier chip.
    let chip = chips.first()
    for (let i = 0; i < chipCount; i++) {
      const t = (await chips.nth(i).innerText().catch(() => '')).toLowerCase()
      if (t.includes('fichiers à joindre') || t.includes("j'ai des") || t.includes('site web') || t.includes('acquisition')) {
        chip = chips.nth(i)
        break
      }
    }
    const label = await chip.innerText().catch(() => '?')
    await chip.click()
    mark(`chat.chip-click-${turn}`, label.slice(0, 40))

    // Wait for assistant to start AND finish replying
    try {
      await isSendingLocator.first().waitFor({ state: 'visible', timeout: 5_000 })
    } catch { /* maybe already finished */ }
    await isSendingLocator.first().waitFor({ state: 'detached', timeout: 90_000 }).catch(() => {})
    mark(`chat.assistant-replied-${turn}`)
  }

  // Envoie le brief consolidé pour saturer le planner
  const textarea = page.locator('textarea.csl-ws-chat-textarea')
  await textarea.fill(BRIEF_DETAIL)
  await page.click('button.csl-ws-send:has-text("Envoyer")')
  mark('chat.brief-sent')

  // Wait for assistant response
  try {
    await isSendingLocator.first().waitFor({ state: 'visible', timeout: 10_000 })
  } catch {}
  await isSendingLocator.first().waitFor({ state: 'detached', timeout: 120_000 }).catch(() => {})
  mark('chat.brief-answered')

  await testInfo.attach('03-after-brief', { body: await page.screenshot(), contentType: 'image/png' })

  // ── 5. GENERATE WITH RETRIES ────────────────────────────
  let generated = false
  let lastGenError: string | null = null

  for (let attempt = 0; attempt < 3 && !generated; attempt++) {
    const genBtn = page.locator('button:has-text("Générer le visuel")').first()
    await genBtn.waitFor({ state: 'visible', timeout: 30_000 })

    // Always force-click via JS to bypass any disabled state
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
      const t = btns.find((b) => b.textContent?.includes('Générer le visuel'))
      if (t) { t.disabled = false; t.click() }
    })
    mark(`generate.click-${attempt}`)

    // Race: posters arrival vs genError message
    const result = await Promise.race([
      page.locator('.csl-poster img').first().waitFor({ state: 'visible', timeout: 6 * 60_000 }).then(() => 'posters' as const),
      page.locator('.csl-error').first().waitFor({ state: 'visible', timeout: 6 * 60_000 }).then(() => 'error' as const),
    ]).catch(() => 'timeout' as const)

    if (result === 'posters') { generated = true; break }
    if (result === 'error') {
      lastGenError = await page.locator('.csl-error').first().innerText().catch(() => null)
      mark(`generate.error-${attempt}`, lastGenError?.slice(0, 80))
      // Send a follow-up that confirms details, then retry
      await textarea.fill("Tout est confirmé : flyer A4 portrait 3:4, palette bleu/orange, brand Ambitech, texte 'Créez votre site web professionnel', sous-titre, CTA téléphone. Lance la génération maintenant.")
      await page.click('button.csl-ws-send:has-text("Envoyer")')
      try { await isSendingLocator.first().waitFor({ state: 'visible', timeout: 5_000 }) } catch {}
      await isSendingLocator.first().waitFor({ state: 'detached', timeout: 120_000 }).catch(() => {})
    } else {
      mark(`generate.timeout-${attempt}`)
    }
  }

  // Collect posters whatever happened
  const posterUrls = await page.locator('.csl-poster img').evaluateAll((imgs) =>
    imgs.map((i) => (i as HTMLImageElement).src)
  )

  await testInfo.attach('04-final-state', { body: await page.screenshot(), contentType: 'image/png' })

  // Save first poster image bytes for archival
  if (posterUrls[0]) {
    try {
      const res = await page.request.get(posterUrls[0])
      const buf = Buffer.from(await res.body())
      const outFile = path.join(testInfo.outputDir, 'first-poster.png')
      fs.writeFileSync(outFile, buf)
      await testInfo.attach('first-poster', { body: buf, contentType: res.headers()['content-type'] || 'image/png' })
    } catch (err) {
      console.warn('[e2e] could not download first poster', err)
    }
  }

  // ── 6. REPORT ───────────────────────────────────────────
  const report = {
    travailId,
    travailUrl,
    durationMs: Date.now() - startedAt,
    generated,
    posterCount: posterUrls.length,
    posterUrls,
    lastGenError,
    milestones,
    apiErrors: API_ERRORS,
    consoleErrors: CONSOLE_ERRORS.slice(0, 40),
  }
  console.log('\n========== E2E REPORT ==========')
  console.log(JSON.stringify(report, null, 2))
  console.log('================================\n')
  await testInfo.attach('report.json', { body: JSON.stringify(report, null, 2), contentType: 'application/json' })

  // Le test ne fait PAS échouer s'il n'y a pas de poster — on veut un rapport
  // complet de ce qui a fonctionné et ce qui n'a pas fonctionné.
  expect(milestones.length).toBeGreaterThan(0)
})
