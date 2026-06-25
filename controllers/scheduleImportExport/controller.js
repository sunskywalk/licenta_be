const service = require('./service');
const { auditScheduleConflicts } = require('./scheduleAudit.service');
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

exports.exportScheduleExcel = async (req, res) => {
    try {
        const result = await service.exportScheduleExcel(req);
        if (result.headers) {
            Object.entries(result.headers).forEach(([key, value]) => res.setHeader(key, value));
        }
        res.status(result.status).send(result.buffer);
    } catch (error) {
        console.error('[exportScheduleExcel] Error:', error);
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

exports.importScheduleExcel = async (req, res) => {
    try {
        const result = await service.importScheduleExcel(req);
        res.status(result.status).json(result.body);
    } catch (error) {
        console.error('[importScheduleExcel] Error:', error);
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

exports.getExcelTemplate = async (req, res) => {
    try {
        const result = await service.getExcelTemplate(req);
        if (result.headers) {
            Object.entries(result.headers).forEach(([key, value]) => res.setHeader(key, value));
        }
        res.status(result.status).send(result.buffer);
    } catch (error) {
        console.error('[getExcelTemplate] Error:', error);
        res.status(500).json({ message: MESSAGES.TEMPLATE_ERROR, error: error.message });
    }
};

exports.auditConflicts = async (req, res) => {
    try {
        const result = await auditScheduleConflicts(req.query);
        res.status(200).json(result);
    } catch (error) {
        console.error('[auditConflicts] Error:', error);
        res.status(500).json({ message: 'Ошибка при проверке конфликтов', error: error.message });
    }
};
