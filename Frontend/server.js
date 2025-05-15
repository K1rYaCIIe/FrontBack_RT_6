import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5500;

// Middleware
app.use(cors({
  origin: 'http://localhost:5000',
  credentials: true
}));

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

app.use(helmet());

// Лимитер запросов
app.use('/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
}));

// Маршруты
app.get(['/', '/login', '/protected', '/register'], (req, res) => {
  let page = req.path.slice(1) || 'index';
  res.sendFile(path.join(__dirname, 'public', `${page}.html`));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`
  Frontend server running on http://localhost:${PORT}
  Available pages:
  • Home: http://localhost:${PORT}
  • Login: http://localhost:${PORT}/login
  • Protected: http://localhost:${PORT}/protected
  • Register: http://localhost:${PORT}/register
  `);
});