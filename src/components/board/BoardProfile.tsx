import { useState } from 'react'
import type { BoardSummary } from '../../data/boards'
import { getBoardCapability, getBoardSupportSummary } from '../../data/boardCapabilityRegistry'

/** Profile of one board; it stands on its own when no 3D viewer exists. */
export function BoardProfile({ board }: { board: BoardSummary }) {
  const support = getBoardSupportSummary(board.id)
  const pinout = Object.entries(getBoardCapability(board.id).pinMap)
    .filter(([key, pin]) => /^[da]\d+$/.test(key) && pin.sourceBacked)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  const [failedPhotos, setFailedPhotos] = useState<string[]>([])
  const referenceLinks = [
    ...(board.referenceDocs ?? []),
    ...(board.sourceUrl ? [{ label: 'Trang nguồn board', url: board.sourceUrl }] : []),
    ...(board.sourceEvidenceUrl && board.sourceEvidenceUrl !== board.sourceUrl
      ? [{ label: 'Tài liệu dùng để đối chiếu', url: board.sourceEvidenceUrl }]
      : []),
  ].filter((link, index, links) => link.url && links.findIndex((candidate) => candidate.url === link.url) === index)
  const rows: Array<[string, string | undefined]> = [
    ['Vi điều khiển', board.mcu],
    ['Revision đối chiếu', board.revision],
    ['Mức logic', board.logicLevel],
    ['Ngoại vi và giao tiếp', board.interfaceSummary],
    ['Phù hợp khi', board.bestFor],
    ['Cần cân nhắc', board.tradeoffs],
    ['Mô hình trong web', support.model],
    ['Pinout trong web', support.pinout],
    ['Phòng thử', support.simulation],
  ]
  return <>
    {board.photos?.length ? <section className="board-reference-photos" aria-label={`Ảnh tham khảo ${board.name}`}>
      <h3>Ảnh board tham khảo</h3>
      <div className="board-reference-photo-grid">{board.photos.map((photo) => <figure key={`${photo.src}:${photo.sourceUrl}`}>
        {failedPhotos.includes(photo.sourceUrl)
          ? <div className="board-reference-photo-fallback" role="img" aria-label={photo.alt}>Ảnh tham khảo hiện không tải được</div>
          : <img src={photo.src} alt={photo.alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedPhotos((current) => current.includes(photo.sourceUrl) ? current : [...current, photo.sourceUrl])} />}
        <figcaption><strong>{photo.label}</strong><span>{photo.variantNote}</span><small>Ảnh: {photo.creator} · {photo.license} · {photo.changes} · <a href={photo.sourceUrl} target="_blank" rel="noreferrer">Nguồn ↗</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">Giấy phép ↗</a></small></figcaption>
      </figure>)}</div>
    </section> : null}
    {referenceLinks.length > 0 && <details className="board-reference-documents">
      <summary>Tài liệu, ảnh và nguồn board ({referenceLinks.length})</summary>
      <p>Nguồn giúp đối chiếu đúng sản phẩm và revision. Hình minh họa, CAD hoặc pinout không thay thế phép đo board vật lý.</p>
      <ul aria-label={`Nguồn tham khảo board ${board.name}`}>
        {referenceLinks.map((link) => <li key={link.url}>
          <a href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>
        </li>)}
      </ul>
    </details>}
    <dl className="board-profile">
      {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Chưa có dữ liệu đã xác minh'}</dd></div>)}
      {board.modelNote && <div className="board-profile-wide"><dt>Ghi chú nguồn</dt><dd>{board.modelNote}</dd></div>}
    </dl>
    {board.id === 'seeed-xiao-esp32c3' && pinout.length > 0 && <details className="board-pinout board-profile-pinout">
      <summary>Pinout D0–D10 · theo tài liệu Seeed</summary>
      <div className="board-pinout-grid" aria-label="Bảng chân Seeed XIAO ESP32-C3">
        {pinout.map(([key, pin]) => <span key={key}><b>{key.toUpperCase()}</b> {pin.label}</span>)}
      </div>
      <small>GPIO2 (D0), GPIO8 (D8) và GPIO9 (D9) là chân strapping; tránh kéo sai mức khi khởi động. D3/GPIO5 là ADC2 và hãng lưu ý ADC2 có thể đọc không ổn định; ưu tiên A0–A2 cho phép đo tương tự. GPIO mức 3,3 V. Pinout lấy từ tài liệu Seeed, chưa xác minh trên mẫu vật lý.</small>
    </details>}
  </>
}
