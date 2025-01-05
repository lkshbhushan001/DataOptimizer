import pandas as pd

def preprocess_pipeline(df, config):
    if config.get("missing_values"):
        strategy = config["missing_values"]["strategy"]
        
        # Handle numeric columns for missing value imputation (using mean)
        if strategy == 'mean':
            numeric_cols = df.select_dtypes(include=['number']).columns
            df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
        
        # Handle categorical columns for missing value imputation (using mode)
        if strategy == 'mode':
            categorical_cols = df.select_dtypes(include=['object', 'category']).columns
            for col in categorical_cols:
                df[col].fillna(df[col].mode()[0], inplace=True)
    
    if config.get("remove_duplicates", False):
        df.drop_duplicates(inplace=True)
    
    return df

