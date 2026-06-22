const academicConfig = require('../../config/academicConfig');
const repository = require('./repository');

async function getStudentLessonDetails(studentId, subject, dateStr) {
    const lessonDate = new Date(dateStr);
    const startOfDay = new Date(lessonDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(lessonDate);
    endOfDay.setHours(23, 59, 59, 999);

    const student = await repository.findUserById(studentId);
    if (!student) {
        return { notFoundStudent: true };
    }

    const [grades, homework, recentGradeWithComment] = await Promise.all([
        repository.findGradesForLessonWindow(studentId, subject, startOfDay, endOfDay),
        repository.findHomeworkForLesson(subject, startOfDay, endOfDay, lessonDate),
        repository.findLatestGradeWithComment(studentId, subject),
    ]);

    return {
        subject,
        date: dateStr,
        grades: grades.map((grade) => ({
            _id: grade._id,
            value: grade.value,
            type: grade.type,
            comment: grade.comment || '',
            createdAt: grade.createdAt,
        })),
        homework: homework.map((hw) => ({
            _id: hw._id,
            title: hw.title,
            description: hw.description || '',
            dueDate: hw.dueDate,
            createdAt: hw.createdAt,
            attachments: hw.attachments || [],
        })),
        teacherComment: recentGradeWithComment?.comment || null,
        lastCommentDate: recentGradeWithComment?.createdAt || null,
    };
}

async function getCurrentAcademicInfo() {
    let info;
    try {
        info = await academicConfig.getCurrentWeekAndSemesterAsync();
    } catch (e) {
        info = academicConfig.getCurrentWeekAndSemester();
    }
    const config = academicConfig.getAcademicYearConfig();

    return {
        ...info,
        currentYear: info.academicYear || config.academicYear,
        academicYearLabel: `${info.academicYear || config.academicYear}-${
            (info.academicYear || config.academicYear) + 1
        }`,
        semester1: {
            start: config.semester1.start.toISOString().split('T')[0],
            end: config.semester1.end.toISOString().split('T')[0],
        },
        semester2: {
            start: config.semester2.start.toISOString().split('T')[0],
            end: config.semester2.end.toISOString().split('T')[0],
        },
    };
}

async function getWeekDates(semester, week) {
    const semesterNum = parseInt(semester, 10);
    const weekNum = parseInt(week, 10);

    if (Number.isNaN(semesterNum) || Number.isNaN(weekNum) || weekNum < 1) {
        return { invalid: true };
    }

    const dates = await academicConfig.getWeekDates(semesterNum, weekNum);
    const weekStart = await academicConfig.getWeekStartDate(semesterNum, weekNum);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return {
        semester: semesterNum,
        week: weekNum,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        dates,
    };
}

module.exports = {
    getStudentLessonDetails,
    getCurrentAcademicInfo,
    getWeekDates,
};
