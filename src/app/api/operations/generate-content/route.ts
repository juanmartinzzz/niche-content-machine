import { NextRequest } from 'next/server'
import { handleGenerateContentPOST } from '@/lib/operations/generateContent'

export async function POST(request: NextRequest) {
  return handleGenerateContentPOST(request)
}

