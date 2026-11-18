import Dexie from "dexie";
// These tests check results a user relies on: valid tasks, safe saving, correct query
// results and reliable file handling.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TaskDatabase } from "@/lib/db";
import { taskService, createTask } from "@/lib/taskService";
import {
  validateTask,
  validDate,
  isStoredTask,
  todayISO,
  displayDate,
} from "@/lib/validation";
import { queryTasks } from "@/lib/taskQueries";
import {
  buildWorkbook,
  parseCSV,
  previewRows,
  readImport,
} from "@/lib/importExport";
import type { TaskInput, Filters } from "@/types/task";
const input: TaskInput = {
  title: "Write report",
  description: "Review customer feedback",
  category: "Work",
  startDate: "",
  dueDate: "2026-11-18",
  completed: false,
};
const filters: Filters = {
  search: "",
  category: "all",
  status: "all",
  sort: "asc",
  page: 1,
  pageSize: 5,
};
describe("validation and local dates", () => {
  it("requires title and description", () => {
    expect(
      validateTask({ ...input, title: " ", description: "" }),
    ).toHaveLength(2);
  });
  it("rejects impossible dates, invalid categories, excessive text and non-boolean status", () => {
    expect(validDate("2026-02-29")).toBe(false);
    expect(validDate("2024-02-29")).toBe(true);
    expect(validDate("2026-13-01")).toBe(false);
    expect(
      validateTask({
        ...input,
        category: "Other" as never,
        completed: "yes" as never,
        title: "a".repeat(151),
        description: "a".repeat(2001),
        dueDate: "bad",
      }),
    ).toHaveLength(5);
  });
  it("accepts no due date and trims text at creation", () => {
    expect(validateTask({ ...input, dueDate: "" })).toEqual([]);
    expect(createTask({ ...input, title: "  hello  " }).title).toBe("hello");
  });
  it("formats local date-only values without UTC shifts", () => {
    expect(todayISO(new Date(2026, 0, 2, 0, 1))).toBe("2026-01-02");
    expect(displayDate("2026-01-02")).toBe("2 Jan 2026");
    expect(displayDate("")).toBe("No due date");
  });
  it("rejects corrupt stored records", () => {
    expect(isStoredTask(null)).toBe(false);
    expect(isStoredTask({ ...createTask(input), createdAt: "bad" })).toBe(
      false,
    );
    expect(isStoredTask({ ...createTask(input), description: undefined })).toBe(
      false,
    );
    expect(isStoredTask(createTask(input))).toBe(true);
  });
});
describe("persistent task lifecycle", () => {
  let database: TaskDatabase;
  let api: ReturnType<typeof taskService>;
  beforeEach(() => {
    database = new TaskDatabase("test-" + crypto.randomUUID());
    api = taskService(database);
  });
  afterEach(async () => {
    await database.delete();
  });
  it("creates, edits, completes, reopens, and deletes a persisted task", async () => {
    const created = await api.save(input);
    expect((await api.list()).tasks).toHaveLength(1);
    const edited = await api.save({ ...input, title: "Updated" }, created.id);
    expect(edited.id).toBe(created.id);
    expect(edited.createdAt).toBe(created.createdAt);
    await api.toggle(created.id);
    expect((await api.list()).tasks[0].completed).toBe(true);
    await api.toggle(created.id);
    expect((await api.list()).tasks[0].completed).toBe(false);
    database.close();
    await database.open();
    expect((await api.list()).tasks[0].title).toBe("Updated");
    await api.remove(created.id);
    expect((await api.list()).tasks).toEqual([]);
  });
  it("does not recreate tasks removed before editing or toggling", async () => {
    await expect(api.save(input, "missing")).rejects.toThrow(
      "no longer exists",
    );
    await expect(api.toggle("missing")).rejects.toThrow("not found");
  });
  it("rejects invalid writes and preserves valid existing data", async () => {
    await api.save(input);
    await expect(api.save({ ...input, title: "" })).rejects.toThrow("Title");
    expect((await api.list()).tasks).toHaveLength(1);
  });
  it("preserves corrupted records and reports their count", async () => {
    await database.tasks.put({ id: "bad" } as never);
    const result = await api.list();
    expect(result.invalidCount).toBe(1);
    expect(await database.tasks.count()).toBe(1);
  });
  it("imports atomically, skips duplicates within and across imports, never overwrites", async () => {
    await api.save(input);
    const result = await api.import([
      input,
      { ...input, completed: true },
      { ...input, title: "New" },
      { ...input, title: "New" },
    ]);
    expect(result).toEqual({ added: 1, skipped: 3 });
    expect(
      (await api.list()).tasks.find((t) => t.title === input.title)?.completed,
    ).toBe(false);
    await expect(
      api.import([
        { ...input, title: "valid" },
        { ...input, title: "" },
      ]),
    ).rejects.toThrow();
    expect((await api.list()).tasks).toHaveLength(2);
  });
  it("rolls back every inserted row when a database batch fails", async () => {
    await api.save(input);
    const random = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("00000000-0000-4000-8000-000000000000");
    try {
      await expect(
        api.import([
          { ...input, title: "First new task" },
          { ...input, title: "Second new task" },
        ]),
      ).rejects.toThrow();
    } finally {
      random.mockRestore();
    }
    expect((await api.list()).tasks).toHaveLength(1);
  });
  it("handles overlapping duplicate imports transactionally", async () => {
    await Promise.all([api.import([input]), api.import([input])]);
    expect((await api.list()).tasks).toHaveLength(1);
  });
  it("propagates database failures without inventing successful writes", async () => {
    await database.delete();
    database.close({ disableAutoOpen: true });
    await expect(api.save(input)).rejects.toThrow();
  });
});
describe("combined search/filter/sort/pagination", () => {
  const tasks = Array.from({ length: 12 }, (_, i) => ({
    ...createTask({
      ...input,
      title: `Task ${i}`,
      description: i % 2 ? "keyword note" : "other note",
      category: i % 2 ? ("Personal" as const) : ("Work" as const),
      dueDate: i === 11 ? "" : `2026-11-${String(i + 1).padStart(2, "0")}`,
      completed: i < 4,
    }),
    order: i,
  }));
  it("combines description search, category, status, descending sort and page", () => {
    const r = queryTasks(tasks, {
      ...filters,
      search: "KEYWORD",
      category: "Personal",
      status: "pending",
      sort: "desc",
    });
    expect(r.total).toBe(4);
    expect(r.items.map((t) => t.title)).toEqual([
      "Task 9",
      "Task 7",
      "Task 5",
      "Task 11",
    ]);
  });
  it("keeps undated tasks last in both sort directions", () => {
    for (const sort of ["asc", "desc"] as const)
      expect(
        queryTasks(tasks, { ...filters, sort, pageSize: 20 }).items.at(-1)
          ?.dueDate,
      ).toBe("");
  });
  it("clamps a stale last page after deletion and handles no matches", () => {
    expect(queryTasks(tasks.slice(0, 5), { ...filters, page: 3 }).page).toBe(1);
    const r = queryTasks(tasks, { ...filters, search: "missing", page: 4 });
    expect(r.items).toEqual([]);
    expect(r.totalPages).toBe(1);
    expect(r.page).toBe(1);
  });
  it("provides selectable page sizes and stable page boundaries", () => {
    expect(queryTasks(tasks, { ...filters, page: 2 }).items[0].title).toBe(
      "Task 5",
    );
    expect(queryTasks(tasks, { ...filters, pageSize: 10 }).items).toHaveLength(
      10,
    );
  });
});
it("combines overdue filtering with category and completion", () => {
  const old = createTask({ ...input, dueDate: "1900-01-01" });
  const done = createTask({ ...input, dueDate: "1900-01-01", completed: true });
  const future = createTask({ ...input, dueDate: "9999-12-31" });
  const result = queryTasks([old, done, future], {
    ...filters,
    onlyOverdue: true,
    category: "Work",
    search: "feedback",
  });
  expect(result.items.map((task) => task.id)).toEqual([old.id]);
});
describe("import and Excel export", () => {
  it("validates CSV records, reports row errors, and skips case-insensitive duplicates", () => {
    const rows = parseCSV(
      "title,description,category,dueDate,status\nWrite report,Review customer feedback,Work,2026-11-18,Pending\n,missing title,Personal,2026-02-30,maybe\n",
    );
    const preview = previewRows(rows, [input]);
    expect(preview[0].duplicate).toBe(true);
    expect(preview[1].row).toBe(3);
    expect(preview[1].errors.length).toBe(3);
  });
  it("handles quoted CSV descriptions and blank lines", () => {
    expect(
      parseCSV('title,description,category\nA,"hello, world",Personal\n\n')[0]
        .description,
    ).toBe("hello, world");
  });
  it("rejects malformed, empty and oversized imports", () => {
    expect(() => parseCSV('title,description\n"unfinished')).toThrow();
    expect(() => parseCSV("title,description")).toThrow();
    expect(() =>
      previewRows(
        Array.from({ length: 5001 }, () => ({})),
        [],
      ),
    ).toThrow("5,000");
  });
  it("rejects invalid extension, large file and invalid workbook", async () => {
    await expect(readImport(new File(["a"], "a.txt"), [])).rejects.toThrow(
      ".csv",
    );
    await expect(
      readImport(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "a.csv"), []),
    ).rejects.toThrow("10 MB");
    await expect(
      readImport(
        {
          name: "a.xlsx",
          size: 3,
          arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
        } as File,
        [],
      ),
    ).rejects.toThrow();
  });
  it("creates a formatted Excel file and roundtrips tasks without date shifts", async () => {
    const tasks = [
      createTask(input),
      createTask({
        ...input,
        title: "=SUM(1,2)",
        dueDate: "",
        completed: true,
      }),
    ];
    const book = await buildWorkbook(tasks);
    expect(book.worksheets[0].getCell("A1").font.bold).toBe(true);
    expect(book.worksheets[0].getCell("E2").numFmt).toBe("yyyy-mm-dd");
    expect(book.worksheets[0].getCell("A3").type).toBe(3);
    const bytes = await book.xlsx.writeBuffer();
    const preview = await readImport(
      {
        name: "tasks.xlsx",
        size: bytes.byteLength,
        arrayBuffer: async () => bytes,
      } as File,
      [],
    );
    expect(preview).toHaveLength(2);
    expect(preview[0].task.dueDate).toBe(input.dueDate);
    expect(preview[1].task.completed).toBe(true);
    expect(preview[1].task.dueDate).toBe("");
    expect(preview.flatMap((r) => r.errors)).toEqual([]);
  });
  it("accepts supported status aliases and flags duplicate rows", () => {
    const raw = {
      title: "A",
      description: "B",
      category: "personal",
      status: "1",
    };
    const p = previewRows([raw, raw, { ...raw, status: "incorrect" }], []);
    expect(p[0].task.completed).toBe(true);
    expect(p[0].task.category).toBe("Personal");
    expect(p[1].duplicate).toBe(true);
    expect(p[2].errors).toHaveLength(1);
  });
});

it("validates optional start dates and rejects reversed date ranges", () => {
  expect(validateTask({ ...input, startDate: "2026-11-17" })).toEqual([]);
  expect(validateTask({ ...input, startDate: input.dueDate })).toEqual([]);
  expect(validateTask({ ...input, startDate: "2026-11-19" })).toContain(
    "Start date cannot be after due date.",
  );
  expect(validateTask({ ...input, startDate: "2026-02-30" }).join()).toContain(
    "Start date must be a real date",
  );
});

it("keeps old tasks when upgrading a database without start dates", async () => {
  const name = "migration-" + crypto.randomUUID();
  const legacy = new Dexie(name);
  legacy.version(1).stores({ tasks: "id, category, dueDate, order" });
  const oldTask = createTask(input);
  const { startDate, ...record } = oldTask;
  expect(startDate).toBe("");
  await legacy.table("tasks").add(record);
  legacy.close();
  const upgraded = new TaskDatabase(name);
  try {
    expect(await upgraded.tasks.get(oldTask.id)).toEqual({
      ...oldTask,
      startDate: "",
    });
  } finally {
    await upgraded.delete();
  }
});

it("imports and exports start dates without losing either date", async () => {
  const task = createTask({ ...input, startDate: "2026-11-16" });
  const csv = previewRows(
    parseCSV(
      "title,description,category,startDate,dueDate\nPlan,Details,Work,2026-11-16,2026-11-18",
    ),
    [],
  );
  expect(csv[0].task.startDate).toBe(task.startDate);
  expect(csv[0].errors).toEqual([]);
  const workbook = await buildWorkbook([task]);
  const bytes = await workbook.xlsx.writeBuffer();
  const file = {
    name: "dates.xlsx",
    size: bytes.byteLength,
    arrayBuffer: async () => bytes,
  } as File;
  const rows = await readImport(file, []);
  expect(rows[0].task.startDate).toBe(task.startDate);
  expect(rows[0].task.dueDate).toBe(task.dueDate);
});
