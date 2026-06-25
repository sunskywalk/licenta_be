const { normalizeAssignedTo, sameId } = require('../controllers/homeworkController/helpers');

describe('homeworkController/helpers', () => {
  describe('normalizeAssignedTo', () => {
    it('returns empty array for falsy input', () => {
      expect(normalizeAssignedTo(null)).toEqual([]);
      expect(normalizeAssignedTo(undefined)).toEqual([]);
    });

    it('returns array unchanged when provided', () => {
      const list = ['s1', 's2'];
      expect(normalizeAssignedTo(list)).toBe(list);
    });
  });

  describe('sameId', () => {
    it('compares values as strings', () => {
      expect(sameId('abc', 'abc')).toBe(true);
      expect(sameId(123, '123')).toBe(true);
      expect(sameId('a', 'b')).toBe(false);
    });
  });
});
