export const FEEDBACK_DRAFT_KEY = 'machmo-feedback-draft-v1'
export const feedbackKinds = [{id:'bug',label:'Báo lỗi'},{id:'idea',label:'Góp ý tính năng'},{id:'content',label:'Góp ý bài học'}] as const
export type FeedbackKind = typeof feedbackKinds[number]['id']
export type FeedbackDraft = {version:1;kind:FeedbackKind;title:string;details:string;steps:string;expected:string;actual:string;page:string}
export type FeedbackErrors = Partial<Record<Exclude<keyof FeedbackDraft,'version'>,string>>
export const feedbackLimits = {title:160,details:5000,steps:3000,expected:1500,actual:1500,page:180} as const
export function safeFeedbackPage(value:string):string {
  if(!value.startsWith('/')||value.startsWith('//'))return ''
  try{const url=new URL(value,'https://machmo.invalid');return url.origin==='https://machmo.invalid'&&url.pathname.length<=feedbackLimits.page?url.pathname:''}catch{return ''}
}
export function emptyFeedbackDraft(page=''):FeedbackDraft {return {version:1,kind:'bug',title:'',details:'',steps:'',expected:'',actual:'',page:safeFeedbackPage(page)}}
export function validateFeedback(value:Partial<FeedbackDraft>|null|undefined):FeedbackErrors {
  const errors:FeedbackErrors={}
  if(!feedbackKinds.some(kind=>kind.id===value?.kind))errors.kind='Chọn loại góp ý.'
  if(typeof value?.title!=='string'||value.title.trim().length<3)errors.title='Nhập tiêu đề ít nhất 3 ký tự.'
  if(typeof value?.details!=='string'||value.details.trim().length<10)errors.details='Mô tả thêm một chút, ít nhất 10 ký tự.'
  for(const [key,max] of Object.entries(feedbackLimits) as Array<[keyof typeof feedbackLimits,number]>){
    if(typeof value?.[key]!=='string')errors[key]='Nội dung cần là văn bản.'
    else if(value[key].length>max)errors[key]=`Tối đa ${max} ký tự.`
  }
  if(value?.page&&safeFeedbackPage(value.page)!==value.page)errors.page='Dùng đường dẫn trong Mạch Mở, ví dụ /build/freestyle; không kèm phần sau dấu ?.'
  return errors
}
/** Incomplete drafts are allowed; unknown versions/fields remain unreadable originals, never migrated silently. */
export function parseFeedbackDraft(raw:string|null):FeedbackDraft|null {
  if(!raw||raw.length>20000)return null
  try{
    const value=JSON.parse(raw) as FeedbackDraft
    const keys=['version','kind',...Object.keys(feedbackLimits)]
    if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1||Object.keys(value).some(key=>!keys.includes(key))||Object.keys(value).length!==keys.length)return null
    if(!feedbackKinds.some(kind=>kind.id===value.kind))return null
    for(const [key,max] of Object.entries(feedbackLimits) as Array<[keyof typeof feedbackLimits,number]>)if(typeof value[key]!=='string'||value[key].length>max)return null
    if(value.page&&safeFeedbackPage(value.page)!==value.page)return null
    return value
  }catch{return null}
}
function textBlock(value:string):string {
  const runs=value.match(/`+/g)??[],fence='`'.repeat(Math.max(3,...runs.map(run=>run.length+1)))
  return `${fence}text\n${value.trim()||'(chưa điền)'}\n${fence}`
}
export function formatFeedback(draft:FeedbackDraft,createdAt=new Date().toISOString(),includeUnsentStatus=true):string {
  const kind=feedbackKinds.find(kind=>kind.id===draft.kind)?.label??'Góp ý'
  const status=includeUnsentStatus?'Trạng thái: Chưa gửi — file được tạo trên thiết bị.\n':''
  return `# Góp ý Mạch Mở\n\n${status}Ngày tạo: ${createdAt}\nLoại: ${kind}\nTrang liên quan: ${safeFeedbackPage(draft.page)||'(chưa chọn)'}\n\n## Tiêu đề\n${textBlock(draft.title)}\n\n## Mô tả\n${textBlock(draft.details)}\n${draft.kind==='bug'?`\n## Các bước gặp lỗi\n${textBlock(draft.steps)}\n\n## Mong đợi\n${textBlock(draft.expected)}\n\n## Thực tế\n${textBlock(draft.actual)}\n`:''}`
}
export function feedbackFilename(at=new Date().toISOString()):string {
  const date=new Date(at)
  return Number.isNaN(date.getTime())?'mach-mo-gop-y.md':`mach-mo-gop-y-${date.toISOString().replace(/[^A-Za-z0-9._-]/g,'-')}.md`
}
