const { computeWeekCount } = require('../models/AcademicYear/helpers');

describe('AcademicYear/helpers', () => {
  describe('computeWeekCount', () => {
    it('computes week count for a date span', () => {
      const start = new Date('2024-09-01');
      const end = new Date('2024-09-14');
      expect(computeWeekCount(start, end)).toBe(2);
    });

    it('returns 0 for same-day span', () => {
      const date = new Date('2024-09-01');
      expect(computeWeekCount(date, date)).toBe(0);
    });

    it('handles reversed date order via absolute diff', () => {
      const start = new Date('2024-09-14');
      const end = new Date('2024-09-01');
      expect(computeWeekCount(start, end)).toBe(2);
    });
  });
});
