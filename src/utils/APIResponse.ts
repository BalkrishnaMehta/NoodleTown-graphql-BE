export const APIResponse = {
  success: (message: string, data = {}, statusCode = 200) => ({
    status: "success",
    message,
    data,
    statusCode,
  }),

  error: (message: string, error: Error, statusCode = 500) => ({
    status: "error",
    message,
    error,
    statusCode,
  }),
};
