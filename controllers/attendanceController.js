// controllers/attendanceController.js
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Classroom = require('../models/Classroom');

// @desc    Mark attendance for a student
// @route   POST /api/attendance/mark
// @access  Private (Teacher)
exports.markAttendance = async (req, res) => {
  const { student, classId, subject, date, status, teacher } = req.body;

  if (!student || !classId || !subject || !date || !status || !teacher) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    console.log('📝 Marking attendance:', { student, classId, subject, date, status, teacher });
    
    // Конвертируем дату в правильный формат
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0); // Убираем время, оставляем только дату
    
    // Ищем существующую запись сначала по основным полям
    const basicSearchCondition = { 
      student, 
      classId, 
      subject, 
      date: attendanceDate
    };
    
    console.log('🔍 Basic search condition:', basicSearchCondition);
    
    // Ищем существующую запись
    let existingAttendance = await Attendance.findOne(basicSearchCondition);
    
    // Если найдена запись от другого учителя, создаем новую
    if (existingAttendance && String(existingAttendance.teacher) !== String(teacher)) {
      console.log('⚠️ Found attendance from different teacher:', existingAttendance.teacher, 'vs', teacher);
      existingAttendance = null; // Создадим новую запись
    }
    
    let attendance;
    if (existingAttendance) {
      // Обновляем существующую запись
      console.log('🔄 Updating existing attendance record:', existingAttendance._id);
      attendance = await Attendance.findByIdAndUpdate(
        existingAttendance._id,
        { status },
        { new: true, runValidators: true }
      );
    } else {
      // Создаем новую запись
      console.log('➕ Creating new attendance record');
      attendance = await Attendance.create({
        student,
        classId,
        subject,
        date: attendanceDate,
        status,
        teacher
      });
    }
    
    console.log('✅ Attendance marked successfully:', attendance);
    res.status(201).json(attendance);
  } catch (error) {
    console.error('❌ Error marking attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get attendance for a specific class on a specific date
// @route   GET /api/attendance/class/:classId/date/:date
// @access  Private (Teacher)
exports.getAttendanceByClassAndDate = async (req, res) => {
  try {
    const { classId, date } = req.params;
    console.log('📊 Fetching attendance for class:', classId, 'date:', date);
    
    // Конвертируем дату в правильный формат
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0); // Убираем время, оставляем только дату
    
    const attendance = await Attendance.find({ classId, date: attendanceDate })
      .populate('student', 'name')
      .populate('teacher', 'name');
    
    console.log('📋 Found attendance records:', attendance.length);
    res.json(attendance);
  } catch (error) {
    console.error('❌ Error fetching attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new attendance record
// @route   POST /api/attendance
// @access  Private
exports.createAttendance = async (req, res) => {
  try {
    const newAttendance = new Attendance(req.body);
    const savedAttendance = await newAttendance.save();
    res.status(201).json(savedAttendance);
  } catch (error) {
    res.status(400).json({ message: 'Error creating attendance', error: error.message });
  }
};

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private
exports.getAllAttendance = async (req, res) => {
  try {
    const attendances = await Attendance.find()
      .populate('student', 'name')
      .populate('classId', 'name')
      .populate('teacher', 'name');
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ message: 'Error getting attendance', error: error.message });
  }
};

// @desc    Get a single attendance record by ID
// @route   GET /api/attendance/:id
// @access  Private
exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('student', 'name')
      .populate('classId', 'name')
      .populate('teacher', 'name');
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance not found' });
    }
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Error getting attendance', error: error.message });
  }
};

// @desc    Update an attendance record
// @route   PUT /api/attendance/:id
// @access  Private
exports.updateAttendance = async (req, res) => {
  try {
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedAttendance) {
      return res.status(404).json({ message: 'Attendance not found' });
    }
    res.json(updatedAttendance);
  } catch (error) {
    res.status(400).json({ message: 'Error updating attendance', error: error.message });
  }
};

// @desc    Delete an attendance record
// @route   DELETE /api/attendance/:id
// @access  Private
exports.deleteAttendance = async (req, res) => {
  try {
    const deletedAttendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!deletedAttendance) {
      return res.status(404).json({ message: 'Attendance not found' });
    }
    res.json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting attendance', error: error.message });
  }
};

// @desc    Get all attendance records for a specific student
// @route   GET /api/attendance/student/:studentId
// @access  Private
exports.getStudentAttendance = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        console.log('📊 Fetching attendance for student:', studentId);
        
        const attendance = await Attendance.find({ student: studentId })
            .populate('classId', 'name')
            .populate('teacher', 'name')
            .sort({ date: -1 }); // Сортировка по дате (новые сначала)
        
        console.log('📋 Found attendance records for student:', attendance.length);
        res.json(attendance);
    } catch (error) {
        console.error('❌ Error fetching student attendance:', error);
        res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
};

// @desc    Get attendance stats for a specific student
// @route   GET /api/attendance/student/:studentId/stats
// @access  Private
exports.getStudentAttendanceStats = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const { period } = req.query; // 'current_month', 'current_semester', 'all'
    
    console.log('📊 Calculating attendance stats for student:', studentId, 'period:', period);
    
    let dateFilter = {};
    
    // Определяем период для расчета статистики
    if (period === 'current_month') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { date: { $gte: startOfMonth } };
    } else if (period === 'current_semester') {
      // Условно считаем что семестр начался 3 месяца назад
      const now = new Date();
      const startOfSemester = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      dateFilter = { date: { $gte: startOfSemester } };
    } else {
      // За последние 30 дней по умолчанию (более разумно чем все время)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { date: { $gte: thirtyDaysAgo } };
    }
    
    const filter = { student: studentId, ...dateFilter };
    console.log('📅 Using filter:', filter);
    
    const attendance = await Attendance.find(filter).sort({ date: -1 });
    
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const excused = attendance.filter(a => a.status === 'excused').length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
    
    const stats = {
      total,
      totalPresent: present, // Изменено для совместимости с frontend
      present,
      absent,
      late,
      excused,
      attendanceRate,
      period: period || 'last_30_days'
    };
    
    console.log('📈 Attendance stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error calculating attendance stats:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

// ============================
// Получение записей посещаемости учителя
// ============================
exports.getTeacherAttendance = async (req, res) => {
  try {
    // Проверяем, что пользователь аутентифицирован
    if (!req.user) {
      return res.status(401).json({ message: 'Необходима аутентификация' });
    }
    
    const { teacherId } = req.params;
    
    // Учитель может видеть только свои записи
    if (req.user.role === 'teacher' && req.user.userId !== teacherId) {
      return res.status(403).json({ message: 'Нет прав' });
    }
    
    const records = await Attendance.find({ teacher: teacherId })
      .populate('student', '-password')
      .populate('classId');
      
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка', error: error.message });
  }
};

// ============================
// Получение статистики посещаемости по классу
// ============================
exports.getClassAttendanceStats = async (req, res) => {
  try {
    const { classId } = req.params;
    const attendance = await Attendance.find({ classId });
    
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const excused = attendance.filter(a => a.status === 'excused').length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
    
    res.json({ total, present, absent, late, excused, attendanceRate });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

// ============================
// Получение посещаемости по классу
// ============================
exports.getAttendanceByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const attendance = await Attendance.find({ classId })
      .populate('student', 'name')
      .populate('teacher', 'name')
      .sort({ date: -1 });
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

// ============================
// Получение посещаемости по дате
// ============================
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const attendance = await Attendance.find({ date })
      .populate('student', 'name')
      .populate('classId', 'name')
      .populate('teacher', 'name')
      .sort({ classId: 1 });
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

// ============================
// Массовое создание записей посещаемости
// ============================
exports.createBulkAttendance = async (req, res) => {
  try {
    const attendanceRecords = req.body;
    
    if (!Array.isArray(attendanceRecords)) {
      return res.status(400).json({ message: 'Ожидается массив записей посещаемости' });
    }
    
    const createdRecords = await Attendance.insertMany(attendanceRecords);
    res.status(201).json({ 
      message: 'Записи посещаемости созданы', 
      count: createdRecords.length,
      records: createdRecords 
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка создания записей', error: error.message });
  }
};