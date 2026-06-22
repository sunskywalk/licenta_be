const repository = require('./repository');
const validators = require('./validators');
const { ROLES, FINAL_GRADE_TYPE } = require('./constants');
const {
  isSameId,
  calculateAverage,
  withTwoDecimals,
  buildSubjectStatsMap,
  mapSubjectStatsToResponse,
  calculateAttendanceRate,
  cloneEmptyGradeStats,
  cloneEmptySubjectStats,
  buildClassroomFlags,
  appendHomeroomClassIfMissing,
  buildGradeRankingItem,
  buildAttendanceRankingItem,
  findRankPosition,
} = require('./helpers');
const { mergeYearFilter } = require('../../utils/academicYearUtils');

async function getAllGrades() {
  return repository.findAllGrades();
}

async function getGradeById(gradeId) {
  return repository.findGradeById(gradeId);
}

async function getStudentAverage(studentId, query, user) {
  if (validators.isStudent(user.role) && !isSameId(user.userId, studentId)) {
    return { status: 403, body: { message: 'Нет прав' } };
  }

  const filter = mergeYearFilter({ student: studentId }, query.year);
  if (query.subject) filter.subject = query.subject;
  if (query.semester) filter.semester = Number(query.semester);

  const grades = await repository.findGradesByFilter(filter);
  if (!grades.length) {
    return { status: 200, body: { average: 0, count: 0 } };
  }

  const avg = calculateAverage(grades, (grade) => grade.value);
  return {
    status: 200,
    body: { average: withTwoDecimals(avg), count: grades.length, details: grades },
  };
}

async function getFinalAverage(studentId, query, user) {
  if (validators.isStudent(user.role) && !isSameId(user.userId, studentId)) {
    return { status: 403, body: { message: 'Нет прав' } };
  }

  const filter = mergeYearFilter({ student: studentId }, query.year);
  if (query.subject) filter.subject = query.subject;

  const allGrades = await repository.findGradesByFilter(filter);
  const sem1 = allGrades.filter((grade) => grade.semester === 1);
  const sem2 = allGrades.filter((grade) => grade.semester === 2);

  const avg1 = calculateAverage(sem1, (grade) => grade.value);
  const avg2 = calculateAverage(sem2, (grade) => grade.value);
  const finalAvg = (avg1 + avg2) / 2;

  return {
    status: 200,
    body: {
      averageSemester1: withTwoDecimals(avg1),
      averageSemester2: withTwoDecimals(avg2),
      finalAverage: withTwoDecimals(finalAvg),
    },
  };
}

async function getTeacherGrades(teacherId, user, year) {
  if (!validators.canReadTeacherGrades(user.role)) {
    return { status: 403, body: { message: 'Нет прав - недопустимая роль' } };
  }

  if (validators.isTeacher(user.role) && !isSameId(user.userId, teacherId)) {
    return { status: 403, body: { message: 'Нет прав - учитель может смотреть только свои оценки' } };
  }

  const filter = mergeYearFilter({ teacher: teacherId }, year);
  const grades = await repository.findGradesByFilter(filter);
  return { status: 200, body: grades };
}

async function getStudentGrades(studentId, user, year) {
  if (validators.isStudent(user.role) && !isSameId(user.userId, studentId)) {
    return { status: 403, body: { message: 'Нет прав' } };
  }

  const filter = mergeYearFilter({ student: studentId }, year);

  if (validators.isTeacher(user.role)) {
    const teacher = await repository.findTeacherById(user.userId);
    const studentUser = await repository.findStudentById(studentId);

    let isHomeroom = false;
    if (studentUser && studentUser.classRooms && studentUser.classRooms.length > 0) {
      const classroom = await repository.findClassroomById(studentUser.classRooms[0]);
      if (classroom && isSameId(classroom.homeroomTeacher, user.userId)) {
        isHomeroom = true;
      }
    }

    if (!isHomeroom) {
      if (teacher.subjects && teacher.subjects.length > 0) {
        filter.subject = { $in: teacher.subjects };
      } else {
        return { status: 200, body: [] };
      }
    }
  }

  const grades = await repository.findGradesByFilter(filter);
  return { status: 200, body: grades };
}

async function getGradesByClass(classId, year) {
  const filter = mergeYearFilter({ classId }, year);
  const grades = await repository.findGradesByFilter(filter);
  return { status: 200, body: grades };
}

async function getTeacherSubjects(user) {
  const teacherId = user.userId;
  const teacher = await repository.findTeacherById(teacherId);
  if (!teacher) {
    return { status: 404, body: { message: 'Учитель не найден' } };
  }

  const subjects = teacher.subjects || [];
  const subjectsWithCounts = await Promise.all(
    subjects.map(async (subject) => ({
      subject,
      gradeCount: await repository.countTeacherGradesBySubject(teacherId, subject),
    }))
  );

  return { status: 200, body: subjectsWithCounts };
}

async function getTeacherSubjectsById(teacherId, user) {
  if (user.role !== ROLES.ADMIN && !isSameId(user.userId, teacherId)) {
    return { status: 403, body: { message: 'Нет прав для получения предметов этого учителя' } };
  }

  const teacher = await repository.findTeacherById(teacherId);
  if (!teacher) {
    return { status: 404, body: { message: 'Учитель не найден' } };
  }

  const subjects = teacher.subjects || [];
  const subjectsWithCounts = await Promise.all(
    subjects.map(async (subject) => ({
      subject,
      gradeCount: await repository.countTeacherGradesBySubject(teacherId, subject),
    }))
  );

  return { status: 200, body: subjectsWithCounts };
}

async function getClassroomsForSubject(subject, user) {
  const teacherId = user.userId;
  const classIds = await repository.findDistinctTeacherClassIdsBySubject(teacherId, subject);
  const classrooms = await repository.findClassroomsByIds(classIds);
  const classroomsWithFlags = buildClassroomFlags(classrooms, teacherId);
  const homeroomClass = await repository.findHomeroomClassByTeacher(teacherId);

  return {
    status: 200,
    body: appendHomeroomClassIfMissing(classrooms, classroomsWithFlags, homeroomClass, true),
  };
}

async function getAllTeacherClasses(user) {
  const teacherId = user.userId;
  const schedules = await repository.findAllSchedulesWithClass();
  const teacherSchedules = schedules.filter(
    (schedule) =>
      schedule.periods &&
      schedule.periods.some(
        (period) => period.teacherId && isSameId(period.teacherId, teacherId)
      )
  );

  const classIds = [...new Set(teacherSchedules.map((schedule) => schedule.classId._id.toString()))];
  const classrooms = await repository.findClassroomsByIds(classIds);
  const classroomsWithFlags = buildClassroomFlags(classrooms, teacherId);
  const homeroomClass = await repository.findHomeroomClassByTeacher(teacherId);

  return {
    status: 200,
    body: appendHomeroomClassIfMissing(classrooms, classroomsWithFlags, homeroomClass, false),
  };
}

async function resolveClassmates(studentId) {
  const student = await repository.findStudentById(studentId);
  if (!student || !student.classRooms || !student.classRooms.length) {
    return [];
  }

  const classroom = await repository.findClassroomByIdWithStudents(student.classRooms[0]);
  return classroom ? classroom.students : [];
}

async function resolveTeacherScopedFilter(baseFilter, studentId, user) {
  const filter = { ...baseFilter };

  if (validators.isTeacher(user.role)) {
    const teacher = await repository.findTeacherById(user.userId);
    const studentUser = await repository.findStudentById(studentId);

    let isHomeroom = false;
    if (studentUser && studentUser.classRooms && studentUser.classRooms.length > 0) {
      const classroom = await repository.findClassroomById(studentUser.classRooms[0]);
      if (classroom && isSameId(classroom.homeroomTeacher, user.userId)) {
        isHomeroom = true;
      }
    }

    if (!isHomeroom) {
      if (teacher.subjects && teacher.subjects.length > 0) {
        filter.subject = { $in: teacher.subjects };
      } else {
        return null;
      }
    }
  }

  return filter;
}

async function getStudentGradeStats(studentId, year, user) {
  if (validators.isStudent(user.role) && !isSameId(user.userId, studentId)) {
    return {
      status: 403,
      body: { message: 'Нет прав просматривать статистику другого студента' },
    };
  }

  const filter = mergeYearFilter({ student: studentId }, year);
  const scopedFilter = await resolveTeacherScopedFilter(filter, studentId, user);
  if (!scopedFilter) {
    return { status: 200, body: cloneEmptyGradeStats() };
  }

  const studentGrades = await repository.findGradesByFilterRaw(scopedFilter);
  if (studentGrades.length === 0) {
    return { status: 200, body: cloneEmptyGradeStats() };
  }

  const classmates = await resolveClassmates(studentId);
  const subjectStats = buildSubjectStatsMap(studentGrades);
  const subjects = mapSubjectStatsToResponse(subjectStats);

  const regularGrades = studentGrades.filter((grade) => grade.type !== FINAL_GRADE_TYPE);
  const averageGrade = regularGrades.length
    ? Number((calculateAverage(regularGrades, (grade) => grade.value)).toFixed(1))
    : 0;

  const attendanceRecords = await repository.findAttendanceByFilter({ student: studentId });
  const attendanceRate = calculateAttendanceRate(attendanceRecords);

  const classGradeRanking = (await Promise.all(
    classmates.map(async (classmate) => {
      const classmateGrades = await repository.findGradesByFilterRaw(
        mergeYearFilter({
          student: classmate._id,
          type: { $ne: FINAL_GRADE_TYPE },
        }, year)
      );
      if (!classmateGrades.length) return null;

      const classmateAverage = calculateAverage(classmateGrades, (grade) => grade.value);
      return buildGradeRankingItem(classmate, classmateAverage);
    })
  )).filter(Boolean);

  classGradeRanking.sort((a, b) => b.average - a.average);
  const gradeRankPosition = findRankPosition(classGradeRanking, studentId);

  const classAttendanceRanking = await Promise.all(
    classmates.map(async (classmate) => {
      const classmateAttendance = await repository.findAttendanceByFilter({ student: classmate._id });
      const classmateRate = classmateAttendance.length
        ? (classmateAttendance.filter((entry) => entry.status === 'present').length / classmateAttendance.length) * 100
        : 0;
      return buildAttendanceRankingItem(classmate, classmateRate);
    })
  );

  classAttendanceRanking.sort((a, b) => b.rate - a.rate);
  const attendanceRankPosition = findRankPosition(classAttendanceRanking, studentId);

  return {
    status: 200,
    body: {
      averageGrade,
      totalGrades: regularGrades.length,
      subjects,
      classRankByGrades: gradeRankPosition,
      classRankByAttendance: attendanceRankPosition,
      attendanceRate,
      totalClassmates: classmates.length,
    },
  };
}

async function getStudentSubjectStats(studentId, subject, year, user) {
  if (validators.isStudent(user.role) && !isSameId(user.userId, studentId)) {
    return { status: 403, body: { message: 'Нет прав' } };
  }

  const filter = mergeYearFilter({ student: studentId, subject }, year);
  const grades = await repository.findGradesByFilterRaw(filter).sort({ createdAt: -1 });

  if (!grades.length) {
    return { status: 200, body: cloneEmptySubjectStats(subject) };
  }

  const classmates = await resolveClassmates(studentId);
  const regularGrades = grades.filter((grade) => grade.type !== FINAL_GRADE_TYPE);
  const finalGrade = grades.find((grade) => grade.type === FINAL_GRADE_TYPE);
  const averageGrade = regularGrades.length
    ? Number((calculateAverage(regularGrades, (grade) => grade.value)).toFixed(1))
    : 0;

  const attendanceRecords = await repository.findAttendanceByFilter({ student: studentId, subject });
  const attendanceRate = calculateAttendanceRate(attendanceRecords);

  const classSubjectRanking = (await Promise.all(
    classmates.map(async (classmate) => {
      const classmateGrades = await repository.findGradesByFilterRaw(
        mergeYearFilter({
          student: classmate._id,
          subject,
          type: { $ne: FINAL_GRADE_TYPE },
        }, year)
      );
      if (!classmateGrades.length) return null;

      const classmateAverage = calculateAverage(classmateGrades, (grade) => grade.value);
      return buildGradeRankingItem(classmate, classmateAverage);
    })
  )).filter(Boolean);

  classSubjectRanking.sort((a, b) => b.average - a.average);
  const subjectGradeRank = findRankPosition(classSubjectRanking, studentId);

  const classSubjectAttendanceRanking = await Promise.all(
    classmates.map(async (classmate) => {
      const classmateAttendance = await repository.findAttendanceByFilter({ student: classmate._id, subject });
      const classmateRate = classmateAttendance.length
        ? (classmateAttendance.filter((entry) => entry.status === 'present').length / classmateAttendance.length) * 100
        : 0;
      return buildAttendanceRankingItem(classmate, classmateRate);
    })
  );

  classSubjectAttendanceRanking.sort((a, b) => b.rate - a.rate);
  const subjectAttendanceRank = findRankPosition(classSubjectAttendanceRanking, studentId);

  // keep dates as-is because frontend expects both keys
  const formattedGrades = regularGrades.map((grade) => ({
    _id: grade._id,
    value: grade.value,
    type: grade.type,
    comment: grade.comment || '',
    date: grade.createdAt,
    createdAt: grade.createdAt,
  }));

  return {
    status: 200,
    body: {
      subject,
      averageGrade,
      finalGrade: finalGrade ? finalGrade.value : null,
      grades: formattedGrades,
      attendanceRate,
      classRankByGrades: subjectGradeRank,
      classRankByAttendance: subjectAttendanceRank,
      totalClassmates: classmates.length,
    },
  };
}

module.exports = {
  getAllGrades,
  getGradeById,
  getStudentAverage,
  getFinalAverage,
  getTeacherGrades,
  getStudentGrades,
  getGradesByClass,
  getTeacherSubjects,
  getTeacherSubjectsById,
  getClassroomsForSubject,
  getAllTeacherClasses,
  getStudentGradeStats,
  getStudentSubjectStats,
};
