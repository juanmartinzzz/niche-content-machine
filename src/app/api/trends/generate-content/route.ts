import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient, getTableName } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { executeAIOperation } from '@/lib/ai-utils'
import Ajv from 'ajv'

// Content type mapping to AI endpoints and prompt templates
const CONTENT_TYPE_CONFIG = {
  hotTakes: {
    endpoint_slug: "grok-4-1-fast-reasoning",
    prompt_template_id: "uuid-here-for-hot-takes-template"
  },
  jobMarketState: {
    endpoint_slug: "grok-4-1-fast-reasoning",
    prompt_template_id: "uuid-here-for-job-market-template"
  },
  workflowBreakdowns: {
    endpoint_slug: "grok-4-1-fast-reasoning",
    prompt_template_id: "uuid-here-for-workflow-template"
  },
  hiringMarketSignals: {
    endpoint_slug: "grok-4-1-fast-reasoning",
    prompt_template_id: "uuid-here-for-hiring-template"
  },
  designPmDiscourse: {
    endpoint_slug: "grok-4-1-fast-reasoning",
    prompt_template_id: "uuid-here-for-design-pm-template"
  },
  salaryTransparency: {
    endpoint_slug: "grok-4-1-fast-reasoning",
    prompt_template_id: "uuid-here-for-salary-template"
  },
  aiToolComparisons: {
    endpoint_slug: "grok-4-1-fast-reasoning",
    prompt_template_id: "uuid-here-for-ai-tool-template"
  }
}

// Full JSON schema for input validation
const TREND_SCHEMA = {
  "type": "object",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "required": [
    "trend",
    "contentTypeScores"
  ],
  "properties": {
    "trend": {
      "type": "object",
      "required": [
        "categoryName",
        "name",
        "description",
        "age",
        "controversyFactor",
        "technicalDifficultyFactor",
        "longevityFactor"
      ],
      "properties": {
        "age": {
          "type": "integer",
          "description": "Age in days"
        },
        "name": {
          "type": "string",
          "description": "Max 12 words"
        },
        "audiences": {
          "type": "object",
          "required": [
            "primary",
            "seniorityRange"
          ],
          "properties": {
            "primary": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "e.g. Senior Engineers, Staff Engineers, Engineering Managers"
            },
            "seniorityRange": {
              "enum": [
                "new grad",
                "junior",
                "mid-level",
                "senior",
                "staff+",
                "all levels"
              ],
              "type": "string",
              "description": "e.g. 'mid-level to staff', 'new grads to senior'"
            }
          },
          "description": "Who this trend resonates with — used to target and personalize assets"
        },
        "description": {
          "type": "string",
          "description": "Maximum 35 words"
        },
        "categoryName": {
          "type": "string"
        },
        "longevityFactor": {
          "type": "integer",
          "maximum": 100,
          "minimum": 0,
          "description": "0 = flash in the pan, 100 = likely to be foundational in 3+ years"
        },
        "controversyFactor": {
          "type": "integer",
          "maximum": 100,
          "minimum": 0
        },
        "toolsAndFrameworks": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Tools and frameworks at the center of this trend"
        },
        "geographicRelevance": {
          "type": "array",
          "items": {
            "type": "string",
            "description": "City name with 2-letter state/province code, e.g. 'San Francisco, CA' or 'Toronto, ON'"
          },
          "description": "Cities where this trend is most active with state/province codes"
        },
        "technicalDifficultyFactor": {
          "type": "integer",
          "maximum": 100,
          "minimum": 0
        }
      }
    },
    "contentTypeScores": {
      "type": "object",
      "required": [
        "hotTakes",
        "jobMarketState",
        "workflowBreakdowns",
        "hiringMarketSignals",
        "designPmDiscourse",
        "salaryTransparency",
        "aiToolComparisons"
      ],
      "properties": {
        "hotTakes": {
          "type": "object",
          "required": [
            "contentFitScore",
            "viralPotentialScore",
            "finalScore",
            "rationale"
          ],
          "properties": {
            "rationale": {
              "type": "string",
              "description": "Max 15 words explaining your rationale for the score"
            },
            "contentFitScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            },
            "viralPotentialScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            },
            "finalScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            }
          },
          "description": "Hot takes on the trend usually published within hours of announcement"
        },
        "jobMarketState": {
          "type": "object",
          "required": [
            "contentFitScore",
            "viralPotentialScore",
            "finalScore",
            "rationale"
          ],
          "properties": {
            "rationale": {
              "type": "string",
              "description": "Max 15 words explaining your rationale for the score"
            },
            "contentFitScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            },
            "viralPotentialScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            },
            "finalScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            }
          },
          "description": "State of job market / layoffs / salaries in [month year] posts"
        },
        "aiToolComparisons": {
          "type": "object",
          "required": [
            "contentFitScore",
            "viralPotentialScore",
            "finalScore",
            "rationale"
          ],
          "properties": {
            "rationale": {
              "type": "string",
              "description": "Max 15 words explaining your rationale for the score"
            },
            "contentFitScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            },
            "viralPotentialScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            },
            "finalScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            }
          },
          "description": "Save-worthy comparison matrices — full version gated behind email for sign-ups"
        },
        "designPmDiscourse": {
          "type": "object",
          "required": [
            "contentFitScore",
            "viralPotentialScore",
            "finalScore",
            "rationale"
          ],
          "properties": {
            "rationale": {
              "type": "string",
              "description": "Max 15 words explaining your rationale for the score"
            },
            "contentFitScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            },
            "viralPotentialScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            },
            "finalScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            }
          },
          "description": "Opinion content that takes a clear side — algorithms reward mild controversy in this audience"
        },
        "salaryTransparency": {
          "type": "object",
          "required": [
            "contentFitScore",
            "viralPotentialScore",
            "finalScore",
            "rationale"
          ],
          "properties": {
            "rationale": {
              "type": "string",
              "description": "Max 15 words explaining your rationale for the score"
            },
            "contentFitScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            },
            "viralPotentialScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            },
            "finalScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            }
          },
          "description": "Salary transparency posts — highest share rate, converts to newsletter subscribers"
        },
        "workflowBreakdowns": {
          "type": "object",
          "required": [
            "contentFitScore",
            "viralPotentialScore",
            "finalScore",
            "rationale"
          ],
          "properties": {
            "rationale": {
              "type": "string",
              "description": "Max 15 words explaining your rationale for the score"
            },
            "contentFitScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            },
            "viralPotentialScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            },
            "finalScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            }
          },
          "description": "How I use [tool] to do X in half the time — specific, credible, save-worthy"
        },
        "hiringMarketSignals": {
          "type": "object",
          "required": [
            "contentFitScore",
            "viralPotentialScore",
            "finalScore",
            "rationale"
          ],
          "properties": {
            "rationale": {
              "type": "string",
              "description": "Max 15 words explaining your rationale for the score"
            },
            "contentFitScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            },
            "viralPotentialScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            },
            "finalScore": {
              "type": "integer",
              "maximum": 100,
              "minimum": 0
            }
          },
          "description": "Which companies are aggressively hiring vs. quietly hiring vs. frozen in the job market"
        }
      }
    }
  }
}

// Initialize AJV validator
const ajv = new Ajv()
const validateTrend = ajv.compile(TREND_SCHEMA)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input against JSON schema
    const valid = validateTrend(body)
    if (!valid) {
      return NextResponse.json({
        error: 'Invalid input schema',
        details: validateTrend.errors
      }, { status: 400 })
    }

    const { trend, contentTypeScores } = body

    // Get top 2 content types by finalScore
    const sortedContentTypes = Object.entries(contentTypeScores)
      .sort(([, a]: any, [, b]: any) => b.finalScore - a.finalScore)
      .slice(0, 2)

    if (sortedContentTypes.length < 2) {
      return NextResponse.json({
        error: 'Need at least 2 content types with finalScore'
      }, { status: 400 })
    }

    // Generate content for top 2 content types in parallel
    const contentPromises = sortedContentTypes.map(async ([contentType, scores]: [string, any]) => {
      const config = CONTENT_TYPE_CONFIG[contentType as keyof typeof CONTENT_TYPE_CONFIG]

      if (!config) {
        throw new Error(`No configuration found for content type: ${contentType}`)
      }

      // Lookup endpoint by slug
      const { data: endpoint, error: endpointError } = await supabaseAdmin
        .from(getTableName('ai_endpoints'))
        .select('id')
        .eq('slug', config.endpoint_slug)
        .eq('is_active', true)
        .single()

      if (endpointError || !endpoint) {
        throw new Error(`Endpoint not found for content type: ${contentType}`)
      }

      // Execute AI operation
      const result = await executeAIOperation({
        endpoint_id: endpoint.id,
        prompt_template_id: config.prompt_template_id,
        variables: { trend },
        user_id: user.id
      })

      return {
        contentType,
        generatedContent: result.response,
        scores
      }
    })

    // Wait for all content generation to complete
    const generatedContent = await Promise.all(contentPromises)

    // Return original trend plus generated content
    return NextResponse.json({
      trend,
      generatedContent
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}