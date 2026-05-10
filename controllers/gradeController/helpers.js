const {
  FINAL_GRADE_TYPE,
  PRESENT_STATUS,
  EMPTY_GRADE_STATS,
  EMPTY_SUBJECT_STATS,
} = require('./constants');

function toObjectIdString(value) {
  return String(value);
}

function isSameId(left, right) {
  return toObjectIdString(left) === toObjectIdString(right);
}

function calculateAverage(items, pickValue) {
  if (!items.length) return 0;
  const sum = items.reduce((acc, item) => acc + pickValue(item), 0);
  return sum / items.length;
}

function withTwoDecimals(value) {
  return value.toFixed(2);
}

function withOneDecimal(value) {
  return value.toFixed(1);
}

function buildSubjectStatsMap(grades) {
  return grades.reduce((acc, grade) => {
    if (!acc[grade.subject]) {
      acc[grade.subject] = {
        grades: [],
        total: 0,
        count: 0,
        finalGrade: null,
      };
    }

    if (grade.type === FINAL_GRADE_TYPE) {
      acc[grade.subject].finalGrade = grade.value;
    } else {
      acc[grade.subject].grades.push(grade.value);
      acc[grade.subject].total += grade.value;
      acc[grade.subject].count += 1;
    }

    return acc;
  }, {});
}

function mapSubjectStatsToResponse(subjectStats) {
  return Object.keys(subjectStats).map((subject) => ({
    name: subject,
    averageGrade: subjectStats[subject].count > 0
      ? withOneDecimal(subjectStats[subject].total / subjectStats[subject].count)
      : 0,
    finalGrade: subjectStats[subject].finalGrade || null,
    totalGrades: subjectStats[subject].count,
  }));
}

function calculateAttendanceRate(records) {
  if (!records.length) return 0;
  const presentCount = records.filter((item) => item.status === PRESENT_STATUS).length;
  return Math.round((presentCount / records.length) * 100);
}

function cloneEmptyGradeStats() {
  return { ...EMPTY_GRADE_STATS, subjects: [] };
}

function cloneEmptySubjectStats(subject) {
  return { subject, ...EMPTY_SUBJECT_STATS, grades: [] };
}

function buildClassroomFlags(classrooms, teacherId) {
  return classrooms.map((classroom) => {
    const classroomObj = classroom.toObject();
    classroomObj.isHomeroom = Boolean(
      classroom.homeroomTeacher && isSameId(classroom.homeroomTeacher._id, teacherId)
    );
    return classroomObj;
  });
}

function appendHomeroomClassIfMissing(classrooms, list, homeroomClass, includeHomeroomOnlyFlag) {
  if (!homeroomClass) return list;

  const existsInList = classrooms.some((item) => isSameId(item._id, homeroomClass._id));
  if (existsInList) return list;

  const homeroomObj = homeroomClass.toObject();
  homeroomObj.isHomeroom = true;
  if (includeHomeroomOnlyFlag) {
    homeroomObj.isHomeroomOnly = true;
  }
  return [...list, homeroomObj];
}

function buildGradeRankingItem(classmate, average) {
  return {
    studentId: classmate._id,
    name: classmate.name,
    average,
  };
}

function buildAttendanceRankingItem(classmate, rate) {
  return {
    studentId: classmate._id,
    name: classmate.name,
    rate,
  };
}

function findRankPosition(items, studentId) {
  return items.findIndex((item) => isSameId(item.studentId, studentId)) + 1;
}

module.exports = {
  isSameId,
  calculateAverage,
  withTwoDecimals,
  buildSubjectStatsMap,
  mapSubjectStatsToResponse,
  calculateAttendanceRate,
  cloneEmptyGradeStats,
  cloneEmptySubjectStats,
  buildClassroomFlags,
  appendHomeroomClassIfMissing,
  buildGradeRankingItem,
  buildAttendanceRankingItem,
  findRankPosition,
};
