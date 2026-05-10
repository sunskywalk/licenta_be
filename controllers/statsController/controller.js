const service = require('./service');
const { MESSAGES } = require('./constants');

async function getSystemStats(req, res) {
    try {
        const stats = await service.buildSystemStats();
        res.json(stats);
    } catch (error) {
        console.error('[getSystemStats] Error:', error);
        res.status(500).json({
            message: MESSAGES.SYSTEM_STATS_ERROR,
            error: error.message,
        });
    }
}

async function getRecentActivity(req, res) {
    try {
        const sortedActivities = await service.buildRecentActivityList();
        res.json(sortedActivities);
    } catch (error) {
        console.error('[getRecentActivity] Error:', error);
        res.status(500).json({
            message: MESSAGES.RECENT_ACTIVITY_ERROR,
            error: error.message,
        });
    }
}

async function getClassStats(req, res) {
    try {
        const classStats = await service.getClassStatistics();
        res.json(classStats);
    } catch (error) {
        console.error('[getClassStats] Error:', error);
        res.status(500).json({
            message: MESSAGES.CLASS_STATS_ERROR,
            error: error.message,
        });
    }
}

module.exports = {
    getSystemStats,
    getRecentActivity,
    getClassStats,
};
