const { isAdmin, canAccessProfile } = require('../controllers/userController/validators');

describe('userController/validators', () => {
  describe('isAdmin', () => {
    it('returns true for admin user', () => {
      expect(isAdmin({ role: 'admin' })).toBe(true);
    });

    it('returns false for non-admin or missing user', () => {
      expect(isAdmin({ role: 'teacher' })).toBe(false);
      expect(isAdmin(null)).toBe(false);
    });
  });

  describe('canAccessProfile', () => {
    it('denies access without authenticated user', () => {
      expect(canAccessProfile({}, 'user1')).toBe(false);
    });

    it('allows admin to access any profile', () => {
      const req = { user: { role: 'admin', userId: 'admin1' } };
      expect(canAccessProfile(req, 'other-user')).toBe(true);
    });

    it('allows user to access own profile', () => {
      const req = { user: { role: 'student', userId: 's1' } };
      expect(canAccessProfile(req, 's1')).toBe(true);
    });

    it('denies user access to other profiles', () => {
      const req = { user: { role: 'student', userId: 's1' } };
      expect(canAccessProfile(req, 's2')).toBe(false);
    });
  });
});
