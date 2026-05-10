const AcademicYear = require('../../models/AcademicYear/index');

function createAcademicYear(payload) {
    return AcademicYear.create(payload);
}

function getActiveAcademicYear() {
    return AcademicYear.getActive();
}

function getAllAcademicYears() {
    return AcademicYear.find().sort({ year: -1 }).populate('createdBy', 'name');
}

function getAcademicYearById(academicYearId) {
    return AcademicYear.findById(academicYearId);
}

function deleteAcademicYearById(academicYearId) {
    return AcademicYear.findByIdAndDelete(academicYearId);
}

module.exports = {
    createAcademicYear,
    getActiveAcademicYear,
    getAllAcademicYears,
    getAcademicYearById,
    deleteAcademicYearById,
};
