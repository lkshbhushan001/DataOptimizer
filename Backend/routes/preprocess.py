from flask import Blueprint, request, jsonify, send_file
import pandas as pd
import os
import json
import io
from Backend.utils.data_cleaning import preprocess_pipeline

preprocess_blueprint = Blueprint('preprocess', __name__)

@preprocess_blueprint.route('/', methods=['POST'])
def preprocess():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    try:
        # Get the uploaded file and user configuration
        file = request.files['file']
        user_config = request.form.get('config')

        
        if user_config:
            config = json.loads(user_config)  # Convert string to dictionary
        else:
            return jsonify({"error": "No preprocessing configuration provided"}), 400

        # Read the uploaded CSV file into a DataFrame
        df = pd.read_csv(file)

        # Apply the preprocessing pipeline
        cleaned_df = preprocess_pipeline(df, config)

        # Create and send the processed file as an Excel download
        return file_download(cleaned_df)

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

def file_download(cleaned_df):
    try:
        # Create an in-memory Excel file
        output_file = io.BytesIO()
        with pd.ExcelWriter(output_file, engine='xlsxwriter') as writer:
            cleaned_df.to_excel(writer, sheet_name='processed_data', index=False)
        output_file.seek(0)  # Reset the file pointer to the beginning

        # Send the file as a downloadable response
        return send_file(output_file, as_attachment=True, download_name="processed_data.xlsx")

    except Exception as e:
        print(f"Error creating downloadable file: {e}")
        return jsonify({"error": f"Error creating file: {e}"}), 500
    
@preprocess_blueprint.route('/get_columns', methods=['POST'])
def get_columns():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    try:
        # Read the CSV file to get column names
        df = pd.read_csv(file)
        columns = list(df.columns)
        return jsonify({"columns": columns})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
