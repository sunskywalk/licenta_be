const SchoolEvent = require('../models/SchoolEvent');
const Classroom = require('../models/Classroom');

// Create a new school event
exports.createSchoolEvent = async (req, res) => {
    try {
        const { type, name, startDate, endDate, affectsAllSchool, classId, shortenedSchedule } = req.body;

        // Validation
        if (!type || !name || !startDate || !endDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            return res.status(400).json({ message: 'Start date must be before end date' });
        }

        // If specific class, verify it exists
        if (!affectsAllSchool && classId) {
            const classroom = await Classroom.findById(classId);
            if (!classroom) {
                return res.status(404).json({ message: 'Classroom not found' });
            }
        }

        // Check for overlapping events (same type, same scope)
        const overlapping = await SchoolEvent.find({
            type,
            affectsAllSchool,
            classId: affectsAllSchool ? undefined : classId,
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } },
            ],
        });

        if (overlapping.length > 0) {
            console.log('[createSchoolEvent] Warning: Overlapping events found:', overlapping.length);
        }

        const event = new SchoolEvent({
            type,
            name,
            startDate: start,
            endDate: end,
            affectsAllSchool: affectsAllSchool !== false,
            classId: affectsAllSchool ? undefined : classId,
            shortenedSchedule: type === 'shortened_day' ? shortenedSchedule : undefined,
            createdBy: req.user.userId,
        });

        await event.save();
        await event.populate('classId', 'name');
        await event.populate('createdBy', 'name email');

        console.log('[createSchoolEvent] Created event:', event.name, 'Type:', event.type);
        res.status(201).json(event);
    } catch (error) {
        console.error('Error creating school event:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all school events
exports.getAllSchoolEvents = async (req, res) => {
    try {
        const events = await SchoolEvent.find()
            .populate('classId', 'name')
            .populate('createdBy', 'name email')
            .sort({ startDate: 1 });

        res.json(events);
    } catch (error) {
        console.error('Error fetching school events:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get events for a specific date
exports.getEventsForDate = async (req, res) => {
    try {
        const { date } = req.params;
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        const endOfDay = new Date(checkDate);
        endOfDay.setHours(23, 59, 59, 999);

        const events = await SchoolEvent.find({
            startDate: { $lte: endOfDay },
            endDate: { $gte: checkDate },
        })
            .populate('classId', 'name')
            .sort({ startDate: 1 });

        res.json(events);
    } catch (error) {
        console.error('Error fetching events for date:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get events in a date range
exports.getEventsInRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const events = await SchoolEvent.find({
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } },
            ],
        })
            .populate('classId', 'name')
            .sort({ startDate: 1 });

        res.json(events);
    } catch (error) {
        console.error('Error fetching events in range:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update a school event
exports.updateSchoolEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Validate dates if provided
        if (updates.startDate && updates.endDate) {
            const start = new Date(updates.startDate);
            const end = new Date(updates.endDate);
            if (start > end) {
                return res.status(400).json({ message: 'Start date must be before end date' });
            }
        }

        const event = await SchoolEvent.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        )
            .populate('classId', 'name')
            .populate('createdBy', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        console.log('[updateSchoolEvent] Updated event:', event.name);
        res.json(event);
    } catch (error) {
        console.error('Error updating school event:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete a school event
exports.deleteSchoolEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await SchoolEvent.findByIdAndDelete(id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        console.log('[deleteSchoolEvent] Deleted event:', event.name);
        res.json({ message: 'Event deleted successfully', event });
    } catch (error) {
        console.error('Error deleting school event:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
