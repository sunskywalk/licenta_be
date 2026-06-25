const { studentCreatingNonSupport } = require('../controllers/notificationController/validators');
const { recipientListIncludesUser } = require('../controllers/notificationController/helpers');

describe('notificationController', () => {
  describe('validators', () => {
    it('blocks students from creating non-support notifications', () => {
      expect(studentCreatingNonSupport('student', 'general')).toBe(true);
      expect(studentCreatingNonSupport('student', 'info')).toBe(true);
    });

    it('allows students to create support notifications', () => {
      expect(studentCreatingNonSupport('student', 'support')).toBe(false);
    });

    it('allows teachers and admins any notification type', () => {
      expect(studentCreatingNonSupport('teacher', 'general')).toBe(false);
      expect(studentCreatingNonSupport('admin', 'info')).toBe(false);
    });
  });

  describe('helpers', () => {
    it('checks if user is in recipient list', () => {
      const notification = { recipients: ['user1', 'user2'] };
      expect(recipientListIncludesUser(notification, 'user1')).toBe(true);
      expect(recipientListIncludesUser(notification, 'user3')).toBe(false);
    });

    it('handles ObjectId-like recipients', () => {
      const notification = {
        recipients: [{ toString: () => 'abc123' }],
      };
      expect(recipientListIncludesUser(notification, 'abc123')).toBe(true);
    });
  });
});
