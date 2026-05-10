const mongoose = require('mongoose');
const { PERIOD_FIELD_MESSAGES } = require('./constants');
const { computeWeekCount } = require('./helpers');

function createAcademicPeriodSchema() {
    const academicPeriodSchema = new mongoose.Schema({
        periodNumber: {
            type: Number,
            required: [true, PERIOD_FIELD_MESSAGES.periodNumber[0]],
            min: 1,
        },
        name: {
            ro: { type: String, default: '' },
            ru: { type: String, default: '' },
            en: { type: String, default: '' },
        },
        startDate: {
            type: Date,
            required: [true, PERIOD_FIELD_MESSAGES.startDate[0]],
        },
        endDate: {
            type: Date,
            required: [true, PERIOD_FIELD_MESSAGES.endDate[0]],
        },
        weekCount: {
            type: Number,
            default: 0,
        },
    });

    // fill weekCount before validators run
    academicPeriodSchema.pre('validate', function (next) {
        if (this.startDate && this.endDate) {
            this.weekCount = computeWeekCount(this.startDate, this.endDate);
        }
        next();
    });

    return academicPeriodSchema;
}

module.exports = {
    createAcademicPeriodSchema,
};
