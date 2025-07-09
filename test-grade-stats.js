const axios = require('axios');

const BASE_URL = 'http://localhost:5050/api';

// Тестовые данные для входа
const loginData = {
  email: 'alex.student@licenta.com',
  password: 'password123'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Attempting login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, loginData);
    authToken = response.data.token;
    console.log('✅ Login successful');
    console.log('👤 User:', response.data.user.name, '- Role:', response.data.user.role);
    console.log('🆔 User ID:', response.data.user._id);
    return response.data.user;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testGradeStats(studentId) {
  try {
    console.log(`\n📊 Testing grade stats for student: ${studentId}`);
    const response = await axios.get(`${BASE_URL}/grades/student/${studentId}/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Grade stats response:');
    console.log('📈 Average grade:', response.data.averageGrade);
    console.log('📚 Total grades:', response.data.totalGrades);
    console.log('👥 Class rank by grades:', response.data.classRankByGrades, '/', response.data.totalClassmates);
    console.log('📅 Attendance rate:', response.data.attendanceRate + '%');
    console.log('📊 Class rank by attendance:', response.data.classRankByAttendance, '/', response.data.totalClassmates);
    
    console.log('\n📚 Subjects:');
    response.data.subjects.forEach((subject, index) => {
      console.log(`${index + 1}. ${subject.name}`);
      console.log(`   - Average: ${subject.averageGrade}`);
      console.log(`   - Final: ${subject.finalGrade || 'No final grade'}`);
      console.log(`   - Total grades: ${subject.totalGrades}`);
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Grade stats test failed:', error.response?.data || error.message);
    throw error;
  }
}

async function checkAllGrades(studentId) {
  try {
    console.log(`\n🔍 Checking ALL grades for student: ${studentId}`);
    const response = await axios.get(`${BASE_URL}/grades/student/${studentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`📋 Total grade records found: ${response.data.length}`);
    
    // Группируем по предметам
    const subjectGroups = {};
    response.data.forEach(grade => {
      if (!subjectGroups[grade.subject]) {
        subjectGroups[grade.subject] = [];
      }
      subjectGroups[grade.subject].push(grade);
    });
    
    console.log(`📚 Subjects found in database: ${Object.keys(subjectGroups).length}`);
    Object.keys(subjectGroups).forEach(subject => {
      console.log(`   - ${subject}: ${subjectGroups[subject].length} grades`);
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Grades check failed:', error.response?.data || error.message);
    throw error;
  }
}

async function checkAttendance(studentId) {
  try {
    console.log(`\n👥 Checking attendance for student: ${studentId}`);
    const response = await axios.get(`${BASE_URL}/attendance/student/${studentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`📊 Total attendance records: ${response.data.length}`);
    
    // Группируем по предметам
    const subjectGroups = {};
    response.data.forEach(record => {
      if (!subjectGroups[record.subject]) {
        subjectGroups[record.subject] = [];
      }
      subjectGroups[record.subject].push(record);
    });
    
    console.log(`📚 Subjects with attendance: ${Object.keys(subjectGroups).length}`);
    Object.keys(subjectGroups).forEach(subject => {
      const present = subjectGroups[subject].filter(r => r.status === 'present').length;
      const total = subjectGroups[subject].length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      console.log(`   - ${subject}: ${present}/${total} (${rate}%)`);
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Attendance check failed:', error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  try {
    const user = await login();
    
    await checkAllGrades(user._id);
    await checkAttendance(user._id);
    await testGradeStats(user._id);
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

runTests(); 