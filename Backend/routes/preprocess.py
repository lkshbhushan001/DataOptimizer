from flask import Blueprint, request, jsonify, send_file
import pandas as pd
import os
import json
import io
from dotenv import load_dotenv
from utils.data_cleaning import preprocess_pipeline
#from routes import preprocessing_examples
from langchain_groq import ChatGroq
from langchain.chains import RetrievalQA
from langchain.vectorstores import FAISS
from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings
from langchain.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough as rpt
from langchain_core.runnables import RunnableParallel as rp
from langchain_core.output_parsers import StrOutputParser as sop

load_dotenv()
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
    
# Configure OpenAI API Key
#groq = ChatGroq(api_key = os.getenv('GROQ_API_KEY'))
current_dir = os.path.dirname(os.path.abspath(__file__))

def load_vector_store():
    file_path = os.path.join(current_dir, "preprocessing_examples.txt")
    loader = TextLoader(file_path) 
    documents = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    texts = text_splitter.split_documents(documents)
    embeddings = NVIDIAEmbeddings(model="NV-Embed-QA", api_key=os.getenv('NVIDIA_API_KEY'))
    vectorstore = FAISS.from_documents(texts, embeddings)
    return vectorstore

vectorstore = load_vector_store()

@preprocess_blueprint.route('/process_with_prompt', methods=['POST'])
def process_with_prompt():
    if 'file' not in request.files or 'prompt' not in request.form:
        return jsonify({"error": "File or prompt not provided"}), 400

    file = request.files['file']
    prompt = request.form['prompt']
    
    try:
        df = pd.read_csv(file)
        
        retriever = vectorstore.as_retriever(search_type="mmr", search_kwarg = {'k' : 3, 'lambda_mult': 0.7})
        #retrieved_docs = retriever.get_relevant_documents(prompt)
        #context = "\n".join([doc.page_content for doc in retrieved_docs])
        
        full_prompt = f"""
        You are a Python data preprocessing assistant. Your task is to generate a Python function named `preprocess` that applies data preprocessing steps to a provided pandas DataFrame, `df`, based on the user’s instructions.
        The user's instructions are as follows:
        {prompt} 

        Guidelines:
        1. Only write the Python function. Do not provide explanations or additional text.
        2. Use appropriate pandas or scikit-learn methods for preprocessing.
        3. Ensure the code is modular and clean, handling edge cases where applicable.
        4. Always return the processed DataFrame as `processed_df`.
        5. Assume that `pandas` (imported as `pd`) and necessary libraries are already available in the environment.
        6. Most Important: Follow the user's instructions precisely and do exactly as asked and include multiple preprocessing steps if required.

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
            exec(code, {"pd": pd, "df": df}, exec_locals) 
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
