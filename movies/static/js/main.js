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
        <div class="movie-card">
            <img src="${movie.image}" alt="${movie.title}" class="movie-image">
            <div class="movie-content">
                <h2 class="movie-title">${movie.title}</h2>
                ${movie.genres.map(genre => `<span class="movie-genre">${genre}</span>`).join('')}
                <p class="movie-description">${movie.description}</p>
                <div class="movie-rating">Рейтинг: ${movie.rating}/10</div>
                <div class="movie-reviews-count">Отзывов: ${movie.reviews.length}</div>
                
                <div class="reviews-section">
                    <h3>Отзывы:</h3>
                    ${movie.reviews.map((review, index) => `
                        <div class="review" ${index >= 2 ? 'hidden' : ''}>
                            <div class="review-author">${review.author}</div>
                            <div class="review-date">${review.date}</div>
                            <div class="review-rating">Оценка: ${review.rating}/10</div>
                            <p class="review-text">${review.text}</p>
                        </div>
                    `).join('')}
                    ${movie.reviews.length > 2 ? 
                        `<button class="show-more-reviews" data-movie-id="${movie.id}">
                            Показать все отзывы (${movie.reviews.length - 2} ещё)
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
            const movieId = this.dataset.movieId;
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