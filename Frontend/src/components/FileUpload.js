import React, { useState } from "react";
import { uploadFile } from "../services/api";
import { getColumns } from "../services/api";
import { uploadFilePrompt } from "../services/api";
import { getVisualizations } from "../services/api";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Input,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Checkbox,
  Typography,
  Grid,
  AppBar,
  Toolbar,
  Container,
  TextField,
} from "@mui/material";

const FileUpload = () => {
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [removeNA, setRemoveNA] = useState(true);
  const [columns, setColumns] = useState([]);
  const [target, setTarget] = useState("");
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [visualizations, setVisualizations] = useState([]);
  const [suggestions, setSuggestions] = useState("");
  const [config, setConfig] = useState({
    remove_columns: [],
    missing_values_num: { strategy: "none" },
    missing_values_cat: { strategy: "none" },
    remove_na: removeNA,
    remove_duplicates: false,
    normalize: { method: "none", columns: [] },
    remove_outliers: { method: "none", contamination: 0.1, columns: [] },
  });

  const [showColumns, setShowColumns] = useState(false);
  const [prompt, setPrompt] = useState(""); 

  const handleFileChange = async (event) => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);    

    try {
      const response = await getColumns(uploadedFile);      
      const result = response.columns;
      if (result) {
        setColumns(result);
      }
    } catch (error) {
      console.error("Error fetching columns:", error);
    }
  };

  const handleColumnSelection = (column) => {
    const updatedSelectedColumns = selectedColumns.includes(column)
      ? selectedColumns.filter((col) => col !== column)
      : [...selectedColumns, column];
    setSelectedColumns(updatedSelectedColumns);
    setConfig({ ...config, remove_columns: updatedSelectedColumns });
  };

  const handleRemoveNAChange = (value) => {
    const shouldRemoveNA = value === "remove";
    setRemoveNA(shouldRemoveNA);
    setConfig({
      ...config,
      remove_na: shouldRemoveNA,
      missing_values_num: shouldRemoveNA
        ? { strategy: "none" }
        : config.missing_values_num,
      missing_values_cat: shouldRemoveNA
        ? { strategy: "none" }
        : config.missing_values_cat,
    });
  };

  const handleConfigChange = (key, value) => {
    setConfig({ ...config, [key]: value });
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please upload a file!");
      return;
    }

    try {
      const response = await uploadFile(file, config);      
      const url = window.URL.createObjectURL(new Blob([response]));
      setDownloadUrl(url);
    } catch (error) {
      alert("Error processing file.");
    }
  };

  const handleUploadWithDashboard = async () => {
    if (!file || !target) {
      alert("Please upload a dataset and select a target variable!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("target", target);

    try {
      const response = await getVisualizations(formData);
      setVisualizations(response.visualizations || []);
      setSuggestions(response.suggestions || "No suggestions available.");
    } catch (error) {
      alert("Error generating dashboard.");
      console.error("Dashboard Error:", error);
    }
  };


  const handleUploadWithPrompt = async () => {
    if (!file || !prompt) {
      alert("Please upload a file and provide a prompt!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("prompt", prompt);

    try {
      const response = await uploadFilePrompt(formData);     
      const url = window.URL.createObjectURL(new Blob([response]));
      setDownloadUrl(url);
    } catch (error) {
      alert("Error processing file with prompt.");
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", "processed_data.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  return (
    <Box>
      {/* Header */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" color="inherit">
            Data Preprocessing App
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" style={{ marginTop: "20px" }}>
        {/* File Upload Card */}
        <Card elevation={4}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Upload Your File
            </Typography>
            <Input
              type="file"
              fullWidth
              onChange={handleFileChange}
              style={{ marginBottom: "20px" }}
            />
            {/* Target Variable Selection */}
            {columns.length > 0 && (
              <Card elevation={4} style={{ marginTop: "20px" }}>
                <CardContent>
                  <Typography variant="h6">Select Target Variable</Typography>
                  <FormControl fullWidth>
                    <FormLabel>Target Variable</FormLabel>
                    <Select
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                    >
                      {columns.map((col) => (
                        <MenuItem key={col} value={col}>
                          {col}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            )}
          </CardContent>
          </Card>

          {/* Upload and Generate Dashboard Button */}
          <Card elevation={4}>
            <CardContent>
            <Box textAlign="center" marginTop="20px">
              <Button
                variant="contained"
                color="primary"
                onClick={handleUploadWithDashboard}
              >
                Generate Dashboard
              </Button>
            </Box>

            {/* Visualizations Section */}
            {visualizations.length > 0 && (
              <Box>
              <Typography variant="h5" gutterBottom>
                Visualizations
              </Typography>
              {visualizations.map((viz, idx) => (
                <Box key={idx} marginBottom="20px">
                  <Typography>{viz.name}</Typography>
                  <img
                    src={`data:image/png;base64,${viz.image}`}
                    alt={`Visualization ${viz.name}`}
                    style={{ width: "100%", height: "auto" }}
                  />
                </Box>
              ))}
            </Box>
            )}

            {/* Suggestions Section */}
            {suggestions && (
              <Box marginTop="20px">
                <Typography variant="h5">Preprocessing Suggestions</Typography>
                <Card>
                  <CardContent>
                    <Typography>{suggestions}</Typography>
                  </CardContent>
                </Card>
              </Box>
            )}
      

            {/* Button to show/hide columns */}
            <Box textAlign="center" marginTop="10px">
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setShowColumns(!showColumns)}
              >
                {showColumns ? "Hide Columns" : "Remove Columns"}
              </Button>
            </Box>
            {showColumns && columns.length > 0 && (
              <Box marginTop="20px">
                <Typography variant="h6">Remove Columns:</Typography>
                <Grid container spacing={1} sx={{ justifyContent: "center" }}>
                  {columns.map((column) => (
                    <Grid item key={column} xs={6} sm={4} md={3}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedColumns.includes(column)}
                            onChange={() => handleColumnSelection(column)}
                          />
                        }
                        label={column}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Configuration Options */}
        <Card elevation={4} style={{ marginTop: "20px" }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Configuration Options
            </Typography>

            {/* Handle Missing Values */}
            <FormControl component="fieldset">
              <FormLabel component="legend">Handle Missing Values:</FormLabel>
              <RadioGroup
                value={removeNA ? "remove" : "fill"}
                onChange={(e) => handleRemoveNAChange(e.target.value)}
                row
              >
                <FormControlLabel
                  value="remove"
                  control={<Radio />}
                  label="Remove Missing Values"
                />
                <FormControlLabel
                  value="fill"
                  control={<Radio />}
                  label="Fill Missing Values"
                />
              </RadioGroup>
            </FormControl>
            <br/>
                {!removeNA && (
                <Box>
                    <FormControl fullWidth style={{ marginBottom: "20px" }}>
                    <FormLabel>Numerical:</FormLabel>
                    <Select
                        onChange={(e) =>
                        handleConfigChange("missing_values_num", {
                            strategy: e.target.value,
                        })
                        }
                    >
                        <MenuItem value="none">None</MenuItem>
                        <MenuItem value="mean">Mean</MenuItem>
                        <MenuItem value="median">Median</MenuItem>
                        <MenuItem value="mode">Mode</MenuItem>
                    </Select>
                    </FormControl>

                    <FormControl fullWidth>
                    <FormLabel>Categorical:</FormLabel>
                    <Select
                        onChange={(e) =>
                        handleConfigChange("missing_values_cat", {
                            strategy: e.target.value,
                        })
                        }
                    >
                        <MenuItem value="none">None</MenuItem>
                        <MenuItem value="mode">Mode</MenuItem>
                    </Select>
                    </FormControl>
                </Box>
                )}
                

            {/* Remove Duplicates */}
            <FormControlLabel
              control={
                <Checkbox
                  onChange={(e) =>
                    handleConfigChange("remove_duplicates", e.target.checked)
                  }
                />
              }
              label="Remove Duplicates"
            />

            {/* Other Options */}
            <FormControl fullWidth style={{ marginTop: "20px" }}>
              <FormLabel>Normalization:</FormLabel>
              <Select
                onChange={(e) =>
                  handleConfigChange("normalize", { method: e.target.value })
                }
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="minmax">Min-Max Scaling</MenuItem>
                <MenuItem value="zscore">Z-Score Standardization</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth style={{ marginTop: "20px" }}>
              <FormLabel>Remove Outliers:</FormLabel>
              <Select
                onChange={(e) =>
                  handleConfigChange("remove_outliers", {
                    method: e.target.value,
                  })
                }
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="iqr">IQR</MenuItem>
                <MenuItem value="isolation_forest">
                  Isolation Forest
                </MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* Upload Button */}
        <Box textAlign="center" marginTop="20px">
          <Button variant="contained" color="primary" onClick={handleUpload}>
            Upload and Process
          </Button>
        </Box>

        {/* RAG Prompt Input */}
        <Card elevation={4} style={{ marginTop: "20px" }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Preprocessing Instructions (RAG)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Enter your natural language instructions (e.g., 'Remove duplicates and normalize all columns.')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              variant="outlined"
            />
          </CardContent>
        </Card>

        {/* Buttons for Both Functionalities */}
        <Box textAlign="center" marginTop="20px">
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleUploadWithPrompt}            
          >
            Process with Prompt
          </Button>
        </Box>

        <Box textAlign="center" marginTop="20px">
          {downloadUrl && (
            <div>
              <h3>Processing Complete!</h3>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleDownload}
              >
                Download Processed File
              </Button>
            </div>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default FileUpload;
