import { test, expect } from '@playwright/test'

test.describe('Rent Bridge Dashboards', () => {
  test('Landlord dashboard - desktop', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard/landlord')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'landlord-desktop.png', fullPage: true })
  })

  test('Landlord dashboard - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('http://localhost:5173/dashboard/landlord')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'landlord-tablet.png', fullPage: true })
  })

  test('Landlord dashboard - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('http://localhost:5173/dashboard/landlord')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'landlord-mobile.png', fullPage: true })
  })

  test('Caretaker dashboard - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('http://localhost:5173/dashboard/caretaker')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'caretaker-desktop.png', fullPage: true })
  })

  test('Lawyer dashboard - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('http://localhost:5173/dashboard/lawyer')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'lawyer-desktop.png', fullPage: true })
  })

  test('Lawyer dashboard - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('http://localhost:5173/dashboard/lawyer')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'lawyer-tablet.png', fullPage: true })
  })

  test('Lawyer dashboard - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('http://localhost:5173/dashboard/lawyer')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'lawyer-mobile.png', fullPage: true })
  })

  test('Lawyer review flow - click Review on first listing', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('http://localhost:5173/dashboard/lawyer')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    // Click first Review button
    await page.locator('button:has-text("Review")').first().click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'lawyer-current-review.png', fullPage: true })
  })
})