export interface OperationParamDescriptor {
  name: string
  in: 'body' | 'query' | 'path' | 'header'
  required: boolean
  type: string
  description?: string
  example?: unknown
}

export interface OperationDescriptor {
  id: string
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  description: string
  auth: {
    required: boolean
    mechanisms: string[]
  }
  compatibilityAliases?: string[]
  requestParams?: OperationParamDescriptor[]
  requestSchema?: Record<string, unknown>
  responseSchema?: Record<string, unknown>
  responseDescription?: string
}

export const operationRegistry: OperationDescriptor[] = [
  {
    id: 'generate-content',
    method: 'POST',
    path: '/api/operations/generate-content',
    description: 'Generate AI content for the highest-scored content types.',
    auth: {
      required: true,
      mechanisms: ['session', 'x-internal-user-id']
    },
    compatibilityAliases: ['/api/trends/generate-content'],
    requestParams: [
      {
        name: 'trend',
        in: 'body',
        required: true,
        type: 'object',
        description: 'Trend metadata and context for content generation.'
      },
      {
        name: 'contentTypeScores',
        in: 'body',
        required: true,
        type: 'object',
        description: 'Scoring object keyed by content type (requires `finalScore` to rank types).'
      }
    ],
    requestSchema: {
      type: 'object',
      required: ['trend', 'contentTypeScores'],
      properties: {
        trend: { type: 'object' },
        contentTypeScores: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              contentFitScore: { type: 'number' },
              viralPotentialScore: { type: 'number' },
              finalScore: { type: 'number' },
              rationale: { type: 'string' }
            }
          }
        }
      }
    },
    responseSchema: {
      type: 'object',
      properties: {
        trend: { type: 'object' },
        generatedContent: { type: 'array' }
      }
    },
    responseDescription: 'Returns the input trend and an array of generated content payloads for top scoring content types.'
  },
  {
    id: 'generate-content-images',
    method: 'POST',
    path: '/api/operations/generate-content-images',
    description: 'Generate image variations for generated content using templates and content-type mappings.',
    auth: {
      required: true,
      mechanisms: ['session', 'x-internal-user-id']
    },
    compatibilityAliases: ['/api/generate-content-images'],
    requestParams: [
      {
        name: 'trend',
        in: 'body',
        required: false,
        type: 'object',
        description: 'Optional trend metadata preserved for traceability.'
      },
      {
        name: 'generatedContent',
        in: 'body',
        required: true,
        type: 'array',
        description: 'Array of content-type keyed objects, each containing generated content items.'
      }
    ],
    requestSchema: {
      type: 'object',
      required: ['generatedContent'],
      properties: {
        trend: { type: 'object' },
        generatedContent: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    },
    responseSchema: {
      type: 'object',
      properties: {
        imagesByContentType: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              contentTypeSlug: { type: 'string' },
              images: { type: 'array' }
            }
          }
        },
        totalImagesGenerated: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } }
      }
    },
    responseDescription: 'Returns generated images grouped by content type with optional per-item/operation errors.'
  }
]

