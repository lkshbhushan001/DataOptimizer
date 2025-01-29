import React, { useState, useEffect } from "react";
import { uploadFile } from "../services/api";
import { getColumns } from "../services/api";
import { uploadFilePrompt } from "../services/api";
import { getVisualizations } from "../services/api";
import { ThemeProvider, CssBaseline } from "@mui/material";
import ThemeToggle from "./ThemeToggle";
import lightTheme from "./themes/lightTheme";
import darkTheme from "./themes/darkTheme";
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
  CircularProgress,
  Modal,
} from "@mui/material";
import {
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
} from "@mui/icons-material";

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
  const itemsPerPage = 6;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); 
  const [darkMode, setDarkMode] = useState(false);
  const handleFileChange = async (event) => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);    
    setColumns([]); 
    setTarget(""); 
    setSelectedColumns([]); 
    setVisualizations([]); 
    setSuggestions(""); 
    setDownloadUrl(null); 
    setShowColumns(false); 
    setPrompt(""); 
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

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

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
    setLoading(true);
    try {
      const response = await uploadFile(file, config);      
      const url = window.URL.createObjectURL(new Blob([response]));
      setDownloadUrl(url);
      setLoading(false);
    } catch (error) {
      alert("Error processing file.");
      setLoading(false);
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
    setLoading(true);
    try {
      const response = await getVisualizations(formData);
      setVisualizations(response.visualizations || []);
      //debugger;
      setSuggestions(response.suggestions || "No suggestions available.");
      setLoading(false);
    } catch (error) {
      alert("Error generating dashboard.");
      console.error("Dashboard Error:", error);
      setLoading(false);
    }
  };


  const handleUploadWithPrompt = async () => {
    if (!file || !prompt) {
      alert("Please upload a file and provide a prompt!");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("prompt", prompt);

    try {
      const response = await uploadFilePrompt(formData);     
      const url = window.URL.createObjectURL(new Blob([response]));      
      setDownloadUrl(url);
      setLoading(false);
    } catch (error) {
      alert("Error processing file with prompt.");
      setLoading(false);
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

  const totalPages = Math.ceil(visualizations.length / itemsPerPage);
  const paginatedVisualizations = visualizations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />   
        
        
    <Box>
      {/* Header */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" color="inherit">
            Data Preprocessing App
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} style={{ marginTop: "20px" }}>
        {/* File Upload Card */}
        <Card elevation={4}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Upload Your File
            </Typography>
            <Input
              type="file"              
              onChange={handleFileChange}
              style={{ marginBottom: "20px", alignItems: "center" }}
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
          

          {/* Upload and Generate Dashboard Button */}
          
            <Box textAlign="center" marginTop="20px">
              <Button
                variant="contained"
                color="primary"
                onClick={handleUploadWithDashboard}
              >
                {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Generate Dashboard"}
                
              </Button>
            </Box>

            {/* Visualizations Section */}
            {visualizations.length > 0 && (
              <Box>
                <Typography variant="h5" gutterBottom>
                  Visualizations
                </Typography>
                <Grid container spacing={2}>
                  {paginatedVisualizations.map((viz, idx) => (
                    <Grid item key={idx} xs={12} sm={6} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6">{viz.name}</Typography>
                          <Box
                            onClick={() => handleImageClick(viz.image)}
                            sx={{ cursor: "pointer" }}
                          >
                            <img
                              src={`data:image/png;base64,${viz.image}`}
                              alt={`Visualization ${viz.name}`}
                              style={{ width: "100%", height: "auto" }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Pagination Controls */}
                <Box textAlign="center" marginTop="20px">
                  {/* First Page Button */}
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    sx={{ margin: "0 4px" }}
                    className="pagination-button"
                  >
                    <FirstPage />
                  </Button>

                  {/* Previous Page Button */}
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    sx={{ margin: "0 4px" }}
                    className="pagination-button"
                  >
                    <NavigateBefore />
                  </Button>

                  {/* Page Numbers */}
                  {pageNumbers.map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "contained" : "outlined"}
                      color="primary"
                      onClick={() => setCurrentPage(page)}
                      sx={{ margin: "0 4px" }}
                      className="pagination-button"
                    >
                      {page}
                    </Button>
                  ))}

                  {/* Next Page Button */}
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    sx={{ margin: "0 4px" }}
                    className="pagination-button"
                  >
                    <NavigateNext />
                  </Button>

                  {/* Last Page Button */}
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    sx={{ margin: "0 4px" }}
                    className="pagination-button"
                  >
                    <LastPage />
                  </Button>
                </Box>

                {/* Page Indicator */}
                <Box textAlign="center" marginTop="10px">
                  <Typography variant="body1">
                    Page {currentPage} of {totalPages}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Modal for Expanded Image */}
            <Modal
              open={isModalOpen}
              onClose={handleCloseModal}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(5px)",
              }}
            >
              <Box
                sx={{
                  maxWidth: "90%",
                  maxHeight: "90%",
                  overflow: "auto",
                  bgcolor: "background.paper",
                  boxShadow: 24,
                  p: 2,
                }}
              >
                {selectedImage && (
                  <img
                    src={`data:image/png;base64,${selectedImage}`}
                    alt="Expanded Visualization"
                    style={{ width: "100%", height: "auto" }}
                  />
                )}
              </Box>
            </Modal>

            {/* Suggestions Section */}
            {suggestions && (
              <Box marginTop="20px">
                <Typography variant="h5" gutterBottom>
                  Preprocessing Suggestions
                </Typography>
                <Card>
                  <CardContent>
                    {/* Parse and format the suggestions string */}
                    {suggestions.split("\n").map((line, index) => {                      
                      if (line.match(/^\d+\./) || line.startsWith("**")) {
                        return (
                          <Typography key={index} gutterBottom sx={{ marginTop: index > 0 ? '16px' : '0' }}>
                            {line.replace(/\*\*/g, "").trim()} {/* Remove markdown-like bold syntax */}
                          </Typography>
                        );
                      }
                      
                      else if (line.startsWith("-") || line.startsWith("*")) {
                        return (
                          <Typography key={index} component="div" sx={{ marginLeft: '16px', marginBottom: '8px' }}>
                            <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                              <li>{line.replace(/^[-*]\s*/, "").trim()}</li>
                            </ul>
                          </Typography>
                        );
                      }
                      
                      else {
                        return (
                          <Typography key={index} paragraph sx={{ marginBottom: '8px' }}>
                            {line.trim()}
                          </Typography>
                        );
                      }
                    })}
                  </CardContent>
                </Card>
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

            {/* Button to show/hide columns */}
            <Box textAlign="left" marginTop="10px">
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setShowColumns(!showColumns)}
                className="remove-columns-button"
              >
                {showColumns ? "Hide Columns" : "Remove Columns"}
              </Button>
            </Box>
            {showColumns && columns.length > 0 && (
              <Box marginTop="20px">
                <Typography variant="h6">Remove Columns:</Typography>
                <Grid container spacing={1} sx={{ justifyContent: "left" }}>
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
            <br/>
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
                        value="none"
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
                        value="none"
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
                value="none"
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
                value="none"
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
            {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Upload and Process"}
            
          </Button>
        </Box>
        
        {/*OR */}
        <Box textAlign="center" marginTop="20px" marginBottom="20px">
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "#666" }}>
            OR
          </Typography>
        </Box>        

        {/* RAG Prompt Input */}
        <Card elevation={4} style={{ marginTop: "20px" }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Enter Preprocessing Instructions
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Enter your preprocessing instructions (e.g., 'Remove duplicates and normalize all columns.')"
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
            {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Process with Prompt"}
            
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
    </ThemeProvider>
  );
};

export default FileUpload;
