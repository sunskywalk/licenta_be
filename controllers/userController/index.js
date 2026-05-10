// Routes must require `./userController/index`. Plain `./userController` resolves to userController.js if it existed — same-name folder trap.

module.exports = require('./controller');
