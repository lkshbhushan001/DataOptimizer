from flask import Flask
from flask_cors import CORS
from routes.preprocess import preprocess_blueprint
from routes.datasets import datasets_blueprint
from routes.dashboard import dashboard_blueprint

app = Flask(__name__)
CORS(app)

app.register_blueprint(preprocess_blueprint, url_prefix='/api/preprocess')
app.register_blueprint(datasets_blueprint, url_prefix='/api/datasets')
app.register_blueprint(dashboard_blueprint, url_prefix='/api/dashboard')

@app.route('/')
def home():
    return {"message": "Welcome to the Data Cleaner Tool Backend!"}

if __name__ == '__main__':
    app.run(debug=True)
