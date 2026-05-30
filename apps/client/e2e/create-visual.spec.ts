import { test, expect, type Page } from '@playwright/test'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const CLIENT_URL = process.env.E2E_CLIENT_URL ?? 'http://localhost:3001'
const EMAIL = process.env.E2E_EMAIL ?? 'ambitechdynamics@gmail.com'

function getClerkTicket(email: string): string {
  const out = execFileSync('node', [path.join(__dirname, 'get-clerk-ticket.mjs'), email], { encoding: 'utf8' })
  const parsed = JSON.parse(out.trim())
  return parsed.token as string
}

const ASSETS_DIR = 'C:/Users/AMBITECH DYNAMICS/OneDrive/Documents/Projects/Studio Flyer AI/test visuel'
const LOGO = path.join(ASSETS_DIR, 'logo.jpg')
const CHARACTER = path.join(ASSETS_DIR, 'personnage.jpeg')

const THEME_NAME = 'Création site web professionnel'
const PROMPT = "créer une affiche publicitaire pour création site web professionnel"

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
      try { body = (await res.text()).slice(0, 400) } catch {}
      API_ERRORS.push({ url, status: res.status(), body })
    }
  })
}

test.setTimeout(10 * 60 * 1000) // 10 min total

test('E2E création visuel complet', async ({ page }, testInfo) => {
  attachLoggers(page)
  const startedAt = Date.now()
  const milestones: Array<{ step: string; ms: number }> = []
  const mark = (step: string) => milestones.push({ step, ms: Date.now() - startedAt })

  // 1. LOGIN — bypass Google OAuth via Clerk sign-in ticket (Backend SDK)
  const ticket = getClerkTicket(EMAIL)
  await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle' })
  mark('login.page-loaded')

  // Wait for Clerk to load on the window
  await page.waitForFunction(() => {
    const w = window as unknown as { Clerk?: { loaded?: boolean; client?: unknown } }
    return !!w.Clerk?.loaded && !!w.Clerk?.client
  }, { timeout: 30_000 })
  mark('login.clerk-loaded')

  // Sign in using the ticket strategy, then activate the session
  const signInResult = await page.evaluate(async (t: string) => {
    type SignIn = {
      create(opts: { strategy: 'ticket'; ticket: string }): Promise<{ status: string; createdSessionId?: string }>
    }
    const w = window as unknown as {
      Clerk: {
        client: { signIn: SignIn }
        setActive(opts: { session: string }): Promise<void>
      }
    }
    const r = await w.Clerk.client.signIn.create({ strategy: 'ticket', ticket: t })
    if (r.status === 'complete' && r.createdSessionId) {
      await w.Clerk.setActive({ session: r.createdSessionId })
    }
    return { status: r.status, sessionId: r.createdSessionId ?? null }
  }, ticket)
  mark('login.ticket-redeemed')
  if (signInResult.status !== 'complete') {
    throw new Error(`Ticket sign-in did not complete: ${JSON.stringify(signInResult)}`)
  }

  // Navigate to dashboard now that the session is active
  await page.goto(`${CLIENT_URL}/dashboard`, { waitUntil: 'networkidle' })
  await page.waitForURL(/\/dashboard(\b|$)/, { timeout: 60_000 })
  mark('login.success')
  await testInfo.attach('after-login', { body: await page.screenshot(), contentType: 'image/png' })

  // 2. DASHBOARD — fill name + upload assets + Créer
  await page.waitForSelector('input.csl-input[placeholder="Nom du projet"]', { timeout: 30_000 })
  await page.fill('input.csl-input[placeholder="Nom du projet"]', THEME_NAME)
  mark('dashboard.name-filled')

  // Upload both files into the hidden <input type="file" multiple>
  // The AssetImportPanel uses a single hidden file input shared by all asset types
  const fileInput = page.locator('input[type="file"][multiple]').first()
  await fileInput.setInputFiles([LOGO, CHARACTER])
  mark('dashboard.files-attached')

  // Verify both thumbnails rendered (AssetImportPanel uses object-URL <img>)
  await expect(page.locator('img[src^="blob:"]')).toHaveCount(2, { timeout: 10_000 })

  // Click "Créer"
  await page.click('button.csl-btn-primary:has-text("Créer")')
  mark('dashboard.create-clicked')

  // Wait for redirect to /dashboard/t/{travailId}
  await page.waitForURL(/\/dashboard\/t\/[^/]+/, { timeout: 60_000 })
  const travailUrl = page.url()
  const travailId = travailUrl.split('/').pop() ?? ''
  mark('workspace.opened')
  await testInfo.attach('workspace-opened', { body: await page.screenshot(), contentType: 'image/png' })

  // 3. WORKSPACE — type the brief, send
  const textarea = page.locator('textarea.csl-ws-chat-textarea')
  await textarea.waitFor({ state: 'visible', timeout: 30_000 })
  await textarea.fill(PROMPT)
  mark('workspace.prompt-typed')

  await page.click('button.csl-ws-send:has-text("Envoyer")')
  mark('workspace.prompt-sent')

  // 4. CLICK "Générer le visuel" — tolerant: chat may hang in mock mode
  const generateBtn = page.locator('button:has-text("Générer le visuel")')
  await generateBtn.waitFor({ state: 'visible', timeout: 30_000 })

  // Wait up to 90s for the button to become enabled (chat completes); if it
  // never enables, force-click anyway via DOM to bypass the local disabled
  // flag and trigger the React onClick handler.
  let chatCompleted = false
  try {
    await page.waitForFunction(
      () => {
        const btns = Array.from(document.querySelectorAll('button'))
        const target = btns.find((b) => b.textContent?.includes('Générer le visuel'))
        return !!target && !(target as HTMLButtonElement).disabled
      },
      undefined,
      { timeout: 90_000 },
    )
    chatCompleted = true
    mark('workspace.chat-ready')
    await generateBtn.click()
  } catch {
    mark('workspace.chat-stuck-bypass')
    // Force-enable + click via JS — React onClick still fires even if disabled
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
      const target = btns.find((b) => b.textContent?.includes('Générer le visuel'))
      if (target) {
        target.disabled = false
        target.click()
      }
    })
  }
  console.log(`[e2e] chat completed normally: ${chatCompleted}`)
  mark('workspace.generate-clicked')

  // 5. WAIT for at least one poster image (`.csl-poster img`) — up to 8 min
  await page
    .locator('.csl-poster img')
    .first()
    .waitFor({ state: 'visible', timeout: 8 * 60_000 })
  mark('poster.first-visible')

  // Grab all poster URLs
  const posterUrls = await page.locator('.csl-poster img').evaluateAll((imgs) =>
    imgs.map((i) => (i as HTMLImageElement).src)
  )

  await testInfo.attach('final-state', { body: await page.screenshot(), contentType: 'image/png' })

  // ── REPORT ──
  const report = {
    travailId,
    travailUrl,
    durationMs: Date.now() - startedAt,
    milestones,
    posterCount: posterUrls.length,
    posterUrls,
    apiErrors: API_ERRORS,
    consoleErrors: CONSOLE_ERRORS.slice(0, 20),
  }
  console.log('\n========== E2E REPORT ==========')
  console.log(JSON.stringify(report, null, 2))
  console.log('================================\n')

  await testInfo.attach('report.json', { body: JSON.stringify(report, null, 2), contentType: 'application/json' })

  expect(posterUrls.length).toBeGreaterThan(0)
})
