// controllers/classController.js
const Classroom = require('../models/Classroom');
const User = require('../models/User');

exports.createClass = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только admin может создавать классы' });
    }
    const { name } = req.body;
    const existing = await Classroom.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Класс с таким названием уже существует' });
    }

    const newClass = await Classroom.create({ name });
    res.status(201).json({ message: 'Класс создан', classroom: newClass });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании класса', error: error.message });
  }
};

exports.getAllClasses = async (req, res) => {
  try {
    // Admin или teacher тоже может смотреть (например, teacherPanel)
    // Но если нужно ограничить — можете поставить checkRole
    const classes = await Classroom.find()
      .populate('teachers', '-password')
      .populate('students', '-password');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении классов', error: error.message });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const cls = await Classroom.findById(req.params.id)
      .populate('teachers', '-password')
      .populate('students', '-password');
    if (!cls) {
      return res.status(404).json({ message: 'Класс не найден' });
    }
    res.json(cls);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.updateClass = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только admin может обновлять класс' });
    }
    const { name, teachers, students } = req.body;
    const cls = await Classroom.findById(req.params.id);
    if (!cls) {
      return res.status(404).json({ message: 'Класс не найден' });
    }

    if (name) cls.name = name;
    if (teachers) cls.teachers = teachers;
    if (students) cls.students = students;

    await cls.save();

    // Опционально: можно синхронизировать user.classRooms
    // Для простоты опустим.
    
    res.json({
      message: 'Класс обновлён',
      classroom: await Classroom.findById(req.params.id)
        .populate('teachers', '-password')
        .populate('students', '-password'),
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только admin может удалять класс' });
    }
    const cls = await Classroom.findById(req.params.id);
    if (!cls) {
      return res.status(404).json({ message: 'Класс не найден' });
    }

    // Удаляем ссылки на класс у пользователей
    await User.updateMany(
      { classRooms: cls._id },
      { $pull: { classRooms: cls._id } }
    );

    await cls.deleteOne();

    res.json({ message: 'Класс удалён' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении класса', error: error.message });
  }
};