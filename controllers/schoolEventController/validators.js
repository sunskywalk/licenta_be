const { MESSAGES } = require('./constants');

// same required fields as the old controller, nothing fancy
function validateCreatePayload(body) {
    const { type, name, startDate, endDate } = body;
    if (!type || !name || !startDate || !endDate) {
        return { ok: false, status: 400, message: MESSAGES.MISSING_FIELDS };
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
        return { ok: false, status: 400, message: MESSAGES.START_BEFORE_END };
    }
    return { ok: true, start, end };
}

// range endpoint used to 400 if either query param missing
function validateRangeQuery(startDate, endDate) {
    if (!startDate || !endDate) {
        return { ok: false, status: 400, message: MESSAGES.RANGE_DATES_REQUIRED };
    }
    return { ok: true };
}

// only validate ordering when both dates sent; partial patch still allowed
function validateUpdateDates(updates) {
    if (updates.startDate && updates.endDate) {
        const start = new Date(updates.startDate);
        const end = new Date(updates.endDate);
        if (start > end) {
            return { ok: false, status: 400, message: MESSAGES.START_BEFORE_END };
        }
    }
    return { ok: true };
}

module.exports = {
    validateCreatePayload,
    validateRangeQuery,
    validateUpdateDates,
};
