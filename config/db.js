// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/schoolCatalog';
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected!');
  } catch (err) {
    console.error('❌ Error connecting to MongoDB:', err.message);
    process.exit(1); // Остановить сервер, если база не подключена
  }
};

module.exports = connectDB;