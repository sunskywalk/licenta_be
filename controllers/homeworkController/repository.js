const Homework = require('../../models/Homework');
const User = require('../../models/User');

const TEACHER_POPULATE = 'teacher';
const TEACHER_FIELDS = '-password';

function createHomework(payload) {
    return Homework.create(payload);
}

function findAllHomeworks() {
    return Homework.find().populate('classId').populate(TEACHER_POPULATE, TEACHER_FIELDS);
}

function findHomeworkById(homeworkId) {
    return Homework.findById(homeworkId).populate('classId').populate(TEACHER_POPULATE, TEACHER_FIELDS);
}

function updateHomeworkById(homeworkId, fields) {
    return Homework.findByIdAndUpdate(homeworkId, fields, { new: true })
        .populate('classId')
        .populate(TEACHER_POPULATE, TEACHER_FIELDS);
}

function deleteHomeworkById(homeworkId) {
    return Homework.findByIdAndDelete(homeworkId);
}

function findHomeworksByClassroom(classroomId) {
    return Homework.find({ classId: classroomId })
        .populate('classId')
        .populate(TEACHER_POPULATE, TEACHER_FIELDS)
        .sort({ dueDate: 1 });
}

function findUserClassRooms(studentId) {
    return User.findById(studentId).select('classRooms');
}

function findHomeworksForStudent(studentId, classIds) {
    // if assignedTo is non-empty = targeted list, do not leak to whole class via classId
    return Homework.find({
        $or: [
            { assignedTo: studentId },
            {
                classId: { $in: classIds },
                $expr: { $eq: [{ $size: { $ifNull: ['$assignedTo', []] } }, 0] },
            },
        ],
    })
        .populate('classId')
        .populate(TEACHER_POPULATE, TEACHER_FIELDS)
        .sort({ dueDate: 1 });
}

function findHomeworksByTeacher(teacherId) {
    return Homework.find({ teacher: teacherId })
        .populate('classId')
        .populate(TEACHER_POPULATE, TEACHER_FIELDS)
        .sort({ dueDate: 1 });
}

module.exports = {
    createHomework,
    findAllHomeworks,
    findHomeworkById,
    updateHomeworkById,
    deleteHomeworkById,
    findHomeworksByClassroom,
    findUserClassRooms,
    findHomeworksForStudent,
    findHomeworksByTeacher,
};
