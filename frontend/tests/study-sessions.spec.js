import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173";
const EMAIL = "ayodhyamitho@gmail.com";
const PASSWORD = "Ayodhya##2206";

async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.locator("input#email").fill(EMAIL);
  await page.locator("input#password").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
}

// TC-01: Unauthenticated user redirected to /login
test("TC-01: Unauthenticated user is redirected to /login", async ({ page }) => {
  await page.goto(`${BASE}/study-sessions`);
  await expect(page).toHaveURL(/\/login/);
});

// TC-02: Study Sessions page loads after login
test("TC-02: Study Sessions page loads with correct heading", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/study-sessions`);
  await expect(page.getByRole("heading", { name: /study sessions/i })).toBeVisible({ timeout: 10000 });
});

// TC-03: Upcoming Sessions section is visible
test("TC-03: Upcoming Sessions section is visible", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/study-sessions`);
  await expect(page.getByText(/upcoming sessions/i)).toBeVisible({ timeout: 10000 });
});

// TC-04: Proposals section is visible
test("TC-04: Proposals section is visible", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/study-sessions`);
  await expect(page.getByText(/proposals/i).first()).toBeVisible({ timeout: 10000 });
});

// TC-05: Propose button navigates to /study-sessions/propose
test("TC-05: Propose button navigates to propose page", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/study-sessions`);
  await page.getByRole("link", { name: /propose/i }).click();
  await expect(page).toHaveURL(/\/study-sessions\/propose/);
  await expect(page.getByRole("heading", { name: /propose a session/i })).toBeVisible();
});

// TC-06: Request Session button navigates to /study-sessions/request
test("TC-06: Request Session button navigates to request page", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/study-sessions`);
  await page.getByRole("link", { name: /request session/i }).click();
  await expect(page).toHaveURL(/\/study-sessions\/request/);
  await expect(page.getByRole("heading", { name: /request a session/i })).toBeVisible();
});

// TC-07: Propose form shows error on empty submit
test("TC-07: Propose form shows error when submitted empty", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/study-sessions/propose`);
  await page.locator("select").first().selectOption({ index: 0 });
  await page.getByRole("button", { name: /create proposal/i }).click();
  await expect(page.locator(".error")).toBeVisible({ timeout: 6000 });
});

// TC-08: Create a new proposal with valid data
test("TC-08: User can create a new session proposal with valid data", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/study-sessions/propose`);

  const moduleSelect = page.locator("select").first();
  const optionCount = await moduleSelect.locator("option").count();
  if (optionCount < 2) {
    test.skip(true, "No modules in DB");
    return;
  }
  await moduleSelect.selectOption({ index: 1 });

  await page.getByPlaceholder(/what will this session cover/i).fill("Playwright E2E test proposal — please ignore");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await page.locator('input[type="date"]').fill(tomorrow.toISOString().split("T")[0]);
  await page.locator('input[type="time"]').nth(0).fill("10:00");
  await page.locator('input[type="time"]').nth(1).fill("11:00");

  await page.getByRole("button", { name: /create proposal/i }).click();
  await expect(page.locator(".success")).toBeVisible({ timeout: 10000 });
});

// TC-09: Send Request button is disabled when note is empty
test("TC-09: Send Request button is disabled when note is empty", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/study-sessions/request`);
  await page.waitForSelector("button[type='submit']", { timeout: 8000 });
  await expect(page.getByRole("button", { name: /send request/i })).toBeDisabled();
});

// TC-10: Back button on Propose page returns to /study-sessions
test("TC-10: Back button on Propose page returns to Study Sessions", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/study-sessions/propose`);
  await page.getByRole("button", { name: /back/i }).click();
  await expect(page).toHaveURL(/\/study-sessions$/);
});
