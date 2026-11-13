import type { BoardFeature, BoardPin } from './board/boardSceneTypes'
import type { CircuitPart } from '../data/lessons'
import { getFeatureEvidence } from '../lib/boardFeatureEvidence'

type ComponentDetailsProps = {
  part: CircuitPart | BoardFeature | BoardPin
  /** The part belongs to a board being inspected, not to the lesson circuit. */
  referenceBoard?: boolean
}

export function ComponentDetails({ part, referenceBoard = false }: ComponentDetailsProps) {
  const title = 'name' in part ? part.name : part.label
  const evidence = 'relatedLessonPartIds' in part ? getFeatureEvidence(part).labels : []
  return (
    <section className="component-details" aria-live="polite" aria-atomic="true">
      <div className="details-heading"><span className="details-marker" aria-hidden="true">i</span><div><p>{'gpio' in part ? 'CHÂN ĐANG CHỌN' : referenceBoard ? 'TRÊN BOARD THAM CHIẾU' : 'LINH KIỆN ĐANG CHỌN'}</p><h3>{title}</h3></div></div>
      {evidence.length > 0 && <p className="board-evidence-tags">{evidence.map((label) => <span key={label}>{label}</span>)}</p>}
      <p className="details-plain">{part.plainDescription}</p>
      <dl className="details-list">
        <div><dt>{referenceBoard ? 'Dữ liệu kết nối' : 'Trong mạch này'}</dt><dd>{part.connection}</dd></div>
        <div><dt>Tên kỹ thuật</dt><dd>{part.technicalRole}</dd></div>
        {'cadFootprint' in part && part.cadFootprint && <div><dt>Dữ liệu CAD tham chiếu</dt><dd>{part.cadFootprint.reference} · {part.cadFootprint.value || 'chưa ghi giá trị'} · {part.cadFootprint.footprint || 'footprint chưa ghi'} · {part.cadFootprint.side === 'front' ? 'mặt trên' : 'mặt dưới'} · xoay {part.cadFootprint.rotation}° · {part.cadFootprint.has3dBody ? 'có hình học 3D trong model' : 'chỉ có footprint/pad trong model'}</dd></div>}
        {'placementReason' in part && part.placementReason && <div><dt>Vị trí trên bo mạch</dt><dd>{part.placementReason}{part.placementEvidence === 'cad' ? ' Tọa độ và góc xoay lấy từ CAD; lý do thiết kế riêng không được suy diễn.' : ''}</dd></div>}
        {'roleEvidence' in part && part.roleEvidence === 'unverified' && <div><dt>Trạng thái giải thích</dt><dd>Vị trí/designator có trong CAD tham chiếu; chức năng chưa được đối chiếu với BOM hoặc schematic đáng tin cậy.</dd></div>}
      </dl>
      {'functions' in part && <div className="pin-functions"><span>CHỨC NĂNG CÓ THỂ DÙNG</span><div>{part.functions.map((item) => <small key={item}>{item}</small>)}</div></div>}
      <div className="safety-note"><span aria-hidden="true">!</span><p><strong>Lưu ý an toàn</strong>{part.safetyNote}</p></div>
    </section>
  )
}
