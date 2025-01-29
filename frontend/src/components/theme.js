import { createTheme, ThemeProvider } from "@mui/material/styles";

// Light theme
const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2", // Blue
    },
    background: {
      default: "#ffffff", // White
      paper: "#f5f5f5", // Light gray
    },
    text: {
      primary: "#000000", // Black
      secondary: "#333333", // Dark gray
    },
  },
});

// Dark theme
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9", // Light blue
    },
    background: {
      default: "#121212", // Dark gray
      paper: "#1e1e1e", // Slightly lighter dark gray
    },
    text: {
      primary: "#ffffff", // White
      secondary: "#bbbbbb", // Light gray
    },
  },
});