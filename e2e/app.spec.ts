// These tests use a real browser against the built app. Each test gets its own browser context, so test tasks do not become the user's tasks.

import { test, expect } from "@playwright/test";

test("top-right menu replaces the sidebar and day cards create persistent plans", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "New task", exact: true }),
  ).toBeEnabled();
  await expect(
    page.locator(".sidebar, .brand, .sidebar-note, .eyebrow"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Workspace", exact: true }),
  ).toHaveCount(0);
  const menu = page.getByRole("button", {
    name: "Open navigation menu",
    exact: true,
  });
  const box = await menu.boundingBox();
  expect(box!.x).toBeGreaterThan(page.viewportSize()!.width - 120);
  await menu.click();
  const navigation = page.getByRole("navigation", {
    name: "Workspace",
    exact: true,
  });
  await expect(navigation).toBeVisible();
  await navigation
    .getByRole("button", { name: "Calendar", exact: true })
    .click();
  await expect(navigation).toHaveCount(0);
  const today = await page.evaluate(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  await page
    .locator(`.calendar-day[data-date="${today}"]`)
    .dblclick({ position: { x: 70, y: 65 } });
  const card = page.getByRole("dialog");
  await expect(card).toContainText("No plans for this day yet.");
  await expect(card.locator("#day-title")).toContainText(
    String(new Date(today + "T12:00:00").getFullYear()),
  );
  await card.getByRole("button", { name: "Add plan", exact: true }).click();
  const form = page.getByRole("dialog");
  await expect(form.getByLabel("Due date", { exact: true })).toHaveValue(today);
  await form
    .getByLabel("Title", { exact: false })
    .fill("Plan directly from the calendar");
  await form
    .getByLabel("Description", { exact: false })
    .fill("A plan created in the selected day card.");
  await form.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: /Plan directly from the calendar/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/day-card-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page.reload();
  await menu.click();
  await page
    .getByRole("navigation", { name: "Workspace", exact: true })
    .getByRole("button", { name: "Calendar", exact: true })
    .click();
  const dateButton = page.getByRole("button", {
    name: `Show plans for ${today}`,
    exact: true,
  });
  await dateButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toContainText(
    "Plan directly from the calendar",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Plan directly from the calendar/ })
    .click();
  await expect(
    page.getByRole("dialog").getByLabel("Title", { exact: false }),
  ).toHaveValue("Plan directly from the calendar");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await menu.click();
  await expect(
    page.getByRole("navigation", { name: "Workspace", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".brand, .sidebar-note")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/navigation-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Close navigation menu", exact: true })
    .click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test("unavailable storage shows a retry without claiming successful persistence", async ({
  page,
}) => {
  await page.addInitScript(() => {
    indexedDB.open = () => {
      throw new DOMException("Storage blocked", "SecurityError");
    };
  });
  await page.goto("/");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Local storage could not be read" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "New task", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Retry", exact: true }),
  ).toBeEnabled();
  await page.evaluate(() => Reflect.deleteProperty(indexedDB, "open"));
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "New task", exact: true }),
  ).toBeEnabled();
});

test("combined filters, pagination boundaries and duplicate previews", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  const csv =
    "title,description,category,dueDate,status\n" +
    Array.from(
      { length: 12 },
      (_, i) =>
        `Task ${i + 1},keyword ${i + 1},${i % 2 ? "Personal" : "Work"},2026-11-${String(i + 1).padStart(2, "0")},Pending`,
    ).join("\n");
  await page.locator("input[type=file]").setInputFiles({
    name: "bulk.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await page
    .getByRole("button", { name: "Import 12 tasks", exact: true })
    .click();
  await expect(page.getByText("Page 1 of 3", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Task 11", exact: true }),
  ).toBeVisible();
  for (const title of ["Task 11", "Task 12"]) {
    await page
      .getByRole("button", { name: `Delete ${title}`, exact: true })
      .click();
    await page
      .getByRole("button", { name: "Delete task", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toHaveCount(0);
  }
  await expect(page.getByText("Page 2 of 2", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Search tasks" }).fill("keyword 1");
  await expect(page.getByText("Page 1 of 1", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Task 1", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Task 10", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.getByRole("combobox", { name: "Category", exact: true }).click();
  await page.getByRole("option", { name: "Personal", exact: true }).click();
  await page.getByRole("combobox", { name: "Due date", exact: true }).click();
  await page.getByRole("option", { name: "Latest first", exact: true }).click();
  await expect(page.locator(".task-copy h3").first()).toHaveText("Task 10");
  await expect(page.locator(".task-row")).toHaveCount(5);
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "duplicates.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "title,description,category,dueDate,status\nTask 1,keyword 1,Work,2026-11-01,Completed\n,broken,Work,2026-02-30,unknown",
    ),
  });
  await expect(
    page.getByText("0 ready to import", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Import 0 tasks", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Title is required.", { exact: false }).first(),
  ).toBeVisible();
});
test("complete task workflow persists across refresh, supports import/export and calendar", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A good day starts here." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await page
    .getByLabel("Title", { exact: false })
    .fill("Interview preparation");
  await page
    .getByLabel("Description", { exact: false })
    .fill("Explain architecture and tradeoffs");
  await page.getByLabel("Due date", { exact: true }).last().fill("2026-11-18");
  await page.getByRole("button", { name: "Create task" }).click();
  await expect(
    page.getByRole("heading", { name: "Interview preparation", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Interview preparation", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Mark Interview preparation complete" })
    .click();
  await expect(
    page.getByRole("checkbox", {
      name: "Mark Interview preparation incomplete",
    }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Edit Interview preparation", exact: true })
    .click();
  await page.getByLabel("Title", { exact: false }).fill("Practice the demo");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: "Practice the demo", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await page
    .locator("input[type=file]")
    .setInputFiles("public/sample-tasks.csv");
  await expect(
    page.getByText("3 ready to import", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Import 3 tasks", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Plan the week", exact: true }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Search tasks" }).fill("focus time");
  await expect(
    page.getByRole("heading", { name: "Plan the week", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Practice the demo", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export all", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("daylight-tasks.xlsx");
  const exportedPath = await download.path();
  expect(exportedPath).toBeTruthy();
  await page.getByRole("button", { name: "Import", exact: true }).click();
  const fs = await import("node:fs/promises");
  await page.locator("input[type=file]").setInputFiles({
    name: "roundtrip.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: await fs.readFile(exportedPath!),
  });
  await expect(
    page.getByText("0 ready to import", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("4 duplicates skipped", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("group", { name: "View", exact: true })
    .getByRole("button", { name: "Calendar", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Task calendar" }),
  ).toBeVisible();
  await page
    .getByRole("group", { name: "View", exact: true })
    .getByRole("button", { name: "List", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete Practice the demo", exact: true })
    .click();
  await page.getByRole("button", { name: "Keep task", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Practice the demo", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete Practice the demo", exact: true })
    .click();
  await page.getByRole("button", { name: "Delete task", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Practice the demo", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("alert")
    .filter({ hasText: "Task deleted." })
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});
test("mobile layout fits the viewport and dialog remains usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "New task", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "New task", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create task" }),
  ).toBeInViewport();
  await page.getByLabel("Title", { exact: false }).fill("Design a calmer week");
  await page
    .getByLabel("Description", { exact: false })
    .fill("Choose one useful thing to focus on. Small steps count.");
  await page.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Design a calmer week", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page
    .getByRole("alert")
    .filter({ hasText: "Task added." })
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});

test("calendar places a task on its due date, navigates months and opens editing", async ({
  page,
}) => {
  await page.goto("/");
  const today = await page.evaluate(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "calendar.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      `title,description,category,dueDate,status\nCalendar check,Discuss the release,Urgent,${today},Pending`,
    ),
  });
  await page
    .getByRole("button", { name: "Import 1 tasks", exact: true })
    .click();
  await page
    .getByRole("group", { name: "View", exact: true })
    .getByRole("button", { name: "Calendar", exact: true })
    .click();
  await expect(
    page.locator(".calendar-day.today .calendar-task.urgent"),
  ).toHaveText("Calendar check");
  const heading = await page.locator(".calendar-heading h3").innerText();
  await page.getByRole("button", { name: "Next month", exact: true }).click();
  await expect(page.locator(".calendar-heading h3")).not.toHaveText(heading);
  await page
    .getByRole("button", { name: "Previous month", exact: true })
    .click();
  await expect(page.locator(".calendar-heading h3")).toHaveText(heading);
  await page
    .getByRole("button", { name: "Calendar check", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("Title", { exact: false })).toHaveValue(
    "Calendar check",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/calendar-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
});
