// controllers/userController.js
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// ========================
// 1. Регистрация (admin)
// ========================
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, classRooms } = req.body;

    // Проверяем - только admin может создавать
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только admin может создавать пользователей' });
    }

    // Проверим email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role,
      classRooms: classRooms || [],
    });

    // Добавим этого пользователя в classrooms (учителя в teachers, ученика в students)
    if (classRooms && Array.isArray(classRooms)) {
      for (let clsId of classRooms) {
        const cls = await Classroom.findById(clsId);
        if (cls) {
          if (role === 'teacher') {
            cls.teachers.push(newUser._id);
          } else if (role === 'student') {
            cls.students.push(newUser._id);
          }
          await cls.save();
        }
      }
    }

    res.status(201).json({
      message: 'Пользователь создан',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        classRooms: newUser.classRooms,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании пользователя', error: error.message });
  }
};

// ========================
// 2. Логин
// ========================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('classRooms');
    if (!user) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    // Генерируем токен
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Успешный вход',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        classRooms: user.classRooms,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при входе', error: error.message });
  }
};

// ========================
// 3. Список всех пользователей (admin)
// ========================
exports.getAllUsers = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав' });
    }
    const users = await User.find().select('-password').populate('classRooms');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении пользователей', error: error.message });
  }
};

// ========================
// 3.5. Получить только администраторов (для поддержки)
// ========================
exports.getAdminUsers = async (req, res) => {
  try {
    // Любой авторизованный пользователь может получить список админов для отправки поддержки
    const adminUsers = await User.find({ role: 'admin' }).select('_id name email role');
    res.json(adminUsers);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении администраторов', error: error.message });
  }
};

// ========================
// 4. Получить 1 пользователя
// ========================
exports.getUserById = async (req, res) => {
  try {
    // admin или сам пользователь
    const userId = req.params.id;
    if (!req.user || (req.user.role !== 'admin' && req.user.userId !== userId)) {
      return res.status(403).json({ message: 'Нет прав' });
    }
    const user = await User.findById(userId).select('-password').populate('classRooms');
    if (!user) {
      return res.status(404).json({ message: 'Не найден' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

// ========================
// 5. Обновить пользователя
// ========================
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, password, role, classRooms } = req.body;
    
    // admin может менять любого, пользователь - только себя (без смены роли)
    if (!req.user || (req.user.role !== 'admin' && req.user.userId !== userId)) {
      return res.status(403).json({ message: 'Нет прав' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    // Роль меняет только admin
    if (role && req.user.role === 'admin') {
      user.role = role;
    }

    // classRooms - тоже только admin
    if (classRooms && req.user.role === 'admin') {
      // Удалим пользователя из прежних классов
      // И добавим в новые
      // Здесь простая реализация: заново переприсваиваем
      // 1) Найдём все классы, где он был teacher/students, уберём
      const allOldClasses = await Classroom.find({
        $or: [
          { teachers: userId },
          { students: userId },
        ],
      });
      for (const c of allOldClasses) {
        c.teachers = c.teachers.filter(t => t.toString() !== userId);
        c.students = c.students.filter(s => s.toString() !== userId);
        await c.save();
      }

      // 2) Добавим к новым
      for (const clsId of classRooms) {
        const cls = await Classroom.findById(clsId);
        if (cls) {
          if (user.role === 'teacher') {
            cls.teachers.push(user._id);
          } else if (user.role === 'student') {
            cls.students.push(user._id);
          }
          await cls.save();
        }
      }

      user.classRooms = classRooms;
    }

    await user.save();

    res.json({
      message: 'Пользователь обновлён',
      user: await User.findById(userId).select('-password').populate('classRooms'),
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении', error: error.message });
  }
};

// ========================
// 6. Удалить пользователя
// ========================
exports.deleteUser = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нет прав (только admin)' });
    }
    const userId = req.params.id;
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Удалим ссылки из классов
    const classes = await Classroom.find({
      $or: [
        { teachers: userId },
        { students: userId },
      ],
    });
    for (let cls of classes) {
      cls.teachers = cls.teachers.filter(t => t.toString() !== userId);
      cls.students = cls.students.filter(s => s.toString() !== userId);
      await cls.save();
    }

    await userToDelete.deleteOne();

    res.json({ message: 'Пользователь удалён', userId });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении', error: error.message });
  }
};