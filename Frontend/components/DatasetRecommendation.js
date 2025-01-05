import React, { useState } from 'react';
import { recommendDatasets } from '../services/api';

const DatasetRecommendation = () => {
    const [query, setQuery] = useState('');
    const [datasets, setDatasets] = useState([]);

    const handleRecommend = async () => {
        if (!query) {
            alert("Please enter a query!");
            return;
        }

        try {
            const data = await recommendDatasets(query);
            setDatasets(data.datasets);
        } catch (error) {
            alert("Error fetching dataset recommendations.");
        }
    };

    return (
        <div>
            <h2>Dataset Recommendation</h2>
            <input
                type="text"
                placeholder="Enter a topic (e.g., sales, energy)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={handleRecommend}>Get Recommendations</button>

            {datasets.length > 0 && (
                <div>
                    <h3>Recommended Datasets:</h3>
                    <ul>
                        {datasets.map((dataset, index) => (
                            <li key={index}>
                                <a href={dataset.link} target="_blank" rel="noopener noreferrer">
                                    {dataset.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default DatasetRecommendation;
