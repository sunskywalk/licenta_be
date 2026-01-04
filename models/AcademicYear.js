// models/AcademicYear.js
const mongoose = require('mongoose');

// Схема для одного академического периода
const academicPeriodSchema = new mongoose.Schema({
    periodNumber: {
        type: Number,
        required: [true, 'Номер периода обязателен'],
        min: 1,
    },
    // Локализованные названия
    name: {
        ro: { type: String, default: '' },
        ru: { type: String, default: '' },
        en: { type: String, default: '' },
    },
    startDate: {
        type: Date,
        required: [true, 'Дата начала периода обязательна'],
    },
    endDate: {
        type: Date,
        required: [true, 'Дата окончания периода обязательна'],
    },
    // Автоматически вычисляется при сохранении
    weekCount: {
        type: Number,
        default: 0,
    },
});

// Вычисление количества недель
academicPeriodSchema.pre('validate', function (next) {
    if (this.startDate && this.endDate) {
        const diffTime = Math.abs(this.endDate - this.startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        this.weekCount = Math.ceil(diffDays / 7);
    }
    next();
});

// Основная схема учебного года
const academicYearSchema = new mongoose.Schema({
    // Для будущей multi-tenancy (schoolId будет добавлен позже)
    // schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },

    // Название года (2024, 2025 и т.д.)
    year: {
        type: Number,
        required: [true, 'Год обязателен'],
    },

    // Альтернативное название (например "2024/2025")
    displayName: {
        type: String,
        default: '',
    },

    // Дата начала учебного года
    startDate: {
        type: Date,
        required: [true, 'Дата начала учебного года обязательна'],
    },

    // Дата окончания учебного года
    endDate: {
        type: Date,
        required: [true, 'Дата окончания учебного года обязательна'],
    },

    // Тип системы разделения
    systemType: {
        type: String,
        enum: ['semesters', 'trimesters', 'quarters', 'custom'],
        required: [true, 'Тип системы обязателен'],
        default: 'semesters',
    },

    // Массив периодов (гибкий!)
    periods: [academicPeriodSchema],

    // Активный ли этот учебный год
    isActive: {
        type: Boolean,
        default: false,
    },

    // Кто создал
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

// Индексы для быстрого поиска
academicYearSchema.index({ year: 1, isActive: 1 });

// Виртуальное поле для displayName
academicYearSchema.pre('save', function (next) {
    if (!this.displayName && this.year) {
        this.displayName = `${this.year}/${this.year + 1}`;
    }
    next();
});

// Метод: получить текущий период по дате
academicYearSchema.methods.getCurrentPeriod = function (date = new Date()) {
    const checkDate = new Date(date);
    checkDate.setHours(12, 0, 0, 0); // Нормализация времени

    return this.periods.find(period => {
        const start = new Date(period.startDate);
        const end = new Date(period.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return checkDate >= start && checkDate <= end;
    });
};

// Метод: получить период по номеру
academicYearSchema.methods.getPeriodByNumber = function (periodNumber) {
    return this.periods.find(period => period.periodNumber === periodNumber);
};

// Метод: проверить, пересекаются ли периоды
academicYearSchema.methods.hasOverlappingPeriods = function () {
    const periods = this.periods.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    for (let i = 0; i < periods.length - 1; i++) {
        const currentEnd = new Date(periods[i].endDate);
        const nextStart = new Date(periods[i + 1].startDate);

        if (currentEnd >= nextStart) {
            return true;
        }
    }

    return false;
};

// Валидация: периоды не должны пересекаться
academicYearSchema.pre('save', function (next) {
    if (this.periods.length > 0 && this.hasOverlappingPeriods()) {
        const error = new Error('Периоды не должны пересекаться');
        error.name = 'ValidationError';
        return next(error);
    }
    next();
});

// Валидация: даты периодов должны быть внутри года
academicYearSchema.pre('save', function (next) {
    const yearStart = new Date(this.startDate);
    const yearEnd = new Date(this.endDate);

    for (const period of this.periods) {
        const periodStart = new Date(period.startDate);
        const periodEnd = new Date(period.endDate);

        if (periodStart < yearStart || periodEnd > yearEnd) {
            const error = new Error(`Период "${period.name.ro || period.periodNumber}" выходит за границы учебного года`);
            error.name = 'ValidationError';
            return next(error);
        }
    }
    next();
});

// Статический метод: получить активный учебный год
academicYearSchema.statics.getActive = async function () {
    return this.findOne({ isActive: true }).sort({ year: -1 });
};

// При активации — деактивировать все остальные
academicYearSchema.pre('save', async function (next) {
    if (this.isActive && this.isModified('isActive')) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { isActive: false }
        );
    }
    next();
});

module.exports = mongoose.model('AcademicYear', academicYearSchema);
