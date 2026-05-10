const { ATTENDANCE_STATUS } = require('./constants');

function normalizeDayStart(dateInput) {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * One pass over attendance docs — same counts as four separate .filter calls.
 */
function countAttendanceStatuses(docs) {
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;
  for (const a of docs) {
    switch (a.status) {
      case ATTENDANCE_STATUS.PRESENT:
        present += 1;
        break;
      case ATTENDANCE_STATUS.ABSENT:
        absent += 1;
        break;
      case ATTENDANCE_STATUS.LATE:
        late += 1;
        break;
      case ATTENDANCE_STATUS.EXCUSED:
        excused += 1;
        break;
      default:
        break;
    }
  }
  const total = docs.length;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
  return { total, present, absent, late, excused, attendanceRate };
}

/**
 * Mimics grades.find(...) order: first grade in array wins for a calendar day + subject.
 */
function buildGradeLookupMap(gradesSorted) {
  const map = new Map();
  for (const grade of gradesSorted) {
    const key = `${new Date(grade.createdAt).toDateString()}|${grade.subject}`;
    if (!map.has(key)) {
      map.set(key, grade);
    }
  }
  return map;
}

function attachGradesToAttendanceRows(attendanceDocs, gradeMap) {
  return attendanceDocs.map((att) => {
    const attDate = new Date(att.date);
    const key = `${attDate.toDateString()}|${att.subject}`;
    const matchingGrade = gradeMap.get(key);

    return {
      ...att.toObject(),
      grade: matchingGrade
        ? {
            value: matchingGrade.value,
            type: matchingGrade.type,
            comment: matchingGrade.comment,
          }
        : null,
    };
  });
}

module.exports = {
  normalizeDayStart,
  countAttendanceStatuses,
  buildGradeLookupMap,
  attachGradesToAttendanceRows,
};
