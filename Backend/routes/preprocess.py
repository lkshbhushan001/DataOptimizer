from flask import Blueprint, request, jsonify, send_file
import pandas as pd
import os
import io
from Backend.utils.data_cleaning import preprocess_pipeline

preprocess_blueprint = Blueprint('preprocess', __name__)

@preprocess_blueprint.route('/', methods=['POST'])
def preprocess():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    try:        
        df = pd.read_csv(file)        
        
        #config = {"missing_values": {}}        
        
        # for col in df.columns:
        #     if pd.api.types.is_numeric_dtype(df[col]):
        #         config["missing_values"][col] = {"strategy": "mean"}  # Numeric columns: use mean
        #     else:
        #         config["missing_values"][col] = {"strategy": "mode"}  # Categorical columns: use mode
        config = {
            "missing_values": {"strategy": "mean"},
            "remove_duplicates": True
        }
        # Example config for removing duplicates
        #config["remove_duplicates"] = True
        cleaned_df = preprocess_pipeline(df, config)

        return file_download(cleaned_df)
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500
    
def file_download(cleaned_df):
    try:        
        output_file = io.BytesIO()
        with pd.ExcelWriter(output_file, engine='xlsxwriter') as writer:
            cleaned_df.to_excel(writer, sheet_name='processed_data', index=False)
        output_file.seek(0)
    
        return send_file(output_file, as_attachment=True, download_name="processed_data.xlsx")
    
    except Exception as e:

        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500
    
    finally:
        
        output_file = os.path.join(os.getcwd(), "processed_data.xlsx")
        if os.path.exists(output_file):
            os.remove(output_file)
