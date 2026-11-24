export function normalizeCatalogText(text: string) {
  return text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replaceAll('đ', 'd').replace(/[^a-z0-9]+/g, ' ').trim()
}

export function matchesCatalogSearch(text: string, query: string) {
  const haystack = normalizeCatalogText(text)
  return normalizeCatalogText(query).split(' ').every(word => haystack.includes(word))
}
