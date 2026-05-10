const service = require('./service');
const { MESSAGES, ROLES } = require('./constants');
const {
    canManageHomework,
    studentMayViewTargetStudent,
    teacherMayViewTargetTeacher,
} = require('./validators');

async function createHomework(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: MESSAGES.AUTH_REQUIRED });
        }

        if (!canManageHomework(req.user.role)) {
            return res.status(403).json({ message: MESSAGES.NO_CREATE_PERMISSION });
        }

        const { classId, subject, title, description, dueDate, assignedTo } = req.body;
        const hw = await service.createHomework(
            { classId, subject, title, description, dueDate, assignedTo },
            req.user.userId
        );
        res.status(201).json({ message: MESSAGES.CREATED, homework: hw });
    } catch (error) {
        res.status(500).json({ message: MESSAGES.SERVER_ERROR, error: error.message });
    }
}

async function getAllHomeworks(req, res) {
    try {
        // students used to get the whole DB via this route — same JSON shape, scoped list
        if (req.user?.role === ROLES.STUDENT) {
            const hws = await service.getHomeworkForStudent(req.user.userId);
            return res.json(hws);
        }

        const hws = await service.getAllHomeworks();
        res.json(hws);
    } catch (error) {
        res.status(500).json({ message: MESSAGES.SERVER_ERROR, error: error.message });
    }
}

async function getHomeworkById(req, res) {
    try {
        const hw = await service.getHomeworkById(req.params.id);
        if (!hw) {
            return res.status(404).json({ message: MESSAGES.NOT_FOUND });
        }
        res.json(hw);
    } catch (error) {
        res.status(500).json({ message: MESSAGES.SERVER_ERROR, error: error.message });
    }
}

async function updateHomework(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: MESSAGES.AUTH_REQUIRED });
        }

        if (!canManageHomework(req.user.role)) {
            return res.status(403).json({ message: MESSAGES.NO_PERMISSION });
        }

        const { classId, subject, title, description, dueDate, assignedTo } = req.body;
        const updated = await service.updateHomework(req.params.id, {
            classId,
            subject,
            title,
            description,
            dueDate,
            assignedTo,
        });
        if (!updated) {
            return res.status(404).json({ message: MESSAGES.NOT_FOUND });
        }
        res.json({ message: MESSAGES.UPDATED, homework: updated });
    } catch (error) {
        res.status(500).json({ message: MESSAGES.SERVER_ERROR, error: error.message });
    }
}

async function deleteHomework(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: MESSAGES.AUTH_REQUIRED });
        }

        if (!canManageHomework(req.user.role)) {
            return res.status(403).json({ message: MESSAGES.NO_PERMISSION });
        }

        const deleted = await service.deleteHomework(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: MESSAGES.NOT_FOUND });
        }
        res.json({ message: MESSAGES.DELETED });
    } catch (error) {
        res.status(500).json({ message: MESSAGES.SERVER_ERROR, error: error.message });
    }
}

async function getHomeworkByClassroom(req, res) {
    try {
        const { classroomId } = req.params;
        const homeworks = await service.getHomeworkByClassroom(classroomId);
        res.json(homeworks);
    } catch (error) {
        console.error('Error in getHomeworkByClassroom:', error);
        res.status(500).json({ message: MESSAGES.SERVER_ERROR, error: error.message });
    }
}

async function getHomeworkByStudent(req, res) {
    try {
        const { studentId } = req.params;

        if (!studentMayViewTargetStudent(req.user.role, req.user.userId, studentId)) {
            return res.status(403).json({ message: MESSAGES.NO_PERMISSION });
        }

        const homeworks = await service.getHomeworkForStudent(studentId);
        res.json(homeworks);
    } catch (error) {
        console.error('Error in getHomeworkByStudent:', error);
        res.status(500).json({ message: MESSAGES.SERVER_ERROR, error: error.message });
    }
}

async function getHomeworkByTeacher(req, res) {
    try {
        const { teacherId } = req.params;

        if (!teacherMayViewTargetTeacher(req.user.role, req.user.userId, teacherId)) {
            return res.status(403).json({ message: MESSAGES.NO_PERMISSION });
        }

        const homeworks = await service.getHomeworkForTeacher(teacherId);
        res.json(homeworks);
    } catch (error) {
        console.error('Error in getHomeworkByTeacher:', error);
        res.status(500).json({ message: MESSAGES.SERVER_ERROR, error: error.message });
    }
}

module.exports = {
    createHomework,
    getAllHomeworks,
    getHomeworkById,
    updateHomework,
    deleteHomework,
    getHomeworkByClassroom,
    getHomeworkByStudent,
    getHomeworkByTeacher,
};
