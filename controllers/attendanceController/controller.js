const service = require('./service');
const { validateMarkAttendanceBody, validateBulkAttendanceBody } = require('./validators');

async function markAttendance(req, res) {
  const validation = validateMarkAttendanceBody(req.body);
  if (!validation.ok) {
    return res.status(validation.response.status).json(validation.response.body);
  }

  try {
    const result = await service.markAttendance(validation.fields, req.user);
    if (result.error) {
      return res.status(result.status).json(result.body);
    }
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('[markAttendance]', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

async function getAttendanceByClassAndDate(req, res) {
  try {
    const { classId, date } = req.params;
    const attendance = await service.getAttendanceByClassAndDate(classId, date);
    return res.json(attendance);
  } catch (error) {
    console.error('[getAttendanceByClassAndDate]', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function createAttendance(req, res) {
  try {
    const saved = await service.createAttendance(req.body);
    return res.status(201).json(saved);
  } catch (error) {
    return res.status(400).json({ message: 'Error creating attendance', error: error.message });
  }
}

async function getAllAttendance(req, res) {
  try {
    const attendances = await service.getAllAttendance();
    return res.json(attendances);
  } catch (error) {
    return res.status(500).json({ message: 'Error getting attendance', error: error.message });
  }
}

async function getAttendanceById(req, res) {
  try {
    const attendance = await service.getAttendanceById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance not found' });
    }
    return res.json(attendance);
  } catch (error) {
    return res.status(500).json({ message: 'Error getting attendance', error: error.message });
  }
}

async function updateAttendance(req, res) {
  try {
    const updatedAttendance = await service.updateAttendance(req.params.id, req.body);
    if (!updatedAttendance) {
      return res.status(404).json({ message: 'Attendance not found' });
    }
    return res.json(updatedAttendance);
  } catch (error) {
    return res.status(400).json({ message: 'Error updating attendance', error: error.message });
  }
}

async function deleteAttendance(req, res) {
  try {
    const deletedAttendance = await service.deleteAttendance(req.params.id);
    if (!deletedAttendance) {
      return res.status(404).json({ message: 'Attendance not found' });
    }
    return res.json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting attendance', error: error.message });
  }
}

async function getStudentAttendance(req, res) {
  try {
    const studentId = req.params.studentId;
    const attendance = await service.getStudentAttendance(studentId);
    return res.json(attendance);
  } catch (error) {
    console.error('[getStudentAttendance]', error);
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
}

async function getStudentAttendanceStats(req, res) {
  try {
    const studentId = req.params.studentId;
    const { period } = req.query;
    const stats = await service.getStudentAttendanceStats(studentId, period);
    return res.json(stats);
  } catch (error) {
    console.error('[getStudentAttendanceStats]', error);
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
}

async function getTeacherAttendance(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Необходима аутентификация' });
    }

    const { teacherId } = req.params;

    if (req.user.role === 'teacher' && req.user.userId !== teacherId) {
      return res.status(403).json({ message: 'Нет прав' });
    }

    const records = await service.getTeacherAttendanceRecords(teacherId);
    return res.json(records);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

async function getClassAttendanceStats(req, res) {
  try {
    const { classId } = req.params;
    const stats = await service.getClassAttendanceStats(classId);
    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
}

async function getAttendanceByClass(req, res) {
  try {
    const { classId } = req.params;
    const attendance = await service.getAttendanceByClass(classId);
    return res.json(attendance);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
}

async function getAttendanceByDate(req, res) {
  try {
    const { date } = req.params;
    const attendance = await service.getAttendanceByDate(date);
    return res.json(attendance);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
}

async function createBulkAttendance(req, res) {
  const validation = validateBulkAttendanceBody(req.body);
  if (!validation.ok) {
    return res.status(validation.response.status).json(validation.response.body);
  }

  try {
    const createdRecords = await service.createBulkAttendance(validation.records);
    return res.status(201).json({
      message: 'Записи посещаемости созданы',
      count: createdRecords.length,
      records: createdRecords,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка создания записей', error: error.message });
  }
}

async function getStudentAttendanceWithGrades(req, res) {
  try {
    const studentId = req.params.studentId;
    const attendanceWithGrades = await service.getStudentAttendanceWithGrades(studentId);
    return res.json(attendanceWithGrades);
  } catch (error) {
    console.error('[getStudentAttendanceWithGrades]', error);
    return res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
}

module.exports = {
  markAttendance,
  getAttendanceByClassAndDate,
  createAttendance,
  getAllAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getStudentAttendance,
  getStudentAttendanceStats,
  getTeacherAttendance,
  getClassAttendanceStats,
  getAttendanceByClass,
  getAttendanceByDate,
  createBulkAttendance,
  getStudentAttendanceWithGrades,
};
