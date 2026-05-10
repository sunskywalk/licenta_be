// Routes must require `./scheduleImportExport/index`. Plain `./scheduleImportExport` resolves to a same-named file if it exists — use `/index` explicitly.

module.exports = require('./controller');
