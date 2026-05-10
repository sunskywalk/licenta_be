const service = require('./service');
const { MESSAGES } = require('./constants');

async function createSchoolEvent(req, res) {
    try {
        const result = await service.createSchoolEvent(req.body, req.user.userId);
        if (result.error) {
            return res.status(result.error.status).json({ message: result.error.message });
        }
        res.status(201).json(result.event);
    } catch (error) {
        console.error('Error creating school event:', error);
        res.status(500).json({ message: MESSAGES.SERVER_ERROR, error: error.message });
    }
}

async function getAllSchoolEvents(req, res) {
    try {
        const events = await service.getAllSchoolEvents();
        res.json(events);
    } catch (error) {
        console.error('Error fetching school events:', error);
        res.status(500).json({ message: MESSAGES.SERVER_ERROR, error: error.message });
    }
}

async function getEventsForDate(req, res) {
    try {
        const events = await service.getEventsForDate(req.params.date);
        res.json(events);
    } catch (error) {
        console.error('Error fetching events for date:', error);
        res.status(500).json({ message: MESSAGES.SERVER_ERROR, error: error.message });
    }
}

async function getEventsInRange(req, res) {
    try {
        const { startDate, endDate } = req.query;
        const result = await service.getEventsInRange(startDate, endDate);
        if (result && result.error) {
            return res.status(result.error.status).json({ message: result.error.message });
        }
        res.json(result);
    } catch (error) {
        console.error('Error fetching events in range:', error);
        res.status(500).json({ message: MESSAGES.SERVER_ERROR, error: error.message });
    }
}

async function updateSchoolEvent(req, res) {
    try {
        const result = await service.updateSchoolEvent(req.params.id, req.body);
        if (result.error) {
            return res.status(result.error.status).json({ message: result.error.message });
        }
        res.json(result.event);
    } catch (error) {
        console.error('Error updating school event:', error);
        res.status(500).json({ message: MESSAGES.SERVER_ERROR, error: error.message });
    }
}

async function deleteSchoolEvent(req, res) {
    try {
        const result = await service.deleteSchoolEvent(req.params.id);
        if (result.error) {
            return res.status(result.error.status).json({ message: result.error.message });
        }
        res.json({ message: MESSAGES.DELETED_OK, event: result.event });
    } catch (error) {
        console.error('Error deleting school event:', error);
        res.status(500).json({ message: MESSAGES.SERVER_ERROR, error: error.message });
    }
}

module.exports = {
    createSchoolEvent,
    getAllSchoolEvents,
    getEventsForDate,
    getEventsInRange,
    updateSchoolEvent,
    deleteSchoolEvent,
};
