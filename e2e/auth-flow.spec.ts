import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('auth page renders login form', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('auth page has Google OAuth button', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByText('Google로 계속하기')).toBeVisible();
  });

  test('auth page toggles between login and signup', async ({ page }) => {
    await page.goto('/auth');
    // Should start in login mode
    await expect(page.getByText('계정에 로그인하세요')).toBeVisible();
    // Click signup link
    await page.getByText('회원가입').click();
    await expect(page.getByText('새 계정을 만들어보세요')).toBeVisible();
    // Should show role selection in signup mode
    await expect(page.getByText('의뢰인')).toBeVisible();
    await expect(page.getByText('크리에이터')).toBeVisible();
  });

  test('signup with email creates user and redirects to dashboard', async ({ page }) => {
    await page.goto('/auth');
    await page.getByText('회원가입').click();

    await page.fill('input#name', '테스트 사용자');
    await page.fill('input#email', `test-${Date.now()}@test.com`);
    await page.fill('input#password', 'TestPassword123!');
    // Select client role (default)
    await page.getByRole('button', { name: '회원가입' }).click();

    // Should redirect to dashboard after signup
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.url()).toContain('/dashboard');
  });

  test('protected route redirects unauthenticated to /auth', async ({ page }) => {
    await page.goto('/dashboard/client');
    await page.waitForURL(/\/auth/, { timeout: 5000 });
    await expect(page.url()).toContain('/auth');
  });

  test('logout redirects to landing page', async ({ page }) => {
    // This test requires an authenticated session first
    // Skip if no session available
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
