const {
  isEndDateAfterStartDate,
  isValidPresetType,
} = require('../controllers/academicYearController/validators');

describe('academicYearController/validators', () => {
  describe('isEndDateAfterStartDate', () => {
    it('returns true when end is after start', () => {
      expect(isEndDateAfterStartDate('2024-09-01', '2025-06-01')).toBe(true);
    });

    it('returns false when end is before or equal to start', () => {
      expect(isEndDateAfterStartDate('2024-09-01', '2024-08-01')).toBe(false);
      expect(isEndDateAfterStartDate('2024-09-01', '2024-09-01')).toBe(false);
    });
  });

  describe('isValidPresetType', () => {
    it('accepts valid preset types', () => {
      expect(isValidPresetType('semesters')).toBe(true);
      expect(isValidPresetType('trimesters')).toBe(true);
      expect(isValidPresetType('quarters')).toBe(true);
    });

    it('rejects invalid preset types', () => {
      expect(isValidPresetType('months')).toBe(false);
      expect(isValidPresetType('')).toBe(false);
    });
  });
});
