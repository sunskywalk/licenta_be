const express = require('express');
const app = express();
const port = 3000;

// Middleware для обработки JSON
app.use(express.json());

// Маршрут по умолчанию
app.get('/', (req, res) => {
    res.send('Привет, мир!');
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
