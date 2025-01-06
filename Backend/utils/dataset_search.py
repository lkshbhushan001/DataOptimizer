def search_datasets(query):
    
    datasets = [
        {"name": "Energy Consumption Data", "tags": ["energy", "time series"], "link": "http://example.com"},
        {"name": "Retail Sales Data", "tags": ["retail", "sales", "time series"], "link": "http://example.com"}
    ]
    # Filter datasets based on query
    return [d for d in datasets if query.lower() in " ".join(d["tags"]).lower()]
