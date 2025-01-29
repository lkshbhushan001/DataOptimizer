from flask import Flask,send_from_directory
from flask_cors import CORS
from routes.preprocess import preprocess_blueprint
from routes.datasets import datasets_blueprint
from routes.dashboard import dashboard_blueprint
import os

app = Flask(__name__)
CORS(app)

app.register_blueprint(preprocess_blueprint, url_prefix='/api/preprocess')
app.register_blueprint(datasets_blueprint, url_prefix='/api/datasets')
app.register_blueprint(dashboard_blueprint, url_prefix='/api/dashboard')

front_folder = os.path.join(os.getcwd(), '..', 'frontend', 'build')
@app.route('/', defaults={"filename": ""})
@app.route('/<path:filename>')
def serve(filename):
    if not filename:
        filename = "index.html"
    return send_from_directory(front_folder, filename)

if __name__ == '__main__':
    app.run(debug=True)
