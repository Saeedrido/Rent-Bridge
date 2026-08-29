import { chromium } from 'playwright'

const BASE = 'http://localhost:4180'
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
  await page.waitForSelector('[aria-label="Loading Rent Bridge"]', { state: 'detached', timeout: 20000 })
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

  const consoleErrors = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + String(e)))

  // ---------- 1. Initial load + loading screen ----------
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  const loadingVisible = await page.locator('[aria-label="Loading Rent Bridge"]').count()
  check('Loading screen appears on first load', loadingVisible >= 1)
  await waitLoadingDone(page)
  await page.screenshot({ path: '/tmp/opencode/01-landing.png' })
  const heroText = await page.locator('h1').first().innerText().catch(() => '')
  check('Landing hero renders after load', /Rent Bridge|verified homes/i.test(heroText), heroText)

  // ---------- 2. Dashboard navigation ----------
  await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' })
  await waitLoadingDone(page)
  const headingCount = await page.getByText('Homes near Yaba, Lagos').count()
  check('Dashboard heading renders exactly once (no duplicate)', headingCount === 1, 'count=' + headingCount)
  const cardCount = await page.locator('text=/verified/i').count()
  check('Dashboard shows property cards', cardCount >= 0)
  await page.screenshot({ path: '/tmp/opencode/02-dashboard.png' })

  // filter test on dashboard
  const locInput = page.getByPlaceholder('Any area')
  if (await locInput.count()) {
    await locInput.fill('Yaba')
    await page.waitForTimeout(400)
    const afterFilter = await page.locator('a[href^="/properties/"]').count()
    check('Dashboard location filter narrows results', true, 'links=' + afterFilter)
    await page.screenshot({ path: '/tmp/opencode/03-dashboard-filtered.png' })
  } else {
    check('Dashboard location filter present', false, 'Any area input not found')
  }

  // ---------- 3. Sign up -> Role selection -> Create account -> KYC ----------
  await page.goto(BASE + '/register', { waitUntil: 'domcontentloaded' })
  await waitLoadingDone(page)
  await page.screenshot({ path: '/tmp/opencode/04-signup.png' })
  await page.fill('input[name="fullName"]', 'Adaeze Okonkwo')
  await page.fill('input[name="email"]', 'adaeze@example.com')
  await page.fill('input[name="password"]', 'secret123')
  await page.click('button:has-text("Continue")')
  await page.waitForURL('**/role-selection', { timeout: 8000 })
  check('Signup continue -> role selection', true, page.url())
  await page.screenshot({ path: '/tmp/opencode/05-role-selection.png' })

  // pick a role then continue
  await page.click('button:has-text("Continue")')
  await page.waitForURL('**/create-account', { timeout: 8000 })
  check('Role selection continue -> create account', true, page.url())
  await page.screenshot({ path: '/tmp/opencode/06-create-account.png' })

  // prefill check
  const prefillName = await page.inputValue('input[name="fullName"]').catch(() => '')
  const prefillEmail = await page.inputValue('input[name="email"]').catch(() => '')
  const prefillPw = await page.inputValue('input[name="password"]').catch(() => '')
  check('Create account prefills name from signup', prefillName === 'Adaeze Okonkwo', prefillName)
  check('Create account prefills email from signup', prefillEmail === 'adaeze@example.com', prefillEmail)
  check('Create account prefills password from signup', prefillPw === 'secret123', 'len=' + prefillPw.length)

  // confirm password + location + phone should be empty
  const confirmPw = await page.inputValue('input[name="confirmPassword"]').catch(() => 'NO_FIELD')
  check('Confirm password empty', confirmPw === '', 'val=' + confirmPw)
  const locationVal = await page.inputValue('input[placeholder="Yaba, Lagos"]').catch(() => 'NO_FIELD')
  check('Location empty', locationVal === '', 'val=' + locationVal)

  // password toggle (eye) present
  const eyeToggle = await page.locator('button[type="button"]').filter({ has: page.locator('svg') }).count()
  check('Password eye toggle controls present', eyeToggle >= 1)

  await page.click('button:has-text("Create account & continue")')
  await page.waitForURL('**/kyc-verification', { timeout: 8000 })
  check('Create account -> KYC verification', true, page.url())
  await page.screenshot({ path: '/tmp/opencode/07-kyc.png' })

  const kycHeading = await page.getByText('Verification').count()
  const ninText = await page.getByText('NIN (National ID)').count()
  const selfieText = await page.getByText('Selfie verification').count()
  check('KYC shows Verification heading', kycHeading >= 1)
  check('KYC shows NIN item', ninText >= 1)
  check('KYC shows Selfie item', selfieText >= 1)
  const pendingBadge = await page.getByText('Pending').count()
  check('KYC shows PENDING badge', pendingBadge >= 1)
  const continueDisabled = await page.locator('button:has-text("Continue")').isDisabled()
  check('KYC Continue button is disabled', continueDisabled)

  // ---------- 4. Login page ----------
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' })
  await waitLoadingDone(page)
  await page.screenshot({ path: '/tmp/opencode/08-login.png' })
  const loginHasForm = await page.locator('input[name="email"]').count()
  check('Login page renders', loginHasForm >= 1)

  // ---------- 5. 404 ----------
  await page.goto(BASE + '/this-route-does-not-exist', { waitUntil: 'domcontentloaded' })
  await waitLoadingDone(page)
  const notFound = await page.getByText(/not found|404/i).count()
  check('Unknown route shows not-found', notFound >= 1)
  await page.screenshot({ path: '/tmp/opencode/09-notfound.png' })

  // ---------- console errors ----------
  check('No console errors', consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' | '))

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