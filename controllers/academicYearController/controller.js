const service = require('./service');
const { isEndDateAfterStartDate, isValidPresetType } = require('./validators');

async function createAcademicYear(req, res) {
    try {
        const { startDate, endDate } = req.body;

        if (!isEndDateAfterStartDate(startDate, endDate)) {
            return res.status(400).json({
                message: 'Дата окончания должна быть позже даты начала',
            });
        }

        const payload = service.buildCreatePayload(req.body, req.user.userId);
        const academicYear = await service.repository.createAcademicYear(payload);

        res.status(201).json({
            message: 'Учебный год создан',
            academicYear,
        });
    } catch (error) {
        console.error('[createAcademicYear] Error:', error);
        res.status(500).json({
            message: error.name === 'ValidationError' ? error.message : 'Ошибка при создании учебного года',
            error: error.message,
        });
    }
}

async function getActiveAcademicYear(req, res) {
    try {
        const academicYear = await service.repository.getActiveAcademicYear();

        if (!academicYear) {
            return res.status(404).json({
                message: 'Активный учебный год не найден',
                fallbackToLegacy: true,
            });
        }

        res.json(academicYear);
    } catch (error) {
        console.error('[getActiveAcademicYear] Error:', error);
        res.status(500).json({ message: 'Ошибка', error: error.message });
    }
}

async function getAllAcademicYears(req, res) {
    try {
        const academicYears = await service.repository.getAllAcademicYears();
        res.json(academicYears);
    } catch (error) {
        console.error('[getAllAcademicYears] Error:', error);
        res.status(500).json({ message: 'Ошибка', error: error.message });
    }
}

async function getAcademicYearById(req, res) {
    try {
        const academicYear = await service.repository.getAcademicYearById(req.params.id);

        if (!academicYear) {
            return res.status(404).json({ message: 'Учебный год не найден' });
        }

        res.json(academicYear);
    } catch (error) {
        console.error('[getAcademicYearById] Error:', error);
        res.status(500).json({ message: 'Ошибка', error: error.message });
    }
}

async function updateAcademicYear(req, res) {
    try {
        const academicYear = await service.repository.getAcademicYearById(req.params.id);
        if (!academicYear) {
            return res.status(404).json({ message: 'Учебный год не найден' });
        }

        service.applyAcademicYearUpdates(academicYear, req.body);
        await academicYear.save();

        res.json({
            message: 'Учебный год обновлён',
            academicYear,
        });
    } catch (error) {
        console.error('[updateAcademicYear] Error:', error);
        res.status(500).json({
            message: error.name === 'ValidationError' ? error.message : 'Ошибка при обновлении',
            error: error.message,
        });
    }
}

async function deleteAcademicYear(req, res) {
    try {
        const academicYear = await service.repository.getAcademicYearById(req.params.id);

        if (!academicYear) {
            return res.status(404).json({ message: 'Учебный год не найден' });
        }

        if (academicYear.isActive) {
            return res.status(400).json({
                message: 'Нельзя удалить активный учебный год. Сначала деактивируйте его.',
            });
        }

        await service.repository.deleteAcademicYearById(req.params.id);
        res.json({ message: 'Учебный год удалён' });
    } catch (error) {
        console.error('[deleteAcademicYear] Error:', error);
        res.status(500).json({ message: 'Ошибка', error: error.message });
    }
}

async function applyPreset(req, res) {
    try {
        const { presetType } = req.body;
        if (!isValidPresetType(presetType)) {
            return res.status(400).json({ message: 'Неверный тип пресета' });
        }

        const academicYear = await service.repository.getAcademicYearById(req.params.id);
        if (!academicYear) {
            return res.status(404).json({ message: 'Учебный год не найден' });
        }

        const periods = service.generatePresetPeriods(academicYear, presetType);
        academicYear.systemType = presetType;
        academicYear.periods = periods;
        await academicYear.save();

        res.json({
            message: `Применён пресет: ${presetType}`,
            academicYear,
        });
    } catch (error) {
        console.error('[applyPreset] Error:', error);
        res.status(500).json({ message: 'Ошибка', error: error.message });
    }
}

async function getPresets(req, res) {
    try {
        const presets = service.getPresets();
        res.json(presets);
    } catch (error) {
        console.error('[getPresets] Error:', error);
        res.status(500).json({ message: 'Ошибка', error: error.message });
    }
}

async function getCurrentPeriod(req, res) {
    try {
        const { date } = req.query;
        const checkDate = date ? new Date(date) : new Date();

        const academicYear = await service.repository.getActiveAcademicYear();
        if (!academicYear) {
            return res.status(404).json({
                message: 'Активный учебный год не найден',
                fallbackToLegacy: true,
            });
        }

        const currentPeriod = academicYear.getCurrentPeriod(checkDate);
        if (!currentPeriod) {
            return res.status(404).json({
                message: 'Текущий период не найден (возможно дата вне учебного года)',
            });
        }

        res.json(service.buildCurrentPeriodResponse(academicYear, currentPeriod));
    } catch (error) {
        console.error('[getCurrentPeriod] Error:', error);
        res.status(500).json({ message: 'Ошибка', error: error.message });
    }
}

module.exports = {
    createAcademicYear,
    getActiveAcademicYear,
    getAllAcademicYears,
    getAcademicYearById,
    updateAcademicYear,
    deleteAcademicYear,
    applyPreset,
    getPresets,
    getCurrentPeriod,
};
