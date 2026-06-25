const {
  validateMarkAttendanceBody,
  validateBulkAttendanceBody,
} = require('../controllers/attendanceController/validators');

describe('attendanceController/validators', () => {
  describe('validateMarkAttendanceBody', () => {
    it('rejects incomplete body', () => {
      const result = validateMarkAttendanceBody({ student: 's1' });
      expect(result.ok).toBe(false);
      expect(result.response.status).toBe(400);
    });

    it('accepts complete body', () => {
      const body = {
        student: 's1',
        classId: 'c1',
        subject: 'Math',
        date: '2024-01-01',
        status: 'present',
        teacher: 't1',
      };
      const result = validateMarkAttendanceBody(body);
      expect(result.ok).toBe(true);
      expect(result.fields.student).toBe('s1');
    });
  });

  describe('validateBulkAttendanceBody', () => {
    it('rejects non-array body', () => {
      const result = validateBulkAttendanceBody({});
      expect(result.ok).toBe(false);
    });

    it('accepts array body', () => {
      const result = validateBulkAttendanceBody([{ student: 's1' }]);
      expect(result.ok).toBe(true);
      expect(result.records).toHaveLength(1);
    });
  });
});
