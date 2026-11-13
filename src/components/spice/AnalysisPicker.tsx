import { useMemo, useState } from 'react'
import { setWorkspaceSpiceAnalysis, type WorkspaceSpiceAnalysis, type WorkspaceSpiceAnalysisResult } from '../../lib/workspaceSpice'

type Props = { netlist: string; onNetlistChange: (result: WorkspaceSpiceAnalysisResult) => void }

function firstVoltageSource(netlist: string): string {
  return netlist.split(/\r?\n/).map(line => /^\s*(V[A-Za-z0-9_.-]+)\s+/i.exec(line)?.[1]).find(Boolean) ?? 'V1'
}

export function AnalysisPicker({ netlist, onNetlistChange }: Props) {
  const defaultSource = useMemo(() => firstVoltageSource(netlist), [netlist])
  const [analysis, setAnalysis] = useState<WorkspaceSpiceAnalysis>({ kind: 'op' })
  const [issues, setIssues] = useState<string[]>([])

  function apply(next: WorkspaceSpiceAnalysis) {
    setAnalysis(next)
    const result = setWorkspaceSpiceAnalysis(netlist, next)
    setIssues(result.ok ? [] : result.issues)
    onNetlistChange(result)
  }

  return <fieldset className="spice-workspace-analysis">
    <legend>Phân tích mạch workspace</legend>
    <label htmlFor="workspace-spice-analysis-kind">Kiểu phân tích</label>
    <select id="workspace-spice-analysis-kind" value={analysis.kind} onChange={event => {
      const kind = event.target.value
      apply(kind === 'tran' ? { kind, step: '1 ms', stop: '1 s' } : kind === 'dc' ? { kind, source: defaultSource, start: '0 V', stop: '5 V', step: '0.05 V' } : { kind: 'op' })
    }}>
      <option value="op">Điểm làm việc · .op</option>
      <option value="tran">Theo thời gian · .tran</option>
      <option value="dc">Quét nguồn DC · .dc</option>
    </select>
    {analysis.kind === 'tran' && <div className="spice-workspace-analysis-fields">
      <label>Bước thời gian<input aria-label="Bước thời gian" value={analysis.step} onChange={event => apply({ ...analysis, step: event.target.value })} /></label>
      <label>Thời điểm dừng<input aria-label="Thời điểm dừng" value={analysis.stop} onChange={event => apply({ ...analysis, stop: event.target.value })} /></label>
    </div>}
    {analysis.kind === 'dc' && <div className="spice-workspace-analysis-fields">
      <label>Nguồn áp<input aria-label="Nguồn áp cần quét" value={analysis.source} onChange={event => apply({ ...analysis, source: event.target.value })} /></label>
      <label>Bắt đầu<input aria-label="Giá trị bắt đầu quét" value={analysis.start} onChange={event => apply({ ...analysis, start: event.target.value })} /></label>
      <label>Kết thúc<input aria-label="Giá trị kết thúc quét" value={analysis.stop} onChange={event => apply({ ...analysis, stop: event.target.value })} /></label>
      <label>Bước quét<input aria-label="Bước quét DC" value={analysis.step} onChange={event => apply({ ...analysis, step: event.target.value })} /></label>
    </div>}
    {issues.length > 0 && <p role="alert">{issues.join(' ')}</p>}
    <small>Giới hạn 20.000 điểm. MCU/GPIO và linh kiện chưa có model vẫn bị chặn; chọn .tran hoặc .dc chỉ thay phép phân tích của mạch tương đương.</small>
  </fieldset>
}
