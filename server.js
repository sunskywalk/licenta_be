/****************************************************************************************
 *  server.js — точка входа backend-приложения «School-Catalog»
 *              Работаем на PORT из .env (по умолчанию 5050)
 ****************************************************************************************/

require('dotenv').config();                           // .env -> process.env
console.log('[DEBUG] dotenv loaded');

const express   = require('express');
const cors      = require('cors');
const connectDB = require('./config/db');             // ДОЛЖНА возвращать Promise!

console.log('[DEBUG] libs imported');

const app = express();

// ────────────────────── Middleware ──────────────────────
app.use(cors());
app.use(express.json());
console.log('[DEBUG] middleware registered');

// ────────────────────── Test-маршрут ────────────────────
app.get('/api/ping', (_, res) => res.send('pong'));

// ────────────────────── Основные роуты ──────────────────
app.use('/api/users',        require('./routes/userRoutes'));
app.use('/api/classes',      require('./routes/classRoutes'));
app.use('/api/schedules',    require('./routes/scheduleRoutes'));
app.use('/api/grades',       require('./routes/gradeRoutes'));
app.use('/api/attendance',   require('./routes/attendanceRoutes'));
app.use('/api/homeworks',    require('./routes/homeworkRoutes'));
app.use('/api/notifications',require('./routes/notificationRoutes'));

const PORT = process.env.PORT || 5050;

// ────────────────────── Запуск ──────────────────────────
(async () => {
  try {
    console.log('[DEBUG] connecting to Mongo…');
    await connectDB();                                // ждём успешного коннекта
    console.log('[DEBUG] DB OK, starting HTTP…');

    app.listen(PORT, () =>
      console.log(`✅  Server is listening on port ${PORT}`),
    );
  } catch (err) {
    console.error('[FATAL] DB connection failed:', err.message);
    process.exit(1);                                  // гасим процесс, чтобы не висел
  }
})();