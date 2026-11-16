export interface CommunityAttachmentStore {
  put(id: string, blob: Blob): Promise<void>
  get(id: string): Promise<Blob | null>
  remove(id: string): Promise<void>
}
/** Resolve on commit, never merely request success. No silent memory fallback. */
export function createAttachmentStore(factory?: IDBFactory): CommunityAttachmentStore {
  async function open(): Promise<IDBDatabase> {
    let availableFactory: IDBFactory | undefined
    try { availableFactory = factory ?? globalThis.indexedDB } catch { /* Denied getters must not prevent page load. */ }
    if (!availableFactory) throw new Error('IndexedDB không khả dụng; tệp chỉ còn trong bộ nhớ biểu mẫu. Chưa lưu bài.')
    return new Promise((resolve, reject) => {
      const request = availableFactory.open('mach-mo-community-attachments-v1', 1)
      let blocked = false
      request.onupgradeneeded = () => request.result.createObjectStore('blobs')
      request.onerror = () => reject(new Error('Không mở được kho tệp trên thiết bị. Chưa lưu bài.'))
      request.onblocked = () => { blocked = true; reject(new Error('Kho tệp bị chặn bởi tab khác. Đóng tab cũ rồi thử lại.')) }
      request.onsuccess = () => {
        if (blocked) { request.result.close(); return }
        request.result.onversionchange = () => request.result.close()
        resolve(request.result)
      }
    })
  }
  async function run<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await open()
    return new Promise((resolve, reject) => {
      let result: T
      const tx = db.transaction('blobs', mode)
      const fail = () => { db.close(); reject(new Error('Không lưu/đọc được tệp (quota hoặc giao dịch bị huỷ). Tệp vẫn còn trong biểu mẫu nếu chưa rời trang.')) }
      tx.onabort = fail
      tx.onerror = fail
      tx.oncomplete = () => { db.close(); resolve(result) }
      try { const request = operation(tx.objectStore('blobs')); request.onsuccess = () => { result = request.result } } catch { tx.abort(); fail() }
    })
  }
  return {
    async put(id, blob) { await run('readwrite', s => s.put(blob, id)) },
    async get(id) { return (await run('readonly', s => s.get(id))) as Blob | undefined ?? null },
    async remove(id) { await run('readwrite', s => s.delete(id)) },
  }
}
export const communityAttachmentStore = createAttachmentStore()
