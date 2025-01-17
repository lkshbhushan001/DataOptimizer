import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4"; // Moon icon for dark mode
import Brightness7Icon from "@mui/icons-material/Brightness7"; // Sun icon for light mode

const ThemeToggle = ({ darkMode, toggleDarkMode }) => {
  return (
    <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
      <IconButton onClick={toggleDarkMode} color="inherit">
        {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;