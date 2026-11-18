// NAVIGATION MAP - press Ctrl+F and search SECTION followed by an ID below.
// TASK-01 Allowed categories
// TASK-02 Category type
// TASK-03 Form field types
// TASK-04 Saved task types
// TASK-05 Completion filter choices
// TASK-06 Search sorting and page types

// These are the only category names the app accepts.
// "as const" lets TypeScript remember the exact names instead of any string.
// SECTION TASK-01 | Allowed categories
export const categories = ["Work", "Personal", "Urgent"] as const;
// SECTION TASK-02 | Category type
export type Category = (typeof categories)[number];
// An interface describes the shape of an object. This is what the form supplies.
// SECTION TASK-03 | Form field types
export interface TaskInput {
  title: string;
  description: string;
  category: Category;
  startDate: string; // Leave blank when no start date is needed.
  dueDate: string; // "YYYY-MM-DD", or an empty string when no date is chosen.
  completed: boolean; // true means finished; false means still pending.
}
// A saved task also needs an ID and information about when it changed.
// SECTION TASK-04 | Saved task types
export interface Task extends TaskInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  order: number; // Breaks ties when two tasks have the same due date.
}
// SECTION TASK-05 | Completion filter choices
export type Status = "all" | "pending" | "completed";
// These settings describe which tasks the user wants to see, not what is saved.
// SECTION TASK-06 | Search sorting and page types
export interface Filters {
  onlyOverdue?: boolean;
  search: string;
  status: Status;
  category: "all" | Category;
  sort: "asc" | "desc";
  page: number;
  pageSize: number;
}
