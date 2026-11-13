import { decode, type ProjectBundle, type ProjectDecodeResult, type ProjectNormalizationIssue } from './projectBundle'

export type ProjectImportPreview = { name: string; bundle: ProjectBundle; issues: ProjectNormalizationIssue[] }

/** Inspect an import while keeping its original bytes available for export/recovery. */
export function decodeProjectImport(text: string): ProjectDecodeResult {
  return decode(text)
}

export function parseProjectImport(text: string, fileName: string): ProjectImportPreview {
  const result = decode(text)
  if (result.status !== 'valid' || !result.document) throw new Error(result.issues[0] ?? 'Project không hợp lệ.')
  const bundle = result.document
  const stem = fileName.replace(/\.machmo\.json$/i, '').replace(/\.json$/i, '')
  const name = stem.split(/[\\/]/).at(-1)?.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
  return { name: name || 'Project đã nhập', bundle, issues: result.normalizationIssues ?? [] }
}
