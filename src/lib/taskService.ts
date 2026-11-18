// NAVIGATION MAP - press Ctrl+F and search SECTION followed by an ID below.
// TASKSERVICE-01 Imports
// TASKSERVICE-02 Prepare a valid task
// TASKSERVICE-03 Task operations
// TASKSERVICE-04 Read saved tasks
// TASKSERVICE-05 Save changes
// TASKSERVICE-06 Change completion
// TASKSERVICE-07 Delete a task
// TASKSERVICE-08 Save the import batch
// TASKSERVICE-09 Shared task service

// SECTION TASKSERVICE-01 | Imports
import { db, TaskDatabase } from "./db";
import { fingerprint, isStoredTask, validateTask } from "./validation";
import { Task, TaskInput } from "@/types/task";
// Turn form data into a complete task. This helper prepares data but does not save it.
// SECTION TASKSERVICE-02 | Prepare a valid task
export function createTask(input: TaskInput): Task {
  const errors = validateTask(input);
  if (errors.length) throw new Error(errors.join(" "));
  const now = new Date().toISOString();
  return {
    ...input,
    title: input.title.trim(),
    description: input.description.trim(),
    id: crypto.randomUUID(), // A unique label, so similar titles are not confused.
    createdAt: now,
    updatedAt: now,
    order: Date.now(),
  };
}
// Keep database operations together so screen components do not repeat them.
// Tests can pass a separate database without changing the user's real tasks.
// SECTION TASKSERVICE-03 | Task operations
export function taskService(database: TaskDatabase = db) {
  return {
    // SECTION TASKSERVICE-04 | Read saved tasks
    async list() {
      const rows = await database.tasks.toArray();
      // Leave damaged records untouched in storage and report how many were hidden.
      const tasks = rows.filter(isStoredTask);
      return { tasks, invalidCount: rows.length - tasks.length };
    },
    // SECTION TASKSERVICE-05 | Save changes
    async save(input: TaskInput, id?: string) {
      const task = createTask(input);
      if (!id) {
        await database.tasks.add(task);
        return task;
      }
      // A transaction keeps the read and write together as one safe operation.
      return database.transaction("rw", database.tasks, async () => {
        const old = await database.tasks.get(id);
        if (!old || !isStoredTask(old))
          throw new Error(
            "This task no longer exists or cannot be read. Refresh and try again.",
          );
        // Editing changes the content, but keeps the original task's identity.
        const updated = {
          ...task,
          id,
          createdAt: old.createdAt,
          order: old.order,
        };
        await database.tasks.put(updated);
        return updated;
      });
    },
    // SECTION TASKSERVICE-06 | Change completion
    async toggle(id: string) {
      // Read the latest value before switching it, including changes from another tab.
      await database.transaction("rw", database.tasks, async () => {
        const task = await database.tasks.get(id);
        if (!isStoredTask(task))
          throw new Error("Task not found. Refresh and try again.");
        await database.tasks.update(id, {
          completed: !task.completed,
          updatedAt: new Date().toISOString(),
        });
      });
    },
    // SECTION TASKSERVICE-07 | Delete a task
    async remove(id: string) {
      await database.tasks.delete(id);
    },
    // SECTION TASKSERVICE-08 | Save the import batch
    async import(inputs: TaskInput[]) {
      if (inputs.length > 5000)
        throw new Error("Import up to 5,000 tasks at a time.");
      // Validate every input before writing any of this batch to the database.
      const tasks = inputs.map(createTask);
      return database.transaction("rw", database.tasks, async () => {
        const existing = (await database.tasks.toArray()).filter(isStoredTask);
        // A Set remembers keys already encountered. Check again here because
        // another tab might have imported tasks after the preview was shown.
        const seen = new Set(existing.map(fingerprint));
        const fresh = tasks.filter((t) => {
          const key = fingerprint(t);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        // Save the batch in one transaction. A failure rolls back the whole batch.
        await database.tasks.bulkAdd(fresh);
        return { added: fresh.length, skipped: tasks.length - fresh.length };
      });
    },
  };
}
// SECTION TASKSERVICE-09 | Shared task service
export const tasksApi = taskService();
