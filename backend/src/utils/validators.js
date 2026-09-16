const { ValidationError } = require('./errors');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegisterInput({ name, email, password }) {
  if (!name || name.trim().length < 2) {
    throw new ValidationError('Name must be at least 2 characters');
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new ValidationError('A valid email is required');
  }
  if (!password || password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters');
  }
}

function validateLoginInput({ email, password }) {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new ValidationError('A valid email is required');
  }
  if (!password) {
    throw new ValidationError('Password is required');
  }
}

function validateReportInput({ description, location, disasterType }) {
  if (!description || description.trim().length < 10) {
    throw new ValidationError('Description must be at least 10 characters');
  }
  if (!location || (!location.address && !(location.lat && location.lng))) {
    throw new ValidationError('Location (address or lat/lng) is required');
  }
  const validTypes = ['flood', 'fire', 'earthquake', 'storm', 'medical', 'other'];
  if (disasterType && !validTypes.includes(disasterType)) {
    throw new ValidationError(`disasterType must be one of: ${validTypes.join(', ')}`);
  }
}

module.exports = { validateRegisterInput, validateLoginInput, validateReportInput, EMAIL_REGEX };
