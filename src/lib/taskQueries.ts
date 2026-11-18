// NAVIGATION MAP - press Ctrl+F and search SECTION followed by an ID below.
// TASKQUERIES-01 Imports
// TASKQUERIES-02 Find matching tasks
// TASKQUERIES-03 Sort matches by due date
// TASKQUERIES-04 Calculate valid page numbers

// SECTION TASKQUERIES-01 | Imports
import { todayISO } from "./validation";
import { Filters, Task } from "@/types/task";
// This function only calculates results. It does not change the saved tasks.
// The order matters: filter everything, sort the matches, then take one page.
// SECTION TASKQUERIES-02 | Find matching tasks
export function queryTasks(tasks: Task[], filters: Filters) {
  const search = filters.search.trim().toLowerCase();
  // filter() creates a new array containing only tasks that pass every condition.
  const matches = tasks.filter(
    (t) =>
      (!filters.onlyOverdue ||
        (!t.completed && !!t.dueDate && t.dueDate < todayISO())) &&
      (!search ||
        `${t.title} ${t.description}`.toLowerCase().includes(search)) &&
      (filters.status === "all" ||
        t.completed === (filters.status === "completed")) &&
      (filters.category === "all" || t.category === filters.category),
  );
  // Date-only strings sort correctly because the year comes before month and day.
  // Keep tasks with no due date last in either sorting direction.
  // SECTION TASKQUERIES-03 | Sort matches by due date
  matches.sort((a, b) => {
    if (!a.dueDate && !b.dueDate)
      return a.order - b.order || a.id.localeCompare(b.id);
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return (
      a.dueDate.localeCompare(b.dueDate) * (filters.sort === "asc" ? 1 : -1) ||
      a.order - b.order ||
      a.id.localeCompare(b.id)
    );
  });
  // SECTION TASKQUERIES-04 | Calculate valid page numbers
  const pageSize = [5, 10, 15, 20].includes(filters.pageSize)
    ? filters.pageSize
    : 5;
  // Round up: 11 tasks at 5 per page need 3 pages, not 2.
  const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
  // Deletion can remove the final page. Keep the requested page inside valid bounds.
  const page = Math.max(1, Math.min(filters.page, totalPages));
  return {
    matches,
    items: matches.slice((page - 1) * pageSize, page * pageSize), // Only this page.
    page,
    totalPages,
    total: matches.length,
  };
}
