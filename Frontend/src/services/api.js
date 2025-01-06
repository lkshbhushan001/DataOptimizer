import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000';

export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {        
        const response = await axios.post(`${BASE_URL}/api/preprocess/`, formData, {
            responseType: 'blob',
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
