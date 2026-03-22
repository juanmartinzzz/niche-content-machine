import { NextRequest } from 'next/server'
import { handleGenerateContentImagesPOST, getGenerateContentImagesUsagePayload } from '@/lib/operations/generateContentImages'
import { NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return handleGenerateContentImagesPOST(request)
}

export async function GET() {
  return NextResponse.json(getGenerateContentImagesUsagePayload())
}

