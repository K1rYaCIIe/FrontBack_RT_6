require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;
const USERS_FILE = path.join(__dirname, 'users.json');

// Middleware
app.use(cors({
  origin: 'http://localhost:5500',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['set-cookie']
}));

app.use(express.json());
app.use(helmet());

// Настройка сессий
app.use(session({
  store: new FileStore({ path: './sessions' }),
  secret: process.env.SESSION_SECRET || 'fallback_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 день
  }
}));

// Лимитер запросов
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100
});
app.use(limiter);

// Инициализация файла пользователей
async function initUsersFile() {
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify([]));
  }
}

// Middleware для проверки сессии
function checkSession(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ 
      status: 'error',
      error: 'Unauthorized',
      message: 'Please login first'
    });
  }
  next();
}

// Регистрация
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const users = JSON.parse(await fs.readFile(USERS_FILE));
    if (users.some(u => u.username === username)) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

    req.session.userId = newUser.id;
    res.status(201).json({ 
      message: 'User registered', 
      user: { id: newUser.id, username }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Логин
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = JSON.parse(await fs.readFile(USERS_FILE));
    const user = users.find(u => u.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    res.json({ 
      message: 'Login successful', 
      user: { id: user.id, username }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Профиль пользователя
app.get('/profile', checkSession, async (req, res) => {
  try {
    const users = JSON.parse(await fs.readFile(USERS_FILE));
    const user = users.find(u => u.id === req.session.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      user: { 
        id: user.id, 
        username: user.username,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Выход
app.post('/logout', (req, res) => {
  console.log('Logout requested'); // Логирование
  req.session.destroy(err => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.status(500).json({ 
        status: 'error',
        message: 'Could not destroy session'
      });
    }

    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax'
    });
    
    console.log('Logout successful'); // Логирование
    res.json({ status: 'success', message: 'Logged out' });
  });
});

// Кэшированные данные
let dataCache = {
  timestamp: 0,
  data: null
};

app.get('/data', checkSession, (req, res) => {
  const now = Date.now();
  if (dataCache.timestamp > now - 60 * 1000) {
    return res.json({ data: dataCache.data, cached: true });
  }

  const newData = {
    items: ['Item 1', 'Item 2'],
    generatedAt: new Date().toISOString()
  };

  dataCache = {
    timestamp: now,
    data: newData
  };

  res.json({ data: newData, cached: false });
});

// Защищенный роут
app.get('/protected', checkSession, async (req, res) => {
  try {
    const users = JSON.parse(await fs.readFile(USERS_FILE));
    const user = users.find(u => u.id === req.session.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      status: 'success',
      data: {
        user_id: user.id,
        username: user.username,
        message: 'This is protected data!'
      }
    });
  } catch (error) {
    console.error('Protected route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Обработка 404
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});
// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    status: 'error',
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Запуск сервера
async function startServer() {
  await initUsersFile();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Available routes:');
    console.log('POST /register - User registration');
    console.log('POST /login - User login');
    console.log('GET /profile - User profile (protected)');
    console.log('GET /protected - Protected data (protected)');
    console.log('GET /data - Cached data (protected)');
    console.log('POST /logout - User logout');
  });
}

startServer();