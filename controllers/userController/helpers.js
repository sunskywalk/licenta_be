/** lowercase email if present (schema also normalizes on save) */
function normalizeEmail(email) {
  if (!email) return email;
  return String(email).toLowerCase();
}

module.exports = {
  normalizeEmail,
};
