import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5500;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Маршруты
app.get(['/', '/login', '/protected', '/register'], (req, res) => {
  let page = req.path.slice(1) || 'index';
  res.sendFile(path.join(__dirname, 'public', `${page}.html`));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`
  Сервер запущен на http://localhost:${PORT}
  Доступные страницы:
  • Главная: http://localhost:${PORT}
  • Логин: http://localhost:${PORT}/login
  • Защищенная: http://localhost:${PORT}/protected
  • Регистрация: http://localhost:${PORT}/register
  `);
});