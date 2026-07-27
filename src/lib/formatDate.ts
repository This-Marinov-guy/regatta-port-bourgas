import moment from 'moment'

export function formatDisplayDate(value: string | Date | null | undefined) {
  if (!value) {
    return ''
  }

  const parsed = moment(value)
  return parsed.isValid() ? parsed.format('DD-MM-YYYY') : ''
}

export function formatDisplayDateRange(
  from: string | Date | null | undefined,
  to: string | Date | null | undefined
) {
  const formattedFrom = formatDisplayDate(from)
  const formattedTo = formatDisplayDate(to)

  if (formattedFrom && formattedTo) {
    return `${formattedFrom} - ${formattedTo}`
  }

  return formattedFrom || formattedTo
}
