const repository = require('./repository');
const { normalizeAssignedTo } = require('./helpers');

function buildCreatePayload(body, teacherUserId, attachments = []) {
    const { classId, subject, title, description, dueDate, assignedTo } = body;
    return {
        classId,
        subject,
        teacher: teacherUserId,
        title,
        description,
        dueDate,
        assignedTo: normalizeAssignedTo(assignedTo),
        attachments,
    };
}

function buildUpdatePayload(body) {
    const { classId, subject, title, description, dueDate, assignedTo } = body;
    return { classId, subject, title, description, dueDate, assignedTo };
}

async function createHomework(body, teacherUserId, attachments = []) {
    const payload = buildCreatePayload(body, teacherUserId, attachments);
    return repository.createHomework(payload);
}

async function getAllHomeworks() {
    return repository.findAllHomeworks();
}

async function getHomeworkById(homeworkId) {
    return repository.findHomeworkById(homeworkId);
}

async function updateHomework(homeworkId, body) {
    const payload = buildUpdatePayload(body);
    return repository.updateHomeworkById(homeworkId, payload);
}

async function deleteHomework(homeworkId) {
    return repository.deleteHomeworkById(homeworkId);
}

async function getHomeworkByClassroom(classroomId) {
    return repository.findHomeworksByClassroom(classroomId);
}

// assigned-only OR whole-class homework for any of the student's rooms
async function getHomeworkForStudent(studentId) {
    const student = await repository.findUserClassRooms(studentId);
    const classIds = student?.classRooms || [];
    return repository.findHomeworksForStudent(studentId, classIds);
}

async function getHomeworkForTeacher(teacherId) {
    return repository.findHomeworksByTeacher(teacherId);
}

module.exports = {
    createHomework,
    getAllHomeworks,
    getHomeworkById,
    updateHomework,
    deleteHomework,
    getHomeworkByClassroom,
    getHomeworkForStudent,
    getHomeworkForTeacher,
};
