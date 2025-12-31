const mongoose = require('mongoose');

const schoolEventSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['vacation', 'holiday', 'shortened_day', 'class_exception'],
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    affectsAllSchool: {
        type: Boolean,
        default: true,
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: function () {
            return !this.affectsAllSchool;
        },
    },
    shortenedSchedule: {
        lessonDuration: {
            type: Number, // minutes
            default: 45,
        },
        breakDuration: {
            type: Number, // minutes
            default: 10,
        },
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

// Index for efficient date range queries
schoolEventSchema.index({ startDate: 1, endDate: 1 });
schoolEventSchema.index({ classId: 1 });

// Virtual to check if event is active on a given date
schoolEventSchema.methods.isActiveOnDate = function (date) {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const start = new Date(this.startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(this.endDate);
    end.setHours(23, 59, 59, 999);

    return checkDate >= start && checkDate <= end;
};

module.exports = mongoose.model('SchoolEvent', schoolEventSchema);
