import { useEffect, useRef, useState, type Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { curriculumLessons, referenceOnlyTopics } from '../data/curriculumSchema'
import { CapabilityBadge, CapabilityLegend } from '../components/CapabilityBadge'
import { addSavedProject, duplicateSavedProject, MissingSavedProjectError, readSavedProjectLibrary, readSavedProjects, removeSavedProject, renameSavedProject, restoreSavedProject, SAVED_PROJECTS_KEY, updateSavedProjectTags, type SavedProject } from '../lib/savedProjects'
import { PROJECT_IMPORT_MAX_BYTES } from '../lib/projectLimits'
import { filterSavedProjects, getProjectLessonLabel } from '../lib/projectLibrary'
import { decodeProjectImport, type ProjectImportPreview } from '../lib/projectTransfer'
import { useProductRoute } from '../lib/useProductRoute'
import { getBrowserStorage, listWorkspaceRecoveryEntries } from '../lib/workspaceStorage'
import { getLessonPartsSummary } from '../lib/lessonPreflight'

const projects = curriculumLessons.map((lesson, index) => ({
  id: String(index + 1).padStart(2, '0'),
  level: `${lesson.level.toLocaleUpperCase('vi-VN')} · ${lesson.durationMinutes} PHÚT`,
  title: lesson.title,
  summary: lesson.objectives.join(' · '),
  parts: getLessonPartsSummary(lesson.id),
  status: lesson.supportedBehavior,
  href: lesson.route,
  action: 'Mở bàn lắp mạch',
  ready: true,
  curriculum: lesson,
}))

export function getProjectImportSizeError(size:number):string {
  return size > PROJECT_IMPORT_MAX_BYTES ? 'Tệp project vượt quá giới hạn 5 MiB.' : ''
}

export function createOriginalImportDownloadBlob(file:File):Blob {
  return new Blob([file],{type:file.type||'application/octet-stream'})
}

export function createImportRequestToken() {
  let current=0
  return {begin:()=>++current,invalidate:()=>{current++},isCurrent:(token:number)=>token===current,runIfCurrent:(token:number,action:()=>void)=>{if(token!==current)return false;action();return true}}
}

export async function inspectProjectImportFile(file:File):Promise<{kind:'oversize';reason:string}|{kind:'problem';status:'unsupported'|'invalid';reason:string;rawBackup:string}|{kind:'valid';preview:ProjectImportPreview}> {
  const sizeError=getProjectImportSizeError(file.size)
  if(sizeError)return {kind:'oversize',reason:sizeError}
  const result=decodeProjectImport(await file.text())
  if(result.status!=='valid'||!result.document)return {kind:'problem',status:result.status==='valid'?'invalid':result.status,reason:result.issues[0]??'Project không hợp lệ.',rawBackup:result.rawBackup}
  const stem=file.name.replace(/\.machmo\.json$/i,'').replace(/\.json$/i,'')
  const name=stem.split(/[\\/]/).at(-1)?.replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim().slice(0,80)||'Project đã nhập'
  return {kind:'valid',preview:{name,bundle:result.document,issues:result.normalizationIssues??[]}}
}

export function saveImportedProjectToLibrary(name:string,bundle:ProjectImportPreview['bundle'],storage?:Storage):SavedProject {
  return storage ? addSavedProject(name,bundle,storage) : addSavedProject(name,bundle)
}

type ProjectImportProblem = {status:'unsupported'|'invalid';reason:string;rawBackup?:string}
export function createImportReviewActions({canSave,onSave,onCancel}:{canSave:boolean;onSave?:()=>void;onCancel:()=>void}):{save?:()=>void;cancel:()=>void} {
  return { ...(canSave&&onSave?{save:onSave}:{}), cancel:onCancel }
}
export function ProjectImportReview({preview,problem,fileName,originalFile,importName='',importNameError='',onNameChange=()=>{},onSave,onCancel,onDownloadOriginal,headingRef,nameInputRef}:{preview?:ProjectImportPreview|null;problem?:ProjectImportProblem|null;fileName:string;originalFile?:File;importName?:string;importNameError?:string;onNameChange?:(name:string)=>void;onSave?:()=>void;onCancel:()=>void;onDownloadOriginal?:(file:File)=>void;headingRef?:Ref<HTMLElement>;nameInputRef?:Ref<HTMLInputElement>}) {
  const actions=createImportReviewActions({canSave:!!preview,onSave,onCancel})
  if(problem)return <div className="saved-project-import-preview" role="alert"><strong>Tệp chưa thể nhập ({problem.status})</strong><p>{problem.reason}</p><p>Tệp này không được nạp vào workspace hoặc thư viện. Có thể tải bản gốc để giữ nguyên byte của tệp.</p><button type="button" aria-label={`Tải bản gốc ${fileName}`} onClick={()=>{if(originalFile)onDownloadOriginal?.(originalFile)}}>Tải bản gốc {fileName}</button><button type="button" onClick={actions.cancel}>Hủy</button></div>
  if(!preview)return null
  return <div className="saved-project-import-preview">
    <strong ref={headingRef} tabIndex={-1}>Xem trước trước khi lưu</strong>
    <label htmlFor="import-project-name">Tên project</label>
    <input ref={nameInputRef} id="import-project-name" value={importName} maxLength={80} onChange={event=>onNameChange(event.target.value)} aria-invalid={!!importNameError} aria-describedby={importNameError?'import-project-name-error':undefined}/>
    {importNameError&&<small id="import-project-name-error" role="alert">{importNameError}</small>}
    <small>Bài: {getProjectLessonLabel(preview.bundle.workspace.lesson)} · Tệp đã qua kiểm tra định dạng. Nội dung sẽ nằm cục bộ trên thiết bị này.</small>
    <small>Chỉ thêm vào thư viện; bản nháp trong workspace không bị thay đổi.</small>
    {preview.issues.map((issue,index)=><p key={`${issue.code}-${issue.lessonId}-${issue.boardId}-${index}`} role="status">{issue.code==='current-draft-conflict'?'Xung đột bản nháp':''}: {issue.lessonId} · {issue.boardId}. Bản hiện có được giữ nguyên; nội dung nhập được giữ riêng trong project thư viện.</p>)}
    <button type="button" onClick={actions.save}>Lưu vào thư viện</button>
    <button type="button" onClick={actions.cancel}>Hủy</button>
  </div>
}

export function ProjectsPage() {
  const productRoute=useProductRoute()
  const navigate=useNavigate()
  const [savedProjects,setSavedProjects]=useState<SavedProject[]>([])
  const [projectError,setProjectError]=useState('')
  const [projectSearch,setProjectSearch]=useState('')
  const [importPreview,setImportPreview]=useState<ProjectImportPreview|null>(null)
  const [importDecodeProblem,setImportDecodeProblem]=useState<ProjectImportProblem|null>(null)
  const [selectedImportFile,setSelectedImportFile]=useState<File|null>(null)
  const [importName,setImportName]=useState('')
  const [importPending,setImportPending]=useState(false)
  const [importNameError,setImportNameError]=useState('')
  const [projectNotice,setProjectNotice]=useState('')
  const [recoveryCount,setRecoveryCount]=useState(0)
  const importRequest=useRef(createImportRequestToken())
  const importFile=useRef<HTMLInputElement>(null)
  const previewHeading=useRef<HTMLElement>(null)
  const importNameInput=useRef<HTMLInputElement>(null)
  useEffect(()=>{
    const library=readSavedProjectLibrary()
    setSavedProjects(library.projects)
    setRecoveryCount(library.unreadable.length+(library.damaged?1:0)+listWorkspaceRecoveryEntries(getBrowserStorage('localStorage'),getBrowserStorage('sessionStorage')).length)
    return () => { importRequest.current.invalidate() }
  },[])
  useEffect(()=>{ if(importPreview) previewHeading.current?.focus() },[importPreview])
  function downloadRecoveryData() {
    const local=getBrowserStorage('localStorage'),library=readSavedProjectLibrary(local)
    const payload={exportedAt:new Date().toISOString(),unreadableProjects:library.unreadable,damagedLibrary:library.damaged?local.getItem(SAVED_PROJECTS_KEY):undefined,backups:listWorkspaceRecoveryEntries(local,getBrowserStorage('sessionStorage'))}
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}))
    const link=document.createElement('a');link.href=url;link.download='mach-mo-du-lieu-can-phuc-hoi.json';link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  const visibleSavedProjects=filterSavedProjects(savedProjects,projectSearch)
  function openSavedProject(project:SavedProject, revisionId?:string) {
    if(!window.confirm(`Mở “${project.name}” sẽ thay workspace đang lưu trong trình duyệt này. Tiếp tục?`))return
    try {
      const latest = readSavedProjects().find(item => item.id === project.id)
      if (!latest) throw new MissingSavedProjectError()
      const bundle = revisionId ? latest.revisions.find(revision => revision.id === revisionId)?.bundle : latest.bundle
      if (!bundle) throw new Error('Không tìm thấy phiên bản đã chọn. Bản đang mở vẫn còn.')
      restoreSavedProject({ ...latest, bundle })
      navigate(productRoute('/build'))
    }
    catch(error) { setProjectError(error instanceof Error?error.message:'Không thể mở project trên thiết bị này.') }
  }
  function exportSavedProject(project:SavedProject) {
    const url=URL.createObjectURL(new Blob([JSON.stringify(project.bundle,null,2)],{type:'application/json'}))
    const link=document.createElement('a');link.href=url;link.download=`${project.name.trim().replace(/[^\p{L}\p{N}-]+/gu,'-').toLowerCase()}.machmo.json`;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  function deleteSavedProject(project:SavedProject) {
    if(!window.confirm(`Xóa project “${project.name}” khỏi danh sách trên thiết bị này?`))return
    try { removeSavedProject(project.id);setSavedProjects(current=>current.filter(item=>item.id!==project.id));setProjectError('') }
    catch(error) { setProjectError(error instanceof Error?error.message:'Không xóa được project.') }
  }
  function renameProject(project:SavedProject) {
    const name=window.prompt('Tên mới cho project:',project.name);if(name===null)return
    try { const renamed=renameSavedProject(project.id,name);setSavedProjects(current=>current.map(item=>item.id===project.id?renamed:item).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)));setProjectError('') }
    catch(error) { setProjectError(error instanceof Error?error.message:'Không đổi được tên project.') }
  }
  function duplicateProject(project:SavedProject) {
    try { const duplicate=duplicateSavedProject(project.id);setSavedProjects(current=>[duplicate,...current]);setProjectError('') }
    catch(error) { setProjectError(error instanceof Error?error.message:'Không sao chép được project.') }
  }
  function editProjectTags(project:SavedProject) {
    const value=window.prompt('Nhãn project, phân tách bằng dấu phẩy (tối đa 8 nhãn):',project.tags.join(', '));if(value===null)return
    const tags=value.split(',')
    if(tags.filter(tag=>tag.trim()).length>8){setProjectError('Mỗi project có thể có tối đa 8 nhãn.');return}
    try { const updated=updateSavedProjectTags(project.id,tags);setSavedProjects(current=>current.map(item=>item.id===project.id?updated:item));setProjectError('') }
    catch(error) { setProjectError(error instanceof Error?error.message:'Không cập nhật được nhãn project.') }
  }
  async function inspectImportFile(file?:File) {
    if(!file)return
    const request = importRequest.current.begin()
    setProjectError('');setProjectNotice('');setImportNameError('');setImportPreview(null);setImportDecodeProblem(null);setSelectedImportFile(file);setImportPending(false)
    setImportPending(true)
    try {
      const inspection = await inspectProjectImportFile(file)
      if(!importRequest.current.runIfCurrent(request,()=>{
        if(inspection.kind==='oversize') setImportDecodeProblem({status:'invalid',reason:inspection.reason})
        else if(inspection.kind==='problem') setImportDecodeProblem({status:inspection.status,reason:inspection.reason,rawBackup:inspection.rawBackup})
        else { setImportPreview(inspection.preview);setImportName(inspection.preview.name) }
      }))return
    } catch(error) {
      importRequest.current.runIfCurrent(request,()=>setProjectError(error instanceof Error?error.message:'Không đọc được tệp project.'))
    } finally {
      importRequest.current.runIfCurrent(request,()=>setImportPending(false))
    }
  }
  function cancelImport() {
    importRequest.current.invalidate()
    setImportPending(false)
    setImportPreview(null)
    setImportDecodeProblem(null)
    setImportNameError('')
    setProjectError('')
    importFile.current?.focus()
  }
  async function downloadOriginalImport(file:File) {
    const url=URL.createObjectURL(createOriginalImportDownloadBlob(file))
    const link=document.createElement('a');link.href=url;link.download=file.name;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  function saveImportedProject() {
    if(!importPreview)return
    setProjectNotice('')
    setProjectError('')
    setImportNameError('')
    try {
      const saved = saveImportedProjectToLibrary(importName, importPreview.bundle)
      setSavedProjects(readSavedProjects())
      setImportPreview(null)
      setProjectNotice(`Đã nhập “${saved.name}” vào thư viện trong trình duyệt này.`)
      importFile.current?.focus()
    } catch(error) {
      const message = error instanceof Error ? error.message : 'Không lưu được project đã nhập.'
      if (message.startsWith('Tên') || message.startsWith('Nhập tên')) {
        setImportNameError(message)
        importNameInput.current?.focus()
      } else {
        setProjectError(message)
      }
    }
  }
  return <div className="catalog-page">
    <section className="catalog-page-heading">
      <p className="eyebrow">LỘ TRÌNH · DỰ ÁN</p>
      <h1>Dự án thực hành</h1>
      <p>Chọn một mục tiêu, xem những gì cần chuẩn bị rồi mở đúng công cụ để bắt đầu. Mỗi thẻ ghi rõ phần nào có thể chạy trong workspace và giới hạn mô phỏng.</p>
      <div className="catalog-actions"><Link className="button-primary" to={productRoute('/build')}>Mở bàn lắp mạch ↗</Link><Link to={productRoute('/components')}>Tra thư viện linh kiện →</Link></div>
    </section>
    <section className="content-section project-page-section">
      <CapabilityLegend ids={['behavior-simulation', 'concept-illustration', 'electrical-simulation', 'firmware-execution']} title="Cách đọc nhãn mô phỏng" />
      <section className="saved-projects" aria-label="Project đã lưu trên thiết bị">
        <div className="saved-projects-heading"><div><p className="eyebrow">WORKSPACE CỦA BẠN · LƯU CỤC BỘ</p><h2>Project đã lưu{savedProjects.length>0&&<span> · {savedProjects.length}</span>}</h2><p>Project nằm trong bộ nhớ trình duyệt này. Xuất tệp để chuyển sang máy khác.</p></div><Link className="button-secondary" to={productRoute('/build')}>Tạo hoặc lưu project ↗</Link></div>
        {projectError&&<p className="builder-message" role="alert">{projectError}</p>}
        {projectNotice&&<p className="saved-project-notice" role="status">{projectNotice}</p>}
        {recoveryCount>0&&<p className="saved-project-notice" role="status">Có {recoveryCount} mục dữ liệu phiên bản này chưa đọc được. Dữ liệu vẫn được giữ trên thiết bị. <button type="button" onClick={downloadRecoveryData}>Tải bản sao để phục hồi</button></p>}
        <div className="saved-project-import" onKeyDown={event=>{if(event.key==='Escape'&&(importPreview||importPending)){event.preventDefault();cancelImport()}}}>
          <label className="saved-project-file-label">Nhập project từ tệp
            <input ref={importFile} type="file" accept=".json,application/json" onChange={event=>{void inspectImportFile(event.currentTarget.files?.[0]);event.currentTarget.value=''}}/>
          </label>
          <small>Tệp .machmo.json chỉ được đọc trong trình duyệt này; giới hạn 5 MiB.</small>
          {importPending&&<div><span role="status">Đang đọc tệp…</span> <button type="button" onClick={cancelImport}>Hủy</button></div>}
          {importDecodeProblem&&selectedImportFile&&<ProjectImportReview problem={importDecodeProblem} originalFile={selectedImportFile} fileName={selectedImportFile.name} onDownloadOriginal={file=>void downloadOriginalImport(file)} onCancel={cancelImport}/>}
          {importPreview&&<><ProjectImportReview preview={importPreview} fileName={selectedImportFile?.name??''} importName={importName} importNameError={importNameError} onNameChange={name=>{setImportName(name);setImportNameError('')}} onSave={saveImportedProject} onCancel={cancelImport} headingRef={previewHeading} nameInputRef={importNameInput}/>{typeof importPreview.bundle.workspace.projectId === 'string' && savedProjects.some(project=>project.bundle.workspace.projectId===importPreview.bundle.workspace.projectId)&&<small>Thư viện đã có bản cùng nguồn. Mục mới sẽ được lưu riêng.</small>}</>}
        </div>
        {savedProjects.length===0?<p className="saved-projects-empty">Chưa có project cá nhân. Mở bàn lắp mạch, nhập tên project rồi chọn “Lưu project”.</p>:<>
          <div className="saved-project-tools"><label htmlFor="saved-project-search">Tìm project</label><input id="saved-project-search" type="search" value={projectSearch} onChange={event=>setProjectSearch(event.target.value)} placeholder="Tên, bài học hoặc nhãn…"/><span>{visibleSavedProjects.length}/{savedProjects.length}</span></div>
          {visibleSavedProjects.length===0?<p className="saved-projects-empty" role="status">Không tìm thấy project phù hợp. Thử tên bài học hoặc một nhãn khác.</p>:<div className="saved-project-list">{visibleSavedProjects.map(project=><article className="saved-project-card" key={project.id}><div><strong>{project.name}</strong><small>{new Date(project.updatedAt).toLocaleString('vi-VN')} · {getProjectLessonLabel(project.bundle.workspace.lesson)} · {project.revisions.length} bản cũ</small>{project.tags.length>0&&<div className="saved-project-tags" aria-label="Nhãn project">{project.tags.map(tag=><span key={tag}>{tag}</span>)}</div>}</div><div><button type="button" onClick={()=>openSavedProject(project)}>Mở</button><button type="button" onClick={()=>exportSavedProject(project)}>Xuất tệp</button><button type="button" onClick={()=>duplicateProject(project)}>Tạo project độc lập</button><button type="button" onClick={()=>editProjectTags(project)}>Nhãn</button><button type="button" onClick={()=>renameProject(project)}>Đổi tên</button><button type="button" className="saved-project-delete" onClick={()=>deleteSavedProject(project)}>Xóa</button></div>{project.revisions.length>0&&<details className="saved-project-history"><summary>Lịch sử snapshot · giữ tối đa 10 bản</summary>{project.revisions.map((revision,index)=><div key={revision.id}><span>{new Date(revision.updatedAt).toLocaleString('vi-VN')} · Bản {project.revisions.length-index}</span><button type="button" onClick={()=>openSavedProject(project,revision.id)}>Khôi phục bản này</button></div>)}</details>}</article>)}</div>}
        </>}
      </section>
      <div className="project-list">
        {projects.map(project => <article className={`project-card-ready ${project.ready ? 'project-card-featured' : ''}`} key={project.id}>
          <div className="project-card-index">{project.id}<span>{project.level}</span></div>
          <div className="project-card-copy">
            <h2>{project.title}</h2><p>{project.summary}</p>
            <div className="project-tags"><span>{project.parts}</span></div>
            <CapabilityBadge className={`project-capability-badge project-capability-${project.curriculum.simulationMode}`} id={project.curriculum.simulationMode === 'code-subset' ? 'behavior-simulation' : 'concept-illustration'} />
            <small className="project-capability">{project.status}</small>
            <details className="project-lesson-details"><summary>Mục tiêu, an toàn và cách tự kiểm tra</summary><div><p><b>Board:</b> {project.curriculum.boardProfile}</p><p><b>Chuẩn bị:</b> {project.curriculum.prerequisites.join(' · ')}</p><p><b>Các bước:</b> {project.curriculum.guidedSteps.join(' → ')}</p><p><b>Thử gỡ lỗi:</b> {project.curriculum.debugChallenge}</p><p><b>An toàn:</b> {project.curriculum.safetyNotes.join(' ')}</p><p><b>Sang phần cứng thật:</b> {project.curriculum.hardwareTransition}</p></div></details>
          </div>
          <Link className={project.ready ? 'button-primary' : 'button-secondary'} to={productRoute(project.href)}>{project.action} ↗</Link>
        </article>)}
      </div>
      <section className="project-scope-note"><strong>Phạm vi mô phỏng · 11 bài</strong><p>8 bài dùng parser Arduino subset (6 mẫu cú pháp, gồm bài biến trở và LDR); 3 bài nguồn/motor/MOSFET dùng kịch bản khái niệm cố định. Biến trở nhận đầu vào ảo chuẩn hóa 0–100. Bài LDR tính Vout từ bộ chia áp giáo dục với điện trở giả định; không tính lux, đặc tuyến cảm biến thật hay số đếm ADC vật lý và không xác nhận mạch thật.</p><div className="project-reference-topics"><b>Chủ đề analog đang mô phỏng / còn tham khảo</b>{referenceOnlyTopics.map(topic=><span key={topic.id}>{topic.title}: {topic.status}</span>)}</div></section>
    </section>
  </div>
}
