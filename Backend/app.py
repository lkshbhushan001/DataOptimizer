from flask import Flask
from flask_cors import CORS
from Backend.routes.preprocess import preprocess_blueprint
from Backend.routes.datasets import datasets_blueprint

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# Register Blueprints
app.register_blueprint(preprocess_blueprint, url_prefix='/api/preprocess')
app.register_blueprint(datasets_blueprint, url_prefix='/api/datasets')

@app.route('/')
def home():
    return {"message": "Welcome to the Data Cleaner Tool Backend!"}

if __name__ == '__main__':
    app.run(debug=True)
