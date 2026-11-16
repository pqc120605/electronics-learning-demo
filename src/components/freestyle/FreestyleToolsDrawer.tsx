import { Suspense, lazy, useEffect, useRef, useState } from 'react'

/**
 * Ngăn công cụ trong bàn lắp mạch (2026-11-14): mở các công cụ sẵn có ngay tại chỗ, không đổi URL công khai.
 * Mỗi công cụ là trang hiện có, chỉ được nạp khi mở tab.
 */
const tools = [
  { id: 'sketch', label: 'Chạy code (sketch)', load: lazy(() => import('../../pages/SketchRunnerPage').then(module => ({ default: module.SketchRunnerPage }))) },
  { id: 'hex', label: 'Firmware HEX / UF2', load: lazy(() => import('../../pages/FirmwareHexToolPage').then(module => ({ default: module.FirmwareHexToolPage }))) },
  { id: 'spice', label: 'SPICE', load: lazy(() => import('../../pages/SpiceWorkbenchPage').then(module => ({ default: module.SpiceWorkbenchPage }))) },
  { id: 'calc', label: 'Máy tính điện tử', load: lazy(() => import('../../pages/ElectronicsCalculatorsPage').then(module => ({ default: module.ElectronicsCalculatorsPage }))) },
] as const
type ToolId = (typeof tools)[number]['id']

export function FreestyleToolsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [tab, setTab] = useState<ToolId>('sketch')
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  const index = tools.findIndex(tool => tool.id === tab)
  const Active = tools[index].load
  const move = (next: number) => {
    const tool = tools[(next + tools.length) % tools.length]
    setTab(tool.id)
    document.getElementById(`freestyle-tool-tab-${tool.id}`)?.focus()
  }
  return <dialog ref={dialogRef} className="freestyle-tools" aria-labelledby="freestyle-tools-title" onClose={onClose} onCancel={onClose}>
    <header className="freestyle-tools-head">
      <h2 id="freestyle-tools-title">Công cụ</h2>
      <div role="tablist" aria-label="Chọn công cụ" className="freestyle-tools-tabs">
        {tools.map(tool => <button key={tool.id} id={`freestyle-tool-tab-${tool.id}`} type="button" role="tab" aria-selected={tab === tool.id} aria-controls="freestyle-tool-panel" tabIndex={tab === tool.id ? 0 : -1} onClick={() => setTab(tool.id)} onKeyDown={event => {
          if (event.key === 'ArrowRight') { event.preventDefault(); move(index + 1) }
          else if (event.key === 'ArrowLeft') { event.preventDefault(); move(index - 1) }
        }}>{tool.label}</button>)}
      </div>
      <button type="button" className="freestyle-tools-close" onClick={onClose}>Đóng</button>
    </header>
    <div id="freestyle-tool-panel" role="tabpanel" aria-labelledby={`freestyle-tool-tab-${tab}`} className="freestyle-tools-body">
      {open && <Suspense fallback={<p role="status">Đang mở công cụ…</p>}><Active /></Suspense>}
    </div>
  </dialog>
}
