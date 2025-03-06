const { ApiError } = require('./errors');

// Regular expressions for validation
const REGEX = {
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  username: /^[a-zA-Z0-9_-]{3,20}$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  name: /^[a-zA-Z\s'-]{2,50}$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  date: /^\d{4}-\d{2}-\d{2}$/
};

/**
 * Base validation function
 * @param {string} value - Value to validate
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 * @throws {ApiError} - If throwError is true and validation fails
 */
const validate = (value, { 
  name, 
  pattern = null, 
  required = true, 
  minLength = null, 
  maxLength = null,
  throwError = false 
}) => {
  // Check if value is required
  if (required && (!value || (typeof value === 'string' && !value.trim()))) {
    const error = `${name} is required`;
    if (throwError) throw new ApiError(error, 400);
    return { isValid: false, message: error };
  }

  // If value is not required and is empty, return valid
  if (!required && (!value || (typeof value === 'string' && !value.trim()))) {
    return { isValid: true, message: `${name} is valid` };
  }

  // Check min length
  if (minLength !== null && value.length < minLength) {
    const error = `${name} must be at least ${minLength} characters long`;
    if (throwError) throw new ApiError(error, 400);
    return { isValid: false, message: error };
  }

  // Check max length
  if (maxLength !== null && value.length > maxLength) {
    const error = `${name} must be no more than ${maxLength} characters long`;
    if (throwError) throw new ApiError(error, 400);
    return { isValid: false, message: error };
  }

  // Check pattern
  if (pattern && !pattern.test(value)) {
    const error = `Invalid ${name.toLowerCase()} format`;
    if (throwError) throw new ApiError(error, 400);
    return { isValid: false, message: error };
  }

  return { isValid: true, message: `${name} is valid` };
};

// Validation functions
const validatePassword = (password, throwError = false) => validate(password, {
  name: 'Password',
  pattern: REGEX.password,
  required: true,
  minLength: 8,
  maxLength: 128,
  throwError
});

const validateEmail = (email, throwError = false) => validate(email, {
  name: 'Email',
  pattern: REGEX.email,
  required: true,
  maxLength: 255,
  throwError
});

const validateUsername = (username, throwError = false) => validate(username, {
  name: 'Username',
  pattern: REGEX.username,
  required: true,
  minLength: 3,
  maxLength: 20,
  throwError
});

const validatePhone = (phone, throwError = false) => validate(phone, {
  name: 'Phone number',
  pattern: REGEX.phone,
  required: false,
  maxLength: 15,
  throwError
});

const validateName = (name, throwError = false) => validate(name, {
  name: 'Name',
  pattern: REGEX.name,
  required: true,
  minLength: 2,
  maxLength: 50,
  throwError
});

const validateUrl = (url, throwError = false) => validate(url, {
  name: 'URL',
  pattern: REGEX.url,
  required: false,
  maxLength: 2048,
  throwError
});

const validateDate = (date, throwError = false) => validate(date, {
  name: 'Date',
  pattern: REGEX.date,
  required: true,
  throwError
});

/**
 * Sanitizes user object for safe return to client
 * @param {Object} user - The user object to sanitize
 * @returns {Object} - Sanitized user object
 */
const sanitizeUser = (user) => {
  if (!user) return null;

  const {
    password,
    refresh_token,
    reset_token,
    reset_token_expires,
    verification_token,
    verification_token_expires,
    login_attempts,
    last_failed_login,
    ...safeUser
  } = user;

  return {
    ...safeUser,
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phoneNumber: user.phone_number,
    isAdmin: Boolean(user.is_admin),
    isVerified: Boolean(user.is_verified),
    isActive: Boolean(user.is_active),
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    lastLogin: user.last_login,
    avatarUrl: user.avatar_url
  };
};

/**
 * Validates test submission data
 * @param {Object} data - Test submission data
 * @throws {ApiError} - If validation fails
 */
const validateTestSubmission = (data) => {
  if (!data || typeof data !== 'object') {
    throw new ApiError('Invalid test submission data', 400);
  }

  if (!Array.isArray(data.answers)) {
    throw new ApiError('Answers must be an array', 400);
  }

  if (data.answers.length === 0) {
    throw new ApiError('No answers provided', 400);
  }

  data.answers.forEach((answer, index) => {
    if (!answer.questionId) {
      throw new ApiError(`Question ID missing for answer at index ${index}`, 400);
    }
    if (answer.selectedOption === undefined || answer.selectedOption === null) {
      throw new ApiError(`Selected option missing for answer at index ${index}`, 400);
    }
  });
};

module.exports = {
  validatePassword,
  validateEmail,
  validateUsername,
  validatePhone,
  validateName,
  validateUrl,
  validateDate,
  validateTestSubmission,
  sanitizeUser,
  REGEX
}; 