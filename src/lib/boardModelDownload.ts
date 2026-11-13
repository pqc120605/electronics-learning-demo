export function getCadViewerDownloadLabel(url: string): string {
  const pathname = url.split(/[?#]/, 1)[0]?.toLowerCase() ?? ''

  if (pathname.endsWith('.glb')) return 'Tải model GLB'
  if (pathname.endsWith('.step') || pathname.endsWith('.stp')) return 'Tải STEP gốc'
  if (pathname.endsWith('.zip')) return 'Tải gói CAD ZIP'
  return 'Tải tệp CAD'
}
