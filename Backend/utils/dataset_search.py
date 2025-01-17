from langchain_groq import ChatGroq
# from langchain.prompts import PromptTemplate
# from langchain_core.output_parsers import StrOutputParser as sop
import os
from flask import jsonify

def search_datasets(query):
    
    try:
        full_prompt = f"""
        You are a helpful and knowledgeable data recommendation assistant. Your task is to recommend publicly available datasets that match a user's query.
        When a user provides a topic (e.g., "wildfires"), you will:

            1. **Understand the Topic**: Identify the key aspects of the user's query (e.g., wildfires, forest fires, fire incidents, etc.).
            2. **Search for Relevant Datasets**: Recommend datasets that contain relevant data (e.g., CSV files, APIs, or other formats) related to the topic.
            3. **Provide Dataset Details**: For each dataset, include the following information:
            - **Dataset Name**: The name of the dataset.
            - **Description**: A brief description of what the dataset contains.
            - **Source**: The organization or platform where the dataset is hosted (e.g., Kaggle, government websites, research institutions).
            - **Format**: The format of the dataset (e.g., CSV, JSON, API).
            - **Link**: A direct link to the dataset (if available).

            4. **Prioritize Quality**: Recommend datasets that are well-documented, up-to-date, and from reputable sources.
            5. **Be Specific**: If the topic is broad (e.g., "wildfires"), suggest datasets that cover specific aspects (e.g., wildfire locations, fire intensity, historical data, etc.).

            Example Output:
            - **Dataset Name**: US Wildfire Activity Dataset
            - **Description**: Contains historical wildfire data in the United States, including location, size, and cause.
            - **Source**: Kaggle
            - **Format**: CSV
            - **Link**: [https://www.kaggle.com/datasets/us-wildfire-activity](https://www.kaggle.com/datasets/us-wildfire-activity)

            - **Dataset Name**: Global Wildfire Information System (GWIS)
            - **Description**: Provides global wildfire data, including fire hotspots, burned areas, and emissions.
            - **Source**: European Space Agency (ESA)
            - **Format**: API
            - **Link**: [https://gwis.jrc.ec.europa.eu](https://gwis.jrc.ec.europa.eu)

            Now, answer the user based on the following query: {query}

        """
        #prompt_template = PromptTemplate.from_template(full_prompt)       

        chat = ChatGroq(
            model="llama-3.3-70b-versatile",            
            model_kwargs = {'seed' : 365},
            temperature = 0.1,
            api_key = os.getenv('GROQ_API_KEY')           
        )        
        response = chat.invoke(full_prompt)

        return response.content

    except Exception as e:
        return jsonify({"error": str(e)}), 500
