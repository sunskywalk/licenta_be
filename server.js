/****************************************************************************************
 *  server.js — точка входа backend-приложения «School-Catalog»
 *              Работаем на PORT из .env (по умолчанию 5050)
 ****************************************************************************************/

require('dotenv').config();                           // .env -> process.env
console.log('[DEBUG] dotenv loaded');

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');             // ДОЛЖНА возвращать Promise!

console.log('[DEBUG] libs imported');

console.log("Loading routes"); const app = express();

// ────────────────────── Middleware ──────────────────────
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('[DEBUG] middleware registered');

// ────────────────────── Test-маршрут ────────────────────
app.get('/api/ping', (_, res) => res.send('pong'));

// ────────────────────── Основные роуты ──────────────────
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/schedule', require('./routes/scheduleRoutes'));
app.use('/api/grades', require('./routes/gradeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/homeworks', require('./routes/homeworkRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/school-events', require('./routes/schoolEventRoutes'));
app.use('/api/academic-years', require('./routes/academicYearRoutes'));
app.use('/api/year-transition', require('./routes/yearTransitionRoutes'));

const PORT = process.env.PORT || 3000;

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