// NAVIGATION MAP - press Ctrl+F and search SECTION followed by an ID below.
// DB-01 Imports
// DB-02 Database table and indexes
// DB-03 Shared database connection

// SECTION DB-01 | Imports
import Dexie, { type Table } from "dexie";
import type { Task } from "@/types/task";
// IndexedDB is a database inside the browser. Dexie gives us simpler commands
// for using it. This file sets up storage; it does not draw anything on screen.
// SECTION DB-02 | Database table and indexes
export class TaskDatabase extends Dexie {
  // The ! tells TypeScript that Dexie will supply this table; string is the ID type.
  tasks!: Table<Task, string>;
  constructor(name = "daylight-tasks") {
    super(name);
    // Version 1 is our first database layout. "id" is the unique record key.
    // The other names create indexes, which can help look up records later.
    this.version(1).stores({ tasks: "id, category, dueDate, order" });
    // Keep old tasks when upgrading. Give them an empty start date instead of deleting them.
    this.version(2)
      .stores({ tasks: "id, category, startDate, dueDate, order" })
      .upgrade(async (transaction) => {
        await transaction
          .table<Task, string>("tasks")
          .toCollection()
          .modify((task) => {
            if (task.startDate === undefined) task.startDate = "";
          });
      });
  }
}
// Share one connection object instead of creating a database in every component.
// SECTION DB-03 | Shared database connection
export const db = new TaskDatabase();
