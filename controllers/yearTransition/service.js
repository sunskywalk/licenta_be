const { resolveClassGrade, promoteClassName } = require('../../utils/classNameUtils');
const { defaultAcademicYear } = require('../../utils/academicYearUtils');
const { generatePeriodsFromPreset } = require('../../config/academicYearPresets');
const Classroom = require('../../models/Classroom');
const repository = require('./repository');

const GRADUATION_GRADE = 12;
const MIN_GRADE = 5;

function buildClassAction(classroom) {
  const grade = resolveClassGrade(classroom);
  const studentCount = classroom.students?.length || 0;

  if (!grade || grade < MIN_GRADE) {
    return {
      classId: classroom._id,
      currentName: classroom.name,
      currentGrade: grade,
      action: 'skip',
      reason: 'unknown_grade',
      studentCount,
    };
  }

  if (grade >= GRADUATION_GRADE) {
    return {
      classId: classroom._id,
      currentName: classroom.name,
      currentGrade: grade,
      action: 'graduate',
      newName: null,
      newGrade: null,
      studentCount,
      students: (classroom.students || []).map((s) => ({
        _id: s._id,
        name: s.name,
      })),
    };
  }

  const newName = promoteClassName(classroom.name);
  if (!newName) {
    return {
      classId: classroom._id,
      currentName: classroom.name,
      currentGrade: grade,
      action: 'skip',
      reason: 'invalid_name',
      studentCount,
    };
  }

  return {
    classId: classroom._id,
    currentName: classroom.name,
    currentGrade: grade,
    action: 'promote',
    newName,
    newGrade: grade + 1,
    studentCount,
  };
}

async function previewTransition() {
  const activeYear = await repository.findActiveAcademicYear();
  const currentYear = activeYear?.year ?? defaultAcademicYear();
  const classrooms = await repository.findAllClassrooms();
  const actions = classrooms.map(buildClassAction);

  const summary = {
    promote: actions.filter((a) => a.action === 'promote').length,
    graduate: actions.filter((a) => a.action === 'graduate').length,
    skip: actions.filter((a) => a.action === 'skip').length,
    totalStudents: actions.reduce((sum, a) => sum + a.studentCount, 0),
    graduatingStudents: actions
      .filter((a) => a.action === 'graduate')
      .reduce((sum, a) => sum + a.studentCount, 0),
  };

  return {
    currentYear,
    nextYear: currentYear + 1,
    displayName: `${currentYear}/${currentYear + 1}`,
    nextDisplayName: `${currentYear + 1}/${currentYear + 2}`,
    actions,
    summary,
  };
}

async function archiveClassRoster(classroom, academicYear) {
  const grade = resolveClassGrade(classroom);
  const students = classroom.students || [];

  for (const student of students) {
    await repository.createHistoryEntry({
      student: student._id,
      classId: classroom._id,
      className: classroom.name,
      grade: grade || 0,
      academicYear,
    });
  }
}

async function graduateStudents(classroom, graduationYear) {
  const students = classroom.students || [];

  for (const studentRef of students) {
    const student = await repository.findUserById(studentRef._id || studentRef);
    if (!student) continue;

    student.graduationYear = graduationYear;
    student.classRooms = [];
    await repository.saveUser(student);
  }

  classroom.students = [];
  await repository.saveClassroom(classroom);
}

async function promoteClass(classroom, action) {
  const existing = await repository.findClassroomByName(action.newName);
  if (existing && String(existing._id) !== String(classroom._id)) {
    throw new Error(`Класс "${action.newName}" уже существует`);
  }

  classroom.name = action.newName;
  classroom.grade = action.newGrade;
  await repository.saveClassroom(classroom);
}

async function createNextAcademicYear(currentYear, userId) {
  const nextYear = currentYear + 1;
  const startDate = new Date(nextYear, 8, 1);
  const endDate = new Date(nextYear + 1, 5, 30);

  return repository.createAcademicYear({
    year: nextYear,
    startDate,
    endDate,
    systemType: 'semesters',
    periods: generatePeriodsFromPreset('semesters', startDate, endDate),
    isActive: true,
    createdBy: userId,
  });
}

async function deactivateCurrentYear(activeYear) {
  if (!activeYear) return;
  activeYear.isActive = false;
  await activeYear.save();
}

async function executeTransition(userId) {
  const preview = await previewTransition();
  const { currentYear, actions } = preview;

  const activeYear = await repository.findActiveAcademicYear();
  const results = [];

  for (const action of actions) {
    const classroom = await Classroom.findById(action.classId).populate('students', '_id name');
    if (!classroom) continue;

    await archiveClassRoster(classroom, currentYear);

    if (action.action === 'graduate') {
      await graduateStudents(classroom, currentYear);
      results.push({ ...action, status: 'graduated' });
    } else if (action.action === 'promote') {
      await promoteClass(classroom, action);
      results.push({ ...action, status: 'promoted' });
    } else {
      results.push({ ...action, status: 'skipped' });
    }
  }

  await deactivateCurrentYear(activeYear);
  const newYear = await createNextAcademicYear(currentYear, userId);

  return {
    ...preview,
    results,
    newAcademicYear: {
      _id: newYear._id,
      year: newYear.year,
      displayName: newYear.displayName,
    },
  };
}

async function getStudentClassHistory(studentId) {
  return repository.findHistoryByStudent(studentId);
}

async function getAvailableGradeYears() {
  const [distinctYears, activeYear] = await Promise.all([
    repository.findDistinctGradeYears(),
    repository.findActiveAcademicYear(),
  ]);

  const years = new Set(
    distinctYears.filter((y) => y !== null && y !== undefined)
  );

  if (activeYear?.year) {
    years.add(activeYear.year);
  }

  years.add(defaultAcademicYear());

  return [...years].sort((a, b) => b - a);
}

module.exports = {
  previewTransition,
  executeTransition,
  getStudentClassHistory,
  getAvailableGradeYears,
};
