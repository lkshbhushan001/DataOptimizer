import React, { useState } from 'react';
import { uploadFile } from '../services/api';

const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [processedData, setProcessedData] = useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please upload a file!");
            return;
        }

        try {
            const data = await uploadFile(file);
            setProcessedData(data.cleaned_data);
        } catch (error) {
            alert("Error processing file.");
        }
    };

    return (
        <div>
            <h2>Upload and Process File</h2>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload</button>

            {processedData && (
                <div>
                    <h3>Processed Data:</h3>
                    <pre>{JSON.stringify(JSON.parse(processedData), null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
