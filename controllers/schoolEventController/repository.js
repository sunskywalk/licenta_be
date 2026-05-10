const SchoolEvent = require('../../models/SchoolEvent');
const Classroom = require('../../models/Classroom');
const { POPULATE } = require('./constants');

function findClassroomById(classId) {
    return Classroom.findById(classId);
}

async function createAndPopulateEvent(docPayload) {
    const event = new SchoolEvent(docPayload);
    await event.save();
    await event.populate('classId', POPULATE.CLASS_NAME);
    await event.populate('createdBy', POPULATE.CREATED_BY);
    return event;
}

function findAllSchoolEventsSorted() {
    return SchoolEvent.find()
        .populate('classId', POPULATE.CLASS_NAME)
        .populate('createdBy', POPULATE.CREATED_BY)
        .sort({ startDate: 1 });
}

/** Same populate as monolith for this route (class only, no createdBy). */
function findEventsIntersectingDay(dayStart, dayEnd) {
    return SchoolEvent.find({
        startDate: { $lte: dayEnd },
        endDate: { $gte: dayStart },
    })
        .populate('classId', POPULATE.CLASS_NAME)
        .sort({ startDate: 1 });
}

/** Same populate as monolith (class only). */
function findEventsIntersectingRange(rangeStart, rangeEnd) {
    return SchoolEvent.find({
        $or: [{ startDate: { $lte: rangeEnd }, endDate: { $gte: rangeStart } }],
    })
        .populate('classId', POPULATE.CLASS_NAME)
        .sort({ startDate: 1 });
}

function updateSchoolEventById(id, updates) {
    return SchoolEvent.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
        .populate('classId', POPULATE.CLASS_NAME)
        .populate('createdBy', POPULATE.CREATED_BY);
}

function deleteSchoolEventById(id) {
    return SchoolEvent.findByIdAndDelete(id);
}

module.exports = {
    findClassroomById,
    createAndPopulateEvent,
    findAllSchoolEventsSorted,
    findEventsIntersectingDay,
    findEventsIntersectingRange,
    updateSchoolEventById,
    deleteSchoolEventById,
};
