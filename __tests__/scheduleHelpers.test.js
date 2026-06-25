const { timeToMinutes, sortSchedulePeriods } = require('../controllers/scheduleController/helpers');

const checkTimeOverlap = (start1, end1, start2, end2) => {
  const newStart = timeToMinutes(start1);
  const newEnd = timeToMinutes(end1);
  const existingStart = timeToMinutes(start2);
  const existingEnd = timeToMinutes(end2);
  return newStart < existingEnd && newEnd > existingStart;
};

const validateTimeFormat = (timeStr) => /^([01]?\d|2[0-3]):([0-5]\d)$/.test(timeStr);

const validateTimeOrder = (startTime, endTime) => timeToMinutes(endTime) > timeToMinutes(startTime);

describe('scheduleController/helpers', () => {
  describe('timeToMinutes', () => {
    it('converts HH:mm to minutes', () => {
      expect(timeToMinutes('09:00')).toBe(540);
      expect(timeToMinutes('10:30')).toBe(630);
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('23:59')).toBe(1439);
    });
  });

  describe('validateTimeFormat', () => {
    it('accepts valid times', () => {
      expect(validateTimeFormat('09:00')).toBe(true);
      expect(validateTimeFormat('14:30')).toBe(true);
      expect(validateTimeFormat('23:59')).toBe(true);
      expect(validateTimeFormat('9:00')).toBe(true);
    });

    it('rejects invalid times', () => {
      expect(validateTimeFormat('25:00')).toBe(false);
      expect(validateTimeFormat('12:60')).toBe(false);
      expect(validateTimeFormat('abc:de')).toBe(false);
      expect(validateTimeFormat('12:5')).toBe(false);
    });
  });

  describe('validateTimeOrder', () => {
    it('requires end time after start time', () => {
      expect(validateTimeOrder('10:00', '11:00')).toBe(true);
      expect(validateTimeOrder('11:00', '10:00')).toBe(false);
      expect(validateTimeOrder('10:00', '10:00')).toBe(false);
    });
  });

  describe('checkTimeOverlap', () => {
    it('detects overlapping intervals', () => {
      expect(checkTimeOverlap('10:00', '11:00', '10:30', '11:30')).toBe(true);
      expect(checkTimeOverlap('10:00', '11:00', '09:00', '10:30')).toBe(true);
    });

    it('does not flag touching or separate intervals', () => {
      expect(checkTimeOverlap('10:00', '11:00', '11:00', '12:00')).toBe(false);
      expect(checkTimeOverlap('10:00', '11:00', '12:00', '13:00')).toBe(false);
    });
  });

  describe('sortSchedulePeriods', () => {
    it('sorts periods by startTime ascending', () => {
      const schedule = {
        periods: [
          { startTime: '11:00', endTime: '12:00' },
          { startTime: '09:00', endTime: '10:00' },
          { startTime: '10:00', endTime: '11:00' },
        ],
      };
      sortSchedulePeriods(schedule);
      expect(schedule.periods.map((p) => p.startTime)).toEqual(['09:00', '10:00', '11:00']);
    });

    it('handles empty or missing periods', () => {
      expect(() => sortSchedulePeriods({})).not.toThrow();
      expect(() => sortSchedulePeriods(null)).not.toThrow();
    });
  });
});
