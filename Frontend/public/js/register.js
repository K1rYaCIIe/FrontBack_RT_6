// Подключение необходимых функций из auth.js
import { saveToken, API_URL } from './auth.js'; 


// Ожидание полной загрузки DOM
document.addEventListener('DOMContentLoaded', async () => {
    const registerForm = document.getElementById('register-form');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                if (!username || !password) {
                    throw new Error('Username and password are required');
                }

                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username.trim(),
                        password: password.trim()
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || errorData.error || 'Registration failed');
                }

                const data = await response.json();
                saveToken(data.token);
                
                alert('Registration successful! Redirecting to login...');
                window.location.href = 'login.html';
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error('Registration error:', errorMessage);
                alert(`Error: ${errorMessage}`);
            }
        });
    }
});