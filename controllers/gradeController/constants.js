const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

const POPULATE_FIELDS = ['student', 'teacher', 'classId'];
const PASSWORD_FIELD = '-password';
const FINAL_GRADE_TYPE = 'final';
const PRESENT_STATUS = 'present';

const EMPTY_GRADE_STATS = {
  averageGrade: 0,
  totalGrades: 0,
  subjects: [],
  classRankByGrades: null,
  classRankByAttendance: null,
  attendanceRate: 0,
};

const EMPTY_SUBJECT_STATS = {
  averageGrade: 0,
  finalGrade: null,
  grades: [],
  attendanceRate: 0,
  classRankByGrades: null,
  classRankByAttendance: null,
};

module.exports = {
  ROLES,
  POPULATE_FIELDS,
  PASSWORD_FIELD,
  FINAL_GRADE_TYPE,
  PRESENT_STATUS,
  EMPTY_GRADE_STATS,
  EMPTY_SUBJECT_STATS,
};
