const { isValidSchedulesPayload } = require('../controllers/scheduleImportExport/validators');

describe('scheduleImportExport/validators', () => {
  it('rejects non-array payloads', () => {
    expect(isValidSchedulesPayload(null)).toBe(false);
    expect(isValidSchedulesPayload({})).toBe(false);
  });

  it('rejects empty arrays', () => {
    expect(isValidSchedulesPayload([])).toBe(false);
  });

  it('accepts non-empty arrays', () => {
    expect(isValidSchedulesPayload([{ classId: 'c1' }])).toBe(true);
  });
});
