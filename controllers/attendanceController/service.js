const repository = require('./repository');
const {
  normalizeDayStart,
  countAttendanceStatuses,
  buildGradeLookupMap,
  attachGradesToAttendanceRows,
} = require('./helpers');
const {
  SEMESTER_LOOKBACK_MS,
  DEFAULT_STATS_WINDOW_MS,
  PERIOD_QUERY,
  STATS_PERIOD_LABEL_DEFAULT,
  USER_ROLE,
} = require('./constants');

async function markAttendance(fields, authUser) {
  const { student, classId, subject, date, status, teacher } = fields;

  if (authUser.role === USER_ROLE.TEACHER) {
    const teacherUser = await repository.findUserById(authUser.userId);
    if (!teacherUser.subjects || !teacherUser.subjects.includes(subject)) {
      return {
        error: true,
        status: 403,
        body: {
          message: `Вы не можете отмечать посещаемость по предмету "${subject}"`,
        },
      };
    }
  }

  const attendanceDate = normalizeDayStart(date);
  const basicSearchCondition = {
    student,
    classId,
    subject,
    date: attendanceDate,
  };

  let existingAttendance = await repository.findOneAttendance(basicSearchCondition);

  if (existingAttendance && String(existingAttendance.teacher) !== String(teacher)) {
    existingAttendance = null; // different teacher — force insert path like before
  }

  let attendance;
  if (existingAttendance) {
    attendance = await repository.updateAttendanceById(
      existingAttendance._id,
      { status },
      { new: true, runValidators: true }
    );
  } else {
    attendance = await repository.createAttendanceDocument({
      student,
      classId,
      subject,
      date: attendanceDate,
      status,
      teacher,
    });
  }

  return { status: 201, body: attendance };
}

async function getAttendanceByClassAndDate(classId, dateParam) {
  const attendanceDate = normalizeDayStart(dateParam);
  return repository.findAttendanceForClassOnDate(classId, attendanceDate);
}

async function createAttendance(body) {
  return repository.saveNewAttendanceFromBody(body);
}

async function getAllAttendance() {
  return repository.findAllAttendancePopulated();
}

async function getAttendanceById(id) {
  return repository.findAttendanceByIdPopulated(id);
}

async function updateAttendance(id, body) {
  return repository.updateAttendanceRaw(id, body, { new: true, runValidators: true });
}

async function deleteAttendance(id) {
  return repository.deleteAttendanceById(id);
}

async function getStudentAttendance(studentId) {
  return repository.findAttendanceByStudent(studentId);
}

function buildStudentStatsDateFilter(period) {
  if (period === PERIOD_QUERY.CURRENT_MONTH) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return { date: { $gte: startOfMonth } };
  }
  if (period === PERIOD_QUERY.CURRENT_SEMESTER) {
    const now = new Date();
    const startOfSemester = new Date(now.getTime() - SEMESTER_LOOKBACK_MS);
    return { date: { $gte: startOfSemester } };
  }
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - DEFAULT_STATS_WINDOW_MS);
  return { date: { $gte: thirtyDaysAgo } };
}

async function getStudentAttendanceStats(studentId, period) {
  const dateFilter = buildStudentStatsDateFilter(period);
  const filter = { student: studentId, ...dateFilter };
  const attendance = await repository.findAttendanceByFilterSorted(filter);
  const counts = countAttendanceStatuses(attendance);

  return {
    total: counts.total,
    totalPresent: counts.present,
    present: counts.present,
    absent: counts.absent,
    late: counts.late,
    excused: counts.excused,
    attendanceRate: counts.attendanceRate,
    period: period || STATS_PERIOD_LABEL_DEFAULT,
  };
}

async function getTeacherAttendanceRecords(teacherId) {
  return repository.findAttendanceByTeacher(teacherId);
}

async function getClassAttendanceStats(classId) {
  const attendance = await repository.findAttendanceByClassId(classId);
  return countAttendanceStatuses(attendance);
}

async function getAttendanceByClass(classId) {
  return repository.findAttendanceByClassPopulated(classId);
}

async function getAttendanceByDate(dateParam) {
  return repository.findAttendanceByDateRaw(dateParam);
}

async function createBulkAttendance(records) {
  return repository.insertManyAttendance(records);
}

async function getStudentAttendanceWithGrades(studentId) {
  const attendance = await repository.findAttendanceForStudentWithGradesView(studentId);
  const grades = await repository.findGradesForStudent(studentId);
  const gradeMap = buildGradeLookupMap(grades);
  return attachGradesToAttendanceRows(attendance, gradeMap);
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
  getTeacherAttendanceRecords,
  getClassAttendanceStats,
  getAttendanceByClass,
  getAttendanceByDate,
  createBulkAttendance,
  getStudentAttendanceWithGrades,
};
