// NAVIGATION MAP - press Ctrl+F and search SECTION followed by an ID below.
// LAYOUT-01 Imports
// LAYOUT-02 Browser title and icon
// LAYOUT-03 Shared page structure
// LAYOUT-04 Screen layout and controls

// Next.js wraps every page in this layout. It supplies the HTML shell, browser tab
// information and shared styles.
// SECTION LAYOUT-01 | Imports
import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import Providers from "@/components/Providers";
import "./globals.css";
// SECTION LAYOUT-02 | Browser title and icon
export const metadata: Metadata = {
  icons: { icon: "/favicon.svg" },
  title: "Tasks - Your personal planner",
  description:
    "A thoughtful, local-first task workspace. Plan your day, find your focus, and make room for what matters.",
};
// SECTION LAYOUT-03 | Shared page structure
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SECTION LAYOUT-04 | Screen layout and controls
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
