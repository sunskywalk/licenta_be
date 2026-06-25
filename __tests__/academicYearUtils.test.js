const {
  defaultAcademicYear,
  buildYearFilter,
  mergeYearFilter,
} = require('../utils/academicYearUtils');

describe('academicYearUtils', () => {
  describe('defaultAcademicYear', () => {
    it('returns current year when date is in September or later', () => {
      expect(defaultAcademicYear(new Date('2024-09-01'))).toBe(2024);
      expect(defaultAcademicYear(new Date('2024-12-15'))).toBe(2024);
    });

    it('returns previous year when date is before September', () => {
      expect(defaultAcademicYear(new Date('2024-08-31'))).toBe(2023);
      expect(defaultAcademicYear(new Date('2024-01-10'))).toBe(2023);
    });
  });

  describe('buildYearFilter', () => {
    it('returns empty object when year is missing or invalid', () => {
      expect(buildYearFilter(undefined)).toEqual({});
      expect(buildYearFilter(null)).toEqual({});
      expect(buildYearFilter('')).toEqual({});
      expect(buildYearFilter('abc')).toEqual({});
    });

    it('builds Mongo filter for a valid year', () => {
      expect(buildYearFilter('2024')).toEqual({
        $or: [
          { academicYear: 2024 },
          { academicYear: { $exists: false } },
          { academicYear: null },
        ],
      });
    });
  });

  describe('mergeYearFilter', () => {
    it('returns base filter unchanged when year is invalid', () => {
      const base = { student: 'abc' };
      expect(mergeYearFilter(base, null)).toEqual(base);
    });

    it('merges year filter into base filter', () => {
      const base = { student: 'abc' };
      const merged = mergeYearFilter(base, 2024);
      expect(merged.student).toBe('abc');
      expect(merged.$or).toBeDefined();
    });
  });
});
