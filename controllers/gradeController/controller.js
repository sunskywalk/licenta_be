const service = require('./service');

function sendResult(res, result) {
  return res.status(result.status).json(result.body);
}

async function createGrade(req, res) {
  try {
    const result = await service.createGrade(req.body, req.user);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

async function getAllGrades(req, res) {
  try {
    const grades = await service.getAllGrades();
    return res.json(grades);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

async function getGradeById(req, res) {
  try {
    const grade = await service.getGradeById(req.params.id);
    if (!grade) {
      return res.status(404).json({ message: 'Оценка не найдена' });
    }
    return res.json(grade);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

async function updateGrade(req, res) {
  try {
    const result = await service.updateGrade(req.params.id, req.body, req.user);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

async function deleteGrade(req, res) {
  try {
    const result = await service.deleteGrade(req.params.id, req.user);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

async function getStudentAverage(req, res) {
  try {
    const result = await service.getStudentAverage(req.params.studentId, req.query, req.user);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

async function getFinalAverage(req, res) {
  try {
    const result = await service.getFinalAverage(req.params.studentId, req.query, req.user);
    return sendResult(res, result);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

async function getTeacherGrades(req, res) {
  try {
    const result = await service.getTeacherGrades(req.params.teacherId, req.user, req.query.year);
    return sendResult(res, result);
  } catch (error) {
    console.error('Error in getTeacherGrades:', error);
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

async function getStudentGrades(req, res) {
  try {
    const result = await service.getStudentGrades(req.params.studentId, req.user, req.query.year);
    return sendResult(res, result);
  } catch (error) {
    console.error('Error in getStudentGrades:', error);
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

async function getGradesByClass(req, res) {
  try {
    const result = await service.getGradesByClass(req.params.classId, req.query.year);
    return sendResult(res, result);
  } catch (error) {
    console.error('Error in getGradesByClass:', error);
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

async function getTeacherSubjects(req, res) {
  try {
    const result = await service.getTeacherSubjects(req.user);
    return sendResult(res, result);
  } catch (error) {
    console.error('Error in getTeacherSubjects:', error);
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

async function getTeacherSubjectsById(req, res) {
  try {
    const result = await service.getTeacherSubjectsById(req.params.teacherId, req.user);
    return sendResult(res, result);
  } catch (error) {
    console.error('Error in getTeacherSubjectsById:', error);
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

async function getClassroomsForSubject(req, res) {
  try {
    const result = await service.getClassroomsForSubject(req.params.subject, req.user);
    return sendResult(res, result);
  } catch (error) {
    console.error('Error in getClassroomsForSubject:', error);
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

async function getAllTeacherClasses(req, res) {
  try {
    const result = await service.getAllTeacherClasses(req.user);
    return sendResult(res, result);
  } catch (error) {
    console.error('Error in getAllTeacherClasses:', error);
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

async function getStudentGradeStats(req, res) {
  try {
    const result = await service.getStudentGradeStats(req.params.studentId, req.query.year, req.user);
    return sendResult(res, result);
  } catch (error) {
    console.error('Error fetching student grade stats:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getStudentSubjectStats(req, res) {
  try {
    const result = await service.getStudentSubjectStats(
      req.params.studentId,
      req.params.subject,
      req.query.year,
      req.user
    );
    return sendResult(res, result);
  } catch (error) {
    console.error('Error fetching subject stats:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  createGrade,
  getAllGrades,
  getGradeById,
  updateGrade,
  deleteGrade,
  getStudentAverage,
  getFinalAverage,
  getTeacherGrades,
  getStudentGrades,
  getGradesByClass,
  getTeacherSubjects,
  getTeacherSubjectsById,
  getClassroomsForSubject,
  getAllTeacherClasses,
  getStudentGradeStats,
  getStudentSubjectStats,
};
