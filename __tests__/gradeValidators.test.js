const {
  canManageGrades,
  canReadTeacherGrades,
  isStudent,
  isTeacher,
} = require('../controllers/gradeController/validators');

describe('gradeController/validators', () => {
  it('allows teachers and admins to manage grades', () => {
    expect(canManageGrades('teacher')).toBe(true);
    expect(canManageGrades('admin')).toBe(true);
    expect(canManageGrades('student')).toBe(false);
  });

  it('allows teachers and admins to read teacher grades', () => {
    expect(canReadTeacherGrades('admin')).toBe(true);
    expect(canReadTeacherGrades('teacher')).toBe(true);
    expect(canReadTeacherGrades('student')).toBe(false);
  });

  it('identifies student role', () => {
    expect(isStudent('student')).toBe(true);
    expect(isStudent('teacher')).toBe(false);
  });

  it('identifies teacher role', () => {
    expect(isTeacher('teacher')).toBe(true);
    expect(isTeacher('admin')).toBe(false);
  });
});
