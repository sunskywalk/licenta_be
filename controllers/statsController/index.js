// Routes must require `./statsController/index`. Plain `./statsController` would resolve to a removed/stale `statsController.js` file if it existed — stick to `/index`.

module.exports = require('./controller');
