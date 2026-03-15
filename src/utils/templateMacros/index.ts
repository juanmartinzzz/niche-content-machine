/**
 * Utilities for replacing template macros in HTML strings.
 */

type MacroValue = unknown

/**
 * Replaces placeholders in the form `{key}` with their matching root-level values.
 *
 * Example:
 * htmlTemplate: "Hello {name}, score: {score}"
 * values: { name: "Ada", score: 10 }
 * output: "Hello Ada, score: 10"
 */
export function applyTemplateMacros(
  htmlTemplate: string,
  values: Record<string, MacroValue>
): string {
  if (!htmlTemplate) return htmlTemplate

  return Object.entries(values).reduce((acc, [key, rawValue]) => {
    const token = `{${key}}`
    const replacement = resolveMacroValue(rawValue)
    return acc.split(token).join(replacement)
  }, htmlTemplate)
}

function resolveMacroValue(value: MacroValue): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
