const { teacherBlockedFromOtherSchedule } = require('../controllers/scheduleController/validators');

describe('scheduleController/validators', () => {
  it('blocks teacher from accessing another teacher schedule', () => {
    expect(teacherBlockedFromOtherSchedule('teacher', 't1', 't2')).toBe(true);
  });

  it('allows teacher to access own schedule', () => {
    expect(teacherBlockedFromOtherSchedule('teacher', 't1', 't1')).toBe(false);
  });

  it('does not block admin or student', () => {
    expect(teacherBlockedFromOtherSchedule('admin', 'a1', 't2')).toBe(false);
    expect(teacherBlockedFromOtherSchedule('student', 's1', 't2')).toBe(false);
  });
});
