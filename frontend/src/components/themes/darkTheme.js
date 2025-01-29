import { createTheme } from "@mui/material/styles";

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
        secondary: "#ffffff", // Light gray
      },
    },
  });

export default darkTheme;