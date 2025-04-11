// controllers/classController.js
const Classroom = require('../models/Classroom');
const User = require('../models/User');

// Создать класс
exports.createClass = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только админ может создавать классы' });
    }

    const { name } = req.body;
    const existing = await Classroom.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Класс с таким названием уже существует' });
    }

    const newClassroom = await Classroom.create({ name });
    res.status(201).json({
      message: 'Класс создан',
      classroom: newClassroom,
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании класса', error: error.message });
  }
};

// Получить все классы
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Classroom.find()
      .populate('teachers', '-password')
      .populate('students', '-password');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении списка классов', error: error.message });
  }
};

// Получить класс по ID
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
    res.status(500).json({ message: 'Ошибка при получении класса', error: error.message });
  }
};

// Обновить класс (добавить/удалить учителей/студентов)
exports.updateClass = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только админ может обновлять класс' });
    }

    const { name, teachers, students } = req.body;
    const cls = await Classroom.findById(req.params.id);
    if (!cls) {
      return res.status(404).json({ message: 'Класс не найден' });
    }

    // Обновляем название
    if (name) {
      cls.name = name;
    }
    // Обновляем учителей, если переданы
    if (teachers) {
      cls.teachers = teachers; 
      // Можно дописать доп. проверки (существуют ли эти User c role=teacher и т.д.)
    }
    // Обновляем студентов, если переданы
    if (students) {
      cls.students = students; 
      // Аналогично можно делать валидацию
    }

    await cls.save();

    // Дополнительно, можно синхронизировать user.classRooms (не обязательно)
    // В учебном примере пропустим детальную синхронизацию.

    res.json({
      message: 'Класс обновлён',
      classroom: await Classroom.findById(req.params.id)
        .populate('teachers', '-password')
        .populate('students', '-password'),
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении класса', error: error.message });
  }
};

// Удалить класс
exports.deleteClass = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только админ может удалять класс' });
    }

    const cls = await Classroom.findById(req.params.id);
    if (!cls) {
      return res.status(404).json({ message: 'Класс не найден' });
    }

    // При желании можно очистить класс у пользователей
    // (если нужно отдельное поведение)
    await cls.deleteOne();

    res.json({ message: 'Класс удалён' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении класса', error: error.message });
  }
};