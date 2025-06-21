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

// Показать детали игры в модальном окне
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
                <div class="modal-game-genres">
                    ${game.genres.map(genre => `<span class="game-genre">${genre}</span>`).join('')}
                </div>
                <div class="modal-game-rating">Рейтинг: ${game.rating}/10</div>
            </div>
            
            <p class="modal-game-description">${game.description}</p>
            
            <div class="modal-reviews-section">
                <h3>Отзывы (${game.reviews.length}):</h3>
                ${game.reviews.map(review => `
                    <div class="modal-review">
                        <div class="modal-review-header">
                            <div>
                                <span class="modal-review-author">${review.author}</span>
                                <span class="modal-review-date">${review.date}</span>
                            </div>
                            <div class="modal-review-rating">${review.rating}/10</div>
                        </div>
                        <p class="modal-review-text">${review.text}</p>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.getElementById('gameModal').style.display = 'block';
    } catch (error) {
        console.error('Ошибка загрузки деталей игры:', error);
        alert('Не удалось загрузить информацию об игре');
    }
}