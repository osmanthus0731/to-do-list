// NAVIGATION MAP - press Ctrl+F and search SECTION followed by an ID below.
// DAYDIALOG-01 Imports
// DAYDIALOG-02 Daily plan card and inputs
// DAYDIALOG-03 Format the chosen date
// DAYDIALOG-04 Screen layout and controls

// Show the selected date and its plans. Adding or editing reuses the normal task form
// instead of creating a second set of form rules.
// SECTION DAYDIALOG-01 | Imports
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { displayDate } from "@/lib/validation";
import { Task } from "@/types/task";

// SECTION DAYDIALOG-02 | Daily plan card and inputs
export default function DayDialog({
  date,
  tasks,
  open,
  onClose,
  onCreate,
  onEdit,
}: {
  date: string;
  tasks: Task[];
  open: boolean;
  onClose: () => void;
  onCreate: (date: string) => void;
  onEdit: (task: Task) => void;
}) {
  // SECTION DAYDIALOG-03 | Format the chosen date
  const formatted = new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  // SECTION DAYDIALOG-04 | Screen layout and controls
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="day-title"
    >
      <DialogTitle id="day-title">
        <span className="day-card-label">YOUR DAY</span>
        {formatted}
      </DialogTitle>
      <DialogContent>
        <p className="muted">
          {tasks.length
            ? `${tasks.length} ${tasks.length === 1 ? "plan" : "plans"} for this day. Select a plan to edit it.`
            : "No plans for this day yet. Make space for something good."}
        </p>
        <div className="day-plans">
          {tasks.map((task) => (
            <button
              className={`day-plan ${task.completed ? "day-plan-done" : ""}`}
              key={task.id}
              onClick={() => onEdit(task)}
            >
              <div className="day-plan-heading">
                <strong>{task.title}</strong>
                <Chip
                  size="small"
                  label={task.category}
                  className={`category-chip ${task.category.toLowerCase()}`}
                />
              </div>
              <p>{task.description}</p>
              <p>
                {task.startDate
                  ? `Starts ${displayDate(task.startDate)} ? `
                  : ""}
                Due {displayDate(task.dueDate)}
              </p>
              <span>{task.completed ? "Completed" : "Pending"}</span>
            </button>
          ))}
        </div>
        <p className="day-card-help">
          All plans for this date are shown, including those outside your
          current filters.
        </p>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => onCreate(date)}
        >
          Add plan
        </Button>
      </DialogActions>
    </Dialog>
  );
}
