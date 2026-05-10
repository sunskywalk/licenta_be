const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const repository = require('./repository');
const { MESSAGES, ROLES, JWT_EXPIRES } = require('./constants');
const { normalizeEmail } = require('./helpers');

async function registerUser(body) {
  let { name, email, password, role, classRooms } = body;
  email = normalizeEmail(email);

  const existing = await repository.findUserByEmail(email);
  if (existing) {
    return { status: 400, body: { message: MESSAGES.DUPLICATE_EMAIL } };
  }

  const newUser = await repository.createUserDoc({
    name,
    email,
    password,
    role,
    classRooms: classRooms || [],
  });

  // attach user to each classroom list (teacher vs student) — parallel is fine, different docs
  if (classRooms && Array.isArray(classRooms)) {
    await Promise.all(
      classRooms.map(async (clsId) => {
        const cls = await repository.findClassroomById(clsId);
        if (!cls) return;
        if (role === ROLES.TEACHER) cls.teachers.push(newUser._id);
        else if (role === ROLES.STUDENT) cls.students.push(newUser._id);
        await repository.saveClassroomDoc(cls);
      })
    );
  }

  return {
    status: 201,
    body: {
      message: MESSAGES.USER_CREATED,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        classRooms: newUser.classRooms,
      },
    },
  };
}

async function loginUser(body) {
  let { email, password } = body;
  email = normalizeEmail(email);

  const user = await repository.findUserByEmail(email, { populateClassRooms: true });
  if (!user) {
    return { status: 400, body: { message: MESSAGES.BAD_CREDENTIALS } };
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return { status: 400, body: { message: MESSAGES.BAD_CREDENTIALS } };
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  return {
    status: 200,
    body: {
      message: MESSAGES.LOGIN_OK,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        classRooms: user.classRooms,
      },
    },
  };
}

async function updateUser(userId, body, actor) {
  let { name, email, password, role, classRooms } = body;
  if (email) email = normalizeEmail(email);

  const user = await repository.findUserByIdRaw(userId);
  if (!user) {
    return { status: 404, body: { message: MESSAGES.USER_NOT_FOUND } };
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
  }
  if (role && actor.role === ROLES.ADMIN) {
    user.role = role;
  }

  // admin-only: strip old classroom memberships then add to new list
  if (classRooms && actor.role === ROLES.ADMIN) {
    const allOldClasses = await repository.findClassroomsHavingMember(userId);
    await Promise.all(
      allOldClasses.map(async (c) => {
        c.teachers = c.teachers.filter((t) => t.toString() !== userId);
        c.students = c.students.filter((s) => s.toString() !== userId);
        await repository.saveClassroomDoc(c);
      })
    );

    await Promise.all(
      classRooms.map(async (clsId) => {
        const cls = await repository.findClassroomById(clsId);
        if (!cls) return;
        if (user.role === ROLES.TEACHER) cls.teachers.push(user._id);
        else if (user.role === ROLES.STUDENT) cls.students.push(user._id);
        await repository.saveClassroomDoc(cls);
      })
    );

    user.classRooms = classRooms;
  }

  await user.save();

  const populated = await repository.findUserByIdWithoutPassword(userId);
  return {
    status: 200,
    body: {
      message: MESSAGES.USER_UPDATED,
      user: populated,
    },
  };
}

async function deleteUser(userId) {
  const userToDelete = await repository.findUserByIdRaw(userId);
  if (!userToDelete) {
    return { status: 404, body: { message: MESSAGES.USER_NOT_FOUND } };
  }

  const classes = await repository.findClassroomsHavingMember(userId);
  await Promise.all(
    classes.map(async (cls) => {
      cls.teachers = cls.teachers.filter((t) => t.toString() !== userId);
      cls.students = cls.students.filter((s) => s.toString() !== userId);
      await repository.saveClassroomDoc(cls);
    })
  );

  await repository.deleteUserDoc(userToDelete);

  return {
    status: 200,
    body: { message: MESSAGES.USER_DELETED, userId },
  };
}

module.exports = {
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
};
