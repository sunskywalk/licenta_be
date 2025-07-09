const mongoose = require('mongoose');
const User = require('./models/User');
const Classroom = require('./models/Classroom');
const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5050';
let adminToken = '';

// Connect to MongoDB
mongoose.set('strictQuery', false);
mongoose.connect('mongodb://localhost:27017/licenta', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('📦 Connected to MongoDB');
}).catch(error => {
  console.error('❌ MongoDB connection error:', error);
});

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Request failed: ${method} ${endpoint}`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
async function loginAsAdmin() {
  try {
    console.log('\n🔐 Logging in as admin...');
    
    const response = await axios.post(`${BASE_URL}/api/users/login`, {
      email: 'admin@school.com',
      password: 'admin123'
    });
    
    adminToken = response.data.token;
    console.log('✅ Admin login successful');
    return true;
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetClassWithStats() {
  try {
    console.log('\n📊 Testing getClassWithStats...');
    
    // Get all classes first
    const classes = await makeRequest('GET', '/api/classes');
    console.log(`📚 Found ${classes.length} classes`);
    
    if (classes.length > 0) {
      const classId = classes[0]._id;
      console.log(`🔍 Testing stats for class: ${classes[0].name} (${classId})`);
      
      const classStats = await makeRequest('GET', `/api/classes/${classId}/stats`);
      console.log('✅ Class stats retrieved successfully');
      console.log(`📈 Class: ${classStats.name}`);
      console.log(`👥 Students: ${classStats.classStats.totalStudents}`);
      console.log(`📊 Average Grade: ${classStats.classStats.averageGrade}`);
      console.log(`📅 Attendance Rate: ${classStats.classStats.attendanceRate}%`);
      console.log(`🎯 Best Student (Grades): ${classStats.classStats.bestPerformingStudent?.name || 'None'}`);
      console.log(`📅 Best Student (Attendance): ${classStats.classStats.bestAttendanceStudent?.name || 'None'}`);
      
      return classStats;
    }
    
    return null;
  } catch (error) {
    console.error('❌ getClassWithStats test failed:', error.message);
    return null;
  }
}

async function testGetAvailableStudents() {
  try {
    console.log('\n👥 Testing getAvailableStudents...');
    
    // Get all students
    const students = await makeRequest('GET', '/api/classes/students/available');
    console.log(`✅ Found ${students.length} available students`);
    
    students.slice(0, 3).forEach(student => {
      console.log(`👤 ${student.name} (${student.email})`);
      if (student.currentClass) {
        console.log(`   Current class: ${student.currentClass.name}`);
      } else {
        console.log(`   No current class`);
      }
    });
    
    // Test with search
    const searchResults = await makeRequest('GET', '/api/classes/students/available?search=test');
    console.log(`🔍 Search results: ${searchResults.length} students`);
    
    return students;
  } catch (error) {
    console.error('❌ getAvailableStudents test failed:', error.message);
    return [];
  }
}

async function testAddRemoveStudent() {
  try {
    console.log('\n🔄 Testing add/remove student...');
    
    // Get a class and available students
    const classes = await makeRequest('GET', '/api/classes');
    const availableStudents = await makeRequest('GET', '/api/classes/students/available');
    
    if (classes.length === 0 || availableStudents.length === 0) {
      console.log('⚠️ No classes or students available for testing');
      return;
    }
    
    const testClass = classes[0];
    const testStudent = availableStudents.find(s => s.canAddToClass);
    
    if (!testStudent) {
      console.log('⚠️ No students available to add to class');
      return;
    }
    
    console.log(`🎯 Test class: ${testClass.name}`);
    console.log(`👤 Test student: ${testStudent.name}`);
    
    // Add student to class
    console.log('➕ Adding student to class...');
    await makeRequest('POST', '/api/classes/students/add', {
      classId: testClass._id,
      studentId: testStudent._id
    });
    console.log('✅ Student added successfully');
    
    // Verify student was added
    const updatedClass = await makeRequest('GET', `/api/classes/${testClass._id}/stats`);
    const addedStudent = updatedClass.students.find(s => s._id === testStudent._id);
    
    if (addedStudent) {
      console.log(`✅ Student verified in class: ${addedStudent.name}`);
    } else {
      console.log('❌ Student not found in class after adding');
    }
    
    // Remove student from class
    console.log('➖ Removing student from class...');
    await makeRequest('POST', '/api/classes/students/remove', {
      classId: testClass._id,
      studentId: testStudent._id
    });
    console.log('✅ Student removed successfully');
    
    // Verify student was removed
    const finalClass = await makeRequest('GET', `/api/classes/${testClass._id}/stats`);
    const removedStudent = finalClass.students.find(s => s._id === testStudent._id);
    
    if (!removedStudent) {
      console.log('✅ Student verified removed from class');
    } else {
      console.log('❌ Student still found in class after removal');
    }
    
  } catch (error) {
    console.error('❌ Add/remove student test failed:', error.message);
  }
}

async function testStudentTransfer() {
  try {
    console.log('\n🔄 Testing student transfer between classes...');
    
    const classes = await makeRequest('GET', '/api/classes');
    
    if (classes.length < 2) {
      console.log('⚠️ Need at least 2 classes for transfer test');
      return;
    }
    
    const class1 = classes[0];
    const class2 = classes[1];
    
    // Get a student from class1
    const class1Stats = await makeRequest('GET', `/api/classes/${class1._id}/stats`);
    
    if (class1Stats.students.length === 0) {
      console.log('⚠️ No students in first class for transfer test');
      return;
    }
    
    const studentToTransfer = class1Stats.students[0];
    
    console.log(`🎯 Transferring ${studentToTransfer.name} from ${class1.name} to ${class2.name}`);
    
    // Add student to class2 (should automatically remove from class1)
    await makeRequest('POST', '/api/classes/students/add', {
      classId: class2._id,
      studentId: studentToTransfer._id
    });
    
    console.log('✅ Student transfer initiated');
    
    // Verify student is in class2
    const class2Updated = await makeRequest('GET', `/api/classes/${class2._id}/stats`);
    const studentInClass2 = class2Updated.students.find(s => s._id === studentToTransfer._id);
    
    // Verify student is not in class1
    const class1Updated = await makeRequest('GET', `/api/classes/${class1._id}/stats`);
    const studentInClass1 = class1Updated.students.find(s => s._id === studentToTransfer._id);
    
    if (studentInClass2 && !studentInClass1) {
      console.log('✅ Student transfer successful');
    } else {
      console.log('❌ Student transfer failed');
      console.log(`Student in class1: ${!!studentInClass1}`);
      console.log(`Student in class2: ${!!studentInClass2}`);
    }
    
  } catch (error) {
    console.error('❌ Student transfer test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🧪 Starting Class Management API Tests...');
  
  // Login as admin
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without admin login');
    return;
  }
  
  // Run tests
  await testGetClassWithStats();
  await testGetAvailableStudents();
  await testAddRemoveStudent();
  await testStudentTransfer();
  
  console.log('\n✅ All tests completed!');
  
  // Close connection
  mongoose.connection.close();
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  mongoose.connection.close();
}); 