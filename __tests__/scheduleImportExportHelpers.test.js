const {
  buildExportFilename,
  buildEmptyExportPayload,
  buildExportPayload,
} = require('../controllers/scheduleImportExport/helpers');

describe('scheduleImportExport/helpers', () => {
  const userId = 'admin1';
  const dateStr = '2024-06-01';

  describe('buildExportFilename', () => {
    it('uses "all" label when exporting all classes', () => {
      expect(buildExportFilename('all', null, dateStr)).toBe(
        'schedule_export_all_2024-06-01.json'
      );
    });

    it('uses class name when available', () => {
      expect(buildExportFilename('classId1', '7A', dateStr)).toBe(
        'schedule_export_7A_2024-06-01.json'
      );
    });

    it('falls back to classId when name missing', () => {
      expect(buildExportFilename('classId1', null, dateStr)).toBe(
        'schedule_export_classId1_2024-06-01.json'
      );
    });
  });

  describe('buildEmptyExportPayload', () => {
    it('builds empty export structure with filters', () => {
      const payload = buildEmptyExportPayload(userId, 'all', '1', '2');
      expect(payload.exportedBy).toBe(userId);
      expect(payload.version).toBe('1.0');
      expect(payload.totalSchedules).toBe(0);
      expect(payload.schedules).toEqual([]);
      expect(payload.filters.semester).toBe(1);
      expect(payload.filters.week).toBe(2);
      expect(payload.filters.classId).toBeNull();
    });
  });

  describe('buildExportPayload', () => {
    it('maps schedules for export', () => {
      const schedules = [{
        classId: { _id: 'c1', name: '5A' },
        dayOfWeek: 1,
        week: 1,
        semester: 1,
        year: 2024,
        periods: [{
          subject: 'Math',
          startTime: '08:00',
          endTime: '09:00',
          room: '101',
          teacherId: { _id: 't1', name: 'Ion', email: 'ion@test.com' },
        }],
      }];

      const payload = buildExportPayload(userId, schedules, 'c1', '1', '1');

      expect(payload.totalSchedules).toBe(1);
      expect(payload.schedules[0].className).toBe('5A');
      expect(payload.schedules[0].periods[0].teacherName).toBe('Ion');
      expect(payload.schedules[0].periods[0].teacherEmail).toBe('ion@test.com');
    });

    it('handles plain teacherId without populated object', () => {
      const schedules = [{
        classId: 'c1',
        dayOfWeek: 1,
        week: 1,
        semester: 1,
        year: 2024,
        periods: [{
          subject: 'Math',
          startTime: '08:00',
          endTime: '09:00',
          teacherId: 't1',
        }],
      }];

      const payload = buildExportPayload(userId, schedules, 'c1', null, null);
      expect(payload.schedules[0].periods[0].teacherName).toBe('Unknown');
      expect(payload.filters.semester).toBeNull();
    });
  });
});
