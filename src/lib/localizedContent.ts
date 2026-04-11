export function localizeText(
  locale: string,
  englishValue: string | null | undefined,
  bulgarianValue: string | null | undefined,
  fallback = ''
) {
  const english = englishValue?.trim()
  const bulgarian = bulgarianValue?.trim()

  if (locale === 'bg') {
    return bulgarian || english || fallback
  }

  return english || bulgarian || fallback
}
