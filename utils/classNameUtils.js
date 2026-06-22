function parseClassName(name) {
  if (!name) return { grade: null, letter: '' };
  const match = String(name).match(/^(\d+)(.*)$/);
  if (!match) return { grade: null, letter: '' };
  return { grade: parseInt(match[1], 10), letter: match[2] || '' };
}

function buildClassName(grade, letter = '') {
  return `${grade}${letter}`;
}

function promoteClassName(name) {
  const { grade, letter } = parseClassName(name);
  if (!grade || grade < 5 || grade > 11) return null;
  return buildClassName(grade + 1, letter);
}

function resolveClassGrade(classroom) {
  if (classroom.grade) return classroom.grade;
  return parseClassName(classroom.name).grade;
}

module.exports = {
  parseClassName,
  buildClassName,
  promoteClassName,
  resolveClassGrade,
};
