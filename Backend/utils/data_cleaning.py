import pandas as pd

def preprocess_pipeline(df, config):
    if config.get("missing_values"):
        strategy = config["missing_values"]["strategy"]        
        
        # if strategy == 'mean':
        #     numeric_cols = df.select_dtypes(include=['number']).columns
        #     df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())        
        
        # if strategy == 'mode':
        #     categorical_cols = df.select_dtypes(include=['object', 'category']).columns
        #     for col in categorical_cols:
        #         df[col].fillna(df[col].mode()[0], inplace=True)

        numerical_cols = df.select_dtypes(include=['float64', 'int64']).columns
        for col in numerical_cols:
            df[col] = df[col].fillna(df[col].mean()) 

        # For categorical columns
        categorical_cols = df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            df[col] = df[col].fillna(df[col].mode()[0])
    
        if config.get("remove_duplicates", False):
            df.drop_duplicates(inplace=True)
    
    return df

