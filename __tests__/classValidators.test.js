const { isAdmin, isTeacher, isStudent } = require('../controllers/classController/validators');

describe('classController/validators', () => {
  it('identifies admin role', () => {
    expect(isAdmin({ role: 'admin' })).toBe(true);
    expect(isAdmin({ role: 'teacher' })).toBe(false);
    expect(isAdmin(null)).toBeFalsy();
  });

  it('identifies teacher role', () => {
    expect(isTeacher({ role: 'teacher' })).toBe(true);
    expect(isTeacher({ role: 'student' })).toBe(false);
  });

  it('identifies student role', () => {
    expect(isStudent({ role: 'student' })).toBe(true);
    expect(isStudent({ role: 'admin' })).toBe(false);
  });
});
