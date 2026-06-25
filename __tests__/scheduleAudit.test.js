const { auditScheduleConflicts, findScheduleConflicts } = require('../controllers/scheduleImportExport/scheduleAudit.service');

describe('scheduleAudit.service', () => {
  it('returns no conflicts for non-overlapping schedules', () => {
    const schedules = [
      {
        _id: 's1',
        classId: { _id: 'c1', name: '5A' },
        dayOfWeek: 1,
        week: 1,
        semester: 1,
        year: 2026,
        periods: [
          {
            subject: 'Matematica',
            startTime: '08:00',
            endTime: '08:45',
            teacherId: { _id: 't1', name: 'Prof. A' },
          },
        ],
      },
      {
        _id: 's2',
        classId: { _id: 'c2', name: '5B' },
        dayOfWeek: 1,
        week: 1,
        semester: 1,
        year: 2026,
        periods: [
          {
            subject: 'Fizică',
            startTime: '09:00',
            endTime: '09:45',
            teacherId: { _id: 't1', name: 'Prof. A' },
          },
        ],
      },
    ];

    expect(findScheduleConflicts(schedules)).toHaveLength(0);
  });

  it('detects teacher conflict in audit data', () => {
    const schedules = [
      {
        _id: 's1',
        classId: { _id: 'c1', name: '5A' },
        dayOfWeek: 1,
        week: 1,
        semester: 1,
        year: 2026,
        periods: [
          {
            subject: 'Matematica',
            startTime: '08:00',
            endTime: '08:45',
            teacherId: { _id: 't1', name: 'Prof. A' },
          },
        ],
      },
      {
        _id: 's2',
        classId: { _id: 'c2', name: '5B' },
        dayOfWeek: 1,
        week: 1,
        semester: 1,
        year: 2026,
        periods: [
          {
            subject: 'Fizică',
            startTime: '08:00',
            endTime: '08:45',
            teacherId: { _id: 't1', name: 'Prof. A' },
          },
        ],
      },
    ];

    const conflicts = findScheduleConflicts(schedules);
    expect(conflicts.some((c) => c.type === 'teacher_conflict')).toBe(true);
  });
});
