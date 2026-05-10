const repo = require('./repository');
const {
    buildExportFilename,
    buildEmptyExportPayload,
    buildExportPayload,
} = require('./helpers');

function buildMongoQuery(classId, semester) {
    const query = {};
    if (classId && classId !== 'all') {
        query.classId = classId;
    }
    if (semester) {
        query.semester = parseInt(semester, 10);
    }
    return query;
}

async function exportSchedule(req) {
    const { classId } = req.params;
    const { semester, week } = req.query;
    const query = buildMongoQuery(classId, semester);

    let schedules = await repo.findSchedulesWithWeekFilter(
        query,
        week ? parseInt(week, 10) : undefined
    );

    // still nothing — drop week filter and pull everything matching class/semester (old UX)
    if (schedules.length === 0 && week) {
        schedules = await repo.findSchedulesWithoutWeek(query);
    }

    if (schedules.length === 0) {
        return {
            status: 200,
            body: buildEmptyExportPayload(req.user.userId, classId, semester, week),
            headers: null,
        };
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const firstName = schedules[0]?.classId?.name;
    const filename = buildExportFilename(classId, firstName, dateStr);

    return {
        status: 200,
        body: buildExportPayload(req.user.userId, schedules, classId, semester, week),
        headers: {
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Type': 'application/json',
        },
    };
}

async function getImportTemplate() {
    const classes = await repo.listClassesForTemplate();
    const teachers = await repo.listTeachersForTemplate();

    const template = {
        _templateVersion: '1.0',
        _instructions: {
            ru: 'Заполните массив schedules и отправьте POST на /api/schedule/import. Используйте classId из списка availableClasses и teacherId из availableTeachers.',
            en: 'Fill in the schedules array and POST to /api/schedule/import. Use classId from availableClasses and teacherId from availableTeachers.',
        },
        availableClasses: classes.map((c) => ({ id: c._id, name: c.name })),
        availableTeachers: teachers.map((t) => ({
            id: t._id,
            name: t.name,
            email: t.email,
        })),
        options: {
            overwrite: false,
            dryRun: true,
        },
        schedules: [
            {
                classId: classes[0]?._id || 'CLASS_ID_HERE',
                className: classes[0]?.name || 'Example Class',
                dayOfWeek: 1,
                week: 1,
                semester: 1,
                year: new Date().getFullYear(),
                periods: [
                    {
                        subject: 'Matematică',
                        teacherId: teachers[0]?._id || 'TEACHER_ID_HERE',
                        teacherName: teachers[0]?.name || 'Teacher Name',
                        teacherEmail: teachers[0]?.email || 'teacher@example.com',
                        startTime: '08:00',
                        endTime: '08:45',
                        room: '101',
                    },
                ],
            },
        ],
    };

    const filename = `schedule_import_template_${new Date().toISOString().split('T')[0]}.json`;

    return {
        status: 200,
        body: template,
        headers: {
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Type': 'application/json',
        },
    };
}

module.exports = {
    exportSchedule,
    getImportTemplate,
};
