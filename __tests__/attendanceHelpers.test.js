const {
  normalizeDayStart,
  countAttendanceStatuses,
  buildGradeLookupMap,
  attachGradesToAttendanceRows,
} = require('../controllers/attendanceController/helpers');

describe('attendanceController/helpers', () => {
  describe('normalizeDayStart', () => {
    it('normalizes date to start of local day', () => {
      const result = normalizeDayStart('2024-06-15T15:30:00');
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe('countAttendanceStatuses', () => {
    it('counts all status types and computes rate', () => {
      const docs = [
        { status: 'present' },
        { status: 'present' },
        { status: 'absent' },
        { status: 'late' },
        { status: 'excused' },
      ];
      const result = countAttendanceStatuses(docs);
      expect(result.total).toBe(5);
      expect(result.present).toBe(2);
      expect(result.absent).toBe(1);
      expect(result.late).toBe(1);
      expect(result.excused).toBe(1);
      expect(result.attendanceRate).toBe(40);
    });

    it('returns zero rate for empty docs', () => {
      const result = countAttendanceStatuses([]);
      expect(result.total).toBe(0);
      expect(result.attendanceRate).toBe(0);
    });

    it('ignores unknown statuses', () => {
      const result = countAttendanceStatuses([{ status: 'unknown' }]);
      expect(result.total).toBe(1);
      expect(result.present).toBe(0);
    });
  });

  describe('buildGradeLookupMap', () => {
    it('uses first grade per day+subject key', () => {
      const date = new Date('2024-06-01');
      const grades = [
        { createdAt: date, subject: 'Math', value: 8, type: 'lesson' },
        { createdAt: date, subject: 'Math', value: 10, type: 'test' },
        { createdAt: date, subject: 'Physics', value: 9, type: 'lesson' },
      ];
      const map = buildGradeLookupMap(grades);
      const mathKey = `${date.toDateString()}|Math`;
      expect(map.get(mathKey).value).toBe(8);
      expect(map.size).toBe(2);
    });
  });

  describe('attachGradesToAttendanceRows', () => {
    it('attaches matching grade to attendance row', () => {
      const date = new Date('2024-06-01');
      const gradeMap = buildGradeLookupMap([
        {
          createdAt: date,
          subject: 'Math',
          value: 9,
          type: 'test',
          comment: 'Good',
        },
      ]);

      const row = {
        date,
        subject: 'Math',
        status: 'present',
        toObject() {
          return { date: this.date, subject: this.subject, status: this.status };
        },
      };

      const result = attachGradesToAttendanceRows([row], gradeMap);
      expect(result[0].grade).toEqual({
        value: 9,
        type: 'test',
        comment: 'Good',
      });
    });

    it('sets grade to null when no match', () => {
      const row = {
        date: new Date('2024-06-01'),
        subject: 'Physics',
        toObject() {
          return { date: this.date, subject: this.subject };
        },
      };
      const result = attachGradesToAttendanceRows([row], new Map());
      expect(result[0].grade).toBeNull();
    });
  });
});
