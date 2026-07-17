// ---------------------------------------------------------------------------
// AppError — the single base class for all domain errors thrown by services
// and controllers. The global error-handling middleware inspects `isOperational`
// to decide whether to surface the message to the client or return a generic 500.
// ---------------------------------------------------------------------------
export class AppError extends Error {
  public readonly statusCode: number;
  /** true = expected domain error (4xx); false = unexpected bug (5xx) */
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    // Maintain correct prototype chain in transpiled JS.
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// ---------------------------------------------------------------------------
// Convenience subclasses — mirrors standard HTTP semantics.
// ---------------------------------------------------------------------------

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'Unprocessable Entity') {
    super(message, 422);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too Many Requests') {
    super(message, 429);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    // isOperational = false — this should never be raised as a domain error;
    // it exists so the error middleware can re-wrap unexpected thrown values.
    super(message, 500, false);
  }
}
