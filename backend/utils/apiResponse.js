const successResponse = (res, data, statusCode = 200) => {
  res.status(statusCode).json({ success: true, data });
};

const errorResponse = (res, error, statusCode = 500) => {
  const errorMessage = error.message || 'An unknown error occurred';
  console.error('Error response:', error); // Log the error object
  res.status(statusCode).json({ success: false, message: errorMessage });
};

module.exports = { successResponse, errorResponse };