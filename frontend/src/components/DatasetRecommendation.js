import React, { useState } from "react";
import { recommendDatasets } from "../services/api";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  CircularProgress,
  Alert,
} from "@mui/material";

const DatasetRecommendation = () => {
  const [query, setQuery] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRecommend = async () => {
    if (!query) {
      setError("Please enter a query!");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await recommendDatasets(query);      
      setDatasets(data.datasets  || "No suggestions available.");      
      setLoading(false);
    } catch (error) {
      setError("Error fetching dataset recommendations.");
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f4f6f8" }}>
      <Container maxWidth={false} sx={{ marginTop: 4 }}>
        <Typography variant="h4" align="center" sx={{ marginBottom: 3 }}>
          Dataset Recommendation
        </Typography>

        {/* Query Input */}
        <TextField
          label="Enter a Topic"
          variant="outlined"
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ marginBottom: 2 }}
        />

        {/* Recommendation Button */}
        <Box textAlign="center" sx={{ marginBottom: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleRecommend}
            sx={{ fontWeight: "bold", padding: "10px 20px" }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Get Recommendations"}
          </Button>
        </Box>

        {/* Error Handling */}
        {error && <Alert severity="error" sx={{ marginBottom: 2 }}>{error}</Alert>}

        {/* Dataset Recommendations */}
        {datasets.length > 0 && (
          <Box sx={{ backgroundColor: "#fff", padding: 2, borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h6" sx={{ marginBottom: 1 }}>
              Recommended Datasets:
            </Typography>
            
              {/* Parse and format the datasets string */}
              {datasets.split("\n\n").map((section, sectionIndex) => {
                // Split each section into lines
                const lines = section.split("\n");

                return (
                  <Box key={sectionIndex} sx={{ marginBottom: sectionIndex > 0 ? '16px' : '0' }}>
                    {lines.map((line, lineIndex) => {
                      // Handle bold text (content between **)
                      const boldRegex = /\*\*(.*?)\*\*/g;
                      const linkRegex = /\[(.*?)\]\((.*?)\)/g;

                      // Check if the line contains a link
                      if (linkRegex.test(line)) {
                        return (
                          <Typography key={lineIndex} paragraph sx={{ marginBottom: '8px' }}>
                            {line.split(linkRegex).map((part, partIndex) => {
                              if (partIndex % 3 === 1) {
                                // Link text
                                return (
                                  <a
                                    key={partIndex}
                                    href={line.match(linkRegex)[0].match(/\((.*?)\)/)[1]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#1976d2', textDecoration: 'underline' }}
                                  >
                                    {part}
                                  </a>
                                );
                              } else if (partIndex % 3 === 2) {
                                // Link URL (skip rendering)
                                return null;                                
                              } 
                              
                              else {
                                // Regular text with bold formatting
                                return (
                                  <span key={partIndex}>
                                    {part.split(boldRegex).map((text, boldIndex) =>
                                      boldIndex % 2 === 1 ? (
                                        <strong key={boldIndex}>{text}</strong>
                                      ) : (
                                        text
                                      )
                                    )}
                                  </span>
                                );
                              }
                            })}
                          </Typography>
                        );
                      }

                      // Handle bold text only
                      return (
                        <Typography key={lineIndex} paragraph sx={{ marginBottom: '8px' }}>
                          {line.split(boldRegex).map((text, boldIndex) =>
                            boldIndex % 2 === 1 ? (
                              <strong key={boldIndex}>{text}</strong>
                            ) : (
                              text
                            )
                          )}
                        </Typography>
                      );
                    })}
                  </Box>
                );
              })}
                  
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default DatasetRecommendation;
