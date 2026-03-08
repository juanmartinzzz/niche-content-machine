/**
 * Slug utilities for consistent slug generation and validation
 */

/**
 * Generates a URL-safe slug from text (lowercase + dashes only)
 * @param text - The text to convert to a slug
 * @returns A slugified version of the text
 */
export function generateSlug(text: string): string {
  if (!text) return ''

  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

/**
 * Validates that a slug contains only lowercase letters, numbers, and dashes
 * @param slug - The slug to validate
 * @returns True if the slug is valid
 */
export function validateSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && !slug.startsWith('-') && !slug.endsWith('-')
}