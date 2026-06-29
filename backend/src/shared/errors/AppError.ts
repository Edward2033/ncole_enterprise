export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, 400, details);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(message, 403);
  }

  static notFound(resource: string): AppError {
    return new AppError(`${resource} not found`, 404);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(message, 500);
  }
}
