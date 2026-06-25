const { normalizeEmail } = require('../controllers/userController/helpers');

describe('userController/helpers', () => {
  describe('normalizeEmail', () => {
    it('lowercases email', () => {
      expect(normalizeEmail('Admin@School.COM')).toBe('admin@school.com');
    });

    it('returns falsy input unchanged', () => {
      expect(normalizeEmail(null)).toBeNull();
      expect(normalizeEmail(undefined)).toBeUndefined();
    });
  });
});
