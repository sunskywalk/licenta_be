const {
  getThirtyDaysAgo,
  buildClassStats,
  getPrimaryClassIds,
  buildClassMap,
  buildStudentWithClassInfo,
} = require('../controllers/classController/helpers');

describe('classController/helpers (extended)', () => {
  describe('getThirtyDaysAgo', () => {
    it('returns date approximately 30 days in the past', () => {
      const now = new Date();
      const result = getThirtyDaysAgo();
      const diffDays = Math.round((now - result) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(30);
    });
  });

  describe('buildClassStats', () => {
    it('aggregates class-level statistics', () => {
      const cls = { students: [{}, {}, {}] };
      const studentsWithStats = [
        { averageGrade: 8, attendanceRate: 90 },
        { averageGrade: 10, attendanceRate: 80 },
        { averageGrade: 6, attendanceRate: 70 },
      ];
      const best = { name: 'B' };
      const bestAtt = { name: 'A' };

      const stats = buildClassStats(cls, studentsWithStats, 15, 240, best, bestAtt);

      expect(stats.totalStudents).toBe(3);
      expect(stats.totalGrades).toBe(15);
      expect(stats.averageGrade).toBe(8);
      expect(stats.attendanceRate).toBe(80);
      expect(stats.bestPerformingStudent).toBe(best);
      expect(stats.bestAttendanceStudent).toBe(bestAtt);
    });

    it('returns zeros for empty class', () => {
      const stats = buildClassStats({ students: [] }, [], 0, 0, null, null);
      expect(stats.averageGrade).toBe(0);
      expect(stats.attendanceRate).toBe(0);
    });
  });

  describe('getPrimaryClassIds', () => {
    it('extracts unique first class ids from students', () => {
      const students = [
        { classRooms: ['c1', 'c2'] },
        { classRooms: ['c1'] },
        { classRooms: ['c3'] },
        { classRooms: [] },
      ];
      expect(getPrimaryClassIds(students).sort()).toEqual(['c1', 'c3']);
    });
  });

  describe('buildClassMap', () => {
    it('maps class id to class object', () => {
      const classes = [{ _id: 'c1', name: '7A' }, { _id: 'c2', name: '8B' }];
      const map = buildClassMap(classes);
      expect(map.get('c1').name).toBe('7A');
      expect(map.get('c2').name).toBe('8B');
    });
  });

  describe('buildStudentWithClassInfo', () => {
    it('includes current class from class map', () => {
      const student = {
        _id: 's1',
        name: 'Ion',
        email: 'ion@test.com',
        classRooms: ['c1'],
      };
      const classMap = buildClassMap([{ _id: 'c1', name: '7A' }]);
      const result = buildStudentWithClassInfo(student, classMap);
      expect(result.currentClass).toEqual({ _id: 'c1', name: '7A' });
    });

    it('sets canAddToClass when option enabled', () => {
      const student = { _id: 's1', name: 'Ion', email: 'e', classRooms: ['c1'] };
      const classMap = buildClassMap([{ _id: 'c1', name: '7A' }]);
      const result = buildStudentWithClassInfo(student, classMap, {
        includeCanAddToClass: true,
        classId: 'c2',
      });
      expect(result.canAddToClass).toBe(true);
    });

    it('sets canAddToClass false when student already in target class', () => {
      const student = { _id: 's1', name: 'Ion', email: 'e', classRooms: ['c1'] };
      const classMap = buildClassMap([{ _id: 'c1', name: '7A' }]);
      const result = buildStudentWithClassInfo(student, classMap, {
        includeCanAddToClass: true,
        classId: 'c1',
      });
      expect(result.canAddToClass).toBe(false);
    });

    it('handles student without class', () => {
      const student = { _id: 's1', name: 'Ion', email: 'e', classRooms: [] };
      const result = buildStudentWithClassInfo(student, new Map());
      expect(result.currentClass).toBeNull();
    });
  });
});
