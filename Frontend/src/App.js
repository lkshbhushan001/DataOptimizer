import React from 'react';
import FileUpload from './components/FileUpload';
import DatasetRecommendation from './components/DatasetRecommendation';

function App() {
    return (
        <div className="App">
            <h1>Data Cleaner Tool</h1>
            <FileUpload />
            <hr />
            <DatasetRecommendation />
        </div>
    );
}

export default App;
