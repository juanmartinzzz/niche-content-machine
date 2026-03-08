import { NextResponse } from 'next/server'

export function logAndReturnError(
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  console.error(`API Error (${status}): ${message}`, details ? { details } : '')
  return NextResponse.json({ error: message }, { status })
}