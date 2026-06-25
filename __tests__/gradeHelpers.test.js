const {
  isSameId,
  calculateAverage,
  withTwoDecimals,
  buildSubjectStatsMap,
  mapSubjectStatsToResponse,
  calculateAttendanceRate,
  findRankPosition,
} = require('../controllers/gradeController/helpers');

describe('gradeController/helpers', () => {
  describe('isSameId', () => {
    it('compares ids as strings', () => {
      expect(isSameId('abc', 'abc')).toBe(true);
      expect(isSameId({ toString: () => '123' }, '123')).toBe(true);
      expect(isSameId({ _id: 'abc' }, 'abc')).toBe(true);
      expect(isSameId('abc', 'def')).toBe(false);
    });
  });

  describe('subjectsMatch', () => {
    const { subjectsMatch } = require('../controllers/gradeController/helpers');

    it('matches TIC aliases', () => {
      expect(subjectsMatch('TIC', 'tic')).toBe(true);
      expect(subjectsMatch('TIC', 'Informatică')).toBe(true);
    });

    it('matches translated subject names', () => {
      expect(subjectsMatch('Romanian', 'Limba română')).toBe(true);
      expect(subjectsMatch('History', 'Istorie')).toBe(true);
    });
  });

  describe('calculateAverage', () => {
    it('computes average using picker function', () => {
      const items = [{ v: 8 }, { v: 10 }];
      expect(calculateAverage(items, (i) => i.v)).toBe(9);
    });

    it('returns 0 for empty array', () => {
      expect(calculateAverage([], (i) => i.v)).toBe(0);
    });
  });

  describe('withTwoDecimals', () => {
    it('formats to two decimal places', () => {
      expect(withTwoDecimals(8.456)).toBe('8.46');
    });
  });

  describe('buildSubjectStatsMap', () => {
    it('separates final grades from regular grades', () => {
      const grades = [
        { subject: 'Math', type: 'lesson', value: 8, semester: 1 },
        { subject: 'Math', type: 'final', value: 9, semester: 1 },
        { subject: 'Math', type: 'test', value: 10, semester: 1 },
      ];
      const stats = buildSubjectStatsMap(grades);
      expect(stats.Math.finalGrades[1]).toBe(9);
      expect(stats.Math.grades).toEqual([8, 10]);
      expect(stats.Math.count).toBe(2);
    });
  });

  describe('mapSubjectStatsToResponse', () => {
    it('maps stats to API response shape', () => {
      const stats = {
        Math: { grades: [8, 10], total: 18, count: 2, finalGrades: { 1: 9 } },
      };
      const result = mapSubjectStatsToResponse(stats);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Math');
      expect(result[0].averageGrade).toBe('9.0');
      expect(result[0].finalGrade).toBe(9);
    });

    it('returns zero average when no regular grades', () => {
      const stats = {
        Physics: { grades: [], total: 0, count: 0, finalGrades: { 2: 7 } },
      };
      const result = mapSubjectStatsToResponse(stats);
      expect(result[0].averageGrade).toBe(0);
      expect(result[0].finalGrade).toBe(7);
    });
  });

  describe('calculateAttendanceRate', () => {
    it('returns percentage of present records', () => {
      const records = [
        { status: 'present' },
        { status: 'absent' },
        { status: 'present' },
        { status: 'present' },
      ];
      expect(calculateAttendanceRate(records)).toBe(75);
    });

    it('returns 0 for empty records', () => {
      expect(calculateAttendanceRate([])).toBe(0);
    });
  });

  describe('findRankPosition', () => {
    it('returns 1-based rank index', () => {
      const items = [
        { studentId: 'a', name: 'A' },
        { studentId: 'b', name: 'B' },
      ];
      expect(findRankPosition(items, 'b')).toBe(2);
      expect(findRankPosition(items, 'x')).toBe(0);
    });
  });
});
