const {
  validateCreatePayload,
  validateRangeQuery,
  validateUpdateDates,
} = require('../controllers/schoolEventController/validators');

describe('schoolEventController/validators', () => {
  describe('validateCreatePayload', () => {
    it('rejects missing fields', () => {
      const result = validateCreatePayload({ type: 'holiday' });
      expect(result.ok).toBe(false);
    });

    it('rejects start date after end date', () => {
      const result = validateCreatePayload({
        type: 'holiday',
        name: 'Test',
        startDate: '2024-06-10',
        endDate: '2024-06-01',
      });
      expect(result.ok).toBe(false);
    });

    it('accepts valid payload', () => {
      const result = validateCreatePayload({
        type: 'holiday',
        name: 'Test',
        startDate: '2024-06-01',
        endDate: '2024-06-10',
      });
      expect(result.ok).toBe(true);
      expect(result.start).toBeInstanceOf(Date);
    });
  });

  describe('validateRangeQuery', () => {
    it('requires both dates', () => {
      expect(validateRangeQuery('2024-01-01', null).ok).toBe(false);
    });

    it('accepts both dates', () => {
      expect(validateRangeQuery('2024-01-01', '2024-01-31').ok).toBe(true);
    });
  });

  describe('validateUpdateDates', () => {
    it('rejects invalid date order on update', () => {
      const result = validateUpdateDates({
        startDate: '2024-06-10',
        endDate: '2024-06-01',
      });
      expect(result.ok).toBe(false);
    });

    it('allows partial update with single date', () => {
      const result = validateUpdateDates({ startDate: '2024-06-01' });
      expect(result.ok).toBe(true);
    });
  });
});
