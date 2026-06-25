const {
  hasId,
  removeId,
  buildStudentStats,
  pickBetterStudent,
  sortStudentsByName,
} = require('../controllers/classController/helpers');

describe('classController/helpers', () => {
  describe('hasId', () => {
    it('finds id in collection', () => {
      expect(hasId(['a', 'b', 'c'], 'b')).toBe(true);
      expect(hasId(['a', 'b'], 'x')).toBe(false);
    });
  });

  describe('removeId', () => {
    it('removes id from collection', () => {
      expect(removeId(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
    });
  });

  describe('buildStudentStats', () => {
    it('builds stats excluding final grades from average', () => {
      const student = { _id: 's1', name: 'Ion', email: 'ion@test.com' };
      const grades = [
        { type: 'lesson', value: 8 },
        { type: 'test', value: 10 },
        { type: 'final', value: 9 },
      ];
      const attendance = [
        { status: 'present' },
        { status: 'late' },
        { status: 'absent' },
      ];

      const stats = buildStudentStats(student, grades, attendance);

      expect(stats.averageGrade).toBe(9);
      expect(stats.attendanceRate).toBe(67);
      expect(stats.totalGrades).toBe(3);
      expect(stats.name).toBe('Ion');
    });
  });

  describe('pickBetterStudent', () => {
    it('picks candidate with higher field value', () => {
      const current = { name: 'A', averageGrade: 8 };
      const candidate = { name: 'B', averageGrade: 9 };
      expect(pickBetterStudent(current, candidate, 'averageGrade')).toBe(candidate);
    });

    it('keeps current when candidate is worse', () => {
      const current = { name: 'A', averageGrade: 9 };
      const candidate = { name: 'B', averageGrade: 8 };
      expect(pickBetterStudent(current, candidate, 'averageGrade')).toBe(current);
    });
  });

  describe('sortStudentsByName', () => {
    it('sorts students alphabetically by name', () => {
      const students = [
        { name: 'Zoe' },
        { name: 'Ana' },
        { name: 'Maria' },
      ];
      const sorted = sortStudentsByName(students);
      expect(sorted.map((s) => s.name)).toEqual(['Ana', 'Maria', 'Zoe']);
    });
  });
});
