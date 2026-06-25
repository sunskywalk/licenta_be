const {
  parseClassName,
  buildClassName,
  promoteClassName,
  resolveClassGrade,
} = require('../utils/classNameUtils');

describe('classNameUtils', () => {
  describe('parseClassName', () => {
    it('parses grade and letter from class name', () => {
      expect(parseClassName('7A')).toEqual({ grade: 7, letter: 'A' });
      expect(parseClassName('10B')).toEqual({ grade: 10, letter: 'B' });
    });

    it('returns null grade for empty or invalid names', () => {
      expect(parseClassName('')).toEqual({ grade: null, letter: '' });
      expect(parseClassName(null)).toEqual({ grade: null, letter: '' });
      expect(parseClassName('ABC')).toEqual({ grade: null, letter: '' });
    });
  });

  describe('buildClassName', () => {
    it('concatenates grade and letter', () => {
      expect(buildClassName(5, 'A')).toBe('5A');
      expect(buildClassName(12)).toBe('12');
    });
  });

  describe('promoteClassName', () => {
    it('increments grade for valid classes 5-11', () => {
      expect(promoteClassName('5A')).toBe('6A');
      expect(promoteClassName('11B')).toBe('12B');
    });

    it('returns null for out-of-range grades', () => {
      expect(promoteClassName('4A')).toBeNull();
      expect(promoteClassName('12A')).toBeNull();
      expect(promoteClassName('')).toBeNull();
    });
  });

  describe('resolveClassGrade', () => {
    it('prefers explicit grade field over name', () => {
      expect(resolveClassGrade({ grade: 8, name: '7A' })).toBe(8);
    });

    it('falls back to parsing name', () => {
      expect(resolveClassGrade({ name: '9C' })).toBe(9);
    });
  });
});
