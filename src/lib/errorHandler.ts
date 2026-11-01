import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_STATE_TRANSITION'
  | 'TRANSACTION_CONFLICT'
  | 'INSUFFICIENT_STOCK'
  | 'SERIAL_NOT_FOUND'
  | 'SERIAL_ALREADY_ASSIGNED'
  | 'INTERNAL_SERVER_ERROR';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly fieldErrors: Record<string, string[]> | null;

  constructor(
    statusCode: number,
    code: ApiErrorCode,
    message: string,
    fieldErrors: Record<string, string[]> | null = null
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function handleApiError(error: unknown) {
  const timestamp = new Date().toISOString();

  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of error.issues) {
      const path = issue.path.join('.');
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }

      fieldErrors[path].push(issue.message);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed. Please check submitted fields.',
          fieldErrors,
          timestamp,
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          fieldErrors: error.fieldErrors,
          timestamp,
        },
      },
      { status: error.statusCode }
    );
  }

  console.log('Unhandled Internal API Error: ', error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An internal server error occurred.',
        fieldErrors: null,
        timestamp,
      },
    },
    { status: 500 }
  );
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}
