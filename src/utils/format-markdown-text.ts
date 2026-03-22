interface MarkdownTextFormatOptions {
  headingMaxWords: number
  headingMaxChars: number
  headingGap: string
  sentenceGap: string
  headingPrefix: string
  preserveExistingMarkdown: boolean
  sentenceEndChars: string
}

const DEFAULT_OPTIONS: MarkdownTextFormatOptions = {
  headingMaxWords: 12,
  headingMaxChars: 80,
  headingGap: '\n\n\n\n',
  sentenceGap: '\n\n',
  headingPrefix: '## ',
  preserveExistingMarkdown: true,
  sentenceEndChars: '.!?'
}

function normalizeInputText(input: string): string {
  return input
    .replace(/\r\n?/g, '\n')
    .trim()
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
}

function splitIntoPhrases(input: string): string[] {
  const escapedSentenceEnds = DEFAULT_OPTIONS.sentenceEndChars.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  const delimiterPattern = new RegExp(`(?<=[${escapedSentenceEnds}])\\s+`, 'g')

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return [...new Intl.Segmenter('en', { granularity: 'sentence' }).segment(input)]
      .map((segment) => segment.segment.trim())
      .filter(Boolean)
  }

  return input
    .split(delimiterPattern)
    .map((segment) => segment.trim())
    .filter(Boolean)
}

function hasExistingMarkdown(text: string): boolean {
  return /^(#{1,6}\s+|[-*+]\s+|\d+\.\s+|>\s+|```|`|!\[|\[.+\]\()/.test(text.trim())
}

function isLikelyHeading(text: string, options: MarkdownTextFormatOptions): boolean {
  const normalized = text.trim().replace(/\s+/g, ' ')
  const words = normalized.split(/\s+/).filter(Boolean)
  const lower = normalized.toLowerCase()
  const sentenceBoundaryPattern = new RegExp(`[${options.sentenceEndChars}]$`)

  if (!normalized) return false
  if (sentenceBoundaryPattern.test(normalized)) return false
  if (normalized.length > options.headingMaxChars) return false
  if (words.length > options.headingMaxWords) return false
  if (/^[-*+]\s+/.test(normalized)) return false
  if (/^\d+\.\s+/.test(normalized)) return false
  if (/[.!?]$/.test(normalized)) return false
  if (normalized.includes(',')) return false
  if (normalized.includes(':') && normalized.length > options.headingMaxChars) return false
  if (!/^[A-Z]/.test(normalized) && !normalized.endsWith(':')) return false
  if (/^(this|that|these|those|it)\s/i.test(normalized)) return false

  const hasSentenceLikeVerb = /\b(is|are|was|were|be|has|have|had|do|does|did|can|could|should|would|will|with|through|between|because|therefore|however)\b/.test(lower)
  if (hasSentenceLikeVerb) return false

  return words.length >= 1
}

export function formatMarkdownText(input: string, overrideOptions: Partial<MarkdownTextFormatOptions> = {}): string {
  const options: MarkdownTextFormatOptions = {
    ...DEFAULT_OPTIONS,
    ...overrideOptions
  }

  const text = normalizeInputText(input)
  if (!text) return ''

  const phrases = splitIntoPhrases(text)
  const formattedParts: string[] = []

  for (const phrase of phrases) {
    if (!phrase) continue

    const normalizedPhrase = phrase.trim().replace(/\s+/g, ' ')
    const treatAsMarkdown = options.preserveExistingMarkdown && hasExistingMarkdown(normalizedPhrase)
    const looksLikeHeading = !treatAsMarkdown && isLikelyHeading(normalizedPhrase, options)
    const gap = formattedParts.length === 0 ? '' : looksLikeHeading ? options.headingGap : options.sentenceGap
    const rendered = looksLikeHeading
      ? `${options.headingPrefix}${normalizedPhrase}`
      : normalizedPhrase

    formattedParts.push(gap + rendered)
  }

  return formattedParts.join('')
}
