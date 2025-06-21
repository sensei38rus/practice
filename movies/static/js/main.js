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
    const modal = document.getElementById('movieModal');
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
        const movies = await loadMovies(currentFilters);
        renderMovies(movies);
    } catch (error) {
        showError();
        console.error('Ошибка загрузки данных:', error);
    }
}

// Показать состояние загрузки
function showLoading() {
    document.getElementById('movieList').innerHTML = '<div class="loading">Загрузка данных...</div>';
}

// Показать ошибку
function showError() {
    document.getElementById('movieList').innerHTML = 
        '<p class="error">Не удалось загрузить данные. Пожалуйста, попробуйте позже.</p>';
}

// Загрузка игр с сервера
async function loadMovies(filters = {}) {
    const params = new URLSearchParams();
    for (const key in filters) {
        if (filters[key]) {
            params.append(key, filters[key]);
        }
    }
    
    const response = await fetch(`/api/movies?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Ошибка сети');
    }
    return await response.json();
}

// Отрисовка списка игр
function renderMovies(movies) {
    const movieList = document.getElementById('movieList');
    
    if (movies.length === 0) {
        movieList.innerHTML = '<p class="no-results">По вашему запросу игр не найдено</p>';
        return;
    }
    
    movieList.innerHTML = movies.map(movie => `
    <div class="movie-card" data-movie-id="${movie.id}">
        <div class="movie-image-container">
            <img src="${movie.image}" alt="${movie.title}" class="movie-image">
        </div>
        <div class="movie-content">
            <h3 class="movie-title">${movie.title}</h3>
            <div class="movie-genres">
                ${movie.genres.map(genre => `<span class="movie-genre">${genre}</span>`).join('')}
            </div>
            <button class="show-more-btn">Подробнее</button>
        </div>
    </div>
`).join('');
    
    // Инициализация обработчиков кликов по карточкам
    initMovieCardHandlers();
}

// Инициализация обработчиков кликов по карточкам
function initMovieCardHandlers() {
    document.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Игнорируем клики по кнопке "Подробнее"
            if (!e.target.classList.contains('show-more-btn')) {
                const movieId = this.dataset.movieId;
                showmovieDetails(movieId);
            }
        });
    });
    
    document.querySelectorAll('.show-more-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const movieId = this.closest('.movie-card').dataset.movieId;
            showMovieDetails(movieId);
        });
    });
}

// Показать детали игры в модальном окне
async function showMovieDetails(movieId) {
    try {
        const response = await fetch(`/api/movies/${movieId}`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки данных игры');
        }
        const movie = await response.json();
        
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h2 class="modal-movie-title">${movie.title}</h2>
            <img src="${movie.image}" alt="${movie.title}" class="modal-movie-image">
            
            <div class="modal-movie-info">
                <div class="modal-movie-genres">
                    ${movie.genres.map(genre => `<span class="movie-genre">${genre}</span>`).join('')}
                </div>
                <div class="modal-movie-rating">Рейтинг: ${movie.rating}/10</div>
            </div>
            
            <p class="modal-movie-description">${movie.description}</p>
            
            <div class="modal-reviews-section">
                <h3>Отзывы (${movie.reviews.length}):</h3>
                ${movie.reviews.map(review => `
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
        
        document.getElementById('movieModal').style.display = 'block';
    } catch (error) {
        console.error('Ошибка загрузки деталей игры:', error);
        alert('Не удалось загрузить информацию об игре');
    }
}