const axios = require('axios');

const API_BASE = 'http://localhost:5050/api';

async function testAttendanceWithGrades() {
    try {
        // Логин как студент
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'student1@school.com',
            password: 'student123'
        });

        const token = loginResponse.data.token;
        const userId = loginResponse.data.user._id;

        console.log('✅ Login successful');
        console.log('User ID:', userId);

        // Тест нового API endpoint
        const response = await axios.get(`${API_BASE}/attendance/student/${userId}/with-grades`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Attendance with grades API test successful');
        console.log('Records count:', response.data.length);
        
        // Показать примеры записей
        const recordsWithGrades = response.data.filter(record => record.grade !== null);
        console.log('Records with grades:', recordsWithGrades.length);
        
        if (recordsWithGrades.length > 0) {
            console.log('Sample record with grade:', {
                subject: recordsWithGrades[0].subject,
                date: recordsWithGrades[0].date,
                status: recordsWithGrades[0].status,
                grade: recordsWithGrades[0].grade
            });
        }

        // Показать статистику
        const statsByStatus = response.data.reduce((acc, record) => {
            acc[record.status] = (acc[record.status] || 0) + 1;
            return acc;
        }, {});

        console.log('Status statistics:', statsByStatus);

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testAttendanceWithGrades(); 