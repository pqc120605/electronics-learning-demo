import {useEffect,useMemo,useRef,useState,type FormEvent} from 'react'
import {useLocation} from 'react-router-dom'
import {developerProfile} from '../data/developerProfile'
import {FEEDBACK_DRAFT_KEY,emptyFeedbackDraft,feedbackFilename,feedbackKinds,feedbackLimits,formatFeedback,parseFeedbackDraft,safeFeedbackPage,validateFeedback,type FeedbackDraft,type FeedbackErrors} from '../lib/feedbackDraft'
import './FeedbackPage.css'

function readDraft(){
  try{const raw=window.sessionStorage.getItem(FEEDBACK_DRAFT_KEY);return {raw,parsed:parseFeedbackDraft(raw),available:true}}
  catch{return {raw:null,parsed:null,available:false}}
}
function downloadText(text:string,name:string,type='text/markdown;charset=utf-8'){
  const url=URL.createObjectURL(new Blob([text],{type})),link=document.createElement('a')
  link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}

export function FeedbackPage(){
 const location=useLocation()
 const [stored]=useState(readDraft)
 const [draft,setDraft]=useState<FeedbackDraft>(()=>stored.parsed??emptyFeedbackDraft(typeof location.state?.from==='string'?safeFeedbackPage(location.state.from):''))
 const [view,setView]=useState<'form'|'preview'>('form'),[errors,setErrors]=useState<FeedbackErrors>({}),[notice,setNotice]=useState('')
 const [storageState,setStorageState]=useState(stored.raw&&!stored.parsed?'unreadable':stored.available?'tab':'memory')
 const touched=useRef(false),previewTitle=useRef<HTMLHeadingElement>(null),preview=useRef<HTMLTextAreaElement>(null)
 const valid=Object.keys(validateFeedback(draft)).length===0
 const report=useMemo(()=>formatFeedback(draft),[draft])
 useEffect(()=>{
  if(!touched.current||storageState==='unreadable')return
  try{const storage=window.sessionStorage,raw=JSON.stringify(draft);storage.setItem(FEEDBACK_DRAFT_KEY,raw);if(storage.getItem(FEEDBACK_DRAFT_KEY)!==raw)throw Error('write not retained');setStorageState('tab')}
  catch{setStorageState('memory')}
 },[draft,storageState])
 useEffect(()=>{if(view==='preview')previewTitle.current?.focus()},[view])
 useEffect(()=>{if(location.hash!=='#nguoi-phat-trien')return;const timer=setTimeout(()=>{const section=document.getElementById('nguoi-phat-trien');section?.scrollIntoView({block:'start'});document.getElementById('feedback-developer-title')?.focus({preventScroll:true})},0);return()=>clearTimeout(timer)},[location.hash])
 function update(patch:Partial<FeedbackDraft>){touched.current=true;setDraft(current=>({...current,...patch}));setNotice('')}
 function review(event:FormEvent){event.preventDefault();const next=validateFeedback(draft);setErrors(next);if(Object.keys(next).length){document.getElementById(`feedback-${Object.keys(next)[0]}`)?.focus();return}setView('preview')}
 async function copy(){
  try{if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');await navigator.clipboard.writeText(report);setNotice('Đã sao chép nội dung. Góp ý chưa được gửi.')}
  catch{preview.current?.focus();preview.current?.select();setNotice('Nội dung đã được chọn. Dùng lệnh Sao chép của trình duyệt hoặc tải file; góp ý chưa được gửi.')}
 }
 const field=(name:keyof typeof feedbackLimits,label:string,rows=3)=>{
  const required=name==='title'||name==='details'
  const props={
   id:`feedback-${name}`,
   value:draft[name],
   required,
   maxLength:feedbackLimits[name],
   onChange:(event:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>update({[name]:event.target.value}),
   'aria-invalid':Boolean(errors[name]),
   'aria-describedby':errors[name]?`feedback-${name}-error`:undefined,
  }
  // Keep input values and validation messages out of the accessible name.
  return <div className="feedback-field" key={name}>
   <label htmlFor={props.id}>{label}{required&&' *'}</label>
   {name==='title'||name==='page'
    ?<input {...props} placeholder={name==='page'?'/build/freestyle':undefined}/>
    :<textarea {...props} rows={rows}/>}
   {errors[name]&&<small id={`feedback-${name}-error`} className="feedback-error">{errors[name]}</small>}
  </div>
 }
 return <article className="feedback-page">
  <header className="feedback-heading"><div><p className="feedback-kicker">Cùng xây dựng Mạch Mở</p><h1>Góp ý & báo lỗi</h1><p>Ghi lại điều khiến bạn vướng mắc, hoặc một ý tưởng giúp việc học và lắp mạch dễ hơn.</p></div><div className="feedback-local-badge"><span aria-hidden="true">●</span> Chưa gửi<p>Bạn có thể xem lại, sao chép và tải file. Form này chưa tự gửi nội dung tới người phát triển.</p></div></header>
  <div className="feedback-mobile-tabs" role="group" aria-label="Chế độ xem góp ý"><button type="button" aria-pressed={view==='form'} onClick={()=>setView('form')}>Viết góp ý</button><button type="button" aria-pressed={view==='preview'} onClick={()=>setView('preview')}>Xem bản góp ý</button></div>
  <div className="feedback-layout" data-view={view}>
   <form className="feedback-form" onSubmit={review} noValidate aria-label="Nội dung góp ý">
    <fieldset><legend>Bạn muốn chia sẻ điều gì?</legend><div className="feedback-kind-options">{feedbackKinds.map(kind=><label key={kind.id}><input id={`feedback-kind-${kind.id}`} type="radio" name="feedback-kind" value={kind.id} checked={draft.kind===kind.id} onChange={()=>update({kind:kind.id})}/><span>{kind.label}</span></label>)}</div></fieldset>
    {field('title','Tiêu đề',1)}{field('details','Mô tả của bạn',6)}{field('page','Trang liên quan (không bắt buộc)',1)}
    {draft.kind==='bug'&&<details className="feedback-more"><summary>Thêm chi tiết để dễ tái hiện lỗi</summary>{field('steps','Bạn đã làm những bước nào?')}{field('expected','Bạn mong đợi điều gì?')}{field('actual','Thực tế đã xảy ra điều gì?')}</details>}
    <p className="feedback-storage" role="status">{storageState==='unreadable'?'Có bản nháp cũ chưa đọc được. Bản gốc được giữ nguyên; nội dung mới chỉ ở trong phiên này.':storageState==='memory'?'Trình duyệt chưa lưu được nháp. Bạn vẫn có thể hoàn thiện và tải file.':'Nháp được giữ trong tab này. Đóng tab có thể mất nháp; tải file để giữ riêng.'}</p>
    {storageState==='unreadable'&&stored.raw&&<button type="button" className="feedback-secondary" onClick={()=>downloadText(stored.raw!,'mach-mo-feedback-original.json','application/json')}>Tải nguyên bản nháp cũ</button>}
    <button type="submit" className="feedback-primary">Xem lại nội dung</button>
   </form>
   <div className="feedback-side">
    <section className="feedback-preview" aria-labelledby="feedback-preview-title"><h2 ref={previewTitle} tabIndex={-1} id="feedback-preview-title">Bản góp ý của bạn</h2><p>{valid?'Bạn có thể giữ bản này dưới dạng file hoặc sao chép.':'Điền tiêu đề và mô tả để chuẩn bị file góp ý.'}</p><textarea ref={preview} readOnly value={report} aria-label="Bản góp ý xem trước" rows={12}/><div className="feedback-export-actions"><button type="button" className="feedback-primary" disabled={!valid} onClick={()=>{downloadText(report,feedbackFilename());setNotice('Đã chuẩn bị file tải xuống. Góp ý chưa được gửi.')}}>Tải file góp ý (.md)</button><button type="button" className="feedback-secondary" disabled={!valid} onClick={copy}>Sao chép</button></div><p className="feedback-result" role="status">{notice}</p></section>
    <section id="nguoi-phat-trien" className="feedback-developer" aria-labelledby="feedback-developer-title"><div className="feedback-person"><span className="feedback-monogram" aria-hidden="true">CP</span><div><h2 tabIndex={-1} id="feedback-developer-title">Người phát triển</h2><h3>{developerProfile.name}</h3><p>Mạch Mở</p></div></div><p>Thông tin liên hệ của người phát triển, để bạn tìm hiểu thêm về người đang xây dựng Mạch Mở.</p><dl><div><dt>Gmail</dt><dd><a href={`mailto:${developerProfile.email}`}>{developerProfile.email}</a></dd></div><div><dt>Facebook</dt><dd><a href={developerProfile.facebook} target="_blank" rel="noreferrer noopener">Facebook của Chiến Phan</a></dd></div><div><dt>Portfolio</dt><dd><a href={developerProfile.portfolio} target="_blank" rel="noreferrer noopener">phanquocchien.vercel.app</a></dd></div></dl></section>
   </div>
  </div>
 </article>
}
