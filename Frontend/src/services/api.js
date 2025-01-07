import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000';

// Updated uploadFile function to include configuration
export const uploadFile = async (file, config) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('config', JSON.stringify(config)); // Attach user-provided config as a string

    try {
        const response = await axios.post(`${BASE_URL}/api/preprocess/`, formData, {
            responseType: 'blob', // Expect a binary response (Excel file)
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};

export const recommendDatasets = async (query) => {
    try {
        const response = await axios.post(`${BASE_URL}/api/datasets/`, { query });
        return response.data;
    } catch (error) {
        console.error("Error fetching dataset recommendations:", error);
        throw error;
    }
};
