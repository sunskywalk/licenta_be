const repository = require('./repository');
const { SUBJECTS } = require('./constants');
const { isAdmin } = require('./validators');
const {
  getThirtyDaysAgo,
  buildStudentStats,
  pickBetterStudent,
  sortStudentsByName,
  buildClassStats,
  getPrimaryClassIds,
  buildClassMap,
  buildStudentWithClassInfo,
} = require('./helpers');

async function getAllClasses() {
  return repository.findAllClasses();
}

async function getClassById(id) {
  return repository.findClassByIdPopulated(id);
}

const { mergeYearFilter } = require('../../utils/academicYearUtils');

async function getClassWithStats(id, user, year) {
  const cls = await repository.findClassByIdPopulated(id);
  if (!cls) {
    return { error: true, status: 404, body: { message: 'Класс не найден' } };
  }

  const isHomeroomTeacher = cls.homeroomTeacher &&
    String(cls.homeroomTeacher._id) === String(user.userId);

  if (!isAdmin(user) && !isHomeroomTeacher) {
    return {
      error: true,
      status: 403,
      body: {
        message: 'Только admin или классный руководитель могут просматривать детальную статистику класса',
      },
    };
  }

  const studentsWithStats = [];
  let totalGrades = 0;
  let totalAttendanceRate = 0;
  let bestStudent = null;
  let bestAttendanceStudent = null;
  const thirtyDaysAgo = getThirtyDaysAgo();

  for (const student of cls.students) {
    const gradeFilter = mergeYearFilter({ student: student._id }, year);
    const grades = await repository.findGradesByStudentFiltered(gradeFilter);
    const attendanceRecords = await repository.findAttendanceByStudentSince(student._id, thirtyDaysAgo);
    const studentData = buildStudentStats(student, grades, attendanceRecords);

    studentsWithStats.push(studentData);
    totalGrades += grades.length;
    totalAttendanceRate += studentData.attendanceRate;
    bestStudent = pickBetterStudent(bestStudent, studentData, 'averageGrade');
    bestAttendanceStudent = pickBetterStudent(bestAttendanceStudent, studentData, 'attendanceRate');
  }

  sortStudentsByName(studentsWithStats);

  return {
    status: 200,
    body: {
      ...cls.toObject(),
      students: studentsWithStats,
      classStats: buildClassStats(
        cls,
        studentsWithStats,
        totalGrades,
        totalAttendanceRate,
        bestStudent,
        bestAttendanceStudent
      ),
    },
  };
}

async function getStudentsWithClassInfo(search, classId, includeCanAddToClass) {
  const searchRegex = new RegExp(search, 'i');
  const students = await repository.findStudentsByName(searchRegex);
  const classIds = getPrimaryClassIds(students);
  const classes = classIds.length > 0 ? await repository.findClassesByIds(classIds) : [];
  const classMap = buildClassMap(classes);

  return students.map((student) => (
    buildStudentWithClassInfo(student, classMap, { classId, includeCanAddToClass })
  ));
}

async function getAvailableStudents(query, user) {
  if (!isAdmin(user)) {
    return { error: true, status: 403, body: { message: 'Только admin может просматривать список учеников' } };
  }

  const { search = '', classId } = query;
  const students = await getStudentsWithClassInfo(search, classId, true);
  return { status: 200, body: students };
}

async function getAllTeachers(query, user) {
  if (!isAdmin(user)) {
    return { error: true, status: 403, body: { message: 'Только admin может просматривать список учителей' } };
  }

  const { search = '' } = query;
  const searchRegex = new RegExp(search, 'i');
  const teachers = await repository.findTeachersByName(searchRegex);
  return { status: 200, body: teachers };
}

async function getAllStudentsForClass(query, user) {
  if (!isAdmin(user)) {
    return { error: true, status: 403, body: { message: 'Только admin может просматривать список учеников' } };
  }

  const { search = '' } = query;
  const students = await getStudentsWithClassInfo(search, undefined, false);
  return { status: 200, body: students };
}

function getSubjectsList(user) {
  if (!isAdmin(user)) {
    return { error: true, status: 403, body: { message: 'Только admin может просматривать список предметов' } };
  }

  return { status: 200, body: [...SUBJECTS].sort() };
}

module.exports = {
  getAllClasses,
  getClassById,
  getClassWithStats,
  getAvailableStudents,
  getAllTeachers,
  getAllStudentsForClass,
  getSubjectsList,
};
