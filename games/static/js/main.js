// Текущие активные фильтры
let currentFilters = {};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    await initFilters();
    await applyFilters();
});

// Инициализация фильтров
async function initFilters() {
    // Назначаем обработчики для кнопок фильтров
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const filterType = this.dataset.filter;
            const filterValue = this.dataset.value;
            
            // Переключаем активное состояние кнопки
            this.classList.toggle('active');
            
            // Обновляем фильтры
            if (this.classList.contains('active')) {
                currentFilters[filterType] = filterValue;
            } else {
                delete currentFilters[filterType];
            }
            
            // Применяем фильтры
            await applyFilters();
        });
    });
    
    // Обработчик для кнопки сброса
    document.getElementById('resetFilters').addEventListener('click', async function() {
        resetFilters();
        await applyFilters();
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
        <div class="game-card">
            <img src="${game.image}" alt="${game.title}" class="game-image">
            <div class="game-content">
                <h2 class="game-title">${game.title}</h2>
                ${game.genres.map(genre => `<span class="game-genre">${genre}</span>`).join('')}
                <p class="game-description">${game.description}</p>
                <div class="game-rating">Рейтинг: ${game.rating}/10</div>
                <div class="game-reviews-count">Отзывов: ${game.reviews.length}</div>
                
                <div class="reviews-section">
                    <h3>Отзывы:</h3>
                    ${game.reviews.slice(0, 2).map(review => `
                        <div class="review">
                            <div class="review-author">${review.author}</div>
                            <div class="review-date">${review.date}</div>
                            <div class="review-rating">Оценка: ${review.rating}/10</div>
                            <p class="review-text">${review.text}</p>
                        </div>
                    `).join('')}
                    ${game.reviews.length > 2 ? 
                        `<button class="show-more-reviews" data-game-id="${game.id}">
                            Показать все отзывы (${game.reviews.length - 2} ещё)
                        </button>` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    // Инициализация кнопок "Показать ещё"
    initShowMoreButtons();
}

// Инициализация кнопок "Показать ещё отзывы"
function initShowMoreButtons() {
    document.querySelectorAll('.show-more-reviews').forEach(btn => {
        btn.addEventListener('click', function() {
            const gameId = this.dataset.gameId;
            const reviewsSection = this.closest('.reviews-section');
            const hiddenReviews = reviewsSection.querySelectorAll('.review[hidden]');
            
            if (hiddenReviews.length > 0) {
                hiddenReviews.forEach(review => review.hidden = false);
                this.textContent = 'Скрыть отзывы';
            } else {
                const allReviews = reviewsSection.querySelectorAll('.review');
                allReviews.forEach((review, index) => {
                    if (index >= 2) review.hidden = true;
                });
                this.textContent = `Показать все отзывы (${allReviews.length - 2} ещё)`;
            }
        });
    });
}