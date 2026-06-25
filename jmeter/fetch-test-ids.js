#!/usr/bin/env node
/**
 * Fetches STUDENT_ID and CLASS_ID from running API (after npm run seed).
 * Usage: node jmeter/fetch-test-ids.js
 * Copy output into JMeter User Defined Variables or pass via -JSTUDENT_ID=...
 */

const axios = require('axios');

const BASE = process.env.API_BASE || 'http://localhost:5050';
const EMAIL = process.env.JMETER_EMAIL || 'admin@school.com';
const PASSWORD = process.env.JMETER_PASSWORD || 'admin123';

async function main() {
  try {
    const loginRes = await axios.post(`${BASE}/api/users/login`, {
      email: EMAIL,
      password: PASSWORD,
    });
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    const [usersRes, classesRes] = await Promise.all([
      axios.get(`${BASE}/api/users`, { headers }),
      axios.get(`${BASE}/api/classes`, { headers }),
    ]);

    const users = usersRes.data;
    const classes = classesRes.data;
    const student = users.find((u) => u.role === 'student');
    const firstClass = classes[0];

    if (!student) {
      console.error('No student found. Run: npm run seed');
      process.exit(1);
    }
    if (!firstClass) {
      console.error('No class found. Run: npm run seed');
      process.exit(1);
    }

    console.log('Paste into JMeter → Test Plan → User Defined Variables:\n');
    console.log(`STUDENT_ID = ${student._id}`);
    console.log(`CLASS_ID   = ${firstClass._id}`);
    console.log('\nOr run headless JMeter:');
    console.log(`jmeter -n -t jmeter/school-catalog-load-test.jmx -l jmeter/results.jtl \\`);
    console.log(`  -JSTUDENT_ID=${student._id} -JCLASS_ID=${firstClass._id}`);
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error('Failed:', msg);
    console.error('Make sure backend is running: npm run dev');
    process.exit(1);
  }
}

main();
