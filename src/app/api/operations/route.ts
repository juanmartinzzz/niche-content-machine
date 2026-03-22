import { NextResponse } from 'next/server'
import { operationRegistry } from '@/lib/operations/registry'

export async function GET() {
  return NextResponse.json({
    service: 'operations',
    version: '1.0.0',
    generated_at: new Date().toISOString(),
    operations: operationRegistry
  })
}

