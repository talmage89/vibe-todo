export abstract class ApiError extends Error {
  status: number = 500;
  code: string = "INTERNAL_ERROR";
}

export class AuthenticationError extends ApiError {
  override status = 401;
  override code = "AUTHENTICATION_ERROR";
}

export class AuthorizationError extends ApiError {
  override status = 403;
  override code = "AUTHORIZATION_ERROR";
}

export class NotFoundError extends ApiError {
  override status = 404;
  override code = "NOT_FOUND";
}

export class ValidationError extends ApiError {
  override status = 400;
  override code = "VALIDATION_ERROR";
}
