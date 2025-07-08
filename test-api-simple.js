const http = require('http');

const BASE_URL = 'http://localhost:5050/api';

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5050,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPI() {
  try {
    console.log('Testing API endpoints...\n');

    // Test login
    console.log('1. Testing login...');
    const loginResponse = await makeRequest('POST', '/users/login', {
      email: 'teacher@school.com',
      password: 'teacher123'
    });
    
    if (loginResponse.status === 200) {
      console.log('Login successful:', loginResponse.data.message);
      const token = loginResponse.data.token;
      console.log('Token received\n');

      // Test get homework
      console.log('2. Testing get homework...');
      const homeworkResponse = await makeRequest('GET', '/homeworks', null, token);
      console.log('Homework status:', homeworkResponse.status);
      if (homeworkResponse.status === 200) {
        console.log('Homework retrieved successfully:', Array.isArray(homeworkResponse.data) ? homeworkResponse.data.length : 'not array', 'items');
      } else {
        console.log('Homework error:', homeworkResponse.data.message || homeworkResponse.data);
      }
      console.log();

      // Test get grades for teacher
      console.log('3. Testing get teacher grades...');
      const teacherId = loginResponse.data.user._id;
      const gradesResponse = await makeRequest('GET', `/grades/teacher/${teacherId}`, null, token);
      console.log('Grades status:', gradesResponse.status);
      if (gradesResponse.status === 200) {
        console.log('Teacher grades retrieved successfully:', Array.isArray(gradesResponse.data) ? gradesResponse.data.length : 'not array', 'items');
      } else {
        console.log('Grades error:', gradesResponse.data.message || gradesResponse.data);
      }
      console.log();

      // Test get attendance for teacher
      console.log('4. Testing get teacher attendance...');
      const attendanceResponse = await makeRequest('GET', `/attendance/teacher/${teacherId}`, null, token);
      console.log('Attendance status:', attendanceResponse.status);
      if (attendanceResponse.status === 200) {
        console.log('Teacher attendance retrieved successfully:', Array.isArray(attendanceResponse.data) ? attendanceResponse.data.length : 'not array', 'items');
      } else {
        console.log('Attendance error:', attendanceResponse.data.message || attendanceResponse.data);
      }
      console.log();

    } else {
      console.log('Login failed:', loginResponse.data.message || loginResponse.data);
    }

    console.log('API testing completed!');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAPI(); 