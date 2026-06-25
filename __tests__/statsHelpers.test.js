const { getTimeAgo } = require('../controllers/statsController/helpers');

describe('statsController/helpers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getTimeAgo', () => {
    it('returns minutes ago for recent dates', () => {
      const thirtyMinAgo = new Date('2024-06-15T11:30:00');
      expect(getTimeAgo(thirtyMinAgo)).toBe('30 minutes ago');
    });

    it('returns hours ago for same-day older dates', () => {
      const threeHoursAgo = new Date('2024-06-15T09:00:00');
      expect(getTimeAgo(threeHoursAgo)).toBe('3 hours ago');
    });

    it('returns days ago for older dates', () => {
      const twoDaysAgo = new Date('2024-06-13T12:00:00');
      expect(getTimeAgo(twoDaysAgo)).toBe('2 days ago');
    });

    it('handles string date input', () => {
      expect(getTimeAgo('2024-06-15T11:00:00')).toBe('1 hours ago');
    });
  });
});
