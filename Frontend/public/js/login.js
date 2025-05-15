import { API_URL } from './auth.js';

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    try {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Важно для работы с куками!
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Login failed');
        }

        // После успешного логина редирект
        window.location.href = 'protected.html';
    } catch (error) {
        console.error('Login error:', error);
        alert(error.message || 'Login error');
    }
});