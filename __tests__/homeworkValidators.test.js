const {
  canManageHomework,
  studentMayViewTargetStudent,
  teacherMayViewTargetTeacher,
} = require('../controllers/homeworkController/validators');

describe('homeworkController/validators', () => {
  describe('canManageHomework', () => {
    it('allows teacher and admin', () => {
      expect(canManageHomework('teacher')).toBe(true);
      expect(canManageHomework('admin')).toBe(true);
    });

    it('denies student', () => {
      expect(canManageHomework('student')).toBe(false);
    });
  });

  describe('studentMayViewTargetStudent', () => {
    it('allows non-students to view any student', () => {
      expect(studentMayViewTargetStudent('teacher', 't1', 's2')).toBe(true);
      expect(studentMayViewTargetStudent('admin', 'a1', 's2')).toBe(true);
    });

    it('allows student to view only own profile', () => {
      expect(studentMayViewTargetStudent('student', 's1', 's1')).toBe(true);
      expect(studentMayViewTargetStudent('student', 's1', 's2')).toBe(false);
    });
  });

  describe('teacherMayViewTargetTeacher', () => {
    it('allows non-teachers to view any teacher', () => {
      expect(teacherMayViewTargetTeacher('admin', 'a1', 't2')).toBe(true);
      expect(teacherMayViewTargetTeacher('student', 's1', 't2')).toBe(true);
    });

    it('allows teacher to view only own profile', () => {
      expect(teacherMayViewTargetTeacher('teacher', 't1', 't1')).toBe(true);
      expect(teacherMayViewTargetTeacher('teacher', 't1', 't2')).toBe(false);
    });
  });
});
