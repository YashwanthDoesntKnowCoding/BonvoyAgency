function successResponse(data, message = 'OK') {
  return { success: true, data, message };
}

function errorResponse(code, message, details = null) {
  return {
    success: false,
    error: { code, message, details },
  };
}

module.exports = { successResponse, errorResponse };
