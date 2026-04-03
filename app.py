from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from model import analyze_stock
import os

app = Flask(__name__, static_folder='frontend')
CORS(app)

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    symbol = data.get('symbol')
    
    if not symbol:
        return jsonify({"error": "Stock symbol is required."}), 400
        
    result = analyze_stock(symbol)
    
    if "error" in result:
        return jsonify({"error": result["error"]}), 500
        
    return jsonify(result)

if __name__ == '__main__':
    print("Starting AI Stock Trend Analyzer server...")
    print("Serving from folder:", os.path.abspath(app.static_folder))
    app.run(debug=True, port=5000)
