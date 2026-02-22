/**
 * Formats a date string or Date object into a human-readable format
 * Omits redundant parts that match the current date (year, month, day)
 * @param date - The date to format (string or Date object)
 * @returns A human-readable date string
 */
export function formatHumanReadableDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()

  const year = dateObj.getFullYear()
  const month = dateObj.toLocaleString('en-US', { month: 'short' })
  const day = dateObj.getDate().toString().padStart(2, '0')
  const hours = dateObj.getHours().toString().padStart(2, '0')
  const minutes = dateObj.getMinutes().toString().padStart(2, '0')

  const isSameYear = year === now.getFullYear()
  const isSameMonth = isSameYear && dateObj.getMonth() === now.getMonth()
  const isSameDay = isSameMonth && dateObj.getDate() === now.getDate()

  if (isSameDay) {
    // Today: just show time
    return `${hours}:${minutes}`
  } else if (isSameMonth) {
    // This month: show day and time
    return `${day} at ${hours}:${minutes}`
  } else if (isSameYear) {
    // This year: show month, day and time
    return `${month}-${day} at ${hours}:${minutes}`
  } else {
    // Different year: show full date and time
    return `${year}-${month}-${day} at ${hours}:${minutes}`
  }
}