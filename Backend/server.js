require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors({
  origin: 'http://localhost:5500',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Authorization']
}));
app.options('*', cors());

const morgan = require('morgan');
app.use(morgan('dev'));
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY || 'fallback_secret_key';
const PORT = process.env.PORT || 5000;
const USERS_FILE = path.join(__dirname, 'users.json');

// Инициализация файла с пользователями
async function initUsersFile() {
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify([]));
  }
}

// Middleware для проверки JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Authorization token is required' 
      });
    }
  
    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) {
        return res.status(403).json({ 
          status: 'error',
          message: 'Invalid or expired token' 
        });
      }
      req.user = user;
      next();
    });
  }

// Регистрация
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Валидация входных данных
        if (!username || !password) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Username and password are required' 
            });
        }

        if (username.length < 4) {
            return res.status(400).json({
                status: 'error',
                message: 'Username must be at least 4 characters'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                status: 'error', 
                message: 'Password must be at least 6 characters'
            });
        }

        // Чтение и проверка файла пользователей
        let users;
        try {
            const data = await fs.readFile(USERS_FILE, 'utf8');
            users = data ? JSON.parse(data) : [];
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Файл не существует - создаем новый
                users = [];
                await fs.writeFile(USERS_FILE, JSON.stringify(users));
            } else {
                console.error('Error reading users file:', error);
                return res.status(500).json({
                    status: 'error',
                    message: 'Server configuration error'
                });
            }
        }

        // Проверка уникальности username (case insensitive)
        const normalizedUsername = username.trim().toLowerCase();
        if (users.some(u => u.username.toLowerCase() === normalizedUsername)) {
            return res.status(409).json({
                status: 'error',
                message: 'Username already taken'
            });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: uuidv4(), // Лучше использовать UUID вместо последовательных ID
            username: username.trim(),
            password: hashedPassword,
            created_at: new Date().toISOString()
        };

        users.push(newUser);

        // Запись в файл с обработкой ошибок
        try {
            await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        } catch (error) {
            console.error('Error writing to users file:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Could not save user data'
            });
        }

        // Генерация токена
        const token = jwt.sign(
            {
                user_id: newUser.id,
                username: newUser.username
            },
            SECRET_KEY,
            { expiresIn: '1h' } // Увеличенное время жизни токена
        );

        // Успешный ответ
        res.status(201).json({
            status: 'success',
            data: {
                token,
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    created_at: newUser.created_at
                }
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            status: 'error',
            message: process.env.NODE_ENV === 'development' 
                ? error.message 
                : 'Internal server error'
        });
    }
});

// Логин
app.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          status: 'error',
          message: 'Username and password required!' 
        });
      }
  
      const users = JSON.parse(await fs.readFile(USERS_FILE));
      const user = users.find(u => u.username === username);
      
      if (!user) {
        return res.status(404).json({ 
          status: 'error',
          message: 'User not found!' 
        });
      }
  
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ 
          status: 'error',
          message: 'Wrong password!' 
        });
      }
  
      const token = jwt.sign(
        { 
          user_id: user.id,
          username: user.username
        },
        SECRET_KEY,
        { expiresIn: '1h' } // Унифицированное время жизни токена
      );
  
      res.json({
        status: 'success',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'Internal server error'
      });
    }
  });

// Защищённый маршрут
app.get('/protected', authenticateToken, (req, res) => {
    try {
      res.json({
        status: 'success',
        data: {
          message: 'This is protected data!',
          user_id: req.user.user_id,
          username: req.user.username
        }
      });
    } catch (error) {
      console.error('Protected route error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  });

// Инициализация и запуск сервера
async function startServer() {
  await initUsersFile();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
});

startServer();