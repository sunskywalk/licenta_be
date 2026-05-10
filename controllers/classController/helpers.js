const {
  ATTENDANCE_PRESENT_STATUSES,
  GRADE_TYPE,
  STATS_LOOKBACK_DAYS,
} = require('./constants');

function getThirtyDaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - STATS_LOOKBACK_DAYS);
  return date;
}

function hasId(collection, id) {
  return collection.some((item) => String(item) === String(id));
}

function removeId(collection, id) {
  return collection.filter((item) => String(item) !== String(id));
}

function calculateAverageGrade(grades) {
  const regularGrades = grades.filter((grade) => grade.type !== GRADE_TYPE.FINAL);
  if (regularGrades.length === 0) {
    return 0;
  }

  const total = regularGrades.reduce((sum, grade) => sum + grade.value, 0);
  return total / regularGrades.length;
}

function calculateAttendanceRate(attendanceRecords) {
  if (attendanceRecords.length === 0) {
    return 0;
  }

  const presentCount = attendanceRecords.filter((record) => (
    ATTENDANCE_PRESENT_STATUSES.includes(record.status)
  )).length;

  return Math.round((presentCount / attendanceRecords.length) * 100);
}

function roundToTwo(value) {
  return Math.round(value * 100) / 100;
}

function buildStudentStats(student, grades, attendanceRecords) {
  const averageGrade = calculateAverageGrade(grades);
  const attendanceRate = calculateAttendanceRate(attendanceRecords);

  return {
    _id: student._id,
    name: student.name,
    email: student.email,
    grades,
    averageGrade: roundToTwo(averageGrade),
    attendanceRate,
    totalGrades: grades.length,
  };
}

function pickBetterStudent(currentBest, candidate, field) {
  if (!currentBest || candidate[field] > currentBest[field]) {
    return candidate;
  }

  return currentBest;
}

function sortStudentsByName(students) {
  return students.sort((first, second) => first.name.localeCompare(second.name));
}

function buildClassStats(cls, studentsWithStats, totalGrades, totalAttendanceRate, bestStudent, bestAttendanceStudent) {
  const totalStudents = cls.students.length;

  return {
    totalStudents,
    totalGrades,
    averageGrade: totalStudents > 0
      ? roundToTwo(studentsWithStats.reduce((sum, student) => sum + student.averageGrade, 0) / totalStudents)
      : 0,
    attendanceRate: totalStudents > 0
      ? Math.round(totalAttendanceRate / totalStudents)
      : 0,
    bestPerformingStudent: bestStudent,
    bestAttendanceStudent,
  };
}

function getPrimaryClassIds(students) {
  const ids = students
    .filter((student) => student.classRooms && student.classRooms.length > 0)
    .map((student) => student.classRooms[0]);

  return [...new Set(ids.map((id) => String(id)))];
}

function buildClassMap(classes) {
  return new Map(classes.map((cls) => [String(cls._id), cls]));
}

function buildStudentWithClassInfo(student, classMap, options = {}) {
  let currentClass = null;

  if (student.classRooms && student.classRooms.length > 0) {
    const cls = classMap.get(String(student.classRooms[0]));
    if (cls) {
      currentClass = {
        _id: cls._id,
        name: cls.name,
      };
    }
  }

  const data = {
    _id: student._id,
    name: student.name,
    email: student.email,
    currentClass,
  };

  if (options.includeCanAddToClass) {
    data.canAddToClass = !currentClass || currentClass._id.toString() !== options.classId;
  }

  return data;
}

module.exports = {
  getThirtyDaysAgo,
  hasId,
  removeId,
  buildStudentStats,
  pickBetterStudent,
  sortStudentsByName,
  buildClassStats,
  getPrimaryClassIds,
  buildClassMap,
  buildStudentWithClassInfo,
};
