const {
    parseDayOfWeek,
    groupRowsIntoSchedules,
    detectBatchConflicts,
    flattenSchedulesToRows,
    timesOverlap,
} = require('../controllers/scheduleImportExport/excelHelpers');

describe('excelHelpers', () => {
    it('parses Romanian day names', () => {
        expect(parseDayOfWeek('Luni')).toBe(1);
        expect(parseDayOfWeek('Vineri')).toBe(5);
    });

    it('groups flat rows into schedule entries', () => {
        const rows = [
            {
                Clasă: '5A',
                Zi: 'Luni',
                'Ora început': '08:00',
                'Ora sfârșit': '08:45',
                Materie: 'Matematica',
                Profesor: 'Prof. Test',
                'Email profesor': 'test@school.ro',
                Sală: '101',
                Săptămână: 1,
                Semestru: 1,
                An: 2026,
            },
            {
                Clasă: '5A',
                Zi: 'Luni',
                'Ora început': '09:00',
                'Ora sfârșit': '09:45',
                Materie: 'Limba română',
                Profesor: 'Prof. Test 2',
                'Email profesor': 'test2@school.ro',
                Sală: '102',
                Săptămână: 1,
                Semestru: 1,
                An: 2026,
            },
        ];

        const { schedules, errors } = groupRowsIntoSchedules(rows);
        expect(errors).toHaveLength(0);
        expect(schedules).toHaveLength(1);
        expect(schedules[0].periods).toHaveLength(2);
    });

    it('detects teacher conflicts in batch', () => {
        const teacherId = 'teacher-1';
        const conflicts = detectBatchConflicts([
            {
                className: '5A',
                dayOfWeek: 1,
                week: 1,
                semester: 1,
                year: 2026,
                periods: [
                    {
                        teacherId,
                        teacherName: 'Prof. A',
                        subject: 'Matematica',
                        startTime: '08:00',
                        endTime: '08:45',
                    },
                ],
            },
            {
                className: '5B',
                dayOfWeek: 1,
                week: 1,
                semester: 1,
                year: 2026,
                periods: [
                    {
                        teacherId,
                        teacherName: 'Prof. A',
                        subject: 'Fizică',
                        startTime: '08:00',
                        endTime: '08:45',
                    },
                ],
            },
        ]);

        expect(conflicts.some((c) => c.type === 'teacher_conflict')).toBe(true);
    });

    it('flattens schedules for export rows', () => {
        const rows = flattenSchedulesToRows([
            {
                classId: { name: '5A' },
                dayOfWeek: 1,
                week: 1,
                semester: 1,
                year: 2026,
                periods: [
                    {
                        subject: 'Matematica',
                        startTime: '08:00',
                        endTime: '08:45',
                        room: '101',
                        teacherId: { name: 'Prof. A', email: 'a@school.ro' },
                    },
                ],
            },
        ]);

        expect(rows).toHaveLength(1);
        expect(rows[0].Clasă).toBe('5A');
        expect(rows[0].Zi).toBe('Luni');
    });

    it('detects overlapping times', () => {
        expect(timesOverlap('08:00', '08:45', '08:30', '09:15')).toBe(true);
        expect(timesOverlap('08:00', '08:45', '09:00', '09:45')).toBe(false);
    });
});

// groupRowsIntoSchedules is not exported with parseDayOfWeek - fix test
// parseDayOfWeek is not exported - I need to export it or test via groupRowsIntoSchedules only
