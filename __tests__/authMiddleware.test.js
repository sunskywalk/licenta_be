const jwt = require('jsonwebtoken');
const { protect, checkRole, adminOnly } = require('../middleware/authMiddleware');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authMiddleware', () => {
  describe('protect', () => {
    it('returns 401 when token is missing', () => {
      const req = { headers: {} };
      const res = mockRes();
      const next = jest.fn();

      protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when token is invalid', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const req = { headers: { authorization: 'Bearer invalid-token' } };
      const res = mockRes();
      const next = jest.fn();

      protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('sets req.user and calls next for valid token', () => {
      const token = jwt.sign({ userId: 'user1', role: 'teacher' }, process.env.JWT_SECRET);
      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();
      const next = jest.fn();

      protect(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({ userId: 'user1', role: 'teacher' });
    });
  });

  describe('checkRole', () => {
    it('returns 403 when role is missing', () => {
      const middleware = checkRole(['admin']);
      const req = { user: {} };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when role is not allowed', () => {
      const middleware = checkRole(['admin']);
      const req = { user: { role: 'student' } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('calls next when role is allowed', () => {
      const middleware = checkRole(['teacher', 'admin']);
      const req = { user: { role: 'teacher' } };
      const res = mockRes();
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('adminOnly', () => {
    it('blocks non-admin users', () => {
      const req = { user: { role: 'teacher' } };
      const res = mockRes();
      const next = jest.fn();

      adminOnly(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('allows admin users', () => {
      const req = { user: { role: 'admin' } };
      const res = mockRes();
      const next = jest.fn();

      adminOnly(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
