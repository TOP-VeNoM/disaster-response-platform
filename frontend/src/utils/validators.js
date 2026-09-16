export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateReportForm({ description, disasterType, address, lat, lng }) {
  const errors = {};
  if (!description || description.trim().length < 10) {
    errors.description = 'Please describe the situation in at least 10 characters.';
  }
  if (!disasterType) {
    errors.disasterType = 'Please select a disaster type.';
  }
  const hasAddress = address && address.trim().length > 0;
  const hasCoords = lat !== '' && lng !== '' && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
  if (!hasAddress && !hasCoords) {
    errors.location = 'Please provide an address or coordinates.';
  }
  return errors;
}
