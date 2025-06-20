from flask import Flask, jsonify, render_template, send_from_directory, request
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

# Получаем путь к текущей директории
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_movies_data():
    # Формируем абсолютный путь к файлу
    movies_path = os.path.join(BASE_DIR, 'data', 'movies.json')
    with open(movies_path, 'r', encoding='utf-8') as f:
        return json.load(f)

@app.route('/')
def index():
    return render_template('index.html')

# Основной endpoint для получения всех игр с возможностью фильтрации
@app.route('/api/movies', methods=['GET'])
def get_all_movies():
    movies = load_movies_data()
    
    # Применяем фильтры, если они указаны в параметрах запроса
    filtered_movies = apply_filters(movies, request.args)
    
    return jsonify(filtered_movies)


@app.route('/static/js/<path:path>')
def serve_js(path):
    return send_from_directory('static/js', path)
# Фильтрация по жанру
@app.route('/api/movies/genre/<string:genre>', methods=['GET'])
def get_movies_by_genre(genre):
    movies = load_movies_data()
    filtered = [movie for movie in movies  if genre.lower() in [g.lower() for g in movie['genres']]]
    return jsonify(filtered)

# Фильтрация по количеству отзывов
@app.route('/api/movies/reviews/<int:min_reviews>', methods=['GET'])
def get_movies_by_reviews_count(min_reviews):
    movies = load_movies_data()
    filtered = [movie for movie in movies if len(movie['reviews']) >= min_reviews]
    return jsonify(filtered)

# Фильтрация по рейтингу
@app.route('/api/movies/rating/<float:min_rating>', methods=['GET'])
def get_movies_by_rating(min_rating):
    movies = load_movies_data()
    filtered = [movie for movie in movies if movie['rating'] >= min_rating]
    return jsonify(filtered)

# Комбинированная фильтрация
def apply_filters(movies, filters):
    filtered = movies
    
    # Фильтр по жанру
    if 'genre' in filters:
        genre = filters['genre'].lower()
        filtered = [movie for movie in filtered if genre in [g.lower() for g in movie['genres']]]
    
    # Фильтр по минимальному количеству отзывов
    if 'min_reviews' in filters:
        min_reviews = int(filters['min_reviews'])
        filtered = [movie for movie in filtered if len(movie['reviews']) >= min_reviews]
    
    # Фильтр по минимальному рейтингу
    if 'min_rating' in filters:
        min_rating = float(filters['min_rating'])
        filtered = [movie for movie in filtered if movie['rating'] >= min_rating]
    
    # Фильтр по максимальному рейтингу
    if 'max_rating' in filters:
        max_rating = float(filters['max_rating'])
        filtered = [movie for movie in filtered if movie['rating'] <= max_rating]
    
    return filtered

@app.route('/api/movies/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):
    movies = load_movies_data()
    movie = next((g for g in movies if g['id'] == movie_id), None)
    if movie:
        return jsonify(movie)
    return jsonify({'error': 'movie not found'}), 404

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)