const mongoose = require('mongoose');
const { createAcademicYearSchema } = require('./academicYear.schema');

/**
 * Import this model as `require('.../models/AcademicYear/index')`.
 * A bare `.../models/AcademicYear` can pick `AcademicYear.js` over `AcademicYear/index.js` if both exist.
 */
const academicYearSchema = createAcademicYearSchema();

module.exports = mongoose.model('AcademicYear', academicYearSchema);
