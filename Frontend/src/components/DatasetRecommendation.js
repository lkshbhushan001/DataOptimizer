import React, { useState } from "react";
import { recommendDatasets } from "../services/api";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  List,
  ListItem,
  ListItemText,
  Link,
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
      setDatasets(data.datasets);
      setLoading(false);
    } catch (error) {
      setError("Error fetching dataset recommendations.");
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f4f6f8" }}>
      <Container maxWidth="sm" sx={{ marginTop: 4 }}>
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
            <List>
              {datasets.map((dataset, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={
                      <Link href={dataset.link} target="_blank" rel="noopener noreferrer" variant="h6">
                        {dataset.name}
                      </Link>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default DatasetRecommendation;
