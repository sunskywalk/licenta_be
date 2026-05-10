const mongoose = require('mongoose');
const {
    YEAR_FIELD_MESSAGES,
    SYSTEM_TYPES,
    ERROR_PERIODS_OVERLAP,
    periodOutsideYearMessage,
} = require('./constants');
const { createAcademicPeriodSchema } = require('./period.schema');

function attachInstanceMethods(schema) {
    // pick period containing date (noon so odd TZ edges behave)
    schema.methods.getCurrentPeriod = function (date = new Date()) {
        const checkDate = new Date(date);
        checkDate.setHours(12, 0, 0, 0);

        return this.periods.find((period) => {
            const start = new Date(period.startDate);
            const end = new Date(period.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            return checkDate >= start && checkDate <= end;
        });
    };

    schema.methods.getPeriodByNumber = function (periodNumber) {
        return this.periods.find((period) => period.periodNumber === periodNumber);
    };

    // mutates periods order — same as old code, used before save hooks
    schema.methods.hasOverlappingPeriods = function () {
        const periods = this.periods.sort(
            (a, b) => new Date(a.startDate) - new Date(b.startDate),
        );

        for (let i = 0; i < periods.length - 1; i++) {
            const currentEnd = new Date(periods[i].endDate);
            const nextStart = new Date(periods[i + 1].startDate);

            if (currentEnd >= nextStart) {
                return true;
            }
        }

        return false;
    };
}

function attachStatics(schema) {
    schema.statics.getActive = async function () {
        return this.findOne({ isActive: true }).sort({ year: -1 });
    };
}

function attachHooks(schema) {
    schema.pre('save', function (next) {
        if (!this.displayName && this.year) {
            this.displayName = `${this.year}/${this.year + 1}`;
        }
        next();
    });

    schema.pre('save', function (next) {
        if (this.periods.length > 0 && this.hasOverlappingPeriods()) {
            const error = new Error(ERROR_PERIODS_OVERLAP);
            error.name = 'ValidationError';
            return next(error);
        }
        next();
    });

    schema.pre('save', function (next) {
        const yearStart = new Date(this.startDate);
        const yearEnd = new Date(this.endDate);

        for (const period of this.periods) {
            const periodStart = new Date(period.startDate);
            const periodEnd = new Date(period.endDate);

            if (periodStart < yearStart || periodEnd > yearEnd) {
                const error = new Error(periodOutsideYearMessage(period));
                error.name = 'ValidationError';
                return next(error);
            }
        }
        next();
    });

    schema.pre('save', async function (next) {
        if (this.isActive && this.isModified('isActive')) {
            await this.constructor.updateMany(
                { _id: { $ne: this._id } },
                { isActive: false },
            );
        }
        next();
    });
}

function createAcademicYearSchema() {
    const academicPeriodSchema = createAcademicPeriodSchema();

    const academicYearSchema = new mongoose.Schema(
        {
            year: {
                type: Number,
                required: [true, YEAR_FIELD_MESSAGES.year[0]],
            },
            displayName: {
                type: String,
                default: '',
            },
            startDate: {
                type: Date,
                required: [true, YEAR_FIELD_MESSAGES.startDate[0]],
            },
            endDate: {
                type: Date,
                required: [true, YEAR_FIELD_MESSAGES.endDate[0]],
            },
            systemType: {
                type: String,
                enum: SYSTEM_TYPES,
                required: [true, YEAR_FIELD_MESSAGES.systemType[0]],
                default: 'semesters',
            },
            periods: [academicPeriodSchema],
            isActive: {
                type: Boolean,
                default: false,
            },
            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        },
        {
            timestamps: true,
        },
    );

    academicYearSchema.index({ year: 1, isActive: 1 });

    attachInstanceMethods(academicYearSchema);
    attachStatics(academicYearSchema);
    attachHooks(academicYearSchema);

    return academicYearSchema;
}

module.exports = {
    createAcademicYearSchema,
};
