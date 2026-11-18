"use client";
// NAVIGATION MAP - press Ctrl+F and search SECTION followed by an ID below.
// USETASKS-01 Imports
// USETASKS-02 Saved task state
// USETASKS-03 Screen state
// USETASKS-04 Start the database connection
// USETASKS-05 Show a storage error
// USETASKS-06 Open storage and listen for changes
// USETASKS-07 Stop listening when the screen closes
// USETASKS-08 Retry the connection

// SECTION USETASKS-01 | Imports
import { useCallback, useEffect, useState } from "react";
import { liveQuery } from "dexie";
import { tasksApi } from "@/lib/taskService";
import { db } from "@/lib/db";
import type { Task } from "@/types/task";
// A custom hook shares React logic. This one connects the screens to saved tasks.
// useState holds values; changing them asks React to update what the user sees.
// SECTION USETASKS-02 | Saved task state
export function useTasks() {
  // SECTION USETASKS-03 | Screen state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invalidCount, setInvalidCount] = useState(0);
  const [revision, setRevision] = useState(0);
  // useEffect starts the connection after the screen mounts. Changing revision
  // runs this effect again, which is how the Retry button reconnects.
  // SECTION USETASKS-04 | Start the database connection
  useEffect(() => {
    let active = true;
    let sub: { unsubscribe: () => void } | undefined;
    // SECTION USETASKS-05 | Show a storage error
    const fail = () => {
      if (!active) return;
      setError(
        "Local storage could not be read. Your data has not been cleared. Check browser storage permissions, then retry.",
      );
      setLoading(false);
    };
    // SECTION USETASKS-06 | Open storage and listen for changes
    async function connect() {
      try {
        // Open explicitly so blocked browser storage becomes a visible error.
        await db.open();
        if (!active) return;
        // liveQuery reads again when tasks change, even in another browser tab.
        sub = liveQuery(() => tasksApi.list()).subscribe({
          next: (result) => {
            if (!active) return;
            setTasks(result.tasks);
            setInvalidCount(result.invalidCount);
            setError("");
            setLoading(false);
          },
          error: fail,
        });
      } catch {
        fail();
      }
    }
    // Start the read. connect handles its own errors, so no unhandled promise is left.
    void connect();
    // Stop listening when this screen leaves. The active flag also prevents
    // an unfinished read from updating a screen that has already gone away.
    // SECTION USETASKS-07 | Stop listening when the screen closes
    return () => {
      active = false;
      sub?.unsubscribe();
    };
  }, [revision]);
  // SECTION USETASKS-08 | Retry the connection
  const retry = useCallback(() => {
    setLoading(true);
    setRevision((v) => v + 1);
  }, []);
  return { tasks, loading, error, invalidCount, retry };
}
