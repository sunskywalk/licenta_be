const MESSAGES = {
    MISSING_FIELDS: 'Missing required fields',
    START_BEFORE_END: 'Start date must be before end date',
    CLASSROOM_NOT_FOUND: 'Classroom not found',
    RANGE_DATES_REQUIRED: 'Start date and end date are required',
    NOT_FOUND: 'Event not found',
    SERVER_ERROR: 'Server error',
    DELETED_OK: 'Event deleted successfully',
};

const EVENT_TYPE = {
    SHORTENED_DAY: 'shortened_day',
};

const POPULATE = {
    CLASS_NAME: 'name',
    CREATED_BY: 'name email',
};

module.exports = {
    MESSAGES,
    EVENT_TYPE,
    POPULATE,
};
