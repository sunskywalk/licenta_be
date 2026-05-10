function validateMarkAttendanceBody(body) {
  const { student, classId, subject, date, status, teacher } = body || {};
  if (!student || !classId || !subject || !date || !status || !teacher) {
    return {
      ok: false,
      response: { status: 400, body: { message: 'Please provide all required fields' } },
    };
  }
  return { ok: true, fields: { student, classId, subject, date, status, teacher } };
}

function validateBulkAttendanceBody(body) {
  if (!Array.isArray(body)) {
    return {
      ok: false,
      response: {
        status: 400,
        body: { message: 'Ожидается массив записей посещаемости' },
      },
    };
  }
  return { ok: true, records: body };
}

module.exports = {
  validateMarkAttendanceBody,
  validateBulkAttendanceBody,
};
