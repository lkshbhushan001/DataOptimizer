import React from 'react';
import FileUpload from './components/FileUpload';
import DatasetRecommendation from './components/DatasetRecommendation';

function App() {
    return (
        <div className="App">            
            <FileUpload />
            <hr />
            <DatasetRecommendation />
        </div>
    );
}

export default App;
