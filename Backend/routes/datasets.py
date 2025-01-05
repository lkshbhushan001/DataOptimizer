from flask import Blueprint, request, jsonify
from Backend.utils.dataset_search import search_datasets

datasets_blueprint = Blueprint('datasets', __name__)

@datasets_blueprint.route('/', methods=['POST'])
def recommend():
    data = request.json
    query = data.get("query", "")
    results = search_datasets(query)
    return jsonify({"datasets": results})
