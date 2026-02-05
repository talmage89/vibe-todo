export abstract class ApiError extends Error {
  status: number = 500;
}

export class AuthenticationError extends ApiError {
  override status = 401;
}

export class AuthorizationError extends ApiError {
  override status = 403;
}

export class NotFoundError extends ApiError {
  override status = 404;
}

export class ValidationError extends ApiError {
  override status = 400;
}
