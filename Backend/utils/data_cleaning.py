import pandas as pd
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.ensemble import IsolationForest

def preprocess_pipeline(df, config):
    # Handle missing values
    if config.get("remove_columns"):
        df = df.drop(columns=config["remove_columns"], errors="ignore")

    if config.get("remove_na") == True:
        df = df.dropna()
    else:
        if config.get("missing_values_num") and config["missing_values_num"]["strategy"] != "none":
            strategy = config["missing_values_num"]["strategy"]
            numerical_cols = df.select_dtypes(include=['float64', 'int64']).columns        

            if strategy == "mean":
                for col in numerical_cols:
                    df[col] = df[col].fillna(df[col].mean())            
            elif strategy == "median":
                for col in numerical_cols:
                    df[col] = df[col].fillna(df[col].median())
            elif strategy == "mode":
                for col in numerical_cols:
                    df[col] = df[col].fillna(df[col].mode()[0])

        if config.get("missing_values_cat") and config["missing_values_cat"]["strategy"] != "none":
            strategy = config["missing_values_cat"]["strategy"]        
            categorical_cols = df.select_dtypes(include=['object']).columns
            
            if strategy == "mode":
                for col in categorical_cols:
                    df[col] = df[col].fillna(df[col].mode()[0])            

    # Remove duplicates
    if config.get("remove_duplicates", False):
        df.drop_duplicates(inplace=True)

    # Normalize or standardize numerical columns
    if config.get("normalize"):
        if config["normalize"]["method"] != "none":
            method = config["normalize"]["method"]
            col = len(config["normalize"]["columns"])        
            # Check if columns list is empty
            if col != 0:
                columns = config["normalize"].get("columns", df.select_dtypes(include=['float64', 'int64']).columns)            
            else:
                columns = df.select_dtypes(include=['float64', 'int64']).columns

            if method == "minmax":
                scaler = MinMaxScaler()
            elif method == "zscore":
                scaler = StandardScaler()
            else:
                raise ValueError("Invalid normalization method: choose 'minmax' or 'zscore'.")
            df[columns] = scaler.fit_transform(df[columns])

    # Remove outliers
    if config.get("remove_outliers"):
        if config["remove_outliers"]["method"] != "none":
            method = config["remove_outliers"]["method"]
            contamination = config["remove_outliers"].get("contamination", 0.1)
            col = len(config["remove_outliers"]["columns"])        
            
            if col != 0:
                columns = config["remove_outliers"].get("columns", df.select_dtypes(include=['float64', 'int64']).columns)
                
            else:
                columns = df.select_dtypes(include=['float64', 'int64']).columns

            if method == "iqr":
                for col in columns:
                    Q1 = df[col].quantile(0.25)
                    Q3 = df[col].quantile(0.75)
                    IQR = Q3 - Q1
                    lower_bound = Q1 - 1.5 * IQR
                    upper_bound = Q3 + 1.5 * IQR
                    df = df[(df[col] >= lower_bound) & (df[col] <= upper_bound)]
            elif method == "isolation_forest":
                clf = IsolationForest(contamination=contamination, random_state=42)
                preds = clf.fit_predict(df[columns])
                df = df[preds == 1]
            else:
                raise ValueError("Invalid outlier removal method: choose 'iqr' or 'isolation_forest'.")

    return df
