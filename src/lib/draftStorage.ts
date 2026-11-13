export function saveDraft(storage: Pick<Storage, 'setItem'>, key: string, value: string, onFailure: () => void, onSuccess?: () => void): void {
  try {
    storage.setItem(key, value)
  } catch {
    onFailure()
    return
  }
  onSuccess?.()
}
