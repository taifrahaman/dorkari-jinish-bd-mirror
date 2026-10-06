// src/lib/errors/errors.ts

import { NextResponse } from "next/server";
import { ZodError } from "zod";

/* ============================================================
 * Base application error
 * ============================================================ */

export class AppError extends Error {
  public status: number;
  public code?: string;
  public details?: unknown;

  constructor(message: string, status = 500, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/* ============================================================
 * Pre-defined error types
 * ============================================================ */

export class BadRequestError extends AppError {
  constructor(message = "Bad Request", details?: unknown) {
    super(message, 400, "BAD_REQUEST", details);
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
  constructor(message = "Conflict", details?: unknown) {
    super(message, 409, "CONFLICT", details);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation Error", details?: unknown) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}

/* ============================================================
 * Zod → field errors
 * ============================================================ */

export function zodToFieldErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_root";
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

/* ============================================================
 * Unified API error → NextResponse
 * ============================================================ */

export function handleApiError(error: unknown): NextResponse {
  // Zod errors — surface field-level details for forms
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          status: 422,
          details: { fieldErrors: zodToFieldErrors(error) },
        },
      },
      { status: 422 },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code ?? "APP_ERROR",
          status: error.status,
          details: error.details,
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
