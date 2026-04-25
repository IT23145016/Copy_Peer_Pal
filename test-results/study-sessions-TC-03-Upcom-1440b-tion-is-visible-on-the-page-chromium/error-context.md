# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: study-sessions.spec.js >> TC-03: Upcoming Sessions section is visible on the page
- Location: tests\study-sessions.spec.js:31:1

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e5]:
    - link "PeerPal logo" [ref=e6] [cursor=pointer]:
      - /url: /
      - img "PeerPal logo" [ref=e7]
    - navigation "Main navigation" [ref=e8]:
      - link "Home" [ref=e9] [cursor=pointer]:
        - /url: /
      - link "Features" [ref=e10] [cursor=pointer]:
        - /url: /#features
      - link "Help" [ref=e11] [cursor=pointer]:
        - /url: /help
      - link "Contact Us" [ref=e12] [cursor=pointer]:
        - /url: /contact
      - link "About Us" [ref=e13] [cursor=pointer]:
        - /url: /about
    - generic [ref=e14]:
      - button "Switch to dark mode" [ref=e15] [cursor=pointer]:
        - img [ref=e16]
        - generic [ref=e18]: Dark
      - link "Login" [ref=e19] [cursor=pointer]:
        - /url: /login
      - link "Signup" [ref=e20] [cursor=pointer]:
        - /url: /register
  - main [ref=e21]:
    - generic [ref=e24]:
      - generic:
        - img
      - generic [ref=e25]:
        - generic [ref=e26]:
          - generic [ref=e27]: Welcome Back
          - heading "Sign in to PeerPal" [level=1] [ref=e28]
          - paragraph [ref=e29]: Use your admin or student account.
        - generic [ref=e30]:
          - generic [ref=e31]:
            - generic [ref=e32]: Email
            - textbox "Email" [ref=e33]: testuser@example.com
          - generic [ref=e34]:
            - generic [ref=e35]: Password
            - generic [ref=e36]:
              - textbox "Password" [ref=e37]: Test@1234
              - button "Show password" [ref=e38] [cursor=pointer]:
                - img [ref=e39]
        - paragraph [ref=e42]: Invalid credentials
        - button "Sign In" [ref=e43] [cursor=pointer]
        - paragraph [ref=e44]:
          - text: No account?
          - link "Sign up" [ref=e45] [cursor=pointer]:
            - /url: /register
  - button "Open system guide chatbot" [ref=e47] [cursor=pointer]:
    - img [ref=e48]
  - contentinfo [ref=e50]:
    - generic [ref=e51]:
      - generic [ref=e52]:
        - generic [ref=e53]:
          - generic [ref=e55]:
            - link "Home" [ref=e56] [cursor=pointer]:
              - /url: /
            - link "Features" [ref=e57] [cursor=pointer]:
              - /url: /#features
            - link "Help" [ref=e58] [cursor=pointer]:
              - /url: /help
            - link "Contact Us" [ref=e59] [cursor=pointer]:
              - /url: /contact
            - link "About Us" [ref=e60] [cursor=pointer]:
              - /url: /about
          - generic [ref=e62]:
            - link "Student Planning" [ref=e63] [cursor=pointer]:
              - /url: /
            - link "Assignment Tracking" [ref=e64] [cursor=pointer]:
              - /url: /#features
            - link "Peer Support" [ref=e65] [cursor=pointer]:
              - /url: /help
            - link "Campus Collaboration" [ref=e66] [cursor=pointer]:
              - /url: /about
          - generic [ref=e68]:
            - link "Help Center" [ref=e69] [cursor=pointer]:
              - /url: /help
            - link "Contact Support" [ref=e70] [cursor=pointer]:
              - /url: /contact
            - link "About PeerPal" [ref=e71] [cursor=pointer]:
              - /url: /about
            - link "Campus Features" [ref=e72] [cursor=pointer]:
              - /url: /#features
          - generic [ref=e74]:
            - paragraph [ref=e75]:
              - img [ref=e76]
              - generic [ref=e79]: support@peerpal.app
            - paragraph [ref=e80]:
              - img [ref=e81]
              - generic [ref=e83]: +94 11 234 5678
            - paragraph [ref=e84]:
              - img [ref=e85]
              - generic [ref=e88]: PeerPal Campus Hub, Colombo, Sri Lanka
        - generic [ref=e90]:
          - generic "PeerPal social media links" [ref=e92]:
            - link "Twitter" [ref=e93] [cursor=pointer]:
              - /url: "#"
              - img [ref=e94]
            - link "Instagram" [ref=e96] [cursor=pointer]:
              - /url: "#"
              - img [ref=e97]
            - link "Facebook" [ref=e100] [cursor=pointer]:
              - /url: "#"
              - img [ref=e101]
          - generic [ref=e104]:
            - generic [ref=e105]: Email subscription
            - generic [ref=e106]:
              - textbox "Email subscription" [ref=e107]:
                - /placeholder: Enter your email
              - button "Subscribe" [ref=e108] [cursor=pointer]
      - generic [ref=e109]:
        - paragraph [ref=e110]: Copyright © 2026 PeerPal. All rights reserved.
        - generic [ref=e111]:
          - generic [ref=e112]: Built for student life
          - generic [ref=e113]: Made for modern campus workflows
```

# Test source

```ts
  1   | // @ts-check
  2   | const { test, expect } = require("@playwright/test");
  3   | 
  4   | const BASE = "http://localhost:5173";
  5   | const CREDENTIALS = { email: "testuser@example.com", password: "Test@1234" };
  6   | 
  7   | // Helper: log in using specific form field IDs to avoid footer email input collision
  8   | async function login(page) {
  9   |   await page.goto(`${BASE}/login`);
  10  |   await page.locator("input#email[type='email']").fill(CREDENTIALS.email);
  11  |   await page.locator("input[type='password']").fill(CREDENTIALS.password);
  12  |   await page.getByRole("button", { name: /login|sign in/i }).click();
  13  |   // Wait until redirected away from /login
> 14  |   await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 });
      |              ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  15  | }
  16  | 
  17  | // ─── TC-01: Unauthenticated redirect ────────────────────────────────────────
  18  | test("TC-01: Unauthenticated user is redirected to /login from /study-sessions", async ({ page }) => {
  19  |   await page.goto(`${BASE}/study-sessions`);
  20  |   await expect(page).toHaveURL(/\/login/);
  21  | });
  22  | 
  23  | // ─── TC-02: Page loads after login ──────────────────────────────────────────
  24  | test("TC-02: Study Sessions page loads with correct heading after login", async ({ page }) => {
  25  |   await login(page);
  26  |   await page.goto(`${BASE}/study-sessions`);
  27  |   await expect(page.getByRole("heading", { name: /study sessions/i })).toBeVisible();
  28  | });
  29  | 
  30  | // ─── TC-03: Upcoming Sessions section is visible ────────────────────────────
  31  | test("TC-03: Upcoming Sessions section is visible on the page", async ({ page }) => {
  32  |   await login(page);
  33  |   await page.goto(`${BASE}/study-sessions`);
  34  |   await expect(page.getByText(/upcoming sessions/i)).toBeVisible();
  35  | });
  36  | 
  37  | // ─── TC-04: Proposals section is visible ────────────────────────────────────
  38  | test("TC-04: Proposals section is visible on the page", async ({ page }) => {
  39  |   await login(page);
  40  |   await page.goto(`${BASE}/study-sessions`);
  41  |   await expect(page.getByText(/proposals/i)).toBeVisible();
  42  | });
  43  | 
  44  | // ─── TC-05: Propose button navigates to /study-sessions/propose ─────────────
  45  | test("TC-05: Clicking Propose button navigates to the propose page", async ({ page }) => {
  46  |   await login(page);
  47  |   await page.goto(`${BASE}/study-sessions`);
  48  |   await page.getByRole("link", { name: /propose/i }).click();
  49  |   await expect(page).toHaveURL(/\/study-sessions\/propose/);
  50  |   await expect(page.getByRole("heading", { name: /propose a session/i })).toBeVisible();
  51  | });
  52  | 
  53  | // ─── TC-06: Request Session button navigates to /study-sessions/request ─────
  54  | test("TC-06: Clicking Request Session button navigates to the request page", async ({ page }) => {
  55  |   await login(page);
  56  |   await page.goto(`${BASE}/study-sessions`);
  57  |   await page.getByRole("link", { name: /request session/i }).click();
  58  |   await expect(page).toHaveURL(/\/study-sessions\/request/);
  59  |   await expect(page.getByRole("heading", { name: /request a session/i })).toBeVisible();
  60  | });
  61  | 
  62  | // ─── TC-07: Propose form validation — submit with empty fields ───────────────
  63  | test("TC-07: Propose form shows error when submitted with empty required fields", async ({ page }) => {
  64  |   await login(page);
  65  |   await page.goto(`${BASE}/study-sessions/propose`);
  66  |   await page.getByRole("button", { name: /create proposal/i }).click();
  67  |   // Backend or frontend should surface an error message
  68  |   await expect(page.locator(".error, [class*='error']")).toBeVisible({ timeout: 6000 });
  69  | });
  70  | 
  71  | // ─── TC-08: Propose form — successful proposal creation ─────────────────────
  72  | test("TC-08: User can create a new session proposal with valid data", async ({ page }) => {
  73  |   await login(page);
  74  |   await page.goto(`${BASE}/study-sessions/propose`);
  75  | 
  76  |   // Select first available module
  77  |   const moduleSelect = page.locator("select").first();
  78  |   await moduleSelect.selectOption({ index: 1 });
  79  | 
  80  |   await page.getByPlaceholder(/what will this session cover/i).fill("Playwright test proposal - please ignore");
  81  | 
  82  |   const tomorrow = new Date();
  83  |   tomorrow.setDate(tomorrow.getDate() + 1);
  84  |   const dateStr = tomorrow.toISOString().split("T")[0];
  85  | 
  86  |   await page.locator('input[type="date"]').fill(dateStr);
  87  |   await page.locator('input[type="time"]').nth(0).fill("10:00");
  88  |   await page.locator('input[type="time"]').nth(1).fill("11:00");
  89  | 
  90  |   await page.getByRole("button", { name: /create proposal/i }).click();
  91  | 
  92  |   await expect(page.locator(".success, [class*='success']")).toBeVisible({ timeout: 8000 });
  93  | });
  94  | 
  95  | // ─── TC-09: Request form validation — submit with empty note ─────────────────
  96  | test("TC-09: Request form shows error when note is empty on submit", async ({ page }) => {
  97  |   await login(page);
  98  |   await page.goto(`${BASE}/study-sessions/request`);
  99  | 
  100 |   // Leave note empty, try to submit
  101 |   const submitBtn = page.getByRole("button", { name: /send request/i });
  102 |   // Button should be disabled when note is empty
  103 |   await expect(submitBtn).toBeDisabled();
  104 | });
  105 | 
  106 | // ─── TC-10: Back button on Propose page returns to /study-sessions ───────────
  107 | test("TC-10: Back button on Propose page navigates back to Study Sessions", async ({ page }) => {
  108 |   await login(page);
  109 |   await page.goto(`${BASE}/study-sessions/propose`);
  110 |   await page.getByRole("button", { name: /back/i }).click();
  111 |   await expect(page).toHaveURL(/\/study-sessions$/);
  112 | });
  113 | 
```