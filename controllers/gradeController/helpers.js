const {
  FINAL_GRADE_TYPE,
  PRESENT_STATUS,
  EMPTY_GRADE_STATS,
  EMPTY_SUBJECT_STATS,
} = require('./constants');

function toObjectIdString(value) {
  if (value == null) return '';
  if (typeof value === 'object' && value._id != null) {
    return String(value._id);
  }
  return String(value);
}

function normalizeSubjectName(subject) {
  return String(subject || '').toLowerCase().trim();
}

const SUBJECT_ALIAS_GROUPS = [
  ['tic', 'ict', 'informatică', 'informatica', 'computer science', 'computer_science'],
  ['romanian', 'limba română', 'limba romana'],
  ['english', 'limba engleză', 'limba engleza', 'engleză', 'engleza'],
  ['mathematics', 'matematică', 'matematica'],
  ['history', 'istorie'],
  ['geography', 'geografie'],
  ['art', 'educație plastică', 'educatie plastica'],
  ['music', 'educație muzicală', 'educatie muzicala'],
];

function subjectsMatch(left, right) {
  const a = normalizeSubjectName(left);
  const b = normalizeSubjectName(right);
  if (!a || !b) return false;
  if (a === b) return true;

  return SUBJECT_ALIAS_GROUPS.some(
    (group) => group.includes(a) && group.includes(b)
  );
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
        finalGrades: {},
      };
    }

    if (grade.type === FINAL_GRADE_TYPE) {
      acc[grade.subject].finalGrades[grade.semester] = grade.value;
    } else {
      acc[grade.subject].grades.push(grade.value);
      acc[grade.subject].total += grade.value;
      acc[grade.subject].count += 1;
    }

    return acc;
  }, {});
}

function resolveLatestFinalGrade(subjectEntry) {
  if (subjectEntry.finalGrades && Object.keys(subjectEntry.finalGrades).length > 0) {
    const semesters = Object.keys(subjectEntry.finalGrades)
      .map(Number)
      .sort((left, right) => right - left);
    return subjectEntry.finalGrades[semesters[0]];
  }

  return subjectEntry.finalGrade ?? null;
}

function mapSubjectStatsToResponse(subjectStats) {
  return Object.keys(subjectStats).map((subject) => ({
    name: subject,
    averageGrade: subjectStats[subject].count > 0
      ? withOneDecimal(subjectStats[subject].total / subjectStats[subject].count)
      : 0,
    finalGrade: resolveLatestFinalGrade(subjectStats[subject]),
    finalGrades: subjectStats[subject].finalGrades || {},
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

function buildClassroomFlags(classrooms, teacherId, options = {}) {
  const { teachesSubject = false } = options;

  return classrooms.map((classroom) => {
    const classroomObj = classroom.toObject();
    classroomObj.isHomeroom = Boolean(
      classroom.homeroomTeacher && isSameId(classroom.homeroomTeacher._id, teacherId)
    );
    classroomObj.teachesSubjectHere = teachesSubject;
    return classroomObj;
  });
}

function appendHomeroomClassIfMissing(classrooms, list, homeroomClass, includeHomeroomOnlyFlag) {
  if (!homeroomClass) return list;

  const homeroomId = toObjectIdString(homeroomClass._id);
  const existingIndex = list.findIndex((item) => isSameId(item._id, homeroomId));

  if (existingIndex >= 0) {
    list[existingIndex].isHomeroom = true;
    if (list[existingIndex].teachesSubjectHere) {
      list[existingIndex].isHomeroomOnly = false;
    }
    return list;
  }

  const existsInSource = classrooms.some((item) => isSameId(item._id, homeroomId));
  if (existsInSource) return list;

  const homeroomObj = homeroomClass.toObject();
  homeroomObj.isHomeroom = true;
  homeroomObj.teachesSubjectHere = false;
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
  subjectsMatch,
  normalizeSubjectName,
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
