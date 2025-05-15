import { logout, fetchWithAuth, API_URL, checkAuth } from './auth.js';

function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) {
      console.error('Logout button not found!');
      return;
    }
  
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('Logout button clicked'); // Логирование
      
      try {
        logoutBtn.disabled = true;
        logoutBtn.textContent = 'Выход...';
        
        await logout();
      } catch (error) {
        console.error('Logout handler error:', error);
        logoutBtn.disabled = false;
        logoutBtn.textContent = '🚪 Выйти';
        alert('Ошибка при выходе: ' + error.message);
      }
    });
}

// Инициализация темы
function initTheme() {
    // Проверяем сохраненную тему
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Устанавливаем начальную тему
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    applyTheme(initialTheme);
    
    // Обработчик кнопки
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
}
  
function applyTheme(theme) {
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
}
  
function toggleTheme() {
    const isDark = document.body.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
}

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    setupLogoutButton();
    const authSection = document.getElementById('auth-section');
    const protectedSection = document.getElementById('protected-section');
    const logoutBtn = document.getElementById('logout-btn');
    const refreshBtn = document.getElementById('refresh-data');

    try {
        const authValid = await checkAuth();
        if (!authValid) {
            window.location.href = 'login.html';
            return;
        }

        if (authSection) authSection.style.display = 'none';
        if (protectedSection) protectedSection.style.display = 'block';
        
        await fetchProtectedData();

        // Обработчики событий
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', fetchProtectedData);
        }

    } catch (error) {
        console.error('Auth check failed:', error);
        logout();
    }
});

async function fetchProtectedData() {
    const userData = document.getElementById('user-data');
    if (!userData) return;
    
    try {
        userData.innerHTML = '<p>Loading...</p>';
        
        const response = await fetchWithAuth(`${API_URL}/protected`);
        
        console.log('Response status:', response.status); // Добавьте лог
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data); // Логируем данные
        
        userData.innerHTML = `
            <p>User ID: ${data.data?.user_id || data.user?.id || 'N/A'}</p>
            <p>Username: ${data.data?.username || data.user?.username || 'N/A'}</p>
            <p>${data.data?.message || data.message || 'Welcome!'}</p>
        `;
    } catch (error) {
        console.error('Fetch error:', error);
        userData.innerHTML = `
            <p class="error">Error loading data</p>
            <p>${error.message}</p>
        `;
        
        if (error.message.includes('401')) {
            logout(); // Разлогиниваем при 401 ошибке
        }
    }
}