// src/lib/errors.ts

import { NextResponse } from "next/server";

/**
 * Base application error with status code and optional error code
 */
export class AppError extends Error {
  public status: number;
  public code?: string;

  constructor(message: string, status = 500, code?: string) {
    super(message);

    this.status = status;
    this.code = code;
    this.name = new.target.name;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Pre-defined error types for common scenarios
 */
export class BadRequestError extends AppError {
  constructor(message = "Bad Request") {
    super(message, 400, "BAD_REQUEST");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not Found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409, "CONFLICT");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation Error") {
    super(message, 422, "VALIDATION_ERROR");
  }
}

/**
 * API response helper that formats errors consistently
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code ?? "APP_ERROR",
          status: error.status,
        },
      },
      { status: error.status },
    );
  }

  console.error("Unhandled error:", error);

  return NextResponse.json(
    {
      success: false,
      error: {
        message: "Internal Server Error",
        code: "INTERNAL_SERVER_ERROR",
      },
    },
    { status: 500 },
  );
}
