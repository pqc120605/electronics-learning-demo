type FeatureLike = { id: string; name: string; designator?: string; cadFootprint?: { has3dBody: boolean } }

export function getBoardFeaturePickerEntries<T extends FeatureLike>(
  features: T[],
  visibleFeatureIds: Set<string>,
  showFootprints: boolean,
  query: string,
): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  return features.filter((feature) => {
    if (!visibleFeatureIds.has(feature.id)) return false
    if (!showFootprints && feature.cadFootprint && !feature.cadFootprint.has3dBody) return false
    if (!normalizedQuery) return true
    return `${feature.name} ${feature.designator ?? ''}`.toLocaleLowerCase().includes(normalizedQuery)
  })
}
