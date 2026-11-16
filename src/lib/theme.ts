export type ThemePreference = 'light' | 'dark' | 'system'
export const THEME_KEY = 'mm-theme'
export function readTheme(storage: Pick<Storage, 'getItem'> | null): ThemePreference {
  try {
    const value = storage?.getItem(THEME_KEY)
    return value === 'dark' || value === 'system' ? value : 'light'
  } catch { return 'light' }
}
export function setTheme(value: ThemePreference, storage: Pick<Storage, 'setItem'> | null, root: Pick<HTMLElement, 'dataset'>) {
  root.dataset.theme = value
  try { storage?.setItem(THEME_KEY, value) } catch { /* theme remains usable during this session */ }
}
