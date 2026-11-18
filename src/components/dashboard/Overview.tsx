// NAVIGATION MAP - press Ctrl+F and search SECTION followed by an ID below.
// OVERVIEW-01 Imports
// OVERVIEW-02 Summary cards and inputs
// OVERVIEW-03 Screen layout and controls

// Show the task totals as clickable summary cards. The parent calculates the counts and
// applies a filter when a card is chosen.
// SECTION OVERVIEW-01 | Imports
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import { Filters, Task } from "@/types/task";
interface Props {
  tasks: Task[];
  completed: number;
  pending: number;
  overdue: number;
  onFilter: (status: Filters["status"], overdue: boolean) => void;
}
// SECTION OVERVIEW-02 | Summary cards and inputs
export default function Overview({
  tasks,
  completed,
  pending,
  overdue,
  onFilter,
}: Props) {
  // SECTION OVERVIEW-03 | Screen layout and controls
  return (
    <section className="overview" aria-label="Task overview">
      {[
        {
          label: "Total tasks",
          value: tasks.length,
          mark: "\u2197",
          kind: "total",
          hint: "Everything on your plate",
          status: "all",
        },
        {
          label: "Completed",
          value: completed,
          mark: "\u2713",
          kind: "complete",
          hint: "Look at you go",
          status: "completed",
        },
        {
          label: "Pending",
          value: pending,
          mark: "\u25f7",
          kind: "pending",
          hint: "One step at a time",
          status: "pending",
        },
        {
          label: "Overdue",
          value: overdue,
          mark: "!",
          kind: "late",
          hint: "A little attention needed",
          status: "pending",
        },
      ].map((s) => (
        <button
          key={s.label}
          className={`stat ${s.kind}`}
          onClick={() => {
            onFilter(s.status as Filters["status"], s.kind === "late");
          }}
          aria-label={`Show ${s.label.toLowerCase()}`}
        >
          <span className="stat-label">
            {s.label}
            <span className="stat-icon">{s.mark}</span>
          </span>
          <strong>{s.value.toString().padStart(2, "0")}</strong>
          <span className="stat-hint">
            {s.hint}
            <ArrowOutwardIcon fontSize="inherit" />
          </span>
        </button>
      ))}
    </section>
  );
}
