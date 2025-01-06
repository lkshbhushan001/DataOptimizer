import React, { useState } from 'react';
import { uploadFile } from '../services/api';

const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [downloadUrl, setDownloadUrl] = useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please upload a file!");
            return;
        }

        try {            
            const response = await uploadFile(file);
            debugger;            
            const url = window.URL.createObjectURL(new Blob([response]));
            setDownloadUrl(url);
        } catch (error) {
            alert("Error processing file.");
        }
    };

    const handleDownload = () => {
        if (downloadUrl) {
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', 'processed_data.xlsx'); // Default file name
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
    };

    return (
        <div>
            <h2>Upload and Process File</h2>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload and Process</button>

            {downloadUrl && (
                <div>
                    <h3>Processing Complete!</h3>
                    <button onClick={handleDownload}>Download Processed File</button>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
