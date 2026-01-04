// controllers/academicYearController.js
const AcademicYear = require('../models/AcademicYear');
const { generatePeriodsFromPreset, getPresetsForUI } = require('../config/academicYearPresets');

// @desc    Создать новый учебный год
// @route   POST /api/academic-years
// @access  Admin only
exports.createAcademicYear = async (req, res) => {
    try {
        const { year, startDate, endDate, systemType, periods, isActive } = req.body;

        // Валидация дат
        if (new Date(endDate) <= new Date(startDate)) {
            return res.status(400).json({
                message: 'Дата окончания должна быть позже даты начала',
            });
        }

        // Инициализация периодов
        let finalPeriods = periods || [];

        // Если тип не custom и периоды не переданы - генерируем из пресета
        if (systemType !== 'custom' && (!periods || periods.length === 0)) {
            finalPeriods = generatePeriodsFromPreset(systemType, startDate, endDate);
        }

        const academicYear = await AcademicYear.create({
            year,
            startDate,
            endDate,
            systemType,
            periods: finalPeriods,
            isActive: isActive || false,
            createdBy: req.user.userId,
        });

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
};

// @desc    Получить активный учебный год
// @route   GET /api/academic-years/active
// @access  All authenticated
exports.getActiveAcademicYear = async (req, res) => {
    try {
        const academicYear = await AcademicYear.getActive();

        if (!academicYear) {
            return res.status(404).json({
                message: 'Активный учебный год не найден',
                fallbackToLegacy: true, // Сигнал для фронтенда использовать старую логику
            });
        }

        res.json(academicYear);
    } catch (error) {
        console.error('[getActiveAcademicYear] Error:', error);
        res.status(500).json({ message: 'Ошибка', error: error.message });
    }
};

// @desc    Получить все учебные годы
// @route   GET /api/academic-years
// @access  Admin only
exports.getAllAcademicYears = async (req, res) => {
    try {
        const academicYears = await AcademicYear.find()
            .sort({ year: -1 })
            .populate('createdBy', 'name');

        res.json(academicYears);
    } catch (error) {
        console.error('[getAllAcademicYears] Error:', error);
        res.status(500).json({ message: 'Ошибка', error: error.message });
    }
};

// @desc    Получить учебный год по ID
// @route   GET /api/academic-years/:id
// @access  Admin only
exports.getAcademicYearById = async (req, res) => {
    try {
        const academicYear = await AcademicYear.findById(req.params.id);

        if (!academicYear) {
            return res.status(404).json({ message: 'Учебный год не найден' });
        }

        res.json(academicYear);
    } catch (error) {
        console.error('[getAcademicYearById] Error:', error);
        res.status(500).json({ message: 'Ошибка', error: error.message });
    }
};

// @desc    Обновить учебный год
// @route   PUT /api/academic-years/:id
// @access  Admin only
exports.updateAcademicYear = async (req, res) => {
    try {
        const { year, startDate, endDate, systemType, periods, isActive } = req.body;

        const academicYear = await AcademicYear.findById(req.params.id);
        if (!academicYear) {
            return res.status(404).json({ message: 'Учебный год не найден' });
        }

        // Обновляем поля
        if (year !== undefined) academicYear.year = year;
        if (startDate !== undefined) academicYear.startDate = startDate;
        if (endDate !== undefined) academicYear.endDate = endDate;
        if (systemType !== undefined) academicYear.systemType = systemType;
        if (periods !== undefined) academicYear.periods = periods;
        if (isActive !== undefined) academicYear.isActive = isActive;

        await academicYear.save(); // Триггерит валидацию

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
};

// @desc    Удалить учебный год
// @route   DELETE /api/academic-years/:id
// @access  Admin only
exports.deleteAcademicYear = async (req, res) => {
    try {
        const academicYear = await AcademicYear.findById(req.params.id);

        if (!academicYear) {
            return res.status(404).json({ message: 'Учебный год не найден' });
        }

        if (academicYear.isActive) {
            return res.status(400).json({
                message: 'Нельзя удалить активный учебный год. Сначала деактивируйте его.',
            });
        }

        await AcademicYear.findByIdAndDelete(req.params.id);

        res.json({ message: 'Учебный год удалён' });
    } catch (error) {
        console.error('[deleteAcademicYear] Error:', error);
        res.status(500).json({ message: 'Ошибка', error: error.message });
    }
};

// @desc    Применить пресет к учебному году
// @route   POST /api/academic-years/:id/apply-preset
// @access  Admin only
exports.applyPreset = async (req, res) => {
    try {
        const { presetType } = req.body;
        console.log('[applyPreset] Received presetType:', presetType);
        console.log('[applyPreset] Academic Year ID:', req.params.id);

        if (!['semesters', 'trimesters', 'quarters'].includes(presetType)) {
            return res.status(400).json({ message: 'Неверный тип пресета' });
        }

        const academicYear = await AcademicYear.findById(req.params.id);
        if (!academicYear) {
            console.log('[applyPreset] Academic year not found');
            return res.status(404).json({ message: 'Учебный год не найден' });
        }

        console.log('[applyPreset] Found academic year:', academicYear.year);
        console.log('[applyPreset] Start date:', academicYear.startDate);
        console.log('[applyPreset] End date:', academicYear.endDate);

        // Генерируем периоды из пресета
        const periods = generatePeriodsFromPreset(
            presetType,
            academicYear.startDate,
            academicYear.endDate
        );

        console.log('[applyPreset] Generated periods:', periods.length);

        academicYear.systemType = presetType;
        academicYear.periods = periods;
        await academicYear.save();

        console.log('[applyPreset] Successfully saved');

        res.json({
            message: `Применён пресет: ${presetType}`,
            academicYear,
        });
    } catch (error) {
        console.error('[applyPreset] Error:', error);
        res.status(500).json({ message: 'Ошибка', error: error.message });
    }
};

// @desc    Получить список доступных пресетов
// @route   GET /api/academic-years/presets
// @access  Admin only
exports.getPresets = async (req, res) => {
    try {
        const presets = getPresetsForUI();
        res.json(presets);
    } catch (error) {
        console.error('[getPresets] Error:', error);
        res.status(500).json({ message: 'Ошибка', error: error.message });
    }
};

// @desc    Получить текущий период по дате
// @route   GET /api/academic-years/current-period
// @access  All authenticated
exports.getCurrentPeriod = async (req, res) => {
    try {
        const { date } = req.query;
        const checkDate = date ? new Date(date) : new Date();

        const academicYear = await AcademicYear.getActive();

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

        res.json({
            academicYear: {
                _id: academicYear._id,
                year: academicYear.year,
                displayName: academicYear.displayName,
            },
            currentPeriod,
        });
    } catch (error) {
        console.error('[getCurrentPeriod] Error:', error);
        res.status(500).json({ message: 'Ошибка', error: error.message });
    }
};
