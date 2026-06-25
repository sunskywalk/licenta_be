const {
  startOfLocalDay,
  endOfLocalDay,
} = require('../controllers/schoolEventController/helpers');

describe('schoolEventController/helpers', () => {
  describe('startOfLocalDay', () => {
    it('sets time to midnight', () => {
      const result = startOfLocalDay('2024-06-15T14:30:00');
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe('endOfLocalDay', () => {
    it('sets time to end of day', () => {
      const result = endOfLocalDay('2024-06-15T14:30:00');
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  it('start and end are on the same calendar day', () => {
    const input = '2024-06-15T10:00:00';
    const start = startOfLocalDay(input);
    const end = endOfLocalDay(input);
    expect(start.getDate()).toBe(end.getDate());
    expect(start.getMonth()).toBe(end.getMonth());
  });
});
