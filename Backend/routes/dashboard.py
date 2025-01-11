from flask import Blueprint, request, jsonify, send_file
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

# Initialize ChatGroq client
groq = ChatGroq(api_key=os.getenv('GROQ_API_KEY'))

@dashboard_blueprint.route('/', methods=['POST'])
def upload_dataset():
    if 'file' not in request.files or 'target' not in request.form:
        return jsonify({"error": "Dataset or target variable not provided"}), 400

    file = request.files['file']
    target = request.form['target']

    try:
        # Load dataset
        df = pd.read_csv(file)

        # Ensure the target variable exists
        if target not in df.columns:
            return jsonify({"error": "Target variable not found in dataset"}), 400

        # Generate visualizations
        visualization_data = []
        visualizations = generate_visualizations(df, target)

        for viz_name, encoded_image in visualizations.items():
            visualization_data.append({"name": viz_name, "image": encoded_image})

        # Data summary and LLM preprocessing suggestions
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
        # Drop rows with missing values in the target variable
        if df[target].isnull().any():
            df = df.dropna(subset=[target])

        # Convert categorical columns to numerical for correlation heatmap
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

        # For categorical columns, create bar plots showing the relationship with the target
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
        X = pd.get_dummies(df.drop(columns=[target]), drop_first=True)  # One-hot encode categorical columns
        y = df[target]

        # Check if the target is continuous or categorical
        if y.dtype == 'object' or y.dtype.name == 'category':
            # If categorical, use RandomForestClassifier
            model = RandomForestClassifier(random_state=42)
        else:
            # If continuous, use RandomForestRegressor
            model = RandomForestRegressor(random_state=42)

        # Fit the model
        model.fit(X, y)
        importances = pd.Series(model.feature_importances_, index=X.columns).sort_values(ascending=False)

        # Plot feature importance
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
        # Summarize dataset
        summary = f"""
        Dataset contains {df.shape[0]} rows and {df.shape[1]} columns.
        Columns: {', '.join(df.columns)}
        Missing values:
        {df.isnull().sum().to_string()}
        Data types:
        {df.dtypes.to_string()}
        """

        # Construct the prompt
        messages = [
            {
                "role": "system",
                "content": "You are a Python data preprocessing assistant. Your task is to analyze dataset summaries and provide actionable preprocessing suggestions for data cleaning and preparation."
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

        # Send to ChatGroq for suggestions
        response = groq.chat.completions.create(
            model="llama3-70b-8192",
            messages=messages,
            max_tokens=500
        )

        suggestion =  response.choices[0].message.content

        return suggestion
    
    except Exception as e:
        # Log and return the error
        #logging.error("Error in get_preprocessing_suggestions: %s", str(e))
        return jsonify({"error": str(e)}), 500