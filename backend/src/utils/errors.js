class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class AuthError extends AppError {
  constructor(message = 'Not authorized') {
    super(message, 401);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message) {
    super(`${service} error: ${message}`, 502);
    this.service = service;
  }
}

module.exports = { AppError, ValidationError, AuthError, NotFoundError, ExternalServiceError };
