// keep old import path working
// use /index so this file doesn't import itself
const handlers = require('./academicYearController/index');

exports.createAcademicYear = handlers.createAcademicYear;
exports.getActiveAcademicYear = handlers.getActiveAcademicYear;
exports.getAllAcademicYears = handlers.getAllAcademicYears;
exports.getAcademicYearById = handlers.getAcademicYearById;
exports.updateAcademicYear = handlers.updateAcademicYear;
exports.deleteAcademicYear = handlers.deleteAcademicYear;
exports.applyPreset = handlers.applyPreset;
exports.getPresets = handlers.getPresets;
exports.getCurrentPeriod = handlers.getCurrentPeriod;
