const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Rough semester window (~3 months), same idea as before refactor */
const SEMESTER_LOOKBACK_MS = 90 * MS_PER_DAY;

/** Default stats window when period query is missing / not special */
const DEFAULT_STATS_WINDOW_MS = 30 * MS_PER_DAY;

const PERIOD_QUERY = {
  CURRENT_MONTH: 'current_month',
  CURRENT_SEMESTER: 'current_semester',
};

const STATS_PERIOD_LABEL_DEFAULT = 'last_30_days';

const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
};

const USER_ROLE = {
  TEACHER: 'teacher',
};

module.exports = {
  MS_PER_DAY,
  SEMESTER_LOOKBACK_MS,
  DEFAULT_STATS_WINDOW_MS,
  PERIOD_QUERY,
  STATS_PERIOD_LABEL_DEFAULT,
  ATTENDANCE_STATUS,
  USER_ROLE,
};
