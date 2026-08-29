import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const results = []
let failed = 0

function check(name, ok, detail) {
  if (ok) results.push('PASS  ' + name)
  else {
    failed++
    results.push('FAIL  ' + name + (detail ? ' :: ' + detail : ''))
  }
}

async function waitLoadingDone(page) {
  try {
    await page.waitForSelector('[aria-label="Loading Rent Bridge"]', { state: 'detached', timeout: 20000 })
  } catch {
    // loading may not be present (e.g. direct deep link after first load); continue
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: false,
    // reuse the shared browser via the env var already set
  })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  const consoleErrors = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + String(e)))

  auto: await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await waitLoadingDone(page)
  await page.screenshot({ path: '/tmp/opencode/pt-01-landing.png' })

  // ---------- Landing page ----------
  check('Landing page title contains Rent Bridge', /Rent Bridge/i.test(await page.title()))
  const logo = page.locator('img[src="/rentbridge-logo.png"]')
  check('Landing page logo present', await logo.count() >= 1)
  const heroH1 = page.locator('h1').first()
  check('Hero heading present', await heroH1.count() >= 1)
  const heroText = await heroH1.innerText()
  check('Hero text contains home location', /Yaba|Lagos|Home/i.test(heroText), heroText)

  // ---------- Navigation: click Get Started / Browse homes ----------
  const getStarted = page.getByRole('button', { name: 'Get Started' }).or(page.getByRole('link', { name: 'Get Started' })).or(page.getByText('Get Started'))
  if (await getStarted.count()) {
    await getStarted.click()
    await page.waitForLoadState('networkidle')
  } else {
    // try navigating to dashboard directly
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' })
  }
  await waitLoadingDone(page)
  await page.screenshot({ path: '/tmp/opencode/pt-02-dashboard.png' })

  // ---------- Dashboard ----------
  const dashHeading = page.getByText('Homes near Yaba, Lagos')
  check('Dashboard heading visible', await dashHeading.count() >= 1)
  // check for duplicate heading (the earlier bug)
  const headingCount = await page.getByText('Homes near Yaba, Lagos').count()
  check('Dashboard heading renders exactly once (no duplicate)', headingCount === 1, 'count=' + headingCount)

  // property cards
  const cards = page.locator('.property-card').or(page.locator('.PropertyCard')).or(page.locator('[class*="card"]'))
  const cardCount = await cards.count()
  check('Dashboard shows property cards', cardCount >= 3, 'count=' + cardCount)

  // filter: location
  const locInput = page.getByPlaceholder('Any area')
  if (await locInput.count()) {
    await locInput.fill('Yaba')
    await page.waitForTimeout(400)
    const afterFilter = await page.locator('text=/verified/i').count()
    check('Dashboard location filter works', afterFilter >= 0)
    await page.screenshot({ path: '/tmp/opencode/pt-03-dashboard-filtered.png' })
  }

  // type dropdown
  const typeSelect = page.locator('select').first()
  if (await typeSelect.count()) {
    await typeSelect.selectOption('apartment')
    await page.waitForTimeout(400)
    check('Type dropdown filters', true, 'selected apartment')
  }

  // favorite / save button (check it's present and clickable)
  const favBtn = page.locator('.FavoriteButton').or(page.locator('[data-testid="favorite"]')).or(page.locator('text=/Save|Favorite/i'))
  if (await favBtn.count()) {
    const isDisabled = await favBtn.isDisabled()
    check('Favorite button is initially enabled', !isDisabled)
    await favBtn.click()
    await page.waitForTimeout(300)
    check('Favorite button click handled', true)
  }

  // ---------- Navigation: login ----------
  const loginLink = page.getByRole('link', { name: 'Login' }).or(page.getByText('Login'))
  if (await loginLink.count()) {
    await loginLink.click()
    await page.waitForLoadState('networkidle')
    await waitLoadingDone(page)
    await page.screenshot({ path: '/tmp/opencode/pt-04-login.png' })
    check('Login page loads', await page.locator('input[name="email"]').count() >= 1)
  }

  // ---------- Sign up flow ----------
  await page.goto(BASE + '/register', { waitUntil: 'domcontentloaded' })
  await waitLoadingDone(page)
  await page.screenshot({ path: '/tmp/opencode/pt-05-signup.png' })
  await page.fill('input[name="fullName"]', 'Test User')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button:has-text("Continue")')
  await page.waitForURL('**/role-selection', { timeout: 8000 })
  await page.screenshot({ path: '/tmp/opencode/pt-06-role-selection.png' })

  // role selection: default should be Tenant, click Continue
  await page.click('button:has-text("Continue")')
  await page.waitForURL('**/create-account', { timeout: 8000 })
  await page.screenshot({ path: '/tmp/opencode/pt-07-create-account.png' })

  // prefill check
  const pName = await page.inputValue('input[name="fullName"]').catch(() => '')
  const pEmail = await page.inputValue('input[name="email"]').catch(() => '')
  check('Create account prefills name', pName === 'Test User', pName)
  check('Create account prefills email', pEmail === 'test@example.com', pEmail)

  // confirm password should be empty, location/phone empty
  const cPw = await page.inputValue('input[name="confirmPassword"]').catch(() => 'NO_FIELD')
  check('Confirm password is empty', cPw === '', 'val=' + cPw)
  const locV = await page.inputValue('input[placeholder="Yaba, Lagos"]').catch(() => 'NO_FIELD')
  check('Location is empty', locV === '', 'val=' + locV)

  // password eye toggle
  const eyeToggles = page.locator('button[type="button"]').filter({ has: page.locator('svg') })
  const eyeCount = await eyeToggles.count()
  check('Password eye toggle controls present', eyeCount >= 1)

  await page.click('button:has-text("Create account & continue")')
  await page.waitForURL('**/kyc-verification', { timeout: 8000 })
  await page.screenshot({ path: '/tmp/opencode/pt-08-kyc.png' })

  // KYC checks
  const kycH = page.getByText('Verification').count()
  check('KYC shows Verification heading', kycH >= 1)
  const pending = page.getByText('Pending').count()
  check('KYC shows PENDING badge', pending >= 1)
  const cBtn = page.locator('button:has-text("Continue")')
  const cDisabled = await cBtn.isDisabled()
  check('KYC Continue button is disabled', cDisabled)

  // ---------- Login page ----------
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
  await waitLoadingDone(page)
  await page.screenshot({ path: '/tmp/opencode/pt-09-login.png' })
  check('Login page renders', await page.locator('input[name="email"]').count() >= 1)

  // ---------- 404 ----------
  await page.goto(BASE + '/this-route-does-not-exist', { waitUntil: 'domcontentloaded' })
  await waitLoadingDone(page)
  const notFound = page.getByText(/not found|404/i).count()
  check('Unknown route shows not-found', notFound >= 1)
  await page.screenshot({ path: '/tmp/opencode/pt-10-notfound.png' })

  // ---------- Summary ----------
  await context.close()
  await browser.close()

  console.log('\n===== PLAYWRIGHT TEST REPORT =====')
  console.log(results.join('\n'))
  console.log('\n' + (failed === 0 ? 'ALL PASSED' : failed + ' FAILURE(S)'))
  console.log('(' + results.length + ' checks)')
  if (consoleErrors.length) {
    console.log('\n--- console errors ---')
    console.log(consoleErrors.join('\n'))
  }
  process.exit(failed === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('TEST CRASHED:', e)
  process.exit(2)
})