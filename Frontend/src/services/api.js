import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000';


export const uploadFile = async (file, config) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('config', JSON.stringify(config)); 

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

export const uploadFilePrompt = async (formData) => {
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('config', JSON.stringify(config)); 

    try {
        const response = await axios.post(`${BASE_URL}/api/preprocess/process_with_prompt`, formData, {
            responseType: 'blob', 
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};

export const getColumns = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await axios.post(`${BASE_URL}/api/preprocess/get_columns`, formData, { 
            responseType: 'json', 
            headers: { 'Content-Type': 'multipart/form-data' }
         });
        return response.data;
    } catch (error) {
        console.error("Error fetching dataset recommendations:", error);
        throw error;
    }
};

export const getVisualizations = async (formData) => {    
    try {
        const response = await axios.post(`${BASE_URL}/api/dashboard`, formData, { 
            responseType: 'json', 
            headers: { 'Content-Type': 'multipart/form-data' }
         });
        return response.data;
    } catch (error) {
        console.error("Error fetching dataset recommendations:", error);
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
