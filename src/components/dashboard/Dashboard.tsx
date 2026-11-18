"use client";
// NAVIGATION MAP - press Ctrl+F and search SECTION followed by an ID below.
// DASHBOARD-01 Imports
// DASHBOARD-02 Starting filters
// DASHBOARD-03 Main screen and inputs
// DASHBOARD-04 Visible tasks and counts
// DASHBOARD-05 Change search filter or sort
// DASHBOARD-06 Run an action with feedback
// DASHBOARD-07 Save changes
// DASHBOARD-08 Save imported tasks
// DASHBOARD-09 Export all tasks
// DASHBOARD-10 Screen layout and controls

// This is the main screen. It connects smaller components and keeps track of which views
// and dialogs are open.
// SECTION DASHBOARD-01 | Imports
import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
  Pagination,
  Snackbar,
  TextField,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NavigationMenu from "./NavigationMenu";
import Overview from "./Overview";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import TaskDialog from "@/components/tasks/TaskDialog";
import TaskToolbar from "@/components/tasks/TaskToolbar";
import TaskList from "@/components/tasks/TaskList";
import ImportDialog from "@/components/tasks/ImportDialog";
import Calendar from "@/components/calendar/Calendar";
import { useTasks } from "@/hooks/useTasks";
import { tasksApi } from "@/lib/taskService";
import { queryTasks } from "@/lib/taskQueries";
import { todayISO } from "@/lib/validation";
import { downloadWorkbook } from "@/lib/importExport";
import { Filters, Task, TaskInput } from "@/types/task";
// SECTION DASHBOARD-02 | Starting filters
const initial: Filters = {
  search: "",
  status: "all",
  category: "all",
  sort: "asc",
  page: 1,
  pageSize: 5,
};
// SECTION DASHBOARD-03 | Main screen and inputs
export default function Dashboard() {
  const { tasks, loading, error, invalidCount, retry } = useTasks();
  const [filters, setFilters] = useState(initial);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [menuOpen, setMenuOpen] = useState(false);
  const [createDueDate, setCreateDueDate] = useState("");
  // undefined means closed, null means add a task, and a Task means edit it.
  const [dialog, setDialog] = useState<Task | null | undefined>(undefined);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);
  // Derive the visible tasks from saved data instead of keeping a second task list.
  // SECTION DASHBOARD-04 | Visible tasks and counts
  const result = queryTasks(tasks, filters);
  const completed = tasks.filter((t) => t.completed).length;
  const pending = tasks.length - completed;
  const overdue = tasks.filter(
    (t) => !t.completed && t.dueDate && t.dueDate < todayISO(),
  ).length;
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;
  // keyof makes sure the setting name and its new value have matching types.
  // Return to page one because the old page might not exist after filtering.
  // SECTION DASHBOARD-05 | Change search filter or sort
  function filter<K extends keyof Filters>(key: K, value: Filters[K]) {
    // ...prev keeps the other settings. [key] means use the supplied setting name.
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
      onlyOverdue: key === "status" ? false : prev.onlyOverdue,
    }));
  }
  // Await the database operation before showing success. finally always clears busy.
  // SECTION DASHBOARD-06 | Run an action with feedback
  async function act(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    try {
      await action();
      setNotice({ text: message });
    } catch {
      setNotice({
        text: "The change could not be saved. Check browser storage permissions and free space, then try again.",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  }
  // Let save errors reach the form so it stays open with the user's input.
  // SECTION DASHBOARD-07 | Save changes
  async function save(input: TaskInput, id?: string) {
    await tasksApi.save(input, id);
    setNotice({
      text: id
        ? "Task updated. A little clearer already."
        : "Task added. One step closer.",
    });
  }
  // SECTION DASHBOARD-08 | Save imported tasks
  async function importTasks(inputs: TaskInput[]) {
    const count = await tasksApi.import(inputs);
    setNotice({
      text: `Imported ${count.added} tasks. ${count.skipped} duplicates skipped.`,
    });
  }
  // Export the whole saved list, not only the currently filtered page.
  // SECTION DASHBOARD-09 | Export all tasks
  async function exportTasks() {
    setBusy(true);
    try {
      await downloadWorkbook(tasks);
      setNotice({ text: `Exported all ${tasks.length} tasks.` });
    } catch {
      setNotice({
        text: "Export failed. Your tasks are safe. Please try again.",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  }
  // SECTION DASHBOARD-10 | Screen layout and controls
  return (
    <div className="app-shell">
      <NavigationMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        tasks={tasks}
        view={view}
        setView={setView}
        filters={filters}
        onCategory={(value) => filter("category", value)}
      />
      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{view === "calendar" ? "Calendar" : "My tasks"}</strong>
          </div>
          <div className="topbar-actions">
            <span className="topbar-note">
              <span />
              Your space to make progress
            </span>
            <IconButton
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? "workspace-menu" : undefined}
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <h1>
                A good day starts here<span>.</span>
              </h1>
              <p className="page-subtitle">
                A little structure for your big ideas. Let&apos;s make things
                happen.
              </p>
            </div>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setCreateDueDate("");
                setDialog(null);
              }}
              disabled={loading || !!error}
            >
              New task
            </Button>
          </div>
          <Overview
            tasks={tasks}
            completed={completed}
            pending={pending}
            overdue={overdue}
            onFilter={(status, onlyOverdue) =>
              setFilters((prev) => ({ ...prev, status, onlyOverdue, page: 1 }))
            }
          />
          <section className="focus-banner">
            <div className="focus-symbol">&#10039;</div>
            <div>
              <strong>
                {progress === 100 && tasks.length
                  ? "You made room for what's next."
                  : "Progress, not perfection."}
              </strong>
              <p>
                {tasks.length
                  ? `You've completed ${completed} of ${tasks.length} tasks. Keep finding your rhythm.`
                  : "Your next chapter starts with one small task."}
              </p>
            </div>
            <div className="progress-block">
              <span>{progress}% complete</span>
              <LinearProgress variant="determinate" value={progress} />
            </div>
          </section>
          {error && (
            <Alert
              severity="error"
              action={<Button onClick={retry}>Retry</Button>}
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}
          {invalidCount > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {invalidCount} stored records could not be read. They have been
              preserved without changes. Export readable tasks for a backup.
            </Alert>
          )}
          <section className="task-panel" aria-label="Task workspace">
            <TaskToolbar
              total={result.total}
              taskCount={tasks.length}
              pending={pending}
              completed={completed}
              filters={filters}
              filter={filter}
              view={view}
              setView={setView}
              disabled={loading || !!error || busy}
              onImport={() => setImporting(true)}
              onExport={exportTasks}
              onReset={() => setFilters(initial)}
            />
            {loading ? (
              <div className="loading">
                <LinearProgress />
                <p>Opening your workspace...</p>
              </div>
            ) : view === "list" ? (
              <>
                <TaskList
                  tasks={result.items}
                  busy={busy || !!error}
                  onEdit={setDialog}
                  onDelete={setDeleting}
                  onToggle={(t) =>
                    act(
                      () => tasksApi.toggle(t.id),
                      t.completed
                        ? "Task marked pending."
                        : "Nice work. Task completed!",
                    )
                  }
                />
                <footer className="pagination">
                  <div className="pagination-size">
                    <TextField
                      select
                      label="Per page"
                      value={filters.pageSize}
                      onChange={(e) =>
                        filter("pageSize", Number(e.target.value))
                      }
                      sx={{ width: 90 }}
                    >
                      {[5, 10, 15, 20].map((n) => (
                        <MenuItem key={n} value={n}>
                          {n}
                        </MenuItem>
                      ))}
                    </TextField>
                    <span>
                      {result.total
                        ? `${(result.page - 1) * filters.pageSize + 1}-${Math.min(result.page * filters.pageSize, result.total)} of ${result.total}`
                        : "0 tasks"}
                    </span>
                  </div>
                  <div className="pagination-controls">
                    <span>
                      Page {result.page} of {result.totalPages}
                    </span>
                    <Button
                      size="small"
                      disabled={result.page === 1}
                      onClick={() =>
                        setFilters((p) => ({ ...p, page: result.page - 1 }))
                      }
                    >
                      Previous
                    </Button>
                    <Pagination
                      count={result.totalPages}
                      page={result.page}
                      onChange={(_, page) =>
                        setFilters((p) => ({ ...p, page }))
                      }
                      color="primary"
                      size="small"
                      hidePrevButton
                      hideNextButton
                      siblingCount={0}
                    />
                    <Button
                      size="small"
                      disabled={result.page === result.totalPages}
                      onClick={() =>
                        setFilters((p) => ({ ...p, page: result.page + 1 }))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </footer>
              </>
            ) : (
              <Calendar
                tasks={result.matches}
                allTasks={tasks}
                onEdit={setDialog}
                onCreate={(date) => {
                  setCreateDueDate(date);
                  setDialog(null);
                }}
                taskDialogOpen={dialog !== undefined}
              />
            )}
          </section>
          <footer className="page-footer">
            <span>
              <CheckCircleOutlineIcon fontSize="inherit" /> Made for a calmer
              kind of productive.
            </span>
            <span>Stored locally - No account needed</span>
          </footer>
        </main>
      </div>
      {dialog !== undefined && (
        <TaskDialog
          task={dialog}
          initialDueDate={createDueDate}
          onClose={() => setDialog(undefined)}
          onSave={save}
        />
      )}
      {importing && (
        <ImportDialog
          tasks={tasks}
          onClose={() => setImporting(false)}
          onImport={importTasks}
        />
      )}
      <Dialog
        open={!!deleting}
        onClose={busy ? undefined : () => setDeleting(null)}
        aria-labelledby="delete-title"
      >
        <DialogTitle id="delete-title">Delete this task?</DialogTitle>
        <DialogContent>
          <p>
            &quot;{deleting?.title}&quot; will be permanently removed from this
            device.
          </p>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setDeleting(null)}>
            Keep task
          </Button>
          <Button
            color="error"
            disabled={busy}
            onClick={() =>
              act(async () => {
                await tasksApi.remove(deleting!.id);
                setFilters((current) => ({
                  ...current,
                  page: Math.min(
                    current.page,
                    Math.max(
                      1,
                      Math.ceil((result.total - 1) / current.pageSize),
                    ),
                  ),
                }));
                setDeleting(null);
              }, "Task deleted.")
            }
          >
            Delete task
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={!!notice}
        autoHideDuration={6000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={notice?.error ? "error" : "success"}
          onClose={() => setNotice(null)}
          variant="filled"
        >
          {notice?.text}
        </Alert>
      </Snackbar>
    </div>
  );
}
