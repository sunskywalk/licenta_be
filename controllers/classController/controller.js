const service = require('./service');

function sendResult(res, result) {
  return res.status(result.status).json(result.body);
}

async function createClass(req, res) {
  try {
    const result = await service.createClass(req.body, req.user);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка при создании класса', error: error.message });
  }
}

async function getAllClasses(req, res) {
  try {
    const classes = await service.getAllClasses();
    return res.json(classes);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка при получении классов', error: error.message });
  }
}

async function getClassById(req, res) {
  try {
    const cls = await service.getClassById(req.params.id);
    if (!cls) {
      return res.status(404).json({ message: 'Класс не найден' });
    }
    return res.json(cls);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

async function updateClass(req, res) {
  try {
    const result = await service.updateClass(req.params.id, req.body, req.user);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

async function deleteClass(req, res) {
  try {
    const result = await service.deleteClass(req.params.id, req.user);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка при удалении класса', error: error.message });
  }
}

async function assignHomeroomTeacher(req, res) {
  try {
    const result = await service.assignHomeroomTeacher(req.params.id, req.body.teacherId, req.user);
    return sendResult(res, result);
  } catch (error) {
    console.error('[assignHomeroomTeacher]', error);
    return res.status(500).json({ message: 'Ошибка при назначении классного руководителя', error: error.message });
  }
}

async function getClassWithStats(req, res) {
  try {
    const result = await service.getClassWithStats(req.params.id, req.user, req.query.year);
    return sendResult(res, result);
  } catch (error) {
    console.error('[getClassWithStats]', error);
    return res.status(500).json({ message: 'Ошибка при получении статистики класса', error: error.message });
  }
}

async function addStudentToClass(req, res) {
  try {
    const { classId, studentId } = req.body;
    const result = await service.addStudentToClass(classId, studentId, req.user);
    return sendResult(res, result);
  } catch (error) {
    console.error('[addStudentToClass]', error);
    return res.status(500).json({ message: 'Ошибка при добавлении ученика', error: error.message });
  }
}

async function removeStudentFromClass(req, res) {
  try {
    const { classId, studentId } = req.body;
    const result = await service.removeStudentFromClass(classId, studentId, req.user);
    return sendResult(res, result);
  } catch (error) {
    console.error('[removeStudentFromClass]', error);
    return res.status(500).json({ message: 'Ошибка при удалении ученика', error: error.message });
  }
}

async function getAvailableStudents(req, res) {
  try {
    const result = await service.getAvailableStudents(req.query, req.user);
    return sendResult(res, result);
  } catch (error) {
    console.error('[getAvailableStudents]', error);
    return res.status(500).json({ message: 'Ошибка при получении списка учеников', error: error.message });
  }
}

async function getAllTeachers(req, res) {
  try {
    const result = await service.getAllTeachers(req.query, req.user);
    return sendResult(res, result);
  } catch (error) {
    console.error('[getAllTeachers]', error);
    return res.status(500).json({ message: 'Ошибка при получении списка учителей', error: error.message });
  }
}

async function getAllStudentsForClass(req, res) {
  try {
    const result = await service.getAllStudentsForClass(req.query, req.user);
    return sendResult(res, result);
  } catch (error) {
    console.error('[getAllStudentsForClass]', error);
    return res.status(500).json({ message: 'Ошибка при получении списка учеников', error: error.message });
  }
}

async function getSubjectsList(req, res) {
  try {
    const result = service.getSubjectsList(req.user);
    return sendResult(res, result);
  } catch (error) {
    console.error('[getSubjectsList]', error);
    return res.status(500).json({ message: 'Ошибка при получении списка предметов', error: error.message });
  }
}

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  assignHomeroomTeacher,
  getClassWithStats,
  addStudentToClass,
  removeStudentFromClass,
  getAvailableStudents,
  getAllTeachers,
  getAllStudentsForClass,
  getSubjectsList,
};
