import { createTheme } from "@mui/material/styles";

const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2", // Blue
    },
    background: {
      default: "#ffffff", // White
      paper: "#ffffff", // Light gray
    },
    text: {
      primary: "#000000", // Black
      secondary: "#000000", // Dark gray
    },
  },
});

export default lightTheme;