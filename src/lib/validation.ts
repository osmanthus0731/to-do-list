// NAVIGATION MAP - press Ctrl+F and search SECTION followed by an ID below.
// VALIDATION-01 Imports
// VALIDATION-02 Check a real date
// VALIDATION-03 Check task fields
// VALIDATION-04 Check saved records
// VALIDATION-05 Get the local day
// VALIDATION-06 Display a readable date
// VALIDATION-07 Compare duplicate tasks

// SECTION VALIDATION-01 | Imports
import { categories, Task, TaskInput } from "@/types/task";
// Check both the date's format and whether that calendar day actually exists.
// SECTION VALIDATION-02 | Check a real date
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  // JavaScript can turn 30 February into a March date. Comparing the result
  // with the original text lets us reject that impossible input.
  const date = new Date(value + "T12:00:00Z");
  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    value >= "1900-01-01" &&
    value <= "9999-12-31"
  );
}
// Return every problem as readable text. An empty array means no errors.
// TypeScript helps while coding, but imported files still need these real checks.
// SECTION VALIDATION-03 | Check task fields
export function validateTask(input: TaskInput): string[] {
  const errors: string[] = [];
  if (typeof input.title !== "string" || !input.title.trim())
    errors.push("Title is required.");
  else if (input.title.trim().length > 150)
    errors.push("Title must be 150 characters or fewer.");
  if (typeof input.description !== "string" || !input.description.trim())
    errors.push("Description is required.");
  else if (input.description.trim().length > 2000)
    errors.push("Description must be 2,000 characters or fewer.");
  if (!categories.includes(input.category))
    errors.push("Category must be Work, Personal, or Urgent.");
  if (
    typeof input.dueDate !== "string" ||
    (input.dueDate && !validDate(input.dueDate))
  )
    errors.push("Due date must be a real date in YYYY-MM-DD format, or blank.");
  if (
    typeof input.startDate !== "string" ||
    (input.startDate && !validDate(input.startDate))
  )
    errors.push(
      "Start date must be a real date in YYYY-MM-DD format, or blank.",
    );
  // Dates in YYYY-MM-DD order can be compared directly, like words in a dictionary.
  if (
    validDate(input.startDate) &&
    validDate(input.dueDate) &&
    input.startDate > input.dueDate
  )
    errors.push("Start date cannot be after due date.");
  if (typeof input.completed !== "boolean")
    errors.push("Completion status is invalid.");
  return errors;
}
// Browser data could be damaged or left over from older code. Check it before
// displaying it. "value is Task" tells TypeScript what a successful check means.
// SECTION VALIDATION-04 | Check saved records
export function isStoredTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false;
  const t = value as Task;
  return (
    validateTask(t).length === 0 &&
    typeof t.id === "string" &&
    !!t.id &&
    typeof t.createdAt === "string" &&
    Number.isFinite(Date.parse(t.createdAt)) &&
    typeof t.updatedAt === "string" &&
    Number.isFinite(Date.parse(t.updatedAt)) &&
    Number.isFinite(t.order)
  );
}
// Use the browser's local day. A UTC conversion could give yesterday or tomorrow.
// SECTION VALIDATION-05 | Get the local day
export function todayISO(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
// Stored dates stay easy to compare; this function makes them nicer to read.
// SECTION VALIDATION-06 | Display a readable date
export function displayDate(value: string): string {
  return value
    ? new Date(value + "T12:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No due date";
}
// Make a comparison key for duplicate imports. This is not encryption.
// Status is left out so a completed copy cannot replace an existing pending task.
// SECTION VALIDATION-07 | Compare duplicate tasks
export function fingerprint(t: TaskInput): string {
  return JSON.stringify([
    t.title.trim().toLowerCase(),
    t.description.trim().toLowerCase(),
    t.category,
    t.startDate,
    t.dueDate,
  ]);
}
