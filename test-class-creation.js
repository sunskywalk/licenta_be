const axios = require('axios');

const API_BASE = 'http://localhost:5050/api';

async function testNewEndpoints() {
  console.log('🧪 Testing new class creation endpoints...\n');
  
  try {
    // Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE}/users/login`, {
      email: 'admin@school.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Admin login successful\n');
    
    // Test 1: Get all teachers
    console.log('2. Testing GET /api/classes/data/teachers...');
    const teachersResponse = await axios.get(`${API_BASE}/classes/data/teachers`, { headers });
    console.log(`✅ Found ${teachersResponse.data.length} teachers:`);
    teachersResponse.data.forEach(teacher => {
      console.log(`   - ${teacher.name} (${teacher.email})`);
    });
    console.log('');
    
    // Test 2: Get all students for class
    console.log('3. Testing GET /api/classes/data/students...');
    const studentsResponse = await axios.get(`${API_BASE}/classes/data/students`, { headers });
    console.log(`✅ Found ${studentsResponse.data.length} students:`);
    studentsResponse.data.slice(0, 3).forEach(student => {
      console.log(`   - ${student.name} (${student.email}) - Current class: ${student.currentClass?.name || 'None'}`);
    });
    if (studentsResponse.data.length > 3) {
      console.log(`   ... and ${studentsResponse.data.length - 3} more`);
    }
    console.log('');
    
    // Test 3: Get subjects list
    console.log('4. Testing GET /api/classes/data/subjects...');
    const subjectsResponse = await axios.get(`${API_BASE}/classes/data/subjects`, { headers });
    console.log(`✅ Found ${subjectsResponse.data.length} subjects:`);
    console.log(`   ${subjectsResponse.data.slice(0, 5).join(', ')}...`);
    console.log('');
    
    // Test 4: Create new class with proper data
    console.log('5. Testing class creation with new data structure...');
    const newClassData = {
      name: 'Test Class 12B',
      grade: 12,
      students: studentsResponse.data.slice(0, 3).map(s => s._id),
      teachers: teachersResponse.data.slice(0, 2).map(t => t._id),
      subjects: subjectsResponse.data.slice(0, 5)
    };
    
    console.log('Class data:', {
      name: newClassData.name,
      grade: newClassData.grade,
      studentCount: newClassData.students.length,
      teacherCount: newClassData.teachers.length,
      subjectCount: newClassData.subjects.length
    });
    
    const createResponse = await axios.post(`${API_BASE}/classes`, newClassData, { headers });
    console.log(`✅ Class created successfully with ID: ${createResponse.data._id}`);
    
    // Test 5: Get created class details
    console.log('\n6. Testing created class details...');
    const classResponse = await axios.get(`${API_BASE}/classes/${createResponse.data._id}`, { headers });
    console.log(`✅ Class details retrieved:`);
    console.log(`   Name: ${classResponse.data.name}`);
    console.log(`   Grade: ${classResponse.data.grade}`);
    console.log(`   Students: ${classResponse.data.students?.length || 0}`);
    console.log(`   Teachers: ${classResponse.data.teachers?.length || 0}`);
    console.log(`   Subjects: ${classResponse.data.subjects?.length || 0}`);
    
    console.log('\n🎉 All tests passed! New class creation system is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testNewEndpoints(); 