// NAVIGATION MAP - press Ctrl+F and search SECTION followed by an ID below.
// TASKTOOLBAR-01 Imports
// TASKTOOLBAR-02 Toolbar and inputs
// TASKTOOLBAR-03 Screen layout and controls

// These controls describe the list the user wants to see. They update filters without
// editing or deleting any tasks.
// SECTION TASKTOOLBAR-01 | Imports
import { Alert, Button, MenuItem, TextField } from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { categories, Filters } from "@/types/task";
interface Props {
  total: number;
  taskCount: number;
  pending: number;
  completed: number;
  filters: Filters;
  filter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  view: "list" | "calendar";
  setView: (view: "list" | "calendar") => void;
  disabled: boolean;
  onImport: () => void;
  onExport: () => void;
  onReset: () => void;
}
// SECTION TASKTOOLBAR-02 | Toolbar and inputs
export default function TaskToolbar({
  total,
  taskCount,
  pending,
  completed,
  filters,
  filter,
  view,
  setView,
  disabled,
  onImport,
  onExport,
  onReset,
}: Props) {
  // SECTION TASKTOOLBAR-03 | Screen layout and controls
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>
            Your tasks <span>{total}</span>
          </h2>
          <p>Big plans, small steps. All in one place.</p>
        </div>
        <div className="data-actions">
          <Button
            startIcon={<FileUploadOutlinedIcon />}
            onClick={onImport}
            disabled={disabled}
          >
            Import
          </Button>
          <Button
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={onExport}
            disabled={disabled}
          >
            Export all
          </Button>
        </div>
      </div>
      <div className="view-line">
        <div
          className="status-tabs"
          role="group"
          aria-label="Completion filter"
        >
          {(["all", "pending", "completed"] as const).map((status) => (
            <button
              key={status}
              className={filters.status === status ? "active" : ""}
              onClick={() => filter("status", status)}
              aria-pressed={filters.status === status}
            >
              {status === "all"
                ? "All tasks"
                : status === "pending"
                  ? "Pending"
                  : "Completed"}
              <span>
                {status === "all"
                  ? taskCount
                  : status === "pending"
                    ? pending
                    : completed}
              </span>
            </button>
          ))}
        </div>
        <div className="view-toggle" role="group" aria-label="View">
          <button
            className={view === "list" ? "active" : ""}
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <GridViewOutlinedIcon fontSize="small" />
            List
          </button>
          <button
            className={view === "calendar" ? "active" : ""}
            aria-pressed={view === "calendar"}
            onClick={() => setView("calendar")}
          >
            <CalendarMonthOutlinedIcon fontSize="small" />
            Calendar
          </button>
        </div>
      </div>
      {filters.onlyOverdue && (
        <Alert severity="info" sx={{ mx: 3, mt: 2 }}>
          Showing overdue tasks. Reset filters to see all tasks.
        </Alert>
      )}
      <div className="filters">
        <div className="search-field">
          <SearchIcon />
          <input
            aria-label="Search tasks"
            placeholder="Find a task, clear your mind..."
            value={filters.search}
            onChange={(e) => filter("search", e.target.value)}
          />
        </div>
        <TextField
          select
          label="Category"
          value={filters.category}
          onChange={(e) =>
            filter("category", e.target.value as Filters["category"])
          }
          sx={{ minWidth: 145 }}
        >
          <MenuItem value="all">All categories</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Due date"
          value={filters.sort}
          onChange={(e) => filter("sort", e.target.value as Filters["sort"])}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="asc">Earliest first</MenuItem>
          <MenuItem value="desc">Latest first</MenuItem>
        </TextField>
        {(filters.search ||
          filters.category !== "all" ||
          filters.status !== "all" ||
          filters.onlyOverdue) && <Button onClick={onReset}>Reset</Button>}
      </div>
    </>
  );
}
