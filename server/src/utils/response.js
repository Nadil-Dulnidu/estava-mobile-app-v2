export const sendSuccess = (res, { statusCode = 200, message, data = null, meta = null }) => {
  const payload = {
    success: true,
    message,
    data,
  };

  if (meta) payload.meta = meta;

  return res.status(statusCode).json(payload);
};

export const sendError = (res, { statusCode = 500, message, errors = [] }) =>
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
