import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"

const BASE_URL = (process.env.BASE_URL || "http://localhost:3001").replace(/\/+$/, "")
const LOADING_TEXT = "Vérification de votre session"

function chromeCandidates() {
  const candidates = []
  if (process.env.CHROME_PATH) candidates.push(process.env.CHROME_PATH)

  if (process.platform === "win32") {
    const roots = [process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"], process.env.LOCALAPPDATA].filter(Boolean)
    for (const root of roots) {
      candidates.push(
        path.join(root, "Google", "Chrome", "Application", "chrome.exe"),
        path.join(root, "Microsoft", "Edge", "Application", "msedge.exe"),
      )
    }
  } else if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    )
  } else {
    candidates.push("/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/microsoft-edge")
  }

  return candidates.filter(Boolean)
}

function findBrowser() {
  const browser = chromeCandidates().find((candidate) => existsSync(candidate))
  if (!browser) {
    throw new Error("No Chrome/Edge executable found. Set CHROME_PATH to run auth loading verification.")
  }
  return browser
}

function dumpDom(browser, url) {
  const profileDir = mkdtempSync(path.join(tmpdir(), "studio-flyer-auth-"))
  try {
    const result = spawnSync(browser, [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--disable-extensions",
      `--user-data-dir=${profileDir}`,
      "--virtual-time-budget=10000",
      "--dump-dom",
      url,
    ], {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    })

    if (result.error) throw result.error
    if (result.status !== 0) {
      throw new Error(result.stderr || `Browser exited with status ${result.status}`)
    }
    return result.stdout
  } finally {
    rmSync(profileDir, { recursive: true, force: true })
  }
}

function assertNoStuckLoader(name, html) {
  if (html.includes(LOADING_TEXT)) {
    throw new Error(`${name} is still showing "${LOADING_TEXT}" after hydration budget.`)
  }
}

const browser = findBrowser()
const loginHtml = dumpDom(browser, `${BASE_URL}/login`)
const dashboardHtml = dumpDom(browser, `${BASE_URL}/dashboard`)

for (const text of ["Bon retour", "Continuer avec Google", "Adresse e-mail", "Se connecter"]) {
  if (!loginHtml.includes(text)) {
    throw new Error(`/login did not render expected text: ${text}`)
  }
}

assertNoStuckLoader("/login", loginHtml)
assertNoStuckLoader("/dashboard", dashboardHtml)

console.log(`Auth loading verification passed for ${BASE_URL}`)
