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
    const modal = document.getElementById('gameModal');
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
        const games = await loadGames(currentFilters);
        renderGames(games);
    } catch (error) {
        showError();
        console.error('Ошибка загрузки данных:', error);
    }
}

// Показать состояние загрузки
function showLoading() {
    document.getElementById('gameList').innerHTML = '<div class="loading">Загрузка данных...</div>';
}

// Показать ошибку
function showError() {
    document.getElementById('gameList').innerHTML = 
        '<p class="error">Не удалось загрузить данные. Пожалуйста, попробуйте позже.</p>';
}

// Загрузка игр с сервера
async function loadGames(filters = {}) {
    const params = new URLSearchParams();
    for (const key in filters) {
        if (filters[key]) {
            params.append(key, filters[key]);
        }
    }
    
    const response = await fetch(`/api/games?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Ошибка сети');
    }
    return await response.json();
}

// Отрисовка списка игр
function renderGames(games) {
    const gameList = document.getElementById('gameList');
    
    if (games.length === 0) {
        gameList.innerHTML = '<p class="no-results">По вашему запросу игр не найдено</p>';
        return;
    }
    
    gameList.innerHTML = games.map(game => `
    <div class="game-card" data-game-id="${game.id}">
        <div class="game-image-container">
            <img src="${game.image}" alt="${game.title}" class="game-image">
        </div>
        <div class="game-content">
            <h3 class="game-title">${game.title}</h3>
             ${game.creator ? `<div class="game-creator">Создатель: ${game.creator}</div>` : ''}
            <div class="game-genres">
                ${game.genres.map(genre => `<span class="game-genre">${genre}</span>`).join('')}
            </div>
            <button class="show-more-btn">Подробнее</button>
        </div>
    </div>
`).join('');
    
    // Инициализация обработчиков кликов по карточкам
    initGameCardHandlers();
}

// Инициализация обработчиков кликов по карточкам
function initGameCardHandlers() {
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Игнорируем клики по кнопке "Подробнее"
            if (!e.target.classList.contains('show-more-btn')) {
                const gameId = this.dataset.gameId;
                showGameDetails(gameId);
            }
        });
    });
    
    document.querySelectorAll('.show-more-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const gameId = this.closest('.game-card').dataset.gameId;
            showGameDetails(gameId);
        });
    });
}


function initReviewForm() {
    const form = document.getElementById('reviewForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const gameId = this.dataset.gameId;
            const author = this.elements['author'].value;
            const text = this.elements['text'].value;
            const rating = this.elements['rating'].value;
            
            try {
                const response = await fetch(`/api/games/${gameId}/reviews`, {
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
                showGameDetails(gameId); // Обновляем модальное окно с новым отзывом
                this.reset(); // Очищаем форму
                
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Не удалось добавить отзыв: ' + error.message);
            }
        });
    }
}

// Обновим функцию showGameDetails для добавления кнопок удаления
async function showGameDetails(gameId) {
    try {
        const response = await fetch(`/api/games/${gameId}`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки данных игры');
        }
        const game = await response.json();
        
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h2 class="modal-game-title">${game.title}</h2>
            <img src="${game.image}" alt="${game.title}" class="modal-game-image">
            
            <div class="modal-game-info">
             ${game.creator ? `<div class="modal-game-creator">Создатель: ${game.creator}</div>` : ''}
                <div class="modal-game-genres">
                    ${game.genres.map(genre => `<span class="game-genre">${genre}</span>`).join('')}
                </div>
                <div class="modal-game-rating">Рейтинг: ${game.rating}/10</div>
            </div>
            
            <p class="modal-game-description">${game.description}</p>
            
            <div class="modal-reviews-section">
                <h3>Отзывы (${game.reviews.length}):</h3>
                ${game.reviews.map((review, index) => `
                    <div class="modal-review" data-review-index="${index}">
                        <div class="modal-review-header">
                            <div>
                                <span class="modal-review-author">${review.author}</span>
                                <span class="modal-review-date">${review.date}</span>
                            </div>
                            <div class="modal-review-rating">
                                ${review.rating}/10
                                <button class="delete-review-btn" data-game-id="${gameId}" data-review-index="${index}">×</button>
                            </div>
                        </div>
                        <p class="modal-review-text">${review.text}</p>
                    </div>
                `).join('')}
            </div>
            
            <div class="add-review-form">
                <h3>Добавить отзыв</h3>
                <form id="reviewForm" data-game-id="${gameId}">
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
        document.getElementById('gameModal').style.display = 'block';
    } catch (error) {
        console.error('Ошибка загрузки деталей игры:', error);
        alert('Не удалось загрузить информацию об игре');
    }
}


function initDeleteReviewButtons() {
    document.querySelectorAll('.delete-review-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const gameId = this.dataset.gameId;
            const reviewIndex = this.dataset.reviewIndex;
            
            if (confirm('Вы уверены, что хотите удалить этот отзыв?')) {
                try {
                    const response = await fetch(`/api/games/${gameId}/reviews/${reviewIndex}`, {
                        method: 'DELETE'
                    });
                    
                    if (!response.ok) {
                        throw new Error('Ошибка при удалении отзыва');
                    }
                    
                    const result = await response.json();
                    console.log(result.message);
                    showGameDetails(gameId); // Обновляем модальное окно
                } catch (error) {
                    console.error('Ошибка:', error);
                    alert('Не удалось удалить отзыв: ' + error.message);
                }
            }
        });
    });
}