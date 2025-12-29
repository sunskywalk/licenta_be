// reset-admin-password.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/schoolCatalog';

async function resetAdminPassword() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected...');

    // Находим админа
    const admin = await User.findOne({ email: 'admin@school.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found. Creating new admin...');
      const newAdmin = await User.create({
        name: 'Director General',
        email: 'admin@school.com',
        password: 'admin123',
        role: 'admin',
        classRooms: [],
      });
      console.log('✅ Admin created:', newAdmin.email);
    } else {
      console.log('✅ Admin found:', admin.email);
      // Сбрасываем пароль - модель автоматически захеширует его
      admin.password = 'admin123';
      await admin.save();
      console.log('✅ Admin password reset to: admin123');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();

