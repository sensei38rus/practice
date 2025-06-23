from flask import Flask, jsonify, render_template, send_from_directory, request
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

# Получаем путь к текущей директории
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_books_data():
    # Формируем абсолютный путь к файлу
    books_path = os.path.join(BASE_DIR, 'data', 'books.json')
    with open(books_path, 'r', encoding='utf-8') as f:
        return json.load(f)

@app.route('/')
def index():
    return render_template('index.html')

# Основной endpoint для получения всех игр с возможностью фильтрации
@app.route('/api/books', methods=['GET'])
def get_all_books():
    books = load_books_data()
    
    # Применяем фильтры, если они указаны в параметрах запроса
    filtered_books = apply_filters(books, request.args)
    
    return jsonify(filtered_books)


@app.route('/static/js/<path:path>')
def serve_js(path):
    return send_from_directory('static/js', path)
# Фильтрация по жанру
@app.route('/api/books/genre/<string:genre>', methods=['GET'])
def get_books_by_genre(genre):
    books = load_books_data()
    filtered = [book for book in books  if genre.lower() in [g.lower() for g in book['genres']]]
    return jsonify(filtered)

# Фильтрация по количеству отзывов
@app.route('/api/books/reviews/<int:min_reviews>', methods=['GET'])
def get_books_by_reviews_count(min_reviews):
    books = load_books_data()
    filtered = [book for book in books if len(book['reviews']) >= min_reviews]
    return jsonify(filtered)

# Фильтрация по рейтингу
@app.route('/api/books/rating/<float:min_rating>', methods=['GET'])
def get_books_by_rating(min_rating):
    books = load_books_data()
    filtered = [book for book in books if book['rating'] >= min_rating]
    return jsonify(filtered)

# Комбинированная фильтрация
def apply_filters(books, filters):
    filtered = books
    
    # Фильтр по жанру
    if 'genre' in filters:
        genre = filters['genre'].lower()
        filtered = [book for book in filtered if genre in [g.lower() for g in book['genres']]]
    
    # Фильтр по минимальному количеству отзывов
    if 'min_reviews' in filters:
        min_reviews = int(filters['min_reviews'])
        filtered = [book for book in filtered if len(book['reviews']) >= min_reviews]
    
    # Фильтр по минимальному рейтингу
    if 'min_rating' in filters:
        min_rating = float(filters['min_rating'])
        filtered = [book for book in filtered if book['rating'] >= min_rating]
    
    # Фильтр по максимальному рейтингу
    if 'max_rating' in filters:
        max_rating = float(filters['max_rating'])
        filtered = [book for book in filtered if book['rating'] <= max_rating]
    
    return filtered

@app.route('/api/books/<int:book_id>', methods=['GET'])
def get_book(book_id):
    books = load_books_data()
    book = next((g for g in books if g['id'] == book_id), None)
    if book:
        return jsonify(book)
    return jsonify({'error': 'book not found'}), 404

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)



@app.route('/api/books/<int:book_id>/reviews', methods=['POST'])
def add_review(book_id):
    books = load_books_data()
    book = next((g for g in books if g['id'] == book_id), None)
    
    if not book:
        return jsonify({'error': 'book not found'}), 404
    
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
    
    book['reviews'].append(new_review)
    
    # Пересчитываем рейтинг игры
    total_rating = sum(review['rating'] for review in book['reviews'])
    book['rating'] = round(total_rating / len(book['reviews']), 1)
    
    # Сохраняем обновленные данные
    books_path = os.path.join(BASE_DIR, 'data', 'books.json')
    with open(books_path, 'w', encoding='utf-8') as f:
        json.dump(books, f, ensure_ascii=False, indent=2)
    
    return jsonify(new_review), 201




# Добавить этот endpoint перед if __name__ == '__main__':
@app.route('/api/books/<int:book_id>/reviews/<int:review_index>', methods=['DELETE'])
def delete_review(book_id, review_index):
    books = load_books_data()
    book = next((g for g in books if g['id'] == book_id), None)
    
    if not book:
        return jsonify({'error': 'book not found'}), 404
    
    try:
        # Удаляем отзыв по индексу
        deleted_review = book['reviews'].pop(review_index)
        
        # Пересчитываем рейтинг игры, если остались отзывы
        if book['reviews']:
            total_rating = sum(review['rating'] for review in book['reviews'])
            book['rating'] = round(total_rating / len(book['reviews']), 1)
        else:
            book['rating'] = 0.0
        
        # Сохраняем обновленные данные
        books_path = os.path.join(BASE_DIR, 'data', 'books.json')
        with open(books_path, 'w', encoding='utf-8') as f:
            json.dump(books, f, ensure_ascii=False, indent=2)
        
        return jsonify({'message': 'Review deleted successfully', 'review': deleted_review}), 200
    except IndexError:
        return jsonify({'error': 'Review not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)