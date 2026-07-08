const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/

export function dateOnlyToLocalDate(dateStr: string) {
  if (DATE_ONLY_RE.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  return new Date(dateStr)
}

export function formatDateOnly(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
) {
  return dateOnlyToLocalDate(dateStr).toLocaleDateString('en-US', options)
}

export function todayDateOnly() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
