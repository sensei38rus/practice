// Текущие активные фильтры
let currentFilters = {};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    await initFilters();
    await applyFilters();
    initModal();
});

// Инициализация фильтров
async function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const filterType = this.dataset.filter;
            const filterValue = this.dataset.value;
            
            this.classList.toggle('active');
            
            if (this.classList.contains('active')) {
                currentFilters[filterType] = filterValue;
            } else {
                delete currentFilters[filterType];
            }
            
            await applyFilters();
        });
    });
    
    document.getElementById('resetFilters').addEventListener('click', async function() {
        resetFilters();
        await applyFilters();
    });
}

// Инициализация модального окна
function initModal() {
    const modal = document.getElementById('bookModal');
    const closeBtn = document.querySelector('.close-btn');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Сброс всех фильтров
function resetFilters() {
    currentFilters = {};
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// Применение текущих фильтров
async function applyFilters() {
    try {
        showLoading();
        const books = await loadbooks(currentFilters);
        renderbooks(books);
    } catch (error) {
        showError();
        console.error('Ошибка загрузки данных:', error);
    }
}

// Показать состояние загрузки
function showLoading() {
    document.getElementById('bookList').innerHTML = '<div class="loading">Загрузка данных...</div>';
}

// Показать ошибку
function showError() {
    document.getElementById('bookList').innerHTML = 
        '<p class="error">Не удалось загрузить данные. Пожалуйста, попробуйте позже.</p>';
}

// Загрузка игр с сервера
async function loadbooks(filters = {}) {
    const params = new URLSearchParams();
    for (const key in filters) {
        if (filters[key]) {
            params.append(key, filters[key]);
        }
    }
    
    const response = await fetch(`/api/books?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Ошибка сети');
    }
    return await response.json();
}

// Отрисовка списка игр
function renderbooks(books) {
    const bookList = document.getElementById('bookList');
    
    if (books.length === 0) {
        bookList.innerHTML = '<p class="no-results">По вашему запросу игр не найдено</p>';
        return;
    }
    
    bookList.innerHTML = books.map(book => `
    <div class="book-card" data-book-id="${book.id}">
        <div class="book-image-container">
            <img src="${book.image}" alt="${book.title}" class="book-image">
        </div>
        <div class="book-content">
            <h3 class="book-title">${book.title}</h3>
             ${book.creator ? `<div class="book-creator">Создатель: ${book.creator}</div>` : ''}
            <div class="book-genres">
                ${book.genres.map(genre => `<span class="book-genre">${genre}</span>`).join('')}
            </div>
            <button class="show-more-btn">Подробнее</button>
        </div>
    </div>
`).join('');
    
    // Инициализация обработчиков кликов по карточкам
    initbookCardHandlers();
}

// Инициализация обработчиков кликов по карточкам
function initbookCardHandlers() {
    document.querySelectorAll('.book-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Игнорируем клики по кнопке "Подробнее"
            if (!e.target.classList.contains('show-more-btn')) {
                const bookId = this.dataset.bookId;
                showbookDetails(bookId);
            }
        });
    });
    
    document.querySelectorAll('.show-more-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const bookId = this.closest('.book-card').dataset.bookId;
            showbookDetails(bookId);
        });
    });
}

// Показать детали игры в модальном окне
// Добавить в конец файла main.js
function initReviewForm() {
    const form = document.getElementById('reviewForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const bookId = this.dataset.bookId;
            const author = this.elements['author'].value;
            const text = this.elements['text'].value;
            const rating = this.elements['rating'].value;
            
            try {
                const response = await fetch(`/api/books/${bookId}/reviews`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        author: author,
                        text: text,
                        rating: rating
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Ошибка при добавлении отзыва');
                }
                
                const newReview = await response.json();
                showbookDetails(bookId); // Обновляем модальное окно с новым отзывом
                this.reset(); // Очищаем форму
                
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Не удалось добавить отзыв: ' + error.message);
            }
        });
    }
}

// Обновить функцию showbookDetails, добавив форму для отзыва
// Обновим функцию showbookDetails для добавления кнопок удаления
async function showbookDetails(bookId) {
    try {
        const response = await fetch(`/api/books/${bookId}`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки данных игры');
        }
        const book = await response.json();
        
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h2 class="modal-book-title">${book.title}</h2>
            <img src="${book.image}" alt="${book.title}" class="modal-book-image">
            
            <div class="modal-book-info">
            ${book.creator ? `<div class="modal-book-creator">Создатель: ${book.creator}</div>` : ''}
                <div class="modal-book-genres">
                    ${book.genres.map(genre => `<span class="book-genre">${genre}</span>`).join('')}
                </div>
                <div class="modal-book-rating">Рейтинг: ${book.rating}/10</div>
            </div>
            
            <p class="modal-book-description">${book.description}</p>
            
            <div class="modal-reviews-section">
                <h3>Отзывы (${book.reviews.length}):</h3>
                ${book.reviews.map((review, index) => `
                    <div class="modal-review" data-review-index="${index}">
                        <div class="modal-review-header">
                            <div>
                                <span class="modal-review-author">${review.author}</span>
                                <span class="modal-review-date">${review.date}</span>
                            </div>
                            <div class="modal-review-rating">
                                ${review.rating}/10
                                <button class="delete-review-btn" data-book-id="${bookId}" data-review-index="${index}">×</button>
                            </div>
                        </div>
                        <p class="modal-review-text">${review.text}</p>
                    </div>
                `).join('')}
            </div>
            
            <div class="add-review-form">
                <h3>Добавить отзыв</h3>
                <form id="reviewForm" data-book-id="${bookId}">
                    <div class="form-group">
                        <label for="author">Ваше имя:</label>
                        <input type="text" id="author" name="author" required>
                    </div>
                    <div class="form-group">
                        <label for="rating">Оценка (0-10):</label>
                        <input type="number" id="rating" name="rating" min="0" max="10" step="1" required>
                    </div>
                    <div class="form-group">
                        <label for="text">Текст отзыва:</label>
                        <textarea id="text" name="text" required></textarea>
                    </div>
                    <button type="submit" class="submit-review-btn">Отправить отзыв</button>
                </form>
            </div>
        `;
        
        initReviewForm();
        initDeleteReviewButtons(); // Инициализируем кнопки удаления
        document.getElementById('bookModal').style.display = 'block';
    } catch (error) {
        console.error('Ошибка загрузки деталей игры:', error);
        alert('Не удалось загрузить информацию об игре');
    }
}


function initDeleteReviewButtons() {
    document.querySelectorAll('.delete-review-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const bookId = this.dataset.bookId;
            const reviewIndex = this.dataset.reviewIndex;
            
            if (confirm('Вы уверены, что хотите удалить этот отзыв?')) {
                try {
                    const response = await fetch(`/api/books/${bookId}/reviews/${reviewIndex}`, {
                        method: 'DELETE'
                    });
                    
                    if (!response.ok) {
                        throw new Error('Ошибка при удалении отзыва');
                    }
                    
                    const result = await response.json();
                    console.log(result.message);
                    showbookDetails(bookId); // Обновляем модальное окно
                } catch (error) {
                    console.error('Ошибка:', error);
                    alert('Не удалось удалить отзыв: ' + error.message);
                }
            }
        });
    });
}