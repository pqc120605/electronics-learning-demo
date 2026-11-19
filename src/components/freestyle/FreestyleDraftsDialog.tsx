import {useEffect,useRef,useState,type ChangeEvent} from 'react'
import {getBrowserStorage} from '../../lib/workspaceStorage'
import {getFreestyleBoard,type FreestyleWorkspace} from '../../lib/freestyle/freestyleCircuit'
import {listFreestyleDrafts,type SavedFreestyleDraft} from '../../lib/freestyle/freestyleDrafts'
import {arduinoSourceFile} from '../../lib/arduinoSketchExport'
import {downloadBlob} from '../../lib/communityAttachments'
import {backupFileLimit,freestyleBomCsv,restoreFreestyleBackup,serializeFreestyleBackup,serializeFreestyleProject} from '../../lib/freestyle/freestyleTransfer'

type DraftProps = {
  open: boolean; onClose: () => void; onRestore: (draft: FreestyleWorkspace) => void; current: FreestyleWorkspace
  drawing?: { kind: 'breadboard' | 'schematic'; get: () => SVGSVGElement | null }
}

export function FreestyleDraftsDialog({open,onClose,onRestore,current,drawing}:DraftProps){
 const dialog=useRef<HTMLDialogElement>(null),[drafts,setDrafts]=useState<SavedFreestyleDraft[]>([]),[error,setError]=useState('')
 const [status,setStatus]=useState(''),[exporting,setExporting]=useState(false)
 useEffect(()=>{if(open){setStatus('');try{setDrafts(listFreestyleDrafts(getBrowserStorage('localStorage')));setError('')}catch{setError('Không đọc được bộ nhớ trình duyệt. Không có bản nháp nào bị xóa.')}dialog.current?.showModal()}else dialog.current?.close()},[open])
 const save = (raw: string, name: string, type = 'application/json') => downloadBlob(new Blob([raw], {type}), name)
 const download = (raw: string) => save(raw, `machmo-draft-${Date.now()}.json`)
 async function restoreBackup(event: ChangeEvent<HTMLInputElement>) {
   const file = event.currentTarget.files?.[0]
   event.currentTarget.value = ''
   if (!file) return
   setStatus('');setError('')
   if (file.size > backupFileLimit) { setError('Tệp sao lưu vượt 8 MiB.'); return }
   try {
     const storage = getBrowserStorage('localStorage')
     const count = restoreFreestyleBackup(storage, await file.text())
     setDrafts(listFreestyleDrafts(storage))
     setStatus(`Đã thêm ${count} bản nháp vào danh sách. Chọn bản muốn mở.`)
   } catch (reason) { setError(reason instanceof Error ? reason.message : 'Chưa đọc được tệp sao lưu.') }
 }
 async function exportDrawing(format: 'svg' | 'png') {
   const svg = drawing?.get()
   if (!drawing || !svg) { setError('Mở bản vẽ 2D hoặc sơ đồ nguyên lý trước khi tải ảnh.'); return }
   setError('');setExporting(true)
   try { await (await import('../../lib/freestyle/exportFreestyleDrawing')).exportFreestyleDrawing(svg, drawing.kind, format) }
   catch (reason) { setError(reason instanceof Error ? reason.message : 'Không xuất được ảnh.') }
   finally { setExporting(false) }
 }
 return <dialog ref={dialog} className="freestyle-tools freestyle-drafts" aria-labelledby="freestyle-drafts-title" onClose={onClose} onCancel={onClose}>
  <header className="freestyle-tools-head"><h2 id="freestyle-drafts-title">Bản nháp trên máy này</h2><button className="freestyle-button" onClick={onClose}>Đóng bản nháp</button></header>
  <div className="freestyle-tools-body"><p>Nháp được lưu trong trình duyệt này, chưa đồng bộ hay sao lưu lên máy chủ. Xóa dữ liệu trình duyệt sẽ mất các bản này; hãy tải file để giữ riêng.</p>
   <section aria-label="Sao lưu mạch đang mở"><h3>Mạch đang mở</h3><p>Bao gồm thay đổi chỉ có trong phiên, kể cả khi chưa ghi được vào trình duyệt.</p>
    <div className="freestyle-transfer-actions">
     <button className="freestyle-button" onClick={()=>download(JSON.stringify(current,null,2))}>Tải mạch đang mở</button>
     <button className="freestyle-button" onClick={()=>save(serializeFreestyleProject(current),'mach-mo-freestyle.machmo.json')}>Xuất dự án .machmo.json</button>
     <button className="freestyle-button" disabled={!current.doc.parts.length&&!current.doc.breadboards.length} onClick={()=>save(freestyleBomCsv(current),'mach-mo-bom.csv','text/csv;charset=utf-8')}>Xuất BOM CSV</button>
     <button className="freestyle-button" disabled={current.language!=='cpp'||!current.code.trim()} onClick={()=>{const file=arduinoSourceFile(current.code,current.boardId);save(file.contents,file.fileName,'text/plain')}}>Tải sketch .ino</button>
     {drawing && <><button className="freestyle-button" disabled={exporting} onClick={()=>void exportDrawing('svg')}>Tải bản vẽ SVG</button><button className="freestyle-button" disabled={exporting} onClick={()=>void exportDrawing('png')}>Tải bản vẽ PNG</button></>}
    </div>
    {drawing && <p>Ảnh xuất lấy toàn khung {drawing.kind === 'breadboard' ? 'lắp mạch 2D' : 'sơ đồ nguyên lý'} đang mở.</p>}
   </section>
   <section aria-label="Sao lưu toàn bộ bàn tự do"><h3>Toàn bộ nháp bàn tự do</h3>
    <div className="freestyle-transfer-actions">
     <button className="freestyle-button" onClick={()=>save(serializeFreestyleBackup(current,drafts),'mach-mo-nhap-ban-tu-do.json')}>Sao lưu tất cả nháp</button>
     <label className="freestyle-button freestyle-import-draft">Khôi phục từ tệp<input type="file" accept=".json,application/json" aria-label="Khôi phục tất cả nháp từ tệp" onChange={restoreBackup}/></label>
    </div>
   </section>
   {status&&<p role="status">{status}</p>}{error&&<p role="alert">{error}</p>}{!error&&!drafts.length&&<p>Chưa có bản nháp đã lưu.</p>}
   <ol>{drafts.map((draft,i)=><li key={draft.key} data-draft-key={draft.key}><strong>{draft.key.includes(':previous:')?'Bản trước khi thay mạch':'Bản lưu hiện tại'} · {draft.workspace?.boardId?getFreestyleBoard(draft.workspace.boardId).name:'Chưa chọn board'}</strong><span>{draft.workspace?`${draft.workspace.doc.parts.length} linh kiện · ${draft.workspace.doc.wires.length} dây · ${draft.workspace.updatedAt}`:'File chưa đọc được; vẫn có thể tải nguyên bản.'}</span><div>{draft.workspace&&<button className="freestyle-button" onClick={()=>onRestore(draft.workspace!)} aria-label={`Khôi phục bản nháp ${i+1}`}>Khôi phục</button>}<button className="freestyle-button" onClick={()=>download(draft.raw)} aria-label={`Tải nguyên bản nháp ${i+1}`}>Tải file gốc</button></div></li>)}</ol>
  </div>
 </dialog>
}
