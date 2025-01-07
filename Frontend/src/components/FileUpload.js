import React, { useState } from 'react';
import { uploadFile } from '../services/api';

const FileUpload = () => {    
    const [file, setFile] = useState(null);
    const [removeNA, setRemoveNA] = useState(true);  
    const [columns, setColumns] = useState([]); 
    const [selectedColumns, setSelectedColumns] = useState([]); 
    const [config, setConfig] = useState({
        remove_columns: [],
        missing_values_num: { strategy: "none" },
        missing_values_cat: { strategy: "none" },
        remove_na: removeNA,
        remove_duplicates: false,
        normalize: { method: "none", columns: [] },
        remove_outliers: { method: "none", contamination: 0.1, columns: [] }
    });

    const handleFileChange = async (event) => {
        const uploadedFile = event.target.files[0];
        setFile(uploadedFile);
    
    
    // const handleRemoveNAChange = (value) => {
    //     setRemoveNA(value === "remove");
    //     if (value === "remove") {
    //         setConfig({ ...config, missing_values: value}); // Reset missing_values in config
    //     } else {
    //         setConfig({ ...config, missing_values_num: { strategy: "none"  }, missing_values_cat: { strategy: "none"  }});
    //     }
    // };    

    
        const formData = new FormData();
        formData.append('file', uploadedFile);

        try {
            const response = await fetch('http://127.0.0.1:5000/api/preprocess/get_columns', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (result.columns) {
                setColumns(result.columns);
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
            missing_values_num: shouldRemoveNA ? { strategy: "none" } : config.missing_values_num,
            missing_values_cat: shouldRemoveNA ? { strategy: "none" } : config.missing_values_cat
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
            const blob = new Blob([response]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'processed_data.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("Error processing file.");
        }
    };

    return (        

        <div>
            <h2>Upload and Configure Preprocessing</h2>
            <input type="file" onChange={handleFileChange} />            

            {columns.length > 0 && (
                <div>
                    <h3>Remove Columns:</h3>
                    {columns.map((column) => (
                        <label key={column}>
                            <input
                                type="checkbox"
                                checked={selectedColumns.includes(column)}
                                onChange={() => handleColumnSelection(column)}
                            />
                            {column}
                        </label>
                    ))}
                </div>
            )}
            <br />

            <h3>Preprocessing Options:</h3>

            <h3>Handle Missing Values:</h3>
            <div>
                <label>
                    <input
                        type="radio"
                        name="missingValues"
                        value="remove"
                        checked={removeNA}
                        onChange={(e) => handleRemoveNAChange(e.target.value)}
                    />
                    Remove Missing Values
                </label>
                <label>
                    <input
                        type="radio"
                        name="missingValues"
                        value="fill"
                        checked={!removeNA}
                        onChange={(e) => handleRemoveNAChange(e.target.value)}
                    />
                    Fill Missing Values
                </label>
            </div>

            {!removeNA && (
                <div>
                    <label>
                        Handle Missing Values(Numerical):
                        <select onChange={(e) => handleConfigChange("missing_values_num", { strategy: e.target.value })}>
                            <option value="none">None</option>                            
                            <option value="mean">Mean</option>
                            <option value="median">Median</option>
                            <option value="mode">Mode</option>
                        </select>
                    </label>
                    <br />
                    <label>
                        Handle Missing Values(Categorical):
                        <select onChange={(e) => handleConfigChange("missing_values_cat", { strategy: e.target.value })}>
                            <option value="none">None</option>                                              
                            <option value="mode">Mode</option>
                        </select>
                    </label>
            </div>
            )}
            <br />
            <label>
                Remove Duplicates:
                <input
                    type="checkbox"
                    onChange={(e) => handleConfigChange("remove_duplicates", e.target.checked)}
                />
            </label>
            <br />

            <label>
                Normalization:
                <select onChange={(e) => handleConfigChange("normalize", { method: e.target.value })}>
                    <option value="none">None</option>
                    <option value="minmax">Min-Max Scaling</option>
                    <option value="zscore">Z-Score Standardization</option>
                </select>
            </label>
            <br />

            <label>
                Remove Outliers:
                <select onChange={(e) => handleConfigChange("remove_outliers", { method: e.target.value })}>
                    <option value="none">None</option>
                    <option value="iqr">IQR</option>
                    <option value="isolation_forest">Isolation Forest</option>
                </select>
            </label>
            <br />

            <button onClick={handleUpload}>Upload and Process</button>
        </div>
    );
};

export default FileUpload;
