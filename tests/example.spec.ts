import { test, expect } from '@playwright/test'

test('landing page loads', async ({ page }) => {
  await page.goto('/')
  // Wait for loading splash to disappear (3 typing cycles of 'Rent Bridge')
  await expect(page.getByRole('img', { name: /Loading Rent Bridge/ })).not.toBeVisible({ timeout: 20000 })
  await expect(page).toHaveTitle(/Rent Bridge/)
})

test('dashboard renders without duplicate heading', async ({ page }) => {
  await page.goto('/dashboard')
  // Wait for dashboard to load, then verify heading renders exactly once
  await page.getByText('Homes near Yaba, Lagos').first().waitFor({ state: 'visible', timeout: 10000 })
  const count = await page.getByText('Homes near Yaba, Lagos').count()
  expect(count).toBe(1)  // should be exactly 1, not duplicated
})

test('onboarding flow: signup → role → create account → KYC', async ({ page }) => {
  await page.goto('/register')
  // Wait for loading splash to disappear
  await expect(page.getByRole('img', { name: /Loading Rent Bridge/ })).not.toBeVisible({ timeout: 20000 })
  await page.fill('input[name="fullName"]', 'Test User')
  await page.fill('input[name="email"]', 'test@test.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button:has-text("Continue")')
  await page.waitForURL('/role-selection')
  await page.click('button:has-text("Continue")')
  await page.waitForURL('/create-account')
  // Check prefill using correct Playwright assertion
  await expect(page.locator('input[name="fullName"]')).toHaveValue('Test User')
  // Confirm password should be empty
  await expect(page.getByPlaceholder(/••••••••/)).toBeVisible()
  // Location/phone should have no default value
  await expect(page.locator('input[placeholder="Yaba, Lagos"]')).toHaveAttribute('value', '')
  // Eye toggle should exist
  await expect(page.locator('button[type="button"]').filter({ has: page.locator('svg') })).toHaveCountGreaterThan(0)
  // Go to KYC
  await page.click('button:has-text("Create account & continue")')
  await page.waitForURL('/kyc-verification')
  await expect(page.getByText('Verification')).toBeVisible()
  await expect(page.getByText('Pending')).toBeVisible()
  // Continue button should be disabled
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()
})

test('404 page works', async ({ page }) => {
  await page.goto('/this-route-does-not-exist')
  // The app has a NotFoundPage for unmatched routes
  await expect(page.getByText('Not Found')).toBeVisible()
  await expect(page.getByText(/The page you're looking for doesn't exist/i)).toBeVisible()
})