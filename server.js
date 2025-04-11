require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const connectDB = require('./config/db'); // ✅ нормальный импорт

// Middleware
app.use(cors());
app.use(express.json());

// Роуты
const userRoutes = require('./routes/userRoutes');
const classRoutes = require('./routes/classRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const homeworkRoutes = require('./routes/homeworkRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/homeworks', homeworkRoutes);
app.use('/api/notifications', notificationRoutes);

// Порт
const PORT = process.env.PORT || 5050;

// Запуск сервера
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server is listening on port ${PORT}`);
  });
});