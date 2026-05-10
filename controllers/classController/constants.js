const USER_ROLE = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

const POPULATE_SELECT = {
  WITHOUT_PASSWORD: '-password',
  NAME_EMAIL: 'name email',
  NAME_EMAIL_CLASSROOMS: 'name email classRooms',
  NAME_ONLY: 'name',
};

const STATS_LOOKBACK_DAYS = 30;

const ATTENDANCE_PRESENT_STATUSES = ['present', 'late'];

const GRADE_TYPE = {
  FINAL: 'final',
};

const SUBJECTS = [
  'Matematică',
  'Limba română',
  'Limba engleză',
  'Limba franceză',
  'Limba germană',
  'Istorie',
  'Geografie',
  'Fizică',
  'Chimie',
  'Biologie',
  'Informatică',
  'Educație fizică',
  'Educație plastică',
  'Educație muzicală',
  'Educație tehnologică',
  'Educație civică',
  'Religie',
  'Filosofie',
  'Psihologie',
  'Logică',
];

module.exports = {
  USER_ROLE,
  POPULATE_SELECT,
  STATS_LOOKBACK_DAYS,
  ATTENDANCE_PRESENT_STATUSES,
  GRADE_TYPE,
  SUBJECTS,
};
