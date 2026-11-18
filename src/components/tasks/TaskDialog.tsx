"use client";
// NAVIGATION MAP - press Ctrl+F and search SECTION followed by an ID below.
// TASKDIALOG-01 Imports
// TASKDIALOG-02 Task form and inputs
// TASKDIALOG-03 Form values
// TASKDIALOG-04 Change one form field
// TASKDIALOG-05 Check the form and save
// TASKDIALOG-06 Screen layout and controls

// This form is shared by adding and editing. An existing task fills the form; otherwise it
// starts with empty fields.
// SECTION TASKDIALOG-01 | Imports
import { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  TextField,
} from "@mui/material";
import { categories, Task, TaskInput } from "@/types/task";
import { validateTask } from "@/lib/validation";
// SECTION TASKDIALOG-02 | Task form and inputs
export default function TaskDialog({
  task,
  initialDueDate = "",
  onClose,
  onSave,
}: {
  task: Task | null;
  initialDueDate?: string;
  onClose: () => void;
  onSave: (input: TaskInput, id?: string) => Promise<void>;
}) {
  // The form edits its own copy. Nothing is saved while the user is still typing.
  // SECTION TASKDIALOG-03 | Form values
  const [input, setInput] = useState<TaskInput>(
    task ?? {
      title: "",
      description: "",
      category: "Work",
      startDate: "",
      dueDate: initialDueDate,
      completed: false,
    },
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // ...prev copies the old fields. [key] replaces only the field being edited.
  // SECTION TASKDIALOG-04 | Change one form field
  const change = (key: keyof TaskInput, value: string | boolean) =>
    setInput((prev) => ({ ...prev, [key]: value }));
  // Stop the normal page reload, validate, then wait for saving to finish.
  // SECTION TASKDIALOG-05 | Check the form and save
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateTask(input);
    if (errors.length) {
      setError(errors.join(" "));
      return;
    }
    setBusy(true);
    try {
      await onSave(input, task?.id);
      // Only close after a successful save. The catch block keeps failed input visible.
      onClose();
    } catch {
      setError(
        "Could not save your task. Check browser storage permissions and available space, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  // SECTION TASKDIALOG-06 | Screen layout and controls
  return (
    <Dialog
      open
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="task-dialog-title"
    >
      <form onSubmit={submit}>
        <DialogTitle id="task-dialog-title">
          {task ? "Edit task" : "Make room for a new idea"}
        </DialogTitle>
        <DialogContent>
          <p className="muted">
            Small steps lead to good things. What&apos;s next?
          </p>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <div className="form-stack">
            <TextField
              autoFocus
              label="Title"
              value={input.title}
              onChange={(e) => change("title", e.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { maxLength: 150 } }}
            />
            <TextField
              label="Description"
              value={input.description}
              onChange={(e) => change("description", e.target.value)}
              required
              multiline
              minRows={3}
              fullWidth
              slotProps={{ htmlInput: { maxLength: 2000 } }}
            />
            <div className="form-pair">
              <TextField
                select
                label="Category"
                value={input.category}
                onChange={(e) => change("category", e.target.value)}
                fullWidth
              >
                {categories.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </div>
            <div className="form-pair">
              <TextField
                label="Start date"
                type="date"
                value={input.startDate}
                onChange={(e) => change("startDate", e.target.value)}
                fullWidth
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { min: "1900-01-01", max: "9999-12-31" },
                }}
              />
              <TextField
                label="Due date"
                type="date"
                value={input.dueDate}
                onChange={(e) => change("dueDate", e.target.value)}
                fullWidth
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { min: "1900-01-01", max: "9999-12-31" },
                }}
              />
            </div>
            <FormControlLabel
              control={
                <Checkbox
                  checked={input.completed}
                  onChange={(e) => change("completed", e.target.checked)}
                />
              }
              label="Already completed"
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" type="submit" disabled={busy}>
            {busy ? "Saving..." : task ? "Save changes" : "Create task"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
