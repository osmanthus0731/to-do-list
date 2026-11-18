"use client";
// NAVIGATION MAP - press Ctrl+F and search SECTION followed by an ID below.
// CALENDAR-01 Imports
// CALENDAR-02 Calendar and inputs
// CALENDAR-03 Calculate the month grid
// CALENDAR-04 Change the month
// CALENDAR-05 Screen layout and controls

// Build the month as a grid of days. A selected date opens a separate card with that day's
// plans.
// SECTION CALENDAR-01 | Imports
import { useState } from "react";
import { Button, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Task } from "@/types/task";
import { todayISO } from "@/lib/validation";
import DayDialog from "./DayDialog";
// SECTION CALENDAR-02 | Calendar and inputs
export default function Calendar({
  tasks,
  onEdit,
  allTasks,
  onCreate,
  taskDialogOpen,
}: {
  tasks: Task[];
  onEdit: (task: Task) => void;
  allTasks: Task[];
  onCreate: (date: string) => void;
  taskDialogOpen: boolean;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [month, setMonth] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  // SECTION CALENDAR-03 | Calculate the month grid
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  // JavaScript numbers Sunday as 0. This calculation makes Monday the first column.
  const offset = (start.getDay() + 6) % 7;
  // Day 0 of next month is the last day of this month, giving its exact length.
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  // JavaScript also handles moving from December into January for us.
  // SECTION CALENDAR-04 | Change the month
  function move(delta: number) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  }
  // SECTION CALENDAR-05 | Screen layout and controls
  return (
    <section className="calendar" aria-label="Task calendar">
      <div className="calendar-heading">
        <h3>
          {month.toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <div>
          <Button
            onClick={() =>
              setMonth(
                new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              )
            }
          >
            Today
          </Button>
          <IconButton aria-label="Previous month" onClick={() => move(-1)}>
            <ChevronLeftIcon />
          </IconButton>
          <IconButton aria-label="Next month" onClick={() => move(1)}>
            <ChevronRightIcon />
          </IconButton>
        </div>
      </div>
      <div className="calendar-scroll">
        <div className="calendar-grid">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div className="weekday" key={d}>
              {d}
            </div>
          ))}
          {Array.from(
            { length: Math.ceil((offset + days) / 7) * 7 },
            (_, i) => {
              const day = i - offset + 1;
              const inMonth = day > 0 && day <= days;
              const iso = inMonth
                ? todayISO(new Date(month.getFullYear(), month.getMonth(), day))
                : "";
              return (
                <div
                  key={i}
                  className={`calendar-day ${!inMonth ? "outside" : ""} ${iso === todayISO() ? "today" : ""}`}
                  data-date={iso || undefined}
                  onDoubleClick={
                    inMonth ? () => setSelectedDate(iso) : undefined
                  }
                >
                  {inMonth && (
                    <>
                      <button
                        className="day-number"
                        aria-label={`Show plans for ${iso}`}
                        onClick={() => setSelectedDate(iso)}
                      >
                        {day}
                      </button>
                      {tasks
                        .filter((t) => t.dueDate === iso)
                        .map((t) => (
                          <button
                            key={t.id}
                            className={`calendar-task ${t.category.toLowerCase()} ${t.completed ? "calendar-done" : ""}`}
                            onClick={() => onEdit(t)}
                            onDoubleClick={(event) => event.stopPropagation()}
                            title={`${t.title} - ${t.category} - ${t.completed ? "Completed" : "Pending"}`}
                          >
                            {t.title}
                          </button>
                        ))}
                    </>
                  )}
                </div>
              );
            },
          )}
        </div>
      </div>
      <p className="calendar-footnote">
        Double-click a day or select its date to view and add plans. Tasks
        without a due date appear in List view. Calendar follows your search and
        filters.
      </p>
      {/* The day card uses all saved tasks, even when the month grid is filtered.
          Hide it while the task form is open, then return to the same date. */}
      {selectedDate && (
        <DayDialog
          date={selectedDate}
          tasks={allTasks.filter((task) => task.dueDate === selectedDate)}
          open={!taskDialogOpen}
          onClose={() => setSelectedDate(null)}
          onCreate={onCreate}
          onEdit={onEdit}
        />
      )}
    </section>
  );
}
