require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Classroom = require('./models/Classroom');
const Grade = require('./models/Grade');
const AcademicYear = require('./models/AcademicYear');
const { defaultAcademicYear } = require('./utils/academicYearUtils');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/schoolCatalog';
const SUBJECT = 'TIC';
const CLASS_NAME = '5A';
const SEMESTER = 1;

const GRADE_TEMPLATES = [
  { type: 'lesson', value: 8, comment: 'Participare activă la lecție' },
  { type: 'homework', value: 9, comment: 'Proiect realizat corect' },
  { type: 'lesson', value: 7, comment: '' },
  { type: 'homework', value: 8, comment: 'Temă încărcată la timp' },
  { type: 'test', value: 9, comment: 'Evaluare practică — Excel' },
];

const STUDENT_OVERRIDES = [
  [8, 9, 7, 8, 9],
  [7, 8, 8, 9, 8],
  [9, 10, 8, 9, 10],
  [6, 7, 7, 8, 7],
  [8, 8, 9, 8, 9],
  [10, 9, 9, 10, 9],
  [7, 7, 8, 7, 8],
  [8, 9, 8, 9, 9],
  [9, 8, 9, 8, 10],
  [7, 8, 7, 8, 8],
  [8, 7, 8, 9, 8],
  [9, 9, 8, 9, 9],
  [6, 8, 7, 7, 8],
  [8, 8, 8, 9, 9],
  [7, 9, 8, 8, 9],
  [9, 8, 10, 9, 9],
  [8, 8, 7, 8, 8],
  [7, 7, 8, 8, 7],
  [9, 9, 9, 8, 10],
  [8, 8, 8, 7, 9],
];

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(10 + (days % 5), 15, 0, 0);
  return date;
}

async function resolveAcademicYear() {
  const active = await AcademicYear.findOne({ isActive: true }).sort({ year: -1 });
  return active?.year ?? defaultAcademicYear();
}

async function main() {
  await mongoose.connect(MONGO_URI);

  const academicYear = await resolveAcademicYear();
  const teacher = await User.findOne({ email: 'adrian.pavel@school.ro' });
  const classroom = await Classroom.findOne({ name: CLASS_NAME }).populate('students', 'name');

  if (!teacher) throw new Error('Teacher Adrian Pavel not found');
  if (!classroom) throw new Error(`Classroom ${CLASS_NAME} not found`);

  await Grade.deleteMany({
    classId: classroom._id,
    subject: SUBJECT,
    teacher: teacher._id,
  });

  const students = classroom.students;
  let created = 0;

  for (let studentIndex = 0; studentIndex < students.length; studentIndex++) {
    const student = students[studentIndex];
    const overrides = STUDENT_OVERRIDES[studentIndex % STUDENT_OVERRIDES.length];

    for (let gradeIndex = 0; gradeIndex < GRADE_TEMPLATES.length; gradeIndex++) {
      const template = GRADE_TEMPLATES[gradeIndex];
      await Grade.create({
        student: student._id,
        teacher: teacher._id,
        classId: classroom._id,
        subject: SUBJECT,
        type: template.type,
        semester: SEMESTER,
        academicYear,
        value: overrides[gradeIndex],
        comment: template.comment,
        createdAt: daysAgo(55 - gradeIndex * 11 - (studentIndex % 3)),
      });
      created++;
    }
  }

  console.log(`Created ${created} ${SUBJECT} grades for ${CLASS_NAME} (${students.length} students × 5)`);
  console.log(`Teacher: ${teacher.name}`);
  console.log(`Academic year: ${academicYear}, semester: ${SEMESTER}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
