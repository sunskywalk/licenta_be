const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  try {
    console.log('Testing API endpoints...\n');

    // Test login
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
      email: 'teacher@school.com',
      password: 'password123'
    });
    console.log('Login successful:', loginResponse.data.message);
    const token = loginResponse.data.token;
    console.log('Token received\n');

    // Test headers
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test get all users (admin only)
    console.log('2. Testing get all users...');
    try {
      const usersResponse = await axios.get(`${BASE_URL}/users`, { headers });
      console.log('Users retrieved successfully');
    } catch (error) {
      console.log('Expected error (teacher cannot get all users):', error.response?.data?.message);
    }
    console.log();

    // Test get homework
    console.log('3. Testing get homework...');
    try {
      const homeworkResponse = await axios.get(`${BASE_URL}/homeworks`, { headers });
      console.log('Homework retrieved successfully:', homeworkResponse.data.length, 'items');
    } catch (error) {
      console.log('Homework error:', error.response?.data?.message || error.message);
    }
    console.log();

    // Test get grades for teacher
    console.log('4. Testing get teacher grades...');
    try {
      const teacherId = loginResponse.data.user._id;
      const gradesResponse = await axios.get(`${BASE_URL}/grades/teacher/${teacherId}`, { headers });
      console.log('Teacher grades retrieved successfully:', gradesResponse.data.length, 'items');
    } catch (error) {
      console.log('Grades error:', error.response?.data?.message || error.message);
    }
    console.log();

    // Test get attendance for teacher
    console.log('5. Testing get teacher attendance...');
    try {
      const teacherId = loginResponse.data.user._id;
      const attendanceResponse = await axios.get(`${BASE_URL}/attendance/teacher/${teacherId}`, { headers });
      console.log('Teacher attendance retrieved successfully:', attendanceResponse.data.length, 'items');
    } catch (error) {
      console.log('Attendance error:', error.response?.data?.message || error.message);
    }
    console.log();

    console.log('API testing completed!');

  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testAPI(); 