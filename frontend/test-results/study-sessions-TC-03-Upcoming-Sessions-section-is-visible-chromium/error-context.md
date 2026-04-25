# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: study-sessions.spec.js >> TC-03: Upcoming Sessions section is visible
- Location: tests\study-sessions.spec.js:29:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/upcoming sessions/i)
Expected: visible
Error: strict mode violation: getByText(/upcoming sessions/i) resolved to 2 elements:
    1) <h3 class="ss-section-title">…</h3> aka getByRole('heading', { name: 'Upcoming Sessions' })
    2) <p>No upcoming sessions yet.</p> aka getByText('No upcoming sessions yet.')

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/upcoming sessions/i)

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
      - button "Logout" [ref=e19] [cursor=pointer]
      - link "Signup" [ref=e20] [cursor=pointer]:
        - /url: /register
  - generic [ref=e21]:
    - complementary [ref=e22]:
      - generic [ref=e23]:
        - img "PeerPal logo" [ref=e24]
        - generic [ref=e25]:
          - text: PeerPal
          - generic [ref=e26]: Student life, simplified
        - button "Toggle sidebar" [ref=e27] [cursor=pointer]:
          - img [ref=e28]
      - generic [ref=e30]:
        - img "Profile" [ref=e31]
        - generic [ref=e32]:
          - paragraph [ref=e33]: Dasuni Samaraweera
          - paragraph [ref=e34]: admin
      - navigation [ref=e35]:
        - button "Dashboard" [ref=e36] [cursor=pointer]:
          - img [ref=e37]
          - generic [ref=e42]: Dashboard
        - link "Assignments" [ref=e43] [cursor=pointer]:
          - /url: /admin/dashboard?tab=assignments
          - img [ref=e44]
          - generic [ref=e47]: Assignments
        - link "Modules" [ref=e48] [cursor=pointer]:
          - /url: /admin/dashboard?tab=modules
          - img [ref=e49]
          - generic [ref=e52]: Modules
        - link "Users" [ref=e53] [cursor=pointer]:
          - /url: /admin/dashboard?tab=users
          - img [ref=e54]
          - generic [ref=e58]: Users
        - link "Help Desk" [ref=e59] [cursor=pointer]:
          - /url: /helpdesk
          - img [ref=e60]
          - generic [ref=e63]: Help Desk
        - link "Study Sessions" [ref=e64] [cursor=pointer]:
          - /url: /study-sessions
          - img [ref=e65]
          - generic [ref=e68]: Study Sessions
        - link "Calendar" [ref=e69] [cursor=pointer]:
          - /url: /calendar
          - img [ref=e70]
          - generic [ref=e72]: Calendar
        - link "Profile" [ref=e73] [cursor=pointer]:
          - /url: /profile
          - img [ref=e74]
          - generic [ref=e77]: Profile
    - main [ref=e78]:
      - generic [ref=e79]:
        - generic [ref=e80]:
          - heading "Study Sessions" [level=1] [ref=e81]
          - paragraph [ref=e82]: 0 scheduled · 0 proposed · 0 pending
        - generic [ref=e83]:
          - link "Propose" [ref=e84] [cursor=pointer]:
            - /url: /study-sessions/propose
            - img [ref=e85]
            - text: Propose
          - link "Request Session" [ref=e86] [cursor=pointer]:
            - /url: /study-sessions/request
            - img [ref=e87]
            - text: Request Session
      - generic [ref=e91]:
        - generic [ref=e92]:
          - img [ref=e93]
          - generic [ref=e95]: Filter sessions
        - combobox [ref=e96]:
          - option "All Years" [selected]
          - option "Year 1"
          - option "Year 2"
          - option "Year 3"
          - option "Year 4"
        - combobox [ref=e97]:
          - option "All Semesters" [selected]
          - option "Semester 1"
          - option "Semester 2"
        - combobox [ref=e98]:
          - option "All Modules" [selected]
        - button "Reset" [ref=e99] [cursor=pointer]
      - generic [ref=e100]:
        - heading "Upcoming Sessions" [level=3] [ref=e101]:
          - img [ref=e102]
          - text: Upcoming Sessions
        - generic [ref=e105]:
          - img [ref=e106]
          - paragraph [ref=e108]: No upcoming sessions yet.
        - heading "Proposals" [level=3] [ref=e109]:
          - img [ref=e110]
          - text: Proposals
        - generic [ref=e112]:
          - img [ref=e113]
          - paragraph [ref=e114]: No proposals yet.
  - button "Open system guide chatbot" [ref=e116] [cursor=pointer]:
    - img [ref=e117]
  - contentinfo [ref=e119]:
    - generic [ref=e120]:
      - generic [ref=e121]:
        - generic [ref=e122]:
          - generic [ref=e124]:
            - link "Home" [ref=e125] [cursor=pointer]:
              - /url: /
            - link "Features" [ref=e126] [cursor=pointer]:
              - /url: /#features
            - link "Help" [ref=e127] [cursor=pointer]:
              - /url: /help
            - link "Contact Us" [ref=e128] [cursor=pointer]:
              - /url: /contact
            - link "About Us" [ref=e129] [cursor=pointer]:
              - /url: /about
          - generic [ref=e131]:
            - link "Dashboard" [ref=e132] [cursor=pointer]:
              - /url: /dashboard
            - link "Help Desk" [ref=e133] [cursor=pointer]:
              - /url: /helpdesk
            - link "Study Sessions" [ref=e134] [cursor=pointer]:
              - /url: /study-sessions
            - link "Calendar" [ref=e135] [cursor=pointer]:
              - /url: /calendar
          - generic [ref=e137]:
            - link "Help Center" [ref=e138] [cursor=pointer]:
              - /url: /helpdesk
            - link "Contact Support" [ref=e139] [cursor=pointer]:
              - /url: /helpdesk
            - link "About PeerPal" [ref=e140] [cursor=pointer]:
              - /url: /about
            - link "Campus Features" [ref=e141] [cursor=pointer]:
              - /url: /#features
          - generic [ref=e143]:
            - paragraph [ref=e144]:
              - img [ref=e145]
              - generic [ref=e148]: support@peerpal.app
            - paragraph [ref=e149]:
              - img [ref=e150]
              - generic [ref=e152]: +94 11 234 5678
            - paragraph [ref=e153]:
              - img [ref=e154]
              - generic [ref=e157]: PeerPal Campus Hub, Colombo, Sri Lanka
        - generic [ref=e159]:
          - generic "PeerPal social media links" [ref=e161]:
            - link "Twitter" [ref=e162] [cursor=pointer]:
              - /url: "#"
              - img [ref=e163]
            - link "Instagram" [ref=e165] [cursor=pointer]:
              - /url: "#"
              - img [ref=e166]
            - link "Facebook" [ref=e169] [cursor=pointer]:
              - /url: "#"
              - img [ref=e170]
          - generic [ref=e173]:
            - generic [ref=e174]: Email subscription
            - generic [ref=e175]:
              - textbox "Email subscription" [ref=e176]:
                - /placeholder: Enter your email
              - button "Subscribe" [ref=e177] [cursor=pointer]
      - generic [ref=e178]:
        - paragraph [ref=e179]: Copyright © 2026 PeerPal. All rights reserved.
        - generic [ref=e180]:
          - generic [ref=e181]: Built for student life
          - generic [ref=e182]: Made for modern campus workflows
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | const BASE = "http://localhost:5173";
  4   | const EMAIL = "ayodhyamitho@gmail.com";
  5   | const PASSWORD = "Ayodhya##2206";
  6   | 
  7   | async function login(page) {
  8   |   await page.goto(`${BASE}/login`);
  9   |   await page.locator("input#email").fill(EMAIL);
  10  |   await page.locator("input#password").fill(PASSWORD);
  11  |   await page.getByRole("button", { name: /sign in/i }).click();
  12  |   await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
  13  | }
  14  | 
  15  | // TC-01: Unauthenticated user redirected to /login
  16  | test("TC-01: Unauthenticated user is redirected to /login", async ({ page }) => {
  17  |   await page.goto(`${BASE}/study-sessions`);
  18  |   await expect(page).toHaveURL(/\/login/);
  19  | });
  20  | 
  21  | // TC-02: Study Sessions page loads after login
  22  | test("TC-02: Study Sessions page loads with correct heading", async ({ page }) => {
  23  |   await login(page);
  24  |   await page.goto(`${BASE}/study-sessions`);
  25  |   await expect(page.getByRole("heading", { name: /study sessions/i })).toBeVisible({ timeout: 10000 });
  26  | });
  27  | 
  28  | // TC-03: Upcoming Sessions section is visible
  29  | test("TC-03: Upcoming Sessions section is visible", async ({ page }) => {
  30  |   await login(page);
  31  |   await page.goto(`${BASE}/study-sessions`);
> 32  |   await expect(page.getByText(/upcoming sessions/i)).toBeVisible({ timeout: 10000 });
      |                                                      ^ Error: expect(locator).toBeVisible() failed
  33  | });
  34  | 
  35  | // TC-04: Proposals section is visible
  36  | test("TC-04: Proposals section is visible", async ({ page }) => {
  37  |   await login(page);
  38  |   await page.goto(`${BASE}/study-sessions`);
  39  |   await expect(page.getByText(/proposals/i).first()).toBeVisible({ timeout: 10000 });
  40  | });
  41  | 
  42  | // TC-05: Propose button navigates to /study-sessions/propose
  43  | test("TC-05: Propose button navigates to propose page", async ({ page }) => {
  44  |   await login(page);
  45  |   await page.goto(`${BASE}/study-sessions`);
  46  |   await page.getByRole("link", { name: /propose/i }).click();
  47  |   await expect(page).toHaveURL(/\/study-sessions\/propose/);
  48  |   await expect(page.getByRole("heading", { name: /propose a session/i })).toBeVisible();
  49  | });
  50  | 
  51  | // TC-06: Request Session button navigates to /study-sessions/request
  52  | test("TC-06: Request Session button navigates to request page", async ({ page }) => {
  53  |   await login(page);
  54  |   await page.goto(`${BASE}/study-sessions`);
  55  |   await page.getByRole("link", { name: /request session/i }).click();
  56  |   await expect(page).toHaveURL(/\/study-sessions\/request/);
  57  |   await expect(page.getByRole("heading", { name: /request a session/i })).toBeVisible();
  58  | });
  59  | 
  60  | // TC-07: Propose form shows error on empty submit
  61  | test("TC-07: Propose form shows error when submitted empty", async ({ page }) => {
  62  |   await login(page);
  63  |   await page.goto(`${BASE}/study-sessions/propose`);
  64  |   await page.locator("select").first().selectOption({ index: 0 });
  65  |   await page.getByRole("button", { name: /create proposal/i }).click();
  66  |   await expect(page.locator(".error")).toBeVisible({ timeout: 6000 });
  67  | });
  68  | 
  69  | // TC-08: Create a new proposal with valid data
  70  | test("TC-08: User can create a new session proposal with valid data", async ({ page }) => {
  71  |   await login(page);
  72  |   await page.goto(`${BASE}/study-sessions/propose`);
  73  | 
  74  |   const moduleSelect = page.locator("select").first();
  75  |   const optionCount = await moduleSelect.locator("option").count();
  76  |   if (optionCount < 2) {
  77  |     test.skip(true, "No modules in DB");
  78  |     return;
  79  |   }
  80  |   await moduleSelect.selectOption({ index: 1 });
  81  | 
  82  |   await page.getByPlaceholder(/what will this session cover/i).fill("Playwright E2E test proposal — please ignore");
  83  | 
  84  |   const tomorrow = new Date();
  85  |   tomorrow.setDate(tomorrow.getDate() + 1);
  86  |   await page.locator('input[type="date"]').fill(tomorrow.toISOString().split("T")[0]);
  87  |   await page.locator('input[type="time"]').nth(0).fill("10:00");
  88  |   await page.locator('input[type="time"]').nth(1).fill("11:00");
  89  | 
  90  |   await page.getByRole("button", { name: /create proposal/i }).click();
  91  |   await expect(page.locator(".success")).toBeVisible({ timeout: 10000 });
  92  | });
  93  | 
  94  | // TC-09: Send Request button is disabled when note is empty
  95  | test("TC-09: Send Request button is disabled when note is empty", async ({ page }) => {
  96  |   await login(page);
  97  |   await page.goto(`${BASE}/study-sessions/request`);
  98  |   await page.waitForSelector("button[type='submit']", { timeout: 8000 });
  99  |   await expect(page.getByRole("button", { name: /send request/i })).toBeDisabled();
  100 | });
  101 | 
  102 | // TC-10: Back button on Propose page returns to /study-sessions
  103 | test("TC-10: Back button on Propose page returns to Study Sessions", async ({ page }) => {
  104 |   await login(page);
  105 |   await page.goto(`${BASE}/study-sessions/propose`);
  106 |   await page.getByRole("button", { name: /back/i }).click();
  107 |   await expect(page).toHaveURL(/\/study-sessions$/);
  108 | });
  109 | 
```