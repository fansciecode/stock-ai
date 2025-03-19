const wrapResponse = (data, message = 'Success') => ({
    success: true,
    message,
    data
}); 