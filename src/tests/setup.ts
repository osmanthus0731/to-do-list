// Set up browser-like testing helpers. fake-indexeddb keeps test records separate from the
// real browser database.
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
afterEach(cleanup);
