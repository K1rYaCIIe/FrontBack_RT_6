import { API_URL } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const registerForm = document.getElementById('register-form');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            try {
                // Валидация
                if (!username || !password) {
                    throw new Error('Username and password are required');
                }

                if (username.length < 4) {
                    throw new Error('Username must be at least 4 characters');
                }

                if (password.length < 6) {
                    throw new Error('Password must be at least 6 characters');
                }

                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include', // Важно для кук!
                    body: JSON.stringify({
                        username,
                        password
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Registration failed');
                }

                alert('Registration successful! Redirecting to login...');
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Registration error:', error);
                alert(`Error: ${error.message}`);
            }
        });
    }
});