import { NextRequest, NextResponse } from 'next/server'
import { getGenerateContentImagesUsagePayload, handleGenerateContentImagesPOST } from '@/lib/operations/generateContentImages'

export async function POST(request: NextRequest) {
  return handleGenerateContentImagesPOST(request)
}

export async function GET() {
  return NextResponse.json(getGenerateContentImagesUsagePayload())
}
