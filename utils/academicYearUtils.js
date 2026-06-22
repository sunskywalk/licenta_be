function defaultAcademicYear(date = new Date()) {
  return date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
}

function buildYearFilter(year) {
  if (year === undefined || year === null || year === '') return {};
  const yearInt = parseInt(year, 10);
  if (Number.isNaN(yearInt)) return {};
  return {
    $or: [
      { academicYear: yearInt },
      { academicYear: { $exists: false } },
      { academicYear: null },
    ],
  };
}

function mergeYearFilter(baseFilter, year) {
  const yearFilter = buildYearFilter(year);
  if (!Object.keys(yearFilter).length) return baseFilter;
  return { ...baseFilter, ...yearFilter };
}

module.exports = {
  defaultAcademicYear,
  buildYearFilter,
  mergeYearFilter,
};
