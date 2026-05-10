const service = require('./service');
const { MESSAGES } = require('./constants');

exports.exportSchedule = async (req, res) => {
    try {
        const result = await service.exportSchedule(req);
        if (result.headers) {
            Object.entries(result.headers).forEach(([key, value]) => res.setHeader(key, value));
        }
        res.status(result.status).json(result.body);
    } catch (error) {
        console.error('[exportSchedule] Error:', error);
        res.status(500).json({ message: MESSAGES.EXPORT_ERROR, error: error.message });
    }
};

exports.importSchedule = async (req, res) => {
    try {
        const result = await service.importSchedule(req);
        res.status(result.status).json(result.body);
    } catch (error) {
        console.error('[importSchedule] Error:', error);
        res.status(500).json({ message: MESSAGES.IMPORT_ERROR, error: error.message });
    }
};

exports.getImportTemplate = async (req, res) => {
    try {
        const result = await service.getImportTemplate(req);
        if (result.headers) {
            Object.entries(result.headers).forEach(([key, value]) => res.setHeader(key, value));
        }
        res.status(result.status).json(result.body);
    } catch (error) {
        console.error('[getImportTemplate] Error:', error);
        res.status(500).json({ message: MESSAGES.TEMPLATE_ERROR, error: error.message });
    }
};
