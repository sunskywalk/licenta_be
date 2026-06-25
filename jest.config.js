module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'utils/**/*.js',
    'middleware/**/*.js',
    'controllers/**/helpers.js',
    'controllers/**/validators.js',
    'controllers/scheduleController/scheduleWrite.service.js',
    'controllers/scheduleImportExport/**/*.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
};
