import { test, expect } from '@playwright/test';

// ─── Replace these with real credentials in your DB ───────────────────────────
const ADMIN_EMAIL    = 'ayodhyamitho@gmail.com';
const ADMIN_PASSWORD = 'Ayodhya##2206';

const NEW_USER_NAME     = 'Test Student';
const NEW_USER_EMAIL    = `student_${Date.now()}@test.com`;
const NEW_USER_PASSWORD = 'Student123!';
// ──────────────────────────────────────────────────────────────────────────────

// ── 1. LOGIN ──────────────────────────────────────────────────────────────────
test.describe('Login', () => {
  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'wrong@test.com');
    await page.fill('#password', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error')).toBeVisible();
  });

  test('shows error on empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error')).toBeVisible();
  });

  test('logs in successfully and redirects', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    // Should redirect away from /login on success
    await expect(page).not.toHaveURL('/login');
  });
});

// ── 2. SIGN UP ────────────────────────────────────────────────────────────────
test.describe('Sign Up', () => {
  test('shows error when passwords do not match', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#reg-name', 'Test User');
    await page.fill('#reg-email', 'test@test.com');
    await page.fill('#reg-password', 'Password1');
    await page.fill('#reg-confirm', 'Different1');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error')).toContainText('Passwords do not match');
  });

  test('shows error on weak password', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#reg-name', 'Test User');
    await page.fill('#reg-email', 'test@test.com');
    await page.fill('#reg-password', 'weak');
    await page.fill('#reg-confirm', 'weak');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error')).toBeVisible();
  });

  test('registers successfully and redirects', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#reg-name', NEW_USER_NAME);
    await page.fill('#reg-email', NEW_USER_EMAIL);
    await page.fill('#reg-password', NEW_USER_PASSWORD);
    await page.fill('#reg-confirm', NEW_USER_PASSWORD);
    await page.selectOption('#reg-year', '1');
    await page.selectOption('#reg-sem', '1');
    await page.selectOption('#reg-batch', 'Malabe');
    await page.click('button[type="submit"]');
    // Should redirect away from /register on success
    await expect(page).not.toHaveURL('/register');
  });
});

// ── 3. ADD MODULE (admin only) ────────────────────────────────────────────────
test.describe('Add Module', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as admin before each test in this group
    await page.goto('/login');
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).not.toHaveURL('/login');
  });

  test('shows error when fields are empty', async ({ page }) => {
    await page.goto('/admin/modules/add');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error')).toContainText('Module code and name are required');
  });

  test('adds a module successfully', async ({ page }) => {
    await page.goto('/admin/modules/add');
    await page.fill('input[name="moduleCode"]', `IT${Date.now().toString().slice(-4)}`);
    await page.fill('input[name="moduleName"]', 'Playwright Test Module');
    await page.selectOption('select[name="academicYear"]', '2');
    await page.selectOption('select[name="semester"]', '1');
    await page.click('button[type="submit"]');
    await expect(page.locator('.success')).toContainText('Module added successfully');
  });
});
