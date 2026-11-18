"use client";
// NAVIGATION MAP - press Ctrl+F and search SECTION followed by an ID below.
// IMPORTDIALOG-01 Imports
// IMPORTDIALOG-02 Import dialog and inputs
// IMPORTDIALOG-03 Preview state
// IMPORTDIALOG-04 Read the chosen file
// IMPORTDIALOG-05 Count valid and invalid rows
// IMPORTDIALOG-06 Save changes
// IMPORTDIALOG-07 Screen layout and controls

// Import has two steps: read and preview the file, then save only after the user confirms.
// SECTION IMPORTDIALOG-01 | Imports
import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
} from "@mui/material";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { PreviewRow, readImport } from "@/lib/importExport";
import { Task, TaskInput } from "@/types/task";
// SECTION IMPORTDIALOG-02 | Import dialog and inputs
export default function ImportDialog({
  tasks,
  onClose,
  onImport,
}: {
  tasks: Task[];
  onClose: () => void;
  onImport: (inputs: TaskInput[]) => Promise<void>;
}) {
  // SECTION IMPORTDIALOG-03 | Preview state
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Choosing a file prepares the preview; it does not import the tasks yet.
  // SECTION IMPORTDIALOG-04 | Read the chosen file
  async function select(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    setRows([]);
    try {
      setRows(await readImport(file, tasks));
    } catch (e) {
      setError(e instanceof Error ? e.message : "This file could not be read.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  // Only rows with no errors and no duplicate key are offered for saving.
  // SECTION IMPORTDIALOG-05 | Count valid and invalid rows
  const valid = rows.filter((r) => !r.errors.length && !r.duplicate);
  const invalid = rows.filter((r) => r.errors.length);
  const duplicates = rows.filter((r) => r.duplicate);
  // The parent calls the task service, which saves this batch in one transaction.
  // SECTION IMPORTDIALOG-06 | Save changes
  async function save() {
    setBusy(true);
    try {
      await onImport(valid.map((r) => r.task));
      onClose();
    } catch {
      setError(
        "Import could not be saved. Nothing was partially imported. Check storage and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  // SECTION IMPORTDIALOG-07 | Screen layout and controls
  return (
    <Dialog
      open
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="import-title"
    >
      <DialogTitle id="import-title">Bring your tasks along</DialogTitle>
      <DialogContent>
        <p className="muted">
          Import CSV or XLSX. Preview everything before it reaches your
          workspace.
        </p>
        <div className="import-drop">
          <UploadFileOutlinedIcon
            sx={{ fontSize: 34, color: "primary.main" }}
          />
          <strong>A fresh start, without starting over</strong>
          <p>Up to 5,000 rows - 10 MB - First worksheet only</p>
          <Button variant="outlined" component="label" disabled={busy}>
            Choose CSV or Excel
            <input
              ref={fileRef}
              hidden
              type="file"
              accept=".csv,.xlsx"
              aria-label="Import file"
              onChange={(e) => select(e.target.files?.[0])}
            />
          </Button>
        </div>
        <p className="import-help">
          Headers: <code>title, description, category, dueDate, status</code>.
          Dates: YYYY-MM-DD or blank. Status: Pending or Completed. Categories:
          Work, Personal, Urgent. Existing tasks are never overwritten;
          duplicates are skipped regardless of status.
        </p>
        <a href="/sample-tasks.csv" download>
          Download sample CSV
        </a>
        {busy && <LinearProgress sx={{ my: 2 }} />}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {rows.length > 0 && (
          <>
            <Alert
              severity={invalid.length ? "warning" : "success"}
              sx={{ my: 2 }}
            >
              {valid.length} ready to import - {invalid.length} invalid -{" "}
              {duplicates.length} duplicates skipped. Only valid, unique rows
              will be saved.
            </Alert>
            <div className="preview-scroll">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Due date</th>
                    <th>Validation</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((r) => (
                    <tr key={r.row}>
                      <td>{r.row}</td>
                      <td>{r.task.title || "-"}</td>
                      <td>{r.task.category}</td>
                      <td>{r.task.dueDate || "-"}</td>
                      <td>
                        {r.errors.join(" ") ||
                          (r.duplicate ? "Duplicate - skipped" : "Ready")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 100 && (
              <p>Showing the first 100 rows of {rows.length}.</p>
            )}
            {invalid.length > 0 && (
              <details>
                <summary>All invalid row errors ({invalid.length})</summary>
                <ul>
                  {invalid.map((r) => (
                    <li key={r.row}>
                      Row {r.row}: {r.errors.join(" ")}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button disabled={busy} onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={busy || !valid.length}
          variant="contained"
          onClick={save}
        >
          Import {valid.length} tasks
        </Button>
      </DialogActions>
    </Dialog>
  );
}
