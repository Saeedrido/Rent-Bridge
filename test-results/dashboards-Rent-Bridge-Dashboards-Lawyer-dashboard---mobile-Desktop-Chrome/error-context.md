# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboards.spec.ts >> Rent Bridge Dashboards >> Lawyer dashboard - mobile
- Location: tests/dashboards.spec.ts:51:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/dashboard/lawyer
Call log:
  - navigating to "http://localhost:5173/dashboard/lawyer", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e5]:
    - heading "This site can’t be reached" [level=1] [ref=e6]
    - paragraph [ref=e7]:
      - strong [ref=e8]: localhost
      - text: refused to connect.
    - generic [ref=e12]:
      - generic [ref=e13]:
        - paragraph [ref=e14]: "Try:"
        - list [ref=e15]:
          - listitem [ref=e16]: Checking the connection
          - listitem [ref=e17]:
            - link "Checking the proxy and the firewall" [ref=e18] [cursor=pointer]:
              - /url: "#buttons"
      - generic [ref=e19]: ERR_CONNECTION_REFUSED
  - generic [ref=e20]:
    - button "Reload" [ref=e22] [cursor=pointer]
    - button "Details" [ref=e23] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('Rent Bridge Dashboards', () => {
  4  |   test('Landlord dashboard - desktop', async ({ page }) => {
  5  |     await page.goto('http://localhost:5173/dashboard/landlord')
  6  |     await page.waitForLoadState('networkidle')
  7  |     await page.waitForTimeout(500)
  8  |     await page.screenshot({ path: 'landlord-desktop.png', fullPage: true })
  9  |   })
  10 | 
  11 |   test('Landlord dashboard - tablet', async ({ page }) => {
  12 |     await page.setViewportSize({ width: 768, height: 1024 })
  13 |     await page.goto('http://localhost:5173/dashboard/landlord')
  14 |     await page.waitForLoadState('networkidle')
  15 |     await page.waitForTimeout(500)
  16 |     await page.screenshot({ path: 'landlord-tablet.png', fullPage: true })
  17 |   })
  18 | 
  19 |   test('Landlord dashboard - mobile', async ({ page }) => {
  20 |     await page.setViewportSize({ width: 390, height: 844 })
  21 |     await page.goto('http://localhost:5173/dashboard/landlord')
  22 |     await page.waitForLoadState('networkidle')
  23 |     await page.waitForTimeout(500)
  24 |     await page.screenshot({ path: 'landlord-mobile.png', fullPage: true })
  25 |   })
  26 | 
  27 |   test('Caretaker dashboard - desktop', async ({ page }) => {
  28 |     await page.setViewportSize({ width: 1440, height: 900 })
  29 |     await page.goto('http://localhost:5173/dashboard/caretaker')
  30 |     await page.waitForLoadState('networkidle')
  31 |     await page.waitForTimeout(500)
  32 |     await page.screenshot({ path: 'caretaker-desktop.png', fullPage: true })
  33 |   })
  34 | 
  35 |   test('Lawyer dashboard - desktop', async ({ page }) => {
  36 |     await page.setViewportSize({ width: 1440, height: 900 })
  37 |     await page.goto('http://localhost:5173/dashboard/lawyer')
  38 |     await page.waitForLoadState('networkidle')
  39 |     await page.waitForTimeout(500)
  40 |     await page.screenshot({ path: 'lawyer-desktop.png', fullPage: true })
  41 |   })
  42 | 
  43 |   test('Lawyer dashboard - tablet', async ({ page }) => {
  44 |     await page.setViewportSize({ width: 768, height: 1024 })
  45 |     await page.goto('http://localhost:5173/dashboard/lawyer')
  46 |     await page.waitForLoadState('networkidle')
  47 |     await page.waitForTimeout(500)
  48 |     await page.screenshot({ path: 'lawyer-tablet.png', fullPage: true })
  49 |   })
  50 | 
  51 |   test('Lawyer dashboard - mobile', async ({ page }) => {
  52 |     await page.setViewportSize({ width: 390, height: 844 })
> 53 |     await page.goto('http://localhost:5173/dashboard/lawyer')
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/dashboard/lawyer
  54 |     await page.waitForLoadState('networkidle')
  55 |     await page.waitForTimeout(500)
  56 |     await page.screenshot({ path: 'lawyer-mobile.png', fullPage: true })
  57 |   })
  58 | 
  59 |   test('Lawyer review flow - click Review on first listing', async ({ page }) => {
  60 |     await page.setViewportSize({ width: 1440, height: 900 })
  61 |     await page.goto('http://localhost:5173/dashboard/lawyer')
  62 |     await page.waitForLoadState('networkidle')
  63 |     await page.waitForTimeout(500)
  64 |     // Click first Review button
  65 |     await page.locator('button:has-text("Review")').first().click()
  66 |     await page.waitForTimeout(500)
  67 |     await page.screenshot({ path: 'lawyer-current-review.png', fullPage: true })
  68 |   })
  69 | })
```