const jwt = require('jsonwebtoken');

// Токен из логина
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODU4ODQ4ZGRhMGYzNmJjNjYwNDNhNTYiLCJyb2xlIjoidGVhY2hlciIsImlhdCI6MTc1MTkxNTM1MCwiZXhwIjoxNzUyMDAxNzUwfQ.eZR9NiH-eJ6pAW28V7yk1U4rggDSPRY-2ym5mFIdh28';

// JWT_SECRET из .env
const JWT_SECRET = 'your_super_secret_jwt_key_here_make_it_long_and_secure_123456789';

console.log('Testing JWT token...');
console.log('Token:', token);
console.log('JWT_SECRET:', JWT_SECRET);

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Decoded token:', decoded);
  console.log('userId:', decoded.userId);
  console.log('role:', decoded.role);
} catch (error) {
  console.error('JWT verification error:', error.message);
} 