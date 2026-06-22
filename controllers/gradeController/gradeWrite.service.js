const repository = require('./repository');
const { defaultAcademicYear } = require('../../utils/academicYearUtils');
const AcademicYear = require('../../models/AcademicYear/index');
const validators = require('./validators');

async function assertTeacherSubjectAccess(user, subject) {
  if (!validators.isTeacher(user.role)) return null;

  const teacher = await repository.findTeacherById(user.userId);
  if (!teacher.subjects || !teacher.subjects.includes(subject)) {
    return {
      status: 403,
      body: {
        message: `Вы не можете ставить оценки по предмету "${subject}". Ваши предметы: ${teacher.subjects?.join(', ') || 'не назначены'}`,
      },
    };
  }
  return null;
}

async function assertTeacherGradeAccess(user, gradeId, actionText) {
  if (!validators.isTeacher(user.role)) return null;

  const teacher = await repository.findTeacherById(user.userId);
  const existingGrade = await repository.findGradeByIdRaw(gradeId);
  if (existingGrade && (!teacher.subjects || !teacher.subjects.includes(existingGrade.subject))) {
    return {
      status: 403,
      body: { message: `Вы не можете ${actionText} оценки по предмету "${existingGrade.subject}"` },
    };
  }
  return null;
}

async function resolveActiveAcademicYearValue() {
  const activeYear = await AcademicYear.getActive();
  return activeYear?.year ?? defaultAcademicYear();
}

async function createGrade(data, user) {
  if (!validators.canManageGrades(user.role)) {
    return { status: 403, body: { message: 'Нет прав добавлять оценки' } };
  }

  const subjectAccessError = await assertTeacherSubjectAccess(user, data.subject);
  if (subjectAccessError) return subjectAccessError;

  const academicYear = data.academicYear ?? await resolveActiveAcademicYearValue();

  const newGrade = await repository.createGrade({
    student: data.student,
    teacher: user.userId,
    classId: data.classId,
    subject: data.subject,
    type: data.type,
    semester: data.semester,
    value: data.value,
    comment: data.comment,
    academicYear,
  });

  return { status: 201, body: { message: 'Оценка создана', grade: newGrade } };
}

async function updateGrade(gradeId, data, user) {
  if (!validators.canManageGrades(user.role)) {
    return { status: 403, body: { message: 'Нет прав' } };
  }

  const accessError = await assertTeacherGradeAccess(user, gradeId, 'изменять');
  if (accessError) return accessError;

  const updated = await repository.updateGradeById(gradeId, {
    student: data.student,
    teacher: user.userId,
    classId: data.classId,
    subject: data.subject,
    type: data.type,
    semester: data.semester,
    value: data.value,
    comment: data.comment,
  });

  if (!updated) {
    return { status: 404, body: { message: 'Не найдено' } };
  }

  return { status: 200, body: { message: 'Оценка обновлена', grade: updated } };
}

async function deleteGrade(gradeId, user) {
  if (!validators.canManageGrades(user.role)) {
    return { status: 403, body: { message: 'Нет прав' } };
  }

  const accessError = await assertTeacherGradeAccess(user, gradeId, 'удалять');
  if (accessError) return accessError;

  const deleted = await repository.deleteGradeById(gradeId);
  if (!deleted) {
    return { status: 404, body: { message: 'Не найдено' } };
  }

  return { status: 200, body: { message: 'Оценка удалена' } };
}

module.exports = {
  createGrade,
  updateGrade,
  deleteGrade,
};
