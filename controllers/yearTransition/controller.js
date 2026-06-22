const service = require('./service');
const { clearCachedAcademicYear } = require('../../config/academicConfig/cacheStore');

async function previewTransition(req, res) {
  try {
    const preview = await service.previewTransition();
    return res.json(preview);
  } catch (error) {
    console.error('[previewTransition] Error:', error);
    return res.status(500).json({ message: 'Ошибка при подготовке перехода', error: error.message });
  }
}

async function executeTransition(req, res) {
  try {
    const result = await service.executeTransition(req.user.userId);
    clearCachedAcademicYear();
    return res.json({
      message: 'Переход на новый учебный год выполнен',
      ...result,
    });
  } catch (error) {
    console.error('[executeTransition] Error:', error);
    return res.status(500).json({ message: error.message || 'Ошибка при переходе', error: error.message });
  }
}

async function getStudentClassHistory(req, res) {
  try {
    const { studentId } = req.params;
    const isOwn = req.user.role === 'student' && String(req.user.userId) !== String(studentId);
    const isAllowed = ['admin', 'teacher'].includes(req.user.role) || !isOwn;

    if (!isAllowed) {
      return res.status(403).json({ message: 'Нет прав' });
    }

    const history = await service.getStudentClassHistory(studentId);
    return res.json(history);
  } catch (error) {
    console.error('[getStudentClassHistory] Error:', error);
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

async function getAvailableGradeYears(req, res) {
  try {
    const years = await service.getAvailableGradeYears();
    return res.json(years);
  } catch (error) {
    console.error('[getAvailableGradeYears] Error:', error);
    return res.status(500).json({ message: 'Ошибка', error: error.message });
  }
}

module.exports = {
  previewTransition,
  executeTransition,
  getStudentClassHistory,
  getAvailableGradeYears,
};
