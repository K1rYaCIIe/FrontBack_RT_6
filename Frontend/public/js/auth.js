// Конфиг API
const API_URL = "http://localhost:5000";

// Сохранить JWT в localStorage
function saveToken(token) {
    localStorage.setItem("jwt_token", token);
}

// Получить JWT
function getToken() {
    return localStorage.getItem("jwt_token");
}

// Удалить JWT (выход)
function logout() {
    localStorage.removeItem("jwt_token");
    window.location.href = "login.html";
}

async function checkAuth() {
    const token = getToken();
    if (!token) return false;
    
    try {
        const response = await fetch(`${API_URL}/protected`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Auth check failed:', error);
        return false;
    }
}

// Запрос с авторизацией
async function fetchWithAuth(url, options = {}) {
    const token = getToken();
    if (!token) throw new Error("No token");

    const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers
    };

    return fetch(url, { ...options, headers });
}

// Экспортируем все функции одним объектом
export {
    API_URL,
    saveToken,
    getToken,
    logout,
    checkAuth,
    fetchWithAuth
};