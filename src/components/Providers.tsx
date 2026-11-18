"use client";
// NAVIGATION MAP - press Ctrl+F and search SECTION followed by an ID below.
// PROVIDERS-01 Imports
// PROVIDERS-02 Colors fonts and shared control styles
// PROVIDERS-03 Apply the theme
// PROVIDERS-04 Screen layout and controls

// One shared theme keeps button shapes, colors and fonts consistent across the app.
// SECTION PROVIDERS-01 | Imports
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
// SECTION PROVIDERS-02 | Colors fonts and shared control styles
const theme = createTheme({
  palette: {
    primary: { main: "#557345" },
    background: { default: "#f7f8f4", paper: "#ffffff" },
    text: { primary: "#25332c", secondary: "#738078" },
  },
  typography: {
    fontFamily: "Arial, Helvetica, sans-serif",
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 9, padding: "9px 17px" } },
    },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 20 } } },
  },
});
// SECTION PROVIDERS-03 | Apply the theme
export default function Providers({ children }: { children: React.ReactNode }) {
  // SECTION PROVIDERS-04 | Screen layout and controls
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
