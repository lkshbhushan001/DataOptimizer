from flask import Blueprint, request, jsonify, send_file
import pandas as pd
import os
import json
import io
from dotenv import load_dotenv
from utils.data_cleaning import preprocess_pipeline
from langchain_groq import ChatGroq
from langchain.vectorstores import FAISS
from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings
from langchain.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough as rpt
from langchain_core.output_parsers import StrOutputParser as sop
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.ensemble import IsolationForest as IF

load_dotenv()
preprocess_blueprint = Blueprint('preprocess', __name__)

@preprocess_blueprint.route('/', methods=['POST'])
def preprocess():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    try:
        file = request.files['file']
        user_config = request.form.get('config')

        
        if user_config:
            config = json.loads(user_config) 
        else:
            return jsonify({"error": "No preprocessing configuration provided"}), 400

        df = pd.read_csv(file)

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
        output_file.seek(0)  # Reset the file pointer to the beginning

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
        df = pd.read_csv(file)
        columns = list(df.columns)
        return jsonify({"columns": columns})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
#groq = ChatGroq(api_key = os.getenv('GROQ_API_KEY'))
current_dir = os.path.dirname(os.path.abspath(__file__))

vectorstore = None

def get_vector_store():
    global vectorstore
    if vectorstore is None:
        file_path = os.path.join(current_dir, "preprocessing_examples.txt")
        loader = TextLoader(file_path)
        documents = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=70, chunk_overlap=10)
        texts = text_splitter.split_documents(documents)
        embeddings = NVIDIAEmbeddings(model="NV-Embed-QA", api_key=os.getenv('NVIDIA_API_KEY'))
        vectorstore = FAISS.from_documents(texts, embeddings)
    return vectorstore

@preprocess_blueprint.route('/process_with_prompt', methods=['POST'])
def process_with_prompt():
    if 'file' not in request.files or 'prompt' not in request.form:
        return jsonify({"error": "File or prompt not provided"}), 400

    file = request.files['file']
    prompt = request.form['prompt']
    
    try:
        df = pd.read_csv(file)
        vectorstore = get_vector_store()
        retriever = vectorstore.as_retriever(search_type="mmr", search_kwarg = {'k' : 3, 'lambda_mult': 0.7})
        #retrieved_docs = retriever.get_relevant_documents(prompt)
        #context = "\n".join([doc.page_content for doc in retrieved_docs])
        
        full_prompt = f"""
        You are a Python data preprocessing assistant. Your task is to generate a Python function named `preprocess` that applies data preprocessing steps to a provided pandas DataFrame, `df`, based on the user’s instructions.
        The user's instructions are as follows:
        {prompt} 

        Guidelines:
        1. Only write the Python function and the necessary libraries used in the code. Do not provide explanations or additional text.
        2. Use appropriate pandas or scikit-learn methods for preprocessing.
        3. Ensure that you import the necessary libraries which are used in the function.
        4. Ensure the code is modular and clean, handling edge cases where applicable.
        5. Always return the processed DataFrame as `processed_df`.
        6. Always check the data type when implementing the function. For example, if the column is numerical, apply numerical preprocessing methods.
        7. Most Important: Follow the user's instructions precisely and do exactly as asked and include multiple preprocessing steps if required.

        Input:
        - A pandas DataFrame `df`.

        Output:
        - A Python function `preprocess(df)` that returns a processed DataFrame `processed_df`.

        Example format:
        ```python
        def preprocess(df):
            # Add preprocessing steps here based on the instructions
            processed_df = df.copy()
            # Your code
            return processed_df

        """
        prompt_template = PromptTemplate.from_template(full_prompt)       

        chat = ChatGroq(
            model="llama3-70b-8192",            
            model_kwargs = {'seed' : 365},
            temperature = 0.1,
            api_key = os.getenv('GROQ_API_KEY')           
        )

        chain = ({'context': retriever, 'question': rpt()} | prompt_template | chat | sop())
        code = chain.invoke(prompt)        
        code = code.replace("```python", "").replace("```", "")        
        
        exec_locals = {}
        try:
            exec(code, {"pd": pd, "StandardScaler": StandardScaler, "MinMaxScaler": MinMaxScaler, "IF" : IF}, exec_locals) 
        except Exception as e:
            return jsonify({"error": f"Error in executing generated code: {str(e)}"}), 500

        processed_df = exec_locals['preprocess'](df)
        if processed_df is None:
            return jsonify({"error": "The generated code did not return 'processed_df'"}), 500
       
        output_file = io.BytesIO()
        with pd.ExcelWriter(output_file, engine='xlsxwriter') as writer:
            processed_df.to_excel(writer, index=False)
        output_file.seek(0)

        return send_file(output_file, as_attachment=True, download_name="processed_data.xlsx")

    except Exception as e:
        return jsonify({"error": str(e)}), 500
