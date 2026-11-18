// NAVIGATION MAP - press Ctrl+F and search SECTION followed by an ID below.
// TASKLIST-01 Imports
// TASKLIST-02 Task list and callbacks
// TASKLIST-03 Empty list message
// TASKLIST-04 Screen layout and controls

// Display the current page of tasks. Button clicks are sent back to the parent; this
// component does not write to the database.
// SECTION TASKLIST-01 | Imports
import { Checkbox, Chip, IconButton, Tooltip } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import { Task } from "@/types/task";
import { displayDate, todayISO } from "@/lib/validation";
// SECTION TASKLIST-02 | Task list and callbacks
export default function TaskList({
  tasks,
  busy,
  onToggle,
  onEdit,
  onDelete,
}: {
  tasks: Task[];
  busy: boolean;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  // SECTION TASKLIST-03 | Empty list message
  if (!tasks.length)
    return (
      <div className="empty">
        <span className="empty-flower">&#10035;</span>
        <h3>A little breathing room.</h3>
        <p>No tasks here yet. Add a task or adjust your filters.</p>
      </div>
    );
  // SECTION TASKLIST-04 | Screen layout and controls
  return (
    <div className="task-list">
      {tasks.map((t) => (
        <article
          className={`task-row ${t.completed ? "is-done" : ""}`}
          key={t.id}
        >
          <Checkbox
            checked={t.completed}
            disabled={busy}
            onChange={() => onToggle(t)}
            slotProps={{
              input: {
                "aria-label": `Mark ${t.title} ${t.completed ? "incomplete" : "complete"}`,
              },
            }}
          />
          <div className="task-copy">
            <h3>{t.title}</h3>
            <p>{t.description}</p>
            <div className="task-meta">
              <Chip
                className={`category-chip ${t.category.toLowerCase()}`}
                label={t.category}
                size="small"
              />
              <span
                className={
                  !t.completed && t.dueDate && t.dueDate < todayISO()
                    ? "overdue"
                    : ""
                }
              >
                <EventOutlinedIcon fontSize="inherit" />
                {displayDate(t.dueDate)}
                {!t.completed && t.dueDate && t.dueDate < todayISO()
                  ? " - Overdue"
                  : ""}
              </span>
              {t.completed && <span className="done-label">Completed</span>}
            </div>
          </div>
          <div className="row-actions">
            <Tooltip title="Edit task">
              <IconButton
                disabled={busy}
                aria-label={`Edit ${t.title}`}
                onClick={() => onEdit(t)}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete task">
              <IconButton
                disabled={busy}
                aria-label={`Delete ${t.title}`}
                onClick={() => onDelete(t)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        </article>
      ))}
    </div>
  );
}
