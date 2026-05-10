const repository = require('./repository');
const { MESSAGES, EVENT_TYPE } = require('./constants');
const { startOfLocalDay, endOfLocalDay } = require('./helpers');
const {
    validateCreatePayload,
    validateRangeQuery,
    validateUpdateDates,
} = require('./validators');

function buildCreateDocument(body, start, end, userId) {
    const { type, name, affectsAllSchool, classId, shortenedSchedule } = body;
    const affectsAll = affectsAllSchool !== false;
    return {
        type,
        name,
        startDate: start,
        endDate: end,
        affectsAllSchool: affectsAll,
        classId: affectsAll ? undefined : classId,
        shortenedSchedule: type === EVENT_TYPE.SHORTENED_DAY ? shortenedSchedule : undefined,
        createdBy: userId,
    };
}

async function createSchoolEvent(body, userId) {
    const parsed = validateCreatePayload(body);
    if (!parsed.ok) {
        return { error: { status: parsed.status, message: parsed.message } };
    }
    const { start, end } = parsed;

    const { affectsAllSchool, classId } = body;
    if (!affectsAllSchool && classId) {
        const classroom = await repository.findClassroomById(classId);
        if (!classroom) {
            return { error: { status: 404, message: MESSAGES.CLASSROOM_NOT_FOUND } };
        }
    }

    const doc = buildCreateDocument(body, start, end, userId);
    const event = await repository.createAndPopulateEvent(doc);
    return { event };
}

async function getAllSchoolEvents() {
    return repository.findAllSchoolEventsSorted();
}

async function getEventsForDate(dateParam) {
    const checkDate = startOfLocalDay(dateParam);
    const endDay = endOfLocalDay(checkDate);
    return repository.findEventsIntersectingDay(checkDate, endDay);
}

async function getEventsInRange(startDate, endDate) {
    const vr = validateRangeQuery(startDate, endDate);
    if (!vr.ok) {
        return { error: { status: vr.status, message: vr.message } };
    }
    const start = startOfLocalDay(startDate);
    const end = endOfLocalDay(endDate);
    return repository.findEventsIntersectingRange(start, end);
}

async function updateSchoolEvent(id, updates) {
    const vu = validateUpdateDates(updates);
    if (!vu.ok) {
        return { error: { status: vu.status, message: vu.message } };
    }
    const event = await repository.updateSchoolEventById(id, updates);
    if (!event) {
        return { error: { status: 404, message: MESSAGES.NOT_FOUND } };
    }
    return { event };
}

async function deleteSchoolEvent(id) {
    const event = await repository.deleteSchoolEventById(id);
    if (!event) {
        return { error: { status: 404, message: MESSAGES.NOT_FOUND } };
    }
    return { event };
}

module.exports = {
    createSchoolEvent,
    getAllSchoolEvents,
    getEventsForDate,
    getEventsInRange,
    updateSchoolEvent,
    deleteSchoolEvent,
};
