// Routes must require `./academicYearController/index`. Plain `./academicYearController` resolves to academicYearController.js if it existed — same-name folder trap.

module.exports = require('./controller');
