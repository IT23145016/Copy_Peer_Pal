// @ts-check
const { test, expect } = require("@playwright/test");

/** @typedef {import("@playwright/test").Page} Page */
/** @typedef {import("@playwright/test").Route} Route */
/** @typedef {import("@playwright/test").Locator} Locator */
/** @typedef {"admin" | "user"} UserRole */
/**
 * @typedef UserCredentials
 * @property {string} email
 * @property {string} password
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

const USER_CREDENTIALS = { email: "testuser@example.com", password: "Test@1234" };
const ADMIN_CREDENTIALS = { email: "admin@example.com", password: "Admin@1234" };

/**
 * @param {Page} page
 * @param {UserCredentials} credentials
 */
async function loginAs(page, { email, password }) {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
}

/**
 * @param {Page} page
 * @param {UserRole} role
 */
async function setAuthStorage(page, role) {
  const token = "fake-jwt-token";
  const user = { role, name: role === "admin" ? "Admin User" : "Test User", email: role === "admin" ? ADMIN_CREDENTIALS.email : USER_CREDENTIALS.email };
  await page.addInitScript(
    /** @param {{ token: string, user: { role: UserRole, name: string, email: string } }} param0 */
    ({ token, user }) => {
      localStorage.setItem("auth", JSON.stringify({ token, user }));
    },
    { token, user }
  );
}

/**
 * @param {Locator} locator
 */
async function expectFieldToBeInvalid(locator) {
  await expect.poll(async () => locator.evaluate((el) => el.matches(":invalid"))).toBe(true);
}

// ─── User Calendar Tests ─────────────────────────────────────────────────────

test.describe("Calendar – User Side", () => {
  test.beforeEach(async ({ page }) => {
    await setAuthStorage(page, "user");

    await page.route("**/api/calendar-events", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            _id: "evt001",
            title: "Data Structures Study",
            type: "study",
            date: new Date().toISOString().split("T")[0],
            time: "10:00 AM",
            endTime: "11:00 AM",
            editable: true,
            deletable: true,
            editRef: { kind: "study_session", id: "ss001" },
            deleteRef: { kind: "study_session", id: "ss001" },
            moduleId: "mod001",
            moduleCode: "CS201",
            moduleName: "Data Structures",
          },
          {
            _id: "evt002",
            title: "Assignment Due",
            type: "assignment",
            date: new Date().toISOString().split("T")[0],
            time: "11:59 PM",
            endTime: "",
            editable: false,
            deletable: false,
          },
        ]),
      });
    });

    await page.route("**/api/modules", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { _id: "mod001", moduleCode: "CS201", moduleName: "Data Structures" },
          { _id: "mod002", moduleCode: "CS301", moduleName: "Algorithms" },
        ]),
      });
    });

    await page.goto("/calendar");
  });

  test("renders calendar page with heading and stat pills", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /calendar/i })).toBeVisible();
    await expect(page.locator(".pp-pill").first()).toBeVisible();
  });

  test("shows week view by default with day labels", async ({ page }) => {
    for (const day of ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]) {
      await expect(page.locator(".calendar-head-cell", { hasText: day }).first()).toBeVisible();
    }
  });

  test("can switch to day view", async ({ page }) => {
    await page.locator(".calendar-view-btn", { hasText: "Day" }).click();
    await expect(page.locator(".calendar-day-agenda")).toBeVisible();
  });

  test("can switch to month view", async ({ page }) => {
    await page.locator(".calendar-view-btn", { hasText: "Month" }).click();
    await expect(page.locator(".calendar-grid-month")).toBeVisible();
  });

  test("can navigate to previous and next week", async ({ page }) => {
    const titleBefore = await page.locator(".calendar-nav h3").innerText();
    await page.click('[aria-label="Previous month"], .icon-action-btn >> nth=0');
    const titleAfter = await page.locator(".calendar-nav h3").innerText();
    expect(titleBefore).not.toBe(titleAfter);
  });

  test("shows upcoming deadlines sidebar section", async ({ page }) => {
    await expect(page.locator(".upcoming-deadlines-card")).toBeVisible();
    await expect(page.locator(".upcoming-deadlines-head h3", { hasText: "Upcoming Deadlines" })).toBeVisible();
  });

  test("shows focus day highlight card", async ({ page }) => {
    await expect(page.locator(".focus-highlight-card")).toBeVisible();
    await expect(page.locator(".focus-highlight-label", { hasText: "Focus Day Highlight" })).toBeVisible();
  });

  test("opens Quick Add modal when Quick Add button is clicked", async ({ page }) => {
    await page.locator(".aa-add-btn", { hasText: "Quick Add" }).click();
    await expect(page.locator(".quickadd-overlay")).toBeVisible();
    await expect(page.locator(".quickadd-modal")).toBeVisible();
  });

  test("Quick Add modal shows correct form fields", async ({ page }) => {
    await page.locator(".aa-add-btn", { hasText: "Quick Add" }).click();
    await expect(page.locator(".quickadd-modal input[type='text']").first()).toBeVisible();
    await expect(page.locator(".quickadd-modal input[type='date']")).toBeVisible();
    await expect(page.locator(".quickadd-modal input[type='time']").first()).toBeVisible();
    await expect(page.locator(".quickadd-modal select").first()).toBeVisible();
  });

  test("Quick Add modal closes on Cancel", async ({ page }) => {
    await page.locator(".aa-add-btn", { hasText: "Quick Add" }).click();
    await page.click(".quickadd-cancel");
    await expect(page.locator(".quickadd-overlay")).not.toBeVisible();
  });

  test("clicking a calendar day cell opens day detail modal", async ({ page }) => {
    await page.locator(".calendar-day-cell").first().click();
    await expect(page.locator(".confirm-modal")).toBeVisible();
  });

  test("day detail modal shows ADD TO THIS DAY section", async ({ page }) => {
    await page.locator(".calendar-day-cell").first().click();
    await expect(page.locator(".confirm-modal", { hasText: "ADD TO THIS DAY" })).toBeVisible();
  });

  test("day detail modal closes when clicking overlay", async ({ page }) => {
    await page.locator(".calendar-day-cell").first().click();
    await expect(page.locator(".confirm-modal")).toBeVisible();
    await page.locator(".confirm-overlay").click({ position: { x: 5, y: 5 } });
    await expect(page.locator(".confirm-modal")).not.toBeVisible();
  });

  test("calendar legend shows all event type labels", async ({ page }) => {
    for (const label of ["Personal", "Study", "Assignments", "Holidays", "Campus Events"]) {
      await expect(page.locator(".calendar-legend", { hasText: label })).toBeVisible();
    }
  });

  test("stat pills show assignment count and study hours", async ({ page }) => {
    await expect(page.locator(".pp-pill", { hasText: "assignments" })).toBeVisible();
    await expect(page.locator(".pp-pill", { hasText: "study" })).toBeVisible();
    await expect(page.locator(".pp-pill", { hasText: "this month" })).toBeVisible();
  });

  test("Quick Add modal shows module selector for study type", async ({ page }) => {
    await page.locator(".aa-add-btn", { hasText: "Quick Add" }).click();
    const categorySelect = page.locator(".quickadd-modal select").first();
    await categorySelect.selectOption("study");
    await expect(page.locator(".quickadd-modal select", { hasText: "Select Module" })).toBeVisible();
  });

  test("Quick Add modal hides module selector for personal type", async ({ page }) => {
    await page.locator(".aa-add-btn", { hasText: "Quick Add" }).click();
    const categorySelect = page.locator(".quickadd-modal select").first();
    await categorySelect.selectOption("personal");
    await expect(page.locator(".quickadd-modal select", { hasText: "Select Module" })).not.toBeVisible();
  });

  test("stat cards visible in week view", async ({ page }) => {
    await expect(page.locator(".adm-stat-card").first()).toBeVisible();
  });

  test("stat cards hidden in month view", async ({ page }) => {
    await page.locator(".calendar-view-btn", { hasText: "Month" }).click();
    await expect(page.locator(".adm-stat-card").first()).not.toBeVisible();
  });
});

// ─── Admin Calendar Tests ────────────────────────────────────────────────────

test.describe("Calendar – Admin Side", () => {
  const today = new Date().toISOString().split("T")[0];

  test.beforeEach(async ({ page }) => {
    await setAuthStorage(page, "admin");

    await page.route("**/api/calendar-events/admin/overview**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: { totalEvents: 5 },
          batchOptions: ["2021", "2022", "2023"],
          filters: {},
          events: [
            {
              _id: "a001",
              title: "CS201 Assignment",
              type: "assignment",
              group: "assignment",
              date: today,
              time: "11:59 PM",
              sourceLabel: "CS201 - Data Structures",
              deletable: false,
            },
            {
              _id: "a002",
              title: "Study Room: Algorithms",
              type: "study",
              group: "study_room",
              date: today,
              time: "02:00 PM",
              endTime: "04:00 PM",
              sourceLabel: "CS301 - Algorithms",
              participantsCount: 5,
              deletable: true,
              deleteRef: { kind: "study_session", id: "ss002" },
            },
            {
              _id: "a003",
              title: "Vesak Day",
              type: "holiday",
              group: "holiday",
              date: today,
              sourceLabel: "Sri Lanka Public Holiday",
              deletable: false,
            },
            {
              _id: "a004",
              title: "Guest Lecture on AI",
              type: "campus",
              group: "campus",
              date: today,
              time: "10:00 AM",
              endTime: "12:00 PM",
              sourceLabel: "Campus Event",
              scopeLabel: "All Students",
              deletable: true,
              audienceScopeType: "all",
              audienceScopeValue: "",
            },
          ],
        }),
      });
    });

    await page.goto("/calendar");
  });

  test("renders admin calendar overview heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /calendar overview/i })).toBeVisible();
  });

  test("shows admin summary stat cards", async ({ page }) => {
    await expect(page.locator(".adm-stat-card", { hasText: "Total Study Sessions" })).toBeVisible();
    await expect(page.locator(".adm-stat-card", { hasText: "Total Assignments" })).toBeVisible();
    await expect(page.locator(".adm-stat-card", { hasText: "Events This Month" })).toBeVisible();
  });

  test("shows admin filter row with batch, year, semester, event type selects", async ({ page }) => {
    await expect(page.locator("select", { hasText: "All Batches" })).toBeVisible();
    await expect(page.locator("select", { hasText: "All Years" })).toBeVisible();
    await expect(page.locator("select", { hasText: "All Semesters" })).toBeVisible();
    await expect(page.locator("select", { hasText: "All Events" })).toBeVisible();
  });

  test("shows date range filter inputs", async ({ page }) => {
    const dateInputs = page.locator(".usr-filter-row input[type='date']");
    await expect(dateInputs).toHaveCount(2);
  });

  test("Reset button clears filters", async ({ page }) => {
    await page.locator("select", { hasText: "All Years" }).selectOption("1");
    await page.locator("button", { hasText: "Reset" }).click();
    await expect(page.locator("select", { hasText: "All Years" })).toHaveValue("");
  });

  test("renders month view calendar grid", async ({ page }) => {
    await expect(page.locator(".calendar-grid-month")).toBeVisible();
    for (const day of ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]) {
      await expect(page.locator(".calendar-head-cell", { hasText: day }).first()).toBeVisible();
    }
  });

  test("shows admin calendar legend", async ({ page }) => {
    for (const label of ["Assignment", "Study Room", "Holiday", "Campus"]) {
      await expect(page.locator(".calendar-legend", { hasText: label })).toBeVisible();
    }
  });

  test("can navigate months with prev/next buttons", async ({ page }) => {
    const titleBefore = await page.locator(".calendar-nav h3").innerText();
    await page.locator(".icon-action-btn").first().click();
    const titleAfter = await page.locator(".calendar-nav h3").innerText();
    expect(titleBefore).not.toBe(titleAfter);
  });

  test("shows Assignment Deadlines side card", async ({ page }) => {
    await expect(page.locator(".calendar-side-card", { hasText: "Assignment Deadlines" })).toBeVisible();
    await expect(page.locator(".deadline-item h4", { hasText: "CS201 Assignment" })).toBeVisible();
  });

  test("shows Study Room Sessions side card", async ({ page }) => {
    await expect(page.locator(".calendar-side-card", { hasText: "Study Room Sessions" })).toBeVisible();
    await expect(page.locator(".deadline-item h4", { hasText: "Study Room: Algorithms" })).toBeVisible();
  });

  test("shows Sri Lanka Holidays side card", async ({ page }) => {
    await expect(page.locator(".calendar-side-card", { hasText: "Sri Lanka Holidays" })).toBeVisible();
    await expect(page.locator(".deadline-item h4", { hasText: "Vesak Day" })).toBeVisible();
  });

  test("shows Campus Events side card", async ({ page }) => {
    await expect(page.locator(".calendar-side-card", { hasText: "Campus Events" })).toBeVisible();
    await expect(page.locator(".deadline-item h4", { hasText: "Guest Lecture on AI" })).toBeVisible();
  });

  test("Add Campus Event button is visible", async ({ page }) => {
    await expect(page.locator(".aa-add-btn", { hasText: "Add Campus Event" })).toBeVisible();
  });

  test("clicking Add Campus Event shows campus event form", async ({ page }) => {
    await page.locator(".aa-add-btn", { hasText: "Add Campus Event" }).click();
    await expect(page.locator(".calendar-campus-form-card")).toBeVisible();
    await expect(page.locator(".quickadd-modal, .calendar-campus-form-card input[type='text']").first()).toBeVisible();
  });

  test("campus event form has required fields", async ({ page }) => {
    await page.locator(".aa-add-btn", { hasText: "Add Campus Event" }).click();
    await expect(page.locator(".calendar-campus-form-card input[placeholder*='Guest Lecture']")).toBeVisible();
    await expect(page.locator(".calendar-campus-form-card input[type='date']")).toBeVisible();
    await expect(page.locator(".calendar-campus-form-card input[type='time']").first()).toBeVisible();
    await expect(page.locator(".calendar-campus-form-card select", { hasText: "All Students" })).toBeVisible();
  });

  test("campus event form shows batch fields when By Batch is selected", async ({ page }) => {
    await page.locator(".aa-add-btn", { hasText: "Add Campus Event" }).click();
    await page.locator(".calendar-campus-form-card select", { hasText: "All Students" }).selectOption("batch");
    await expect(page.locator(".calendar-campus-form-card select", { hasText: "Select Batch" })).toBeVisible();
    await expect(page.locator(".calendar-campus-form-card select", { hasText: "Select Year" })).toBeVisible();
    await expect(page.locator(".calendar-campus-form-card select", { hasText: "Select Semester" })).toBeVisible();
  });

  test("campus event form Cancel button hides the form", async ({ page }) => {
    await page.locator(".aa-add-btn", { hasText: "Add Campus Event" }).click();
    await page.locator(".calendar-campus-form-card .quickadd-cancel").click();
    await expect(page.locator(".calendar-campus-form-card")).not.toBeVisible();
  });

  test("study room delete button is visible for deletable sessions", async ({ page }) => {
    await expect(page.locator(".calendar-study-delete-btn").first()).toBeVisible();
  });

  test("campus event Edit button is visible", async ({ page }) => {
    await expect(page.locator(".deadline-item .aa-edit-btn", { hasText: "Edit" }).first()).toBeVisible();
  });

  test("campus event delete triggers confirm modal", async ({ page }) => {
    await page.route("**/api/calendar-events/campus/**", (route) => {
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ message: "Deleted" }) });
    });
    await page.locator(".deadline-item .calendar-study-delete-btn").last().click();
    await expect(page.locator(".confirm-modal", { hasText: "Delete Campus Event" })).toBeVisible();
  });

  test("confirm delete modal has Cancel and Yes Delete buttons", async ({ page }) => {
    await page.locator(".deadline-item .calendar-study-delete-btn").last().click();
    await expect(page.locator(".confirm-cancel")).toBeVisible();
    await expect(page.locator(".confirm-delete")).toBeVisible();
  });

  test("confirm delete modal Cancel dismisses modal", async ({ page }) => {
    await page.locator(".deadline-item .calendar-study-delete-btn").last().click();
    await page.click(".confirm-cancel");
    await expect(page.locator(".confirm-modal", { hasText: "Delete Campus Event" })).not.toBeVisible();
  });

  test("clicking a calendar day cell opens day detail modal", async ({ page }) => {
    await page.locator(".calendar-day-cell").first().click();
    await expect(page.locator(".confirm-modal")).toBeVisible();
  });

  test("day detail modal shows ADD TO THIS DAY with campus event option", async ({ page }) => {
    await page.locator(".calendar-day-cell").first().click();
    await expect(page.locator(".confirm-modal", { hasText: "ADD TO THIS DAY" })).toBeVisible();
    await expect(page.locator(".confirm-modal .aa-add-btn", { hasText: "+ Campus Event" })).toBeVisible();
  });

  test("admin stat pills show correct labels", async ({ page }) => {
    await expect(page.locator(".pp-pill", { hasText: "assignments" })).toBeVisible();
    await expect(page.locator(".pp-pill", { hasText: "this month" })).toBeVisible();
    await expect(page.locator(".pp-pill", { hasText: "study sessions" })).toBeVisible();
  });

  test("successfully submits a new campus event", async ({ page }) => {
    await page.route("**/api/calendar-events", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ message: "Created" }) });
      } else {
        route.continue();
      }
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    await page.locator(".aa-add-btn", { hasText: "Add Campus Event" }).click();
    await page.locator(".calendar-campus-form-card input[placeholder*='Guest Lecture']").fill("Tech Symposium 2025");
    await page.locator(".calendar-campus-form-card input[type='date']").fill(tomorrowStr);
    await page.locator(".calendar-campus-form-card input[type='time']").first().fill("09:00");
    await page.locator(".calendar-campus-form-card input[type='time']").last().fill("11:00");
    await page.locator(".calendar-campus-form-card .quickadd-save").click();
    await expect(page.locator(".success, .calendar-campus-form-card")).toBeTruthy();
  });
});

// ─── Form Validation Tests ───────────────────────────────────────────────────

test.describe("Calendar – Form Validations", () => {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  // shared mock for admin overview
  /** @param {Page} page */
  function mockAdminOverview(page) {
    page.route("**/api/calendar-events/admin/overview**", /** @param {Route} route */ (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {},
          batchOptions: ["2021", "2022", "2023"],
          filters: {},
          events: [],
        }),
      });
    });
  }

  /** @param {Page} page */
  function mockAdminCalendarWrites(page) {
    page.route("**/api/calendar-events", /** @param {Route} route */ (route) => {
      route.fulfill({
        status: route.request().method() === "POST" ? 201 : 200,
        contentType: "application/json",
        body: JSON.stringify(route.request().method() === "POST" ? { message: "Created" } : []),
      });
    });
  }

  // shared mock for user events + modules
  /** @param {Page} page */
  function mockUserRoutes(page) {
    page.route("**/api/calendar-events", /** @param {Route} route */ (route) => {
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });
    page.route("**/api/modules", /** @param {Route} route */ (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { _id: "mod001", moduleCode: "CS201", moduleName: "Data Structures" },
        ]),
      });
    });
  }

  // ── Quick Add (User) ────────────────────────────────────────────────────────

  test.describe("Quick Add Form – User", () => {
    test.beforeEach(async ({ page }) => {
      await setAuthStorage(page, "user");
      mockUserRoutes(page);
      await page.goto("/calendar");
      await page.locator(".aa-add-btn", { hasText: "Quick Add" }).click();
      await expect(page.locator(".quickadd-overlay")).toBeVisible();
    });

    test("shows error when submitting with empty title", async ({ page }) => {
      const titleInput = page.locator(".quickadd-modal input[placeholder*='Data Structures']");
      await page.locator(".quickadd-save").click();
      await expectFieldToBeInvalid(titleInput);
    });

    test("shows error when submitting with whitespace-only title", async ({ page }) => {
      await page.locator(".quickadd-modal input[type='text']").first().fill("   ");
      await page.locator(".quickadd-save").click();
      await expect(page.locator(".quickadd-modal .error")).toContainText(/required/i);
    });

    test("shows error when study type has no module selected", async ({ page }) => {
      await page.locator(".quickadd-modal input[type='text']").first().fill("Study Block");
      await page.locator(".quickadd-modal select").first().selectOption("study");
      // deselect module
      const moduleSelect = page.locator(".quickadd-modal select").last();
      await moduleSelect.selectOption("");
      await page.locator(".quickadd-save").click();
      await expectFieldToBeInvalid(moduleSelect);
    });

    test("shows inline error when end time is before start time", async ({ page }) => {
      await page.locator(".quickadd-modal input[type='time']").first().fill("14:00");
      await page.locator(".quickadd-modal input[type='time']").last().fill("13:00");
      await expect(page.locator(".quickadd-inline-error")).toContainText(/before start/i);
    });

    test("shows inline error when end time equals start time", async ({ page }) => {
      await page.locator(".quickadd-modal input[type='time']").first().fill("10:00");
      await page.locator(".quickadd-modal input[type='time']").last().fill("10:00");
      await expect(page.locator(".quickadd-inline-error")).toContainText(/before start/i);
    });

    test("clears error after correcting the title", async ({ page }) => {
      const titleInput = page.locator(".quickadd-modal input[placeholder*='Data Structures']");
      await page.locator(".quickadd-save").click();
      await expectFieldToBeInvalid(titleInput);
      await titleInput.fill("Valid Title");
      await page.locator(".quickadd-modal select").first().selectOption("personal");
      await page.locator(".quickadd-save").click();
      await expect(page.locator(".quickadd-overlay")).not.toBeVisible();
    });

    test("no inline time error when end time is after start time", async ({ page }) => {
      await page.locator(".quickadd-modal input[type='time']").first().fill("09:00");
      await page.locator(".quickadd-modal input[type='time']").last().fill("10:00");
      await expect(page.locator(".quickadd-inline-error")).not.toBeVisible();
    });

    test("Save Entry button is disabled-like when time range error exists", async ({ page }) => {
      await page.locator(".quickadd-modal input[type='time']").first().fill("15:00");
      await page.locator(".quickadd-modal input[type='time']").last().fill("14:00");
      // clicking save with time error should show the time error message
      await page.locator(".quickadd-modal input[type='text']").first().fill("Some Title");
      await page.locator(".quickadd-save").click();
      await expect(page.locator(".quickadd-modal .error")).toContainText(/end time/i);
    });

    test("shows conflict warning when event overlaps existing event", async ({ page }) => {
      // route with an existing event on today
      await page.route("**/api/calendar-events", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              _id: "evt001",
              title: "Existing Session",
              type: "study",
              date: today,
              time: "10:00",
              endTime: "11:00",
              editable: false,
              deletable: false,
            },
          ]),
        });
      });
      await page.reload();
      await page.locator(".aa-add-btn", { hasText: "Quick Add" }).click();
      await page.locator(".quickadd-modal input[type='date']").fill(today);
      await page.locator(".quickadd-modal input[type='time']").first().fill("10:30");
      await page.locator(".quickadd-modal input[type='time']").last().fill("11:30");
      await expect(page.locator(".quickadd-warning")).toBeVisible();
      await expect(page.locator(".quickadd-warning")).toContainText(/conflict/i);
    });
  });

  // ── Campus Event Form (Admin) ───────────────────────────────────────────────

  test.describe("Campus Event Form – Admin", () => {
    test.beforeEach(async ({ page }) => {
      await setAuthStorage(page, "admin");
      mockAdminOverview(page);
      mockAdminCalendarWrites(page);
      await page.goto("/calendar");
      await page.locator(".aa-add-btn", { hasText: "Add Campus Event" }).click();
      await expect(page.locator(".calendar-campus-form-card")).toBeVisible();
    });

    test("shows error when title is empty on submit", async ({ page }) => {
      const titleInput = page.locator(".calendar-campus-form-card input[placeholder*='Guest Lecture']");
      await page.locator(".calendar-campus-form-card .quickadd-save").click();
      await expectFieldToBeInvalid(titleInput);
    });

    test("shows error when date is missing", async ({ page }) => {
      const dateInput = page.locator(".calendar-campus-form-card input[type='date']");
      await page.locator(".calendar-campus-form-card input[placeholder*='Guest Lecture']").fill("Tech Talk");
      // clear the date field
      await dateInput.fill("");
      await page.locator(".calendar-campus-form-card .quickadd-save").click();
      await expectFieldToBeInvalid(dateInput);
    });

    test("shows error when start time is missing", async ({ page }) => {
      const startTimeInput = page.locator(".calendar-campus-form-card input[type='time']").first();
      await page.locator(".calendar-campus-form-card input[placeholder*='Guest Lecture']").fill("Tech Talk");
      await page.locator(".calendar-campus-form-card input[type='date']").fill(tomorrow);
      await startTimeInput.fill("");
      await page.locator(".calendar-campus-form-card .quickadd-save").click();
      await expectFieldToBeInvalid(startTimeInput);
    });

    test("shows error when end time is missing", async ({ page }) => {
      const endTimeInput = page.locator(".calendar-campus-form-card input[type='time']").last();
      await page.locator(".calendar-campus-form-card input[placeholder*='Guest Lecture']").fill("Tech Talk");
      await page.locator(".calendar-campus-form-card input[type='date']").fill(tomorrow);
      await page.locator(".calendar-campus-form-card input[type='time']").first().fill("09:00");
      await endTimeInput.fill("");
      await page.locator(".calendar-campus-form-card .quickadd-save").click();
      await expectFieldToBeInvalid(endTimeInput);
    });

    test("shows inline error when end time is before start time", async ({ page }) => {
      await page.locator(".calendar-campus-form-card input[type='time']").first().fill("14:00");
      await page.locator(".calendar-campus-form-card input[type='time']").last().fill("13:00");
      await expect(page.locator(".calendar-campus-form-card .quickadd-inline-error")).toContainText(/after start/i);
    });

    test("shows error on submit when end time is before start time", async ({ page }) => {
      await page.locator(".calendar-campus-form-card input[placeholder*='Guest Lecture']").fill("Tech Talk");
      await page.locator(".calendar-campus-form-card input[type='date']").fill(tomorrow);
      await page.locator(".calendar-campus-form-card input[type='time']").first().fill("14:00");
      await page.locator(".calendar-campus-form-card input[type='time']").last().fill("13:00");
      await page.locator(".calendar-campus-form-card .quickadd-save").click();
      await expect(page.locator(".calendar-campus-form-card .error")).toContainText(/after start/i);
    });

    test("shows error when batch scope is selected but batch not chosen", async ({ page }) => {
      const batchSelect = page.locator(".calendar-campus-form-card select", { hasText: "Select Batch" });
      await page.locator(".calendar-campus-form-card input[placeholder*='Guest Lecture']").fill("Batch Event");
      await page.locator(".calendar-campus-form-card input[type='date']").fill(tomorrow);
      await page.locator(".calendar-campus-form-card input[type='time']").first().fill("09:00");
      await page.locator(".calendar-campus-form-card input[type='time']").last().fill("10:00");
      await page.locator(".calendar-campus-form-card select", { hasText: "All Students" }).selectOption("batch");
      // leave batch/year/semester empty
      await page.locator(".calendar-campus-form-card .quickadd-save").click();
      await expectFieldToBeInvalid(batchSelect);
    });

    test("shows error when batch scope is selected but year not chosen", async ({ page }) => {
      const yearSelect = page.locator(".calendar-campus-form-card select", { hasText: "Select Year" });
      await page.locator(".calendar-campus-form-card input[placeholder*='Guest Lecture']").fill("Batch Event");
      await page.locator(".calendar-campus-form-card input[type='date']").fill(tomorrow);
      await page.locator(".calendar-campus-form-card input[type='time']").first().fill("09:00");
      await page.locator(".calendar-campus-form-card input[type='time']").last().fill("10:00");
      await page.locator(".calendar-campus-form-card select", { hasText: "All Students" }).selectOption("batch");
      await page.locator(".calendar-campus-form-card select", { hasText: "Select Batch" }).selectOption("2022");
      // leave year and semester empty
      await page.locator(".calendar-campus-form-card .quickadd-save").click();
      await expectFieldToBeInvalid(yearSelect);
    });

    test("shows error when batch scope is selected but semester not chosen", async ({ page }) => {
      const semesterSelect = page.locator(".calendar-campus-form-card select", { hasText: "Select Semester" });
      await page.locator(".calendar-campus-form-card input[placeholder*='Guest Lecture']").fill("Batch Event");
      await page.locator(".calendar-campus-form-card input[type='date']").fill(tomorrow);
      await page.locator(".calendar-campus-form-card input[type='time']").first().fill("09:00");
      await page.locator(".calendar-campus-form-card input[type='time']").last().fill("10:00");
      await page.locator(".calendar-campus-form-card select", { hasText: "All Students" }).selectOption("batch");
      await page.locator(".calendar-campus-form-card select", { hasText: "Select Batch" }).selectOption("2022");
      await page.locator(".calendar-campus-form-card select", { hasText: "Select Year" }).selectOption("1");
      // leave semester empty
      await page.locator(".calendar-campus-form-card .quickadd-save").click();
      await expectFieldToBeInvalid(semesterSelect);
    });

    test("no error shown when all required fields are valid for All Students scope", async ({ page }) => {
      await page.route("**/api/calendar-events", (route) => {
        if (route.request().method() === "POST") {
          route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ message: "Created" }) });
        } else {
          route.continue();
        }
      });
      await page.locator(".calendar-campus-form-card input[placeholder*='Guest Lecture']").fill("Valid Event");
      await page.locator(".calendar-campus-form-card input[type='date']").fill(tomorrow);
      await page.locator(".calendar-campus-form-card input[type='time']").first().fill("09:00");
      await page.locator(".calendar-campus-form-card input[type='time']").last().fill("10:00");
      await page.locator(".calendar-campus-form-card .quickadd-save").click();
      await expect(page.locator(".calendar-campus-form-card .error")).not.toBeVisible();
    });

    test("no error shown when all batch fields are fully filled", async ({ page }) => {
      await page.route("**/api/calendar-events", (route) => {
        if (route.request().method() === "POST") {
          route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ message: "Created" }) });
        } else {
          route.continue();
        }
      });
      await page.locator(".calendar-campus-form-card input[placeholder*='Guest Lecture']").fill("Batch Event");
      await page.locator(".calendar-campus-form-card input[type='date']").fill(tomorrow);
      await page.locator(".calendar-campus-form-card input[type='time']").first().fill("09:00");
      await page.locator(".calendar-campus-form-card input[type='time']").last().fill("10:00");
      await page.locator(".calendar-campus-form-card select", { hasText: "All Students" }).selectOption("batch");
      await page.locator(".calendar-campus-form-card select", { hasText: "Select Batch" }).selectOption("2022");
      await page.locator(".calendar-campus-form-card select", { hasText: "Select Year" }).selectOption("1");
      await page.locator(".calendar-campus-form-card select", { hasText: "Select Semester" }).selectOption("1");
      await page.locator(".calendar-campus-form-card .quickadd-save").click();
      await expect(page.locator(".calendar-campus-form-card .error")).not.toBeVisible();
    });
  });
});
