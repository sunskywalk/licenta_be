// controllers/userController.js
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// ======================
// Регистрация пользователя (только admin)
// ======================
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, classRooms } = req.body;

    // Проверка: только admin может создавать новых пользователей
    //if (req.user.role !== 'admin') {
    //  return res.status(403).json({ message: 'Только админ может создавать пользователей' });
   // }

    // Проверяем, существует ли пользователь с таким e-mail
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    // Создаем пользователя
    const newUser = await User.create({
      name,
      email,
      password,
      role,
      classRooms: classRooms || [],
    });

    // Если нужно, добавляем пользователя в массив студентов/учителей соответствующих классов
    if (classRooms && Array.isArray(classRooms)) {
      for (let clsId of classRooms) {
        const classroom = await Classroom.findById(clsId);
        if (classroom) {
          if (role === 'student') {
            classroom.students.push(newUser._id);
          } else if (role === 'teacher') {
            classroom.teachers.push(newUser._id);
          }
          await classroom.save();
        }
      }
    }

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        classRooms: newUser.classRooms,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при регистрации', error: error.message });
  }
};

// ======================
// Логин
// ======================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Ищем пользователя
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    // Проверяем пароль
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    // Генерируем токен
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Успешный вход в систему',
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

// ======================
// Список пользователей (admin)
// ======================
exports.getAllUsers = async (req, res) => {
  try {
    // Только админ
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только админ может смотреть всех пользователей' });
    }
    const users = await User.find().select('-password').populate('classRooms');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении пользователей', error: error.message });
  }
};

// ======================
// Получить конкретного пользователя
// ======================
exports.getUserById = async (req, res) => {
  try {
    // любой авторизованный может получить, но чаще — только админ или сам пользователь
    const userId = req.params.id;

    if (req.user.role !== 'admin' && req.user.userId !== userId) {
      return res.status(403).json({ message: 'Нет доступа к этому профилю' });
    }

    const user = await User.findById(userId).select('-password').populate('classRooms');
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении пользователя', error: error.message });
  }
};

// ======================
// Обновить пользователя (admin или сам пользователь)
// ======================
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, password, role, classRooms } = req.body;

    // Проверка прав: админ может менять кого угодно, 
    // пользователь — только себя (но без изменения роли)
    if (req.user.role !== 'admin' && req.user.userId !== userId) {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Обновляем поля
    if (name) user.name = name;
    if (email) user.email = email;
    // Пароль меняем отдельно
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    // Роль может менять только админ
    if (role && req.user.role === 'admin') {
      user.role = role;
    }

    // При желании обновляем классы (только админ)
    if (classRooms && req.user.role === 'admin') {
      // Удалим пользователя из старых классов
      // (если старая логика требует)
      // затем добавим в новые классы:
      user.classRooms = classRooms;
      // Можно сделать дополнительную логику для Classroom:
      // 1) Вычистить из старых classroom (teachers/students) — 
      // 2) Добавить в новые...
      // Ниже — упрощённая схема, когда мы только добавляем/обновляем.
      // Для полноты лучше писать отдельную бизнес-логику.
    }

    await user.save();

    res.json({
      message: 'Пользователь обновлён',
      user: await User.findById(userId).select('-password').populate('classRooms'),
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении пользователя', error: error.message });
  }
};

// ======================
// Удалить пользователя (admin)
// ======================
exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только админ может удалять пользователей' });
    }

    const userId = req.params.id;
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Удаляем ссылку из Classroom
    const allClassrooms = await Classroom.find({ 
      $or: [
        { teachers: userId },
        { students: userId }
      ]
    });
    for (let cls of allClassrooms) {
      cls.teachers = cls.teachers.filter(t => t.toString() !== userId);
      cls.students = cls.students.filter(s => s.toString() !== userId);
      await cls.save();
    }

    await userToDelete.deleteOne();

    res.json({ message: 'Пользователь удалён', userId });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении пользователя', error: error.message });
  }
};