const repository = require('./repository');
const { isAdmin, isTeacher, isStudent } = require('./validators');
const { hasId, removeId } = require('./helpers');

async function createClass(name, user) {
  if (!isAdmin(user)) {
    return { error: true, status: 403, body: { message: 'Только admin может создавать классы' } };
  }

  const existing = await repository.findClassByName(name);
  if (existing) {
    return { error: true, status: 400, body: { message: 'Класс с таким названием уже существует' } };
  }

  const classroom = await repository.createClass({ name });
  return { status: 201, body: { message: 'Класс создан', classroom } };
}

async function updateClass(id, body, user) {
  if (!isAdmin(user)) {
    return { error: true, status: 403, body: { message: 'Только admin может обновлять класс' } };
  }

  const cls = await repository.findClassById(id);
  if (!cls) {
    return { error: true, status: 404, body: { message: 'Класс не найден' } };
  }

  const { name, teachers, students } = body;
  if (name) cls.name = name;
  if (teachers) cls.teachers = teachers;
  if (students) cls.students = students;

  await cls.save();

  const classroom = await repository.findUpdatedClass(id);
  return { status: 200, body: { message: 'Класс обновлён', classroom } };
}

async function deleteClass(id, user) {
  if (!isAdmin(user)) {
    return { error: true, status: 403, body: { message: 'Только admin может удалять класс' } };
  }

  const cls = await repository.findClassById(id);
  if (!cls) {
    return { error: true, status: 404, body: { message: 'Класс не найден' } };
  }

  await repository.pullClassFromUsers(cls._id);
  await cls.deleteOne();

  return { status: 200, body: { message: 'Класс удалён' } };
}

async function assignHomeroomTeacher(classId, teacherId, user) {
  if (!isAdmin(user)) {
    return { error: true, status: 403, body: { message: 'Только admin может назначать классных руководителей' } };
  }

  const cls = await repository.findClassById(classId);
  if (!cls) {
    return { error: true, status: 404, body: { message: 'Класс не найден' } };
  }

  if (!teacherId) {
    cls.homeroomTeacher = null;
    await cls.save();
    return { status: 200, body: { message: 'Классный руководитель снят', classroom: cls } };
  }

  const teacher = await repository.findUserById(teacherId);
  if (!teacher) {
    return { error: true, status: 404, body: { message: 'Учитель не найден' } };
  }
  if (!isTeacher(teacher)) {
    return { error: true, status: 400, body: { message: 'Пользователь не является учителем' } };
  }

  cls.homeroomTeacher = teacherId;
  await cls.save();

  const classroom = await repository.findHomeroomViewClass(classId);
  return { status: 200, body: { message: 'Классный руководитель назначен', classroom } };
}

async function addStudentToClass(classId, studentId, user) {
  if (!isAdmin(user)) {
    return { error: true, status: 403, body: { message: 'Только admin может добавлять учеников' } };
  }

  const cls = await repository.findClassById(classId);
  const student = await repository.findUserById(studentId);

  if (!cls) {
    return { error: true, status: 404, body: { message: 'Класс не найден' } };
  }

  if (!student) {
    return { error: true, status: 404, body: { message: 'Ученик не найден' } };
  }

  if (!isStudent(student)) {
    return { error: true, status: 400, body: { message: 'Пользователь не является учеником' } };
  }

  if (hasId(cls.students, studentId)) {
    return { error: true, status: 400, body: { message: 'Ученик уже находится в этом классе' } };
  }

  await repository.removeStudentFromAllClasses(studentId);
  cls.students.push(studentId);
  await cls.save();

  student.classRooms = [classId];
  await student.save();

  return { status: 200, body: { message: 'Ученик успешно добавлен в класс' } };
}

async function removeStudentFromClass(classId, studentId, user) {
  if (!isAdmin(user)) {
    return { error: true, status: 403, body: { message: 'Только admin может удалять учеников' } };
  }

  const cls = await repository.findClassById(classId);
  const student = await repository.findUserById(studentId);

  if (!cls) {
    return { error: true, status: 404, body: { message: 'Класс не найден' } };
  }

  if (!student) {
    return { error: true, status: 404, body: { message: 'Ученик не найден' } };
  }

  if (!hasId(cls.students, studentId)) {
    return { error: true, status: 400, body: { message: 'Ученик не находится в этом классе' } };
  }

  cls.students = removeId(cls.students, studentId);
  await cls.save();

  student.classRooms = removeId(student.classRooms, classId);
  await student.save();

  return { status: 200, body: { message: 'Ученик успешно удален из класса' } };
}

module.exports = {
  createClass,
  updateClass,
  deleteClass,
  assignHomeroomTeacher,
  addStudentToClass,
  removeStudentFromClass,
};
