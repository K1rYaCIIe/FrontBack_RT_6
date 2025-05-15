export const API_URL = 'http://localhost:5000';

// Проверка авторизации
export async function isAuth() {
  try {
    const response = await fetch(`${API_URL}/profile`, {
      credentials: 'include'
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Защищенные запросы
export async function fetchWithAuth(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: 'include'
  });
}

// Выход из системы
export async function logout() {
  try {
    console.log('Attempting logout...'); // Логирование
    const response = await fetch(`${API_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Logout response:', response.status); // Логирование
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Logout failed');
    }

    localStorage.removeItem('theme');
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Logout failed:', error);
    window.location.href = '/login.html';
  }
}

// Проверка авторизации (альтернативное название)
export async function checkAuth() {
  return isAuth();
}