import { checkAuth, logout, fetchWithAuth, API_URL } from './auth.js';

// Перенаправление если не авторизован
if (!checkAuth() && window.location.pathname.includes('protected.html')) {
    window.location.href = 'login.html';
    throw new Error('Redirecting to login');
}

// Проверка авторизации при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => { // Добавлено async
    // Элементы страницы
    const authSection = document.getElementById('auth-section');
    const protectedSection = document.getElementById('protected-section');
    const logoutBtn = document.getElementById('logout-btn');
    const userData = document.getElementById('user-data');

    // Если на странице есть защищённая секция
    if (protectedSection) {
        try {
            // Проверяем авторизацию асинхронно
            const authValid = await checkAuth(); // Теперь await работает правильно
            if (!authValid) {
                logout();
                return;
            }

            // Скрываем auth-section если он есть
            if (authSection) {
                authSection.style.display = 'none';
            }
            
            // Показываем защищённый контент
            protectedSection.style.display = 'block';
            
            // Загружаем данные
            await fetchProtectedData(); // Добавлен await
        } catch (error) {
            console.error('Auth check failed:', error);
            logout();
        }
    }

    // Обработчик кнопки выхода
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

// Запрос к защищённому API (оставляем без изменений)
async function fetchProtectedData() {
    const userData = document.getElementById('user-data');
    if (!userData) return;
    
    try {
        userData.innerHTML = '<p>Loading...</p>';
        const response = await fetchWithAuth(`${API_URL}/protected`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch protected data');
        }
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const data = await response.json();
        userData.innerHTML = `
            <p>User ID: ${data.data.user_id}</p>
            <p>Username: ${data.data.username}</p>
            <p>${data.data.message}</p>
        `;
    } catch (error) {
        userData.innerHTML = '<p class="error">Error loading data</p>';
        console.error('Error:', error);
        logout();
    }
}