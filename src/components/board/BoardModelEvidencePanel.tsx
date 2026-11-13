import type { BoardModelEvidence } from './boardSceneTypes'
import { CapabilityBadge } from '../CapabilityBadge'

type BoardModelEvidencePanelProps = {
  evidence?: BoardModelEvidence
  className?: string
}

export function BoardModelEvidencePanel({ evidence, className = '' }: BoardModelEvidencePanelProps) {
  if (!evidence) {
    return <section className={`board-evidence-panel board-evidence-missing ${className}`} aria-label="Trạng thái model board">
      <CapabilityBadge id="model-not-available" />
      <p>Chưa có hồ sơ nguồn để xác nhận hình học hoặc quyền phân phối model này.</p>
    </section>
  }

  const published = evidence.published && evidence.status !== 'preview-only'
  return <section className={`board-evidence-panel ${published ? 'board-evidence-published' : 'board-evidence-preview'} ${className}`} aria-label="Nguồn và độ tin cậy model">
    <div className="board-evidence-heading">
      <CapabilityBadge id={published ? 'cad-reference' : 'model-not-available'} />
      <span>{published ? 'Model tham khảo' : 'Chỉ thông tin tham khảo'}</span>
    </div>
    <dl>
      <dt>Board / revision</dt><dd>{evidence.revision}</dd>
      <dt>Nguồn và giấy phép</dt><dd><a href={evidence.sourceUrl} target="_blank" rel="noreferrer">{evidence.attribution}</a><br />{evidence.licenseName}{evidence.noticeUrl && <><br /><a href={evidence.noticeUrl} target="_blank" rel="noreferrer">Tệp ghi công và giấy phép ↗</a></>}</dd>
      <dt>Mức độ xác nhận</dt><dd>{evidence.confidenceNote}</dd>
      {evidence.unresolvedIssues.length > 0 && <><dt>Cần lưu ý</dt><dd><ul>{evidence.unresolvedIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul></dd></>}
    </dl>
    {!published && <p className="board-evidence-caveat">Model 3D tương tác chưa được phát hành cho board này.</p>}
  </section>
}
