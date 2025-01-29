from flask import Flask,send_from_directory
from flask_cors import CORS
from routes.preprocess import preprocess_blueprint
from routes.datasets import datasets_blueprint
from routes.dashboard import dashboard_blueprint
import os

app = Flask(__name__)
frontend_url = os.getenv("FRONTEND_URL", "*")
CORS(app, origins=["frontend_url"])

app.register_blueprint(preprocess_blueprint, url_prefix='/api/preprocess')
app.register_blueprint(datasets_blueprint, url_prefix='/api/datasets')
app.register_blueprint(dashboard_blueprint, url_prefix='/api/dashboard')

if __name__ == '__main__':
    app.run(debug=False) 