from flask import Blueprint, request, jsonify
import pandas as pd
from Backend.utils.data_cleaning import preprocess_pipeline

preprocess_blueprint = Blueprint('preprocess', __name__)

@preprocess_blueprint.route('/', methods=['POST'])
def preprocess():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    try:
        # Read CSV file
        df = pd.read_csv(file)
        
        # Dynamically create the config based on column types
        config = {"missing_values": {}}
        
        # Check each column's data type
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                config["missing_values"][col] = {"strategy": "mean"}  # Numeric columns: use mean
            else:
                config["missing_values"][col] = {"strategy": "mode"}  # Categorical columns: use mode
        
        # Example config for removing duplicates
        config["remove_duplicates"] = True
        
        cleaned_df = preprocess_pipeline(df, config)

        # Convert to JSON to send back
        response = cleaned_df.to_json(orient='records')
        return jsonify({"cleaned_data": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
