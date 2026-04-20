import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AppError } from './errors'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function created<T>(data: T) {
  return ok(data, 201)
}

export function handleError(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code },
      { status: err.statusCode },
    )
  }

  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Datos inválidos',
        code: 'VALIDATION_ERROR',
        details: err.flatten().fieldErrors,
      },
      { status: 422 },
    )
  }

  // Unique constraint PostgreSQL
  if (
    err instanceof Error &&
    'code' in err &&
    (err as NodeJS.ErrnoException).code === '23505'
  ) {
    return NextResponse.json(
      { success: false, error: 'Registro duplicado', code: 'CONFLICT' },
      { status: 409 },
    )
  }

  console.error('[unhandled]', err)
  return NextResponse.json(
    { success: false, error: 'Error interno del servidor', code: 'INTERNAL_ERROR' },
    { status: 500 },
  )
}
