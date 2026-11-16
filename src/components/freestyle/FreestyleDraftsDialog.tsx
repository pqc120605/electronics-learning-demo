import {useEffect,useRef,useState} from 'react'
import {getBrowserStorage} from '../../lib/workspaceStorage'
import {getFreestyleBoard,type FreestyleWorkspace} from '../../lib/freestyle/freestyleCircuit'
import {listFreestyleDrafts,type SavedFreestyleDraft} from '../../lib/freestyle/freestyleDrafts'
export function FreestyleDraftsDialog({open,onClose,onRestore,current}:{open:boolean;onClose:()=>void;onRestore:(draft:FreestyleWorkspace)=>void;current:FreestyleWorkspace}){
 const dialog=useRef<HTMLDialogElement>(null),[drafts,setDrafts]=useState<SavedFreestyleDraft[]>([]),[error,setError]=useState('')
 useEffect(()=>{if(open){try{setDrafts(listFreestyleDrafts(getBrowserStorage('localStorage')));setError('')}catch{setError('Không đọc được bộ nhớ trình duyệt. Không có bản nháp nào bị xóa.')}dialog.current?.showModal()}else dialog.current?.close()},[open])
 const download=(raw:string)=>{const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=`machmo-draft-${Date.now()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <dialog ref={dialog} className="freestyle-tools freestyle-drafts" aria-labelledby="freestyle-drafts-title" onClose={onClose} onCancel={onClose}>
  <header className="freestyle-tools-head"><h2 id="freestyle-drafts-title">Bản nháp trên máy này</h2><button className="freestyle-button" onClick={onClose}>Đóng bản nháp</button></header>
  <div className="freestyle-tools-body"><p>Nháp được lưu trong trình duyệt này, chưa đồng bộ hay sao lưu lên máy chủ. Xóa dữ liệu trình duyệt sẽ mất các bản này; hãy tải file để giữ riêng.</p><section aria-label="Sao lưu mạch đang mở"><h3>Mạch đang mở</h3><p>Bao gồm thay đổi chỉ có trong phiên, kể cả khi chưa ghi được vào trình duyệt.</p><button className="freestyle-button" onClick={()=>download(JSON.stringify(current,null,2))}>Tải mạch đang mở</button></section>{error&&<p role="alert">{error}</p>}{!error&&!drafts.length&&<p>Chưa có bản nháp đã lưu.</p>}
   <ol>{drafts.map((draft,i)=><li key={draft.key} data-draft-key={draft.key}><strong>{draft.key.includes(':previous:')?'Bản trước khi thay mạch':'Bản lưu hiện tại'} · {draft.workspace?.boardId?getFreestyleBoard(draft.workspace.boardId).name:'Chưa chọn board'}</strong><span>{draft.workspace?`${draft.workspace.doc.parts.length} linh kiện · ${draft.workspace.doc.wires.length} dây · ${draft.workspace.updatedAt}`:'File chưa đọc được; vẫn có thể tải nguyên bản.'}</span><div>{draft.workspace&&<button className="freestyle-button" onClick={()=>onRestore(draft.workspace!)} aria-label={`Khôi phục bản nháp ${i+1}`}>Khôi phục</button>}<button className="freestyle-button" onClick={()=>download(draft.raw)} aria-label={`Tải nguyên bản nháp ${i+1}`}>Tải file gốc</button></div></li>)}</ol>
  </div>
 </dialog>
}
