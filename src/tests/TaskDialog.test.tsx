// Use the form through its labels and buttons, then check what was submitted and what
// happens when saving fails.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import TaskDialog from "@/components/tasks/TaskDialog";
import Providers from "@/components/Providers";
import { createTask } from "@/lib/taskService";
it("submits an accessible task form with actual user input", async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  const close = vi.fn();
  render(
    <Providers>
      <TaskDialog task={null} onClose={close} onSave={save} />
    </Providers>,
  );
  fireEvent.change(screen.getByLabelText(/Title/), {
    target: { value: "Plan release" },
  });
  fireEvent.change(screen.getByLabelText(/Description/), {
    target: { value: "Review test results" },
  });
  fireEvent.change(screen.getByLabelText(/Start date/), {
    target: { value: "2026-11-16" },
  });
  fireEvent.change(screen.getByLabelText(/Due date/), {
    target: { value: "2026-11-18" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create task" }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith(
      {
        title: "Plan release",
        description: "Review test results",
        category: "Work",
        completed: false,
        startDate: "2026-11-16",
        dueDate: "2026-11-18",
      },
      undefined,
    ),
  );
  expect(close).toHaveBeenCalled();
});
it("keeps edits open and displays storage errors when saving fails", async () => {
  const task = createTask({
    title: "Original",
    description: "Details",
    category: "Work",
    startDate: "",
    dueDate: "",
    completed: false,
  });
  const close = vi.fn();
  render(
    <Providers>
      <TaskDialog
        task={task}
        onClose={close}
        onSave={vi.fn().mockRejectedValue(new Error("storage"))}
      />
    </Providers>,
  );
  fireEvent.change(screen.getByLabelText(/Title/), {
    target: { value: "Revised" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not save");
  expect(screen.getByLabelText(/Title/)).toHaveValue("Revised");
  expect(close).not.toHaveBeenCalled();
});
