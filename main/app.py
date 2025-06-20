import os
from flask import Flask, jsonify, render_template, send_from_directory
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

# Получаем путь к текущей директории
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_games_data():
    # Формируем абсолютный путь к файлу
    games_path = os.path.join(BASE_DIR, 'data', 'games.json')
    with open(games_path, 'r', encoding='utf-8') as f:
        return json.load(f)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/games', methods=['GET'])
def get_all_games():
    games = load_games_data()
    return jsonify(games)

@app.route('/api/games/<int:game_id>', methods=['GET'])
def get_game(game_id):
    games = load_games_data()
    game = next((g for g in games if g['id'] == game_id), None)
    if game:
        return jsonify(game)
    return jsonify({'error': 'Game not found'}), 404

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)