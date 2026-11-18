// NAVIGATION MAP - press Ctrl+F and search SECTION followed by an ID below.
// IMPORTEXPORT-01 Imports
// IMPORTEXPORT-02 One preview row
// IMPORTEXPORT-03 Import limit
// IMPORTEXPORT-04 Validate import rows
// IMPORTEXPORT-05 Read CSV text
// IMPORTEXPORT-06 Visible tasks and counts
// IMPORTEXPORT-07 Read the chosen file
// IMPORTEXPORT-08 Create the Excel report
// IMPORTEXPORT-09 Download the workbook

// SECTION IMPORTEXPORT-01 | Imports
import Papa from "papaparse";
import { Category, Task, TaskInput } from "@/types/task";
import { fingerprint, validateTask, validDate } from "./validation";
// A preview keeps the proposed task and its problems separate from saved data.
// SECTION IMPORTEXPORT-02 | One preview row
export interface PreviewRow {
  row: number;
  task: TaskInput;
  errors: string[];
  duplicate: boolean;
}
// SECTION IMPORTEXPORT-03 | Import limit
export const MAX_ROWS = 5000;
// Both CSV and Excel use this same validation step, so their rules stay consistent.
// SECTION IMPORTEXPORT-04 | Validate import rows
export function previewRows(
  rows: Record<string, unknown>[],
  existing: TaskInput[],
): PreviewRow[] {
  if (rows.length > MAX_ROWS)
    throw new Error("Import up to 5,000 rows at a time.");
  const seen = new Set(existing.map(fingerprint));
  return rows.map((raw, index) => {
    // Accept headers such as "Due Date", "due_date" and "dueDate" as the same field.
    const r = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [
        k.trim().toLowerCase().replace(/[ _-]/g, ""),
        v,
      ]),
    );
    const text = (key: string) => String(r[key] ?? "").trim();
    const rawStatus = text("completed") || text("status") || "false";
    const status = rawStatus.toLowerCase();
    let dueDate = text("duedate");
    if (r.duedate instanceof Date)
      dueDate = r.duedate.toISOString().slice(0, 10);
    const category = text("category");
    const task: TaskInput = {
      title: text("title"),
      description: text("description"),
      category: (category.charAt(0).toUpperCase() +
        category.slice(1).toLowerCase()) as Category,
      dueDate,
      completed: ["true", "completed", "1"].includes(status),
    };
    const errors = validateTask(task);
    if (
      ![
        "true",
        "false",
        "completed",
        "pending",
        "incomplete",
        "0",
        "1",
      ].includes(status)
    )
      errors.push("Status must be completed/pending or true/false.");
    const key = fingerprint(task);
    const duplicate = errors.length === 0 && seen.has(key);
    if (!errors.length) seen.add(key);
    // Spreadsheet row 1 contains headings; the first task is therefore row 2.
    return { row: index + 2, task, errors, duplicate };
  });
}
// PapaParse understands quoted commas and blank lines; splitting on commas would not.
// SECTION IMPORTEXPORT-05 | Read CSV text
export function parseCSV(text: string): Record<string, unknown>[] {
  // SECTION IMPORTEXPORT-06 | Visible tasks and counts
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.replace(/^\uFEFF/, "").trim(),
  });
  if (result.errors.length)
    throw new Error(`CSV could not be read: ${result.errors[0].message}`);
  if (!result.meta.fields?.length || !result.data.length)
    throw new Error(
      "The file has no task rows. Include a header and at least one task.",
    );
  return result.data;
}
// Reading a file only creates a preview. The user must confirm before anything is saved.
// SECTION IMPORTEXPORT-07 | Read the chosen file
export async function readImport(
  file: File,
  existing: TaskInput[],
): Promise<PreviewRow[]> {
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Choose a file smaller than 10 MB.");
  let rows: Record<string, unknown>[];
  if (file.name.toLowerCase().endsWith(".csv"))
    rows = parseCSV(await file.text());
  else if (file.name.toLowerCase().endsWith(".xlsx")) {
    // Load the larger Excel library only when someone actually needs it.
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 2)
      throw new Error("The first worksheet has no task rows.");
    if (sheet.rowCount > MAX_ROWS + 1)
      throw new Error("Import up to 5,000 rows at a time.");
    const headers: string[] = [];
    sheet.getRow(1).eachCell((cell, col) => {
      headers[col] = cell.text.trim();
    });
    rows = [];
    sheet.eachRow((row, index) => {
      if (index === 1) return;
      const record: Record<string, unknown> = {};
      headers.forEach((header, col) => {
        if (!header) return;
        const cell = row.getCell(col);
        // Reject formulas and error cells instead of trusting spreadsheet calculations.
        if (
          cell.type === ExcelJS.ValueType.Formula ||
          cell.type === ExcelJS.ValueType.Error
        )
          throw new Error(
            `Row ${index}: formulas and error cells are not supported. Export values only.`,
          );
        record[header] = cell.value instanceof Date ? cell.value : cell.text;
      });
      rows.push(record);
    });
  } else throw new Error("Choose a .csv or .xlsx file.");
  return previewRows(rows, existing);
}
// Build the report in memory first, which also lets tests inspect it without a download.
// SECTION IMPORTEXPORT-08 | Create the Excel report
export async function buildWorkbook(tasks: Task[]) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Daylight";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Tasks", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "Title", key: "title", width: 32 },
    { header: "Description", key: "description", width: 58 },
    { header: "Category", key: "category", width: 15 },
    { header: "Due Date", key: "dueDate", width: 16 },
    { header: "Status", key: "status", width: 16 },
    { header: "ID", key: "id", width: 40 },
    { header: "Created At", key: "createdAt", width: 27 },
    { header: "Updated At", key: "updatedAt", width: 27 },
  ];
  tasks.forEach((task) => {
    // Plain text stays text, even if a title starts with "=". Dates use real Excel cells.
    const row = sheet.addRow({
      ...task,
      dueDate:
        task.dueDate && validDate(task.dueDate)
          ? new Date(task.dueDate + "T12:00:00Z")
          : null,
      status: task.completed ? "Completed" : "Pending",
    });
    row.getCell("dueDate").numFmt = "yyyy-mm-dd";
    row.alignment = { vertical: "top", wrapText: true };
    row.height = 44;
    row.getCell("status").font = {
      color: { argb: task.completed ? "FF557345" : "FF93672B" },
    };
  });
  sheet.getRow(1).height = 30;
  sheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF344E3C" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle" };
  });
  sheet.autoFilter = { from: "A1", to: `H${Math.max(1, sheet.rowCount)}` };
  sheet.properties.defaultRowHeight = 24;
  return workbook;
}
// A Blob is a file-like object in browser memory. Give it a temporary URL so the
// browser can download it, then release that URL when it is no longer needed.
// SECTION IMPORTEXPORT-09 | Download the workbook
export async function downloadWorkbook(tasks: Task[]) {
  const workbook = await buildWorkbook(tasks);
  const bytes = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "daylight-tasks.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
