from flask import Blueprint, request, jsonify
import pandas as pd
import os
import matplotlib.pyplot as plt
import seaborn as sns
import base64
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from groq import Groq as ChatGroq
import io
from sklearn.preprocessing import LabelEncoder
from dotenv import load_dotenv

load_dotenv()
dashboard_blueprint = Blueprint('dashboard', __name__)
groq = ChatGroq(api_key=os.getenv('GROQ_API_KEY'))

@dashboard_blueprint.route('/', methods=['POST'])
def upload_dataset():
    if 'file' not in request.files or 'target' not in request.form:
        return jsonify({"error": "Dataset or target variable not provided"}), 400

    file = request.files['file']
    target = request.form['target']

    try:        
        df = pd.read_csv(file)
        
        if target not in df.columns:
            return jsonify({"error": "Target variable not found in dataset"}), 400
        
        visualization_data = []
        visualizations = generate_visualizations(df, target)

        for viz_name, encoded_image in visualizations.items():
            visualization_data.append({"name": viz_name, "image": encoded_image})
        
        suggestions = get_preprocessing_suggestions(df)

        return jsonify({
            "visualizations": visualization_data,
            "suggestions": suggestions
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def generate_visualizations(df, target):
    visualizations = {}

    try:        
        if df[target].isnull().any():
            df = df.dropna(subset=[target])
        
        encoded_df = df.copy()
        label_encoders = {}
        for col in df.select_dtypes(include=['object', 'category']).columns:
            if col != target:
                le = LabelEncoder()
                encoded_df[col] = le.fit_transform(df[col].astype(str))
                label_encoders[col] = le

        # Correlation heatmap
        plt.figure(figsize=(10, 8))
        sns.heatmap(encoded_df.corr(), annot=True, cmap='coolwarm', fmt=".2f")
        plt.title("Correlation Heatmap")
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        visualizations["correlation_heatmap"] = base64.b64encode(buffer.read()).decode('utf-8')
        buffer.close()
        plt.close()

        # Feature-target relationships
        for col in df.select_dtypes(include=['float64', 'int64']).columns:
            if col != target:
                plt.figure(figsize=(8, 6))
                sns.scatterplot(x=df[col], y=df[target])
                plt.title(f"{col} vs {target}")
                buffer = io.BytesIO()
                plt.savefig(buffer, format='png')
                buffer.seek(0)
                visualizations[f"{col}_vs_{target}"] = base64.b64encode(buffer.read()).decode('utf-8')
                buffer.close()
                plt.close()

        # For categorical columns, bar plots showing the relationship with the target
        for col in df.select_dtypes(include=['object', 'category']).columns:
            if col != target:
                plt.figure(figsize=(8, 6))
                sns.countplot(x=df[col], hue=df[target])
                plt.title(f"Distribution of {col} by {target}")
                plt.xticks(rotation=45)
                buffer = io.BytesIO()
                plt.savefig(buffer, format='png')
                buffer.seek(0)
                visualizations[f"{col}_distribution_by_{target}"] = base64.b64encode(buffer.read()).decode('utf-8')
                buffer.close()
                plt.close()

        # Outlier detection for numerical columns
        for col in df.select_dtypes(include=['float64', 'int64']).columns:
            plt.figure(figsize=(8, 6))
            sns.boxplot(x=df[col])
            plt.title(f"Outliers in {col}")
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png')
            buffer.seek(0)
            visualizations[f"{col}_outliers"] = base64.b64encode(buffer.read()).decode('utf-8')
            buffer.close()
            plt.close()

        # Feature importance using RandomForest
        X = pd.get_dummies(df.drop(columns=[target]), drop_first=True) 
        y = df[target]

        # Check if the target is continuous or categorical
        if y.dtype == 'object' or y.dtype.name == 'category':            
            model = RandomForestClassifier(random_state=42)
        else:            
            model = RandomForestRegressor(random_state=42)
        
        model.fit(X, y)
        importances = pd.Series(model.feature_importances_, index=X.columns).sort_values(ascending=False)
        
        plt.figure(figsize=(10, 6))
        sns.barplot(x=importances, y=importances.index)
        plt.title("Feature Importance")
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        visualizations["feature_importance"] = base64.b64encode(buffer.read()).decode('utf-8')
        buffer.close()
        plt.close()

    except Exception as e:
        return {"error": str(e)}

    return visualizations

def get_preprocessing_suggestions(df):
    try:        
        summary = f"""
        Dataset contains {df.shape[0]} rows and {df.shape[1]} columns.
        Columns: {', '.join(df.columns)}
        Missing values:
        {df.isnull().sum().to_string()}
        Data types:
        {df.dtypes.to_string()}
        """        
        messages = [
            {
                "role": "system",
                "content": '''You are a Python data preprocessing assistant. Your task is to analyze dataset summaries and provide actionable preprocessing suggestions for data cleaning and preparation.
                Do not give sample code, but provide clear and concise suggestions for handling missing values, outliers, feature scaling, encoding, and other preprocessing steps specific to the dataset.'''
            },
            {
                "role": "user",
                "content": f"""
                Analyze the following dataset summary and provide preprocessing suggestions:
                {summary}
                Suggestions should cover missing values, outliers, feature scaling, encoding, and any other relevant steps.
                """
            }
        ]
        
        response = groq.chat.completions.create(
            model="llama3-70b-8192",
            messages=messages,
            max_tokens=1000
        )

        suggestion =  response.choices[0].message.content

        return suggestion
    
    except Exception as e:
        # Log and return the error
        #logging.error("Error in get_preprocessing_suggestions: %s", str(e))
        return jsonify({"error": str(e)}), 500