from flask import Flask, jsonify, render_template, send_from_directory, request
from flask_cors import CORS
import json
import os

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

# Основной endpoint для получения всех игр с возможностью фильтрации
@app.route('/api/games', methods=['GET'])
def get_all_games():
    games = load_games_data()
    
    # Применяем фильтры, если они указаны в параметрах запроса
    filtered_games = apply_filters(games, request.args)
    
    return jsonify(filtered_games)


@app.route('/static/js/<path:path>')
def serve_js(path):
    return send_from_directory('static/js', path)
# Фильтрация по жанру
@app.route('/api/games/genre/<string:genre>', methods=['GET'])
def get_games_by_genre(genre):
    games = load_games_data()
    filtered = [game for game in games if genre.lower() in [g.lower() for g in game['genres']]]
    return jsonify(filtered)

# Фильтрация по количеству отзывов
@app.route('/api/games/reviews/<int:min_reviews>', methods=['GET'])
def get_games_by_reviews_count(min_reviews):
    games = load_games_data()
    filtered = [game for game in games if len(game['reviews']) >= min_reviews]
    return jsonify(filtered)

# Фильтрация по рейтингу
@app.route('/api/games/rating/<float:min_rating>', methods=['GET'])
def get_games_by_rating(min_rating):
    games = load_games_data()
    filtered = [game for game in games if game['rating'] >= min_rating]
    return jsonify(filtered)

# Комбинированная фильтрация
def apply_filters(games, filters):
    filtered = games
    
    # Фильтр по жанру
    if 'genre' in filters:
        genre = filters['genre'].lower()
        filtered = [game for game in filtered if genre in [g.lower() for g in game['genres']]]
    
    # Фильтр по минимальному количеству отзывов
    if 'min_reviews' in filters:
        min_reviews = int(filters['min_reviews'])
        filtered = [game for game in filtered if len(game['reviews']) >= min_reviews]
    
    # Фильтр по минимальному рейтингу
    if 'min_rating' in filters:
        min_rating = float(filters['min_rating'])
        filtered = [game for game in filtered if game['rating'] >= min_rating]
    
    # Фильтр по максимальному рейтингу
    if 'max_rating' in filters:
        max_rating = float(filters['max_rating'])
        filtered = [game for game in filtered if game['rating'] <= max_rating]
    
    return filtered

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



@app.route('/api/games/<int:game_id>/reviews', methods=['POST'])
def add_review(game_id):
    games = load_games_data()
    game = next((g for g in games if g['id'] == game_id), None)
    
    if not game:
        return jsonify({'error': 'Game not found'}), 404
    
    new_review = request.get_json()
    
    # Валидация данных
    required_fields = ['author', 'text', 'rating']
    if not all(field in new_review for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        new_review['rating'] = float(new_review['rating'])
        if not (0 <= new_review['rating'] <= 10):
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({'error': 'Rating must be a number between 0 and 10'}), 400
    
    # Добавляем дату
    from datetime import datetime
    new_review['date'] = datetime.now().strftime("%d.%m.%Y")
    
    game['reviews'].append(new_review)
    
    # Пересчитываем рейтинг игры
    total_rating = sum(review['rating'] for review in game['reviews'])
    game['rating'] = round(total_rating / len(game['reviews']), 1)
    
    # Сохраняем обновленные данные
    games_path = os.path.join(BASE_DIR, 'data', 'games.json')
    with open(games_path, 'w', encoding='utf-8') as f:
        json.dump(games, f, ensure_ascii=False, indent=2)
    
    return jsonify(new_review), 201



@app.route('/api/games/<int:game_id>/reviews/<int:review_index>', methods=['DELETE'])
def delete_review(game_id, review_index):
    games = load_games_data()
    game = next((g for g in games if g['id'] == game_id), None)
    
    if not game:
        return jsonify({'error': 'Game not found'}), 404
    
    try:
        # Удаляем отзыв по индексу
        deleted_review = game['reviews'].pop(review_index)
        
        # Пересчитываем рейтинг игры, если остались отзывы
        if game['reviews']:
            total_rating = sum(review['rating'] for review in game['reviews'])
            game['rating'] = round(total_rating / len(game['reviews']), 1)
        else:
            game['rating'] = 0.0
        
        # Сохраняем обновленные данные
        games_path = os.path.join(BASE_DIR, 'data', 'games.json')
        with open(games_path, 'w', encoding='utf-8') as f:
            json.dump(games, f, ensure_ascii=False, indent=2)
        
        return jsonify({'message': 'Review deleted successfully', 'review': deleted_review}), 200
    except IndexError:
        return jsonify({'error': 'Review not found'}), 404


if __name__ == '__main__':
    app.run(debug=True, port=5000)