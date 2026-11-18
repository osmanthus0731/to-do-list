# To Do List Application

A personal task planner built with Next.js App Router, TypeScript and Material UI. Tasks are saved in the browser using IndexedDB and Dexie. No account, API key or database server is needed.

Quick links: [Run the app](#run-locally) · [Main code files](#where-the-main-code-lives) · [Frontend and design](#where-the-frontend-and-design-are) · [Button functions](#where-each-button-function-is) · [Other files](#remaining-files-explained).

## Where the main code lives

### Jump between code sections

The main code files now start with a **NAVIGATION MAP**. The map lists numbered sections, and a matching comment appears beside each section of code.

1. Open the file you want to read.
2. Read its navigation map at the top.
3. Press **Ctrl+F** and search for `SECTION` followed by the section ID.
4. Read the nearby plain-English comments for an explanation.

For example, search for `SECTION TASKSERVICE-05` in `taskService.ts` to find where a task is saved. Search for the full phrase including `SECTION` to jump to the code rather than its entry in the map.

| What you want to find          | Open this file                                          | Search for               |
| ------------------------------ | ------------------------------------------------------- | ------------------------ |
| Main screen layout and buttons | [Dashboard.tsx](src/components/dashboard/Dashboard.tsx) | `SECTION DASHBOARD-10`   |
| Save button action             | [Dashboard.tsx](src/components/dashboard/Dashboard.tsx) | `SECTION DASHBOARD-07`   |
| Form fields and controls       | [TaskDialog.tsx](src/components/tasks/TaskDialog.tsx)   | `SECTION TASKDIALOG-06`  |
| Form validation and submission | [TaskDialog.tsx](src/components/tasks/TaskDialog.tsx)   | `SECTION TASKDIALOG-05`  |
| Saving a task in the database  | [taskService.ts](src/lib/taskService.ts)                | `SECTION TASKSERVICE-05` |
| Completing a task              | [taskService.ts](src/lib/taskService.ts)                | `SECTION TASKSERVICE-06` |
| Deleting a task                | [taskService.ts](src/lib/taskService.ts)                | `SECTION TASKSERVICE-07` |
| Importing a task batch         | [taskService.ts](src/lib/taskService.ts)                | `SECTION TASKSERVICE-08` |

Other files follow the same pattern, using their own filename in the section IDs. CSS uses `/* SECTION GLOBALS-... */` comments. These labels are navigation notes only; they do not add buttons or change the app's behavior.

Next.js App Router uses `src/app/page.tsx` instead of an `app.js` file.

| File                                          | What it does                                                                                    |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/app/page.tsx`                            | The home page. It displays Dashboard. Start reading here.                                       |
| `src/app/layout.tsx`                          | The shared HTML shell, page title and style providers.                                          |
| `src/components/dashboard/Dashboard.tsx`      | The main screen logic. Opens forms, changes views and connects user actions to task operations. |
| `src/components/tasks/TaskDialog.tsx`         | The add/edit form. Keeps what you type until you save or cancel.                                |
| `src/lib/taskService.ts`                      | The main task operations: create, edit, complete, delete and bulk import.                       |
| `src/lib/db.ts`                               | Sets up the browser database and task table.                                                    |
| `src/hooks/useTasks.ts`                       | Reads saved tasks and updates the screen when the database changes.                             |
| `src/lib/validation.ts`                       | Checks required fields, categories and real dates.                                              |
| `src/lib/taskQueries.ts`                      | Combines searching, filtering, sorting and pagination.                                          |
| `src/lib/importExport.ts`                     | Reads CSV/Excel files, validates preview rows and creates the Excel report.                     |
| `src/components/calendar/Calendar.tsx`        | Displays months and opens the selected date.                                                    |
| `src/components/calendar/DayDialog.tsx`       | Shows that date's plans and opens the add/edit form.                                            |
| `src/components/dashboard/NavigationMenu.tsx` | The top-right three-line navigation menu.                                                       |
| `src/types/task.ts`                           | Describes the fields and allowed values in a task.                                              |
| `src/app/globals.css`                         | Layout, colors and mobile styles.                                                               |

There is **no separate backend** or server API. `taskService.ts` contains business logic, but runs in the browser. Dexie writes to IndexedDB rather than sending task records to a remote server. Next.js serves the application. This meets the assignment's local-persistence requirement.

## How one save works

**Form input → validation → task service → IndexedDB → updated screen**

1. You type into TaskDialog. The form holds a temporary copy.
2. On save, the app checks the input and calls the task service.
3. The service creates an ID and timestamps, then saves through Dexie.
4. The task subscription notices the saved change and updates the screen.
5. The form closes after success. On failure, it keeps the input and shows an error.

Comments in the source explain the important steps in plain English. **State** is information React remembers between screen updates. **Props** are values passed from a parent component to a child. **async/await** lets the code wait for operations such as saving. A **transaction** groups database work so a failed import can roll back the batch.

## Run locally

Use a current Node.js 22 LTS or newer and npm. This project was verified on Node 25.4.0 and its production build also passed on Node 24.22.1.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. If that port is occupied, use `npm run dev -- --port 3001`.

For a production build:

```sh
npm run build
npm start -- --port 3001
```

The generated production build is in `.next/`. It is not the editable source code. Submit the source project and lockfile; the reviewer can install and rebuild it. Keep the same browser profile, hostname and port to access the same saved tasks. `localhost` and `127.0.0.1` use different storage origins.

## Deploy to Vercel

1. Push this project to GitHub, then open Vercel and choose **Add New > Project**.
2. Import the GitHub repository. Allow the Vercel GitHub integration to access it if the repository is private.
3. Use **Next.js** as the framework preset and the repository root (`./`) as the root directory.
4. Use **Node.js 24.x**, **npm ci** as the install command and **npm run build** as the build command. Keep the default Next.js output settings; do not select the public folder as the build output.
5. No environment variables, API keys or external database are required. Select **Deploy**, then open the generated URL.

Vercel runs the build; you do not upload `.next/` or `node_modules/`. The source files and package lockfile are enough. See [Vercel Git deployment](https://vercel.com/docs/git) and [supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

Tasks remain inside each visitor's browser. Tasks saved on localhost will not automatically appear at the new Vercel address because it has a different storage origin. Export and import a workbook to move them if needed. Deployments on a different preview hostname also have separate local storage. Nothing in this app sends your task database to GitHub or Vercel.

## Features

- Create, edit, delete with confirmation, and complete/reopen tasks.
- Work, Personal and Urgent categories; optional due dates and overdue counts.
- Combined title/description search, completion/category filters and due-date sorting.
- Pagination with 5/10/15/20 tasks per page, page numbers and Previous/Next controls.
- Persistent local storage, visible storage errors with retry and preserved corrupt records.
- CSV/XLSX import with preview, row errors and duplicate skipping.
- Formatted XLSX export of **all readable tasks**, independent of filters.
- Category-colored calendar with daily plan cards.

Open navigation from the top-right three-line button. Double-click a calendar day, tap its date number or activate that button with the keyboard to see its plans. **Add plan** prefills the date. Saving or cancelling returns to the day card. The card includes all plans for that date even when the calendar grid is filtered.

## Import and export

Start with `public/sample-tasks.csv`, also available from the Import dialog.

Required columns: `title`, `description`, `category`. Optional: `dueDate`, `status` or `completed`. Dates use YYYY-MM-DD, actual Excel date cells or a blank value. Categories ignore case. Status accepts Pending/Incomplete/Completed, true/false or 0/1; omitted means pending. Headers ignore case, spaces, underscores and hyphens.

Limits are 10 MB and 5,000 rows per file. XLSX reads the first worksheet only. Preview shows the first 100 rows and lists all invalid-row errors separately. Only valid, unique rows are saved after confirmation. Formula/error cells and legacy XLS files are unsupported.

Duplicates have the same trimmed, case-insensitive title and description, category and due date. Status is excluded. Import never overwrites existing tasks; checks repeat inside the transaction to handle another tab importing at the same time. A failed batch rolls back.

Excel export includes task content, category, due date, status, ID and timestamps, with a styled frozen header, filters and readable column widths. Text is written as text rather than spreadsheet formulas. An exported workbook can be reimported; existing duplicates are skipped.

## Checks and recorded results

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Verified on 18 November 2026: TypeScript and ESLint passed; **26 unit/component tests** passed; the production build passed; **6 production browser tests** passed. Tests cover task operations, persistence, validation, combined queries, import/export, day-card creation, menu behavior and mobile layouts.

Browser tests use installed Microsoft Edge and port 3001. Build first. To use Playwright Chromium, remove `channel: 'msedge'` from `playwright.config.ts` and run `npx playwright install chromium`. Tests use isolated browser contexts. For optional library coverage, run `npm test -- --coverage`.

## Known limits and dependency audit

Data belongs to the browser profile and origin. Clearing data or storage eviction can remove tasks, so export backups. There is no cloud sync, encryption, account system or offline service worker. Very large datasets and specially crafted compressed workbooks need further performance/security hardening. Full-form concurrent edits use the last successful write. Calendar is included; optional drag-and-drop is omitted.

The 18 November 2026 full audit reports **17 high-severity package entries from the same unpatched picomatch advisory in development tools**. `npm audit --omit=dev` reports **zero production dependency vulnerabilities**. Task text is not supplied to that file-pattern matcher by this app. GitHub lists no patched version; this is a disclosed development dependency limitation. Do not describe the full audit as clean or apply a forced downgrade without checking compatibility. See the [upstream advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf).

## Submission and demo

Submit `src/`, `public/`, `e2e/`, package files, configuration files and this README. Exclude `node_modules/`, `.next/`, coverage, test output and local delivery archives. No Word/PDF instruction documents or rendering scripts are required.

Demo: import the sample → create/edit/complete a task → refresh → combine filters and pages → add a plan through a calendar day card → export/reimport → confirm deletion. Follow any separate employer instructions for uploading, naming and deadlines. The supplied PDF does not require hosting.

## Where the frontend and design are

**Frontend** means the screens and controls the user sees. Most of it is in `src/components/`. The home page starts in `src/app/page.tsx`, and `Dashboard.tsx` brings the smaller components together.

**Design** means how those screens look: layout, spacing, colors, fonts and mobile sizing.

| Change you want to make                     | File and place to look                                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Overall layout, header and spacing          | `src/app/globals.css`: `.app-shell`, `.main-shell`, `.topbar`, `.page-heading`.                                                |
| Summary cards and progress area             | `globals.css`: `.overview`, `.stat`, `.focus-banner`; markup in `Overview.tsx` and `Dashboard.tsx`.                            |
| Task list appearance                        | `globals.css`: `.task-panel`, `.task-row`, `.task-copy`, `.task-meta`; markup in `TaskList.tsx`.                               |
| Calendar and daily plans                    | `globals.css`: `.calendar-grid`, `.calendar-day`, `.calendar-task`, `.day-plan`; markup in `Calendar.tsx` and `DayDialog.tsx`. |
| Right-hand menu                             | `globals.css`: `.navigation-menu`, `.nav-item`, `.collections`; markup in `NavigationMenu.tsx`.                                |
| Main button color, font or rounded corners  | `src/components/Providers.tsx`: `createTheme()`, especially `palette`, `typography` and `components`.                          |
| Phone layout                                | `globals.css`: `@media` rules change styles at smaller screen widths.                                                          |
| A style specific to one Material UI control | Its `.tsx` file may use an `sx` property for that individual control.                                                          |

For example, change the primary button color in Providers. To change what **New task does**, look at its `onClick` in Dashboard. Appearance and behavior are related, but are not the same thing.

## Where each button function is

A button's **onClick** says what to do when clicked. An input's **onChange** reacts when its value changes. A **callback** is a function passed from a parent component to a child, so the child can ask the parent to do something.

| Button or action                             | Where it starts                   | Function or action to follow                                                                                             |
| -------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| New task                                     | `Dashboard.tsx`                   | Its `onClick` clears `createDueDate` and calls `setDialog(null)` to open an empty form.                                  |
| Create task or Save changes                  | `TaskDialog.tsx`                  | `submit()` validates input, calls `onSave`, then reaches Dashboard's `save()` and `tasksApi.save()` in `taskService.ts`. |
| Edit pencil                                  | `TaskList.tsx`                    | `onEdit(task)` reaches Dashboard's `setDialog(task)`, opening the prefilled form.                                        |
| Completion checkbox                          | `TaskList.tsx`                    | `onToggle(task)` reaches Dashboard's `act()`, which waits for `tasksApi.toggle(task.id)`.                                |
| Delete bin                                   | `TaskList.tsx`                    | `onDelete(task)` reaches `setDeleting(task)` in Dashboard, opening confirmation.                                         |
| Delete task confirmation                     | `Dashboard.tsx`                   | Calls `tasksApi.remove()`, adjusts pagination and closes confirmation.                                                   |
| Keep task                                    | `Dashboard.tsx`                   | `setDeleting(null)` closes confirmation without deleting.                                                                |
| Three-line menu                              | `Dashboard.tsx`                   | `setMenuOpen(true)` opens NavigationMenu; its `onClose` callback sets the value back to false.                           |
| My tasks or Calendar in the menu             | `NavigationMenu.tsx`              | `navigate()` calls `setView()` and closes the menu.                                                                      |
| Category in the menu                         | `NavigationMenu.tsx`              | `category()` calls `onCategory`, which reaches Dashboard's `filter()`.                                                   |
| Search, status, category and sorting         | `TaskToolbar.tsx`                 | Call Dashboard's `filter()`. `queryTasks()` in `taskQueries.ts` calculates the results.                                  |
| Reset                                        | `TaskToolbar.tsx`                 | `onReset` reaches `setFilters(initial)` in Dashboard.                                                                    |
| List or Calendar view switch                 | `TaskToolbar.tsx`                 | Calls `setView()` in Dashboard.                                                                                          |
| Previous, Next and page numbers              | `Dashboard.tsx`                   | Update `page` through `setFilters()`; `queryTasks()` selects that page.                                                  |
| Per page selector                            | `Dashboard.tsx`                   | Calls `filter('pageSize', ...)`, which also returns to page one.                                                         |
| Summary cards                                | `Overview.tsx`                    | `onFilter` reaches Dashboard and changes the status/overdue filter.                                                      |
| Import                                       | `TaskToolbar.tsx`                 | `onImport` reaches `setImporting(true)` in Dashboard.                                                                    |
| Choose CSV or Excel                          | `ImportDialog.tsx`                | `select()` calls `readImport()` in `importExport.ts` and displays the preview. Nothing is saved yet.                     |
| Import tasks confirmation                    | `ImportDialog.tsx`                | Its `save()` calls Dashboard's `importTasks()`, then `tasksApi.import()` saves the batch.                                |
| Export all                                   | `TaskToolbar.tsx`                 | Calls Dashboard's `exportTasks()`, then `downloadWorkbook()` and `buildWorkbook()` in `importExport.ts`.                 |
| Calendar month arrows                        | `Calendar.tsx`                    | `move(-1)` or `move(1)` changes the month.                                                                               |
| Today                                        | `Calendar.tsx`                    | `setMonth()` returns to the current month.                                                                               |
| Double-click a day or select its date number | `Calendar.tsx`                    | `setSelectedDate()` opens DayDialog.                                                                                     |
| Add plan                                     | `DayDialog.tsx`                   | `onCreate(date)` reaches Dashboard, which sets `createDueDate` and opens TaskDialog.                                     |
| Select an existing calendar plan             | `Calendar.tsx` or `DayDialog.tsx` | `onEdit(task)` opens the same editing form.                                                                              |
| Retry storage                                | `Dashboard.tsx`                   | Calls `retry()` from `useTasks.ts`, restarting the connection and task subscription.                                     |

There is not a separate named function for every button. A simple action may be written directly inside `onClick`. Saving and other important operations call a named function and then the task service. Only the service writes task records; the buttons themselves do not contain database commands.

## Remaining files explained

The full paths for these screen files are under `src/components/`:

| File                     | What it does                                                             |
| ------------------------ | ------------------------------------------------------------------------ |
| `Providers.tsx`          | Shared Material UI colors, fonts, buttons and dialog styles.             |
| `dashboard/Overview.tsx` | Draws the four summary cards.                                            |
| `tasks/TaskList.tsx`     | Draws task rows, checkboxes, labels, pencil icons and bin icons.         |
| `tasks/TaskToolbar.tsx`  | Draws the search/filter controls, view switch and Import/Export buttons. |
| `tasks/ImportDialog.tsx` | File selection, preview errors and import confirmation.                  |

The other source and project files are:

| File                            | What it does                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `src/tests/core.test.ts`        | Tests task validation, database operations, queries and file handling.           |
| `src/tests/TaskDialog.test.tsx` | Tests the task form and failed saving.                                           |
| `src/tests/setup.ts`            | Prepares the browser-like unit test environment and fake IndexedDB.              |
| `e2e/app.spec.ts`               | Tests complete workflows in a real browser.                                      |
| `package.json`                  | Lists libraries and commands such as `npm run dev`.                              |
| `package-lock.json`             | Records exact dependency versions so another computer can reproduce the install. |
| `next.config.ts`                | Next.js build settings.                                                          |
| `tsconfig.json`                 | TypeScript settings and the `@/` shortcut for `src/`.                            |
| `eslint.config.mjs`             | Code-quality rules and folders to skip.                                          |
| `vitest.config.ts`              | Unit/component test settings.                                                    |
| `playwright.config.ts`          | Browser test settings and the test server address.                               |
| `next-env.d.ts`                 | Types generated by Next.js; normally do not edit it yourself.                    |
| `public/sample-tasks.csv`       | Sample import data.                                                              |
| `public/favicon.svg`            | The browser tab icon.                                                            |
| `.gitignore`                    | Lists files and folders to leave out of source control.                          |
| `.next/`                        | Generated build output, not the application's editable source.                   |
| `node_modules/`                 | Installed third-party libraries.                                                 |
