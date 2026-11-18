import type { CircuitGateReport, CircuitGateId, CircuitDiagnosticAction } from '../../lib/circuitGates'
import { presentCircuitGateReport } from '../../lib/circuitGatePresentation'
import './CircuitGatePanel.css'

export function CircuitGatePanel({ report, onInspect }: { report: CircuitGateReport; onInspect?: (gateId: CircuitGateId, action: CircuitDiagnosticAction) => void }) {
  const presentation = presentCircuitGateReport(report)
  const { summary } = presentation

  return <section className="circuit-gate-panel" aria-labelledby="circuit-gate-title">
    <h2 id="circuit-gate-title">Kiểm tra mạch</h2>
    <p className="circuit-gate-scope">{presentation.scopeNote}</p>
    <p className="circuit-gate-summary" role="status" aria-live="polite" aria-atomic="true" data-overall={summary.overall}>
      {summary.passed} nhóm đạt · {summary.failed} lỗi · {summary.warnings} lưu ý · {summary.notApplicable} không áp dụng
    </p>
    <ul className="circuit-gate-list">
      {presentation.gates.map(gate => <li key={gate.id} data-status={gate.status}>
        <details open={gate.status === 'fail' || gate.status === 'warning'}>
          <summary>
            <span className="circuit-gate-id">{gate.id}</span>
            <span className="circuit-gate-title">{gate.title}</span>
            <span className="circuit-gate-status">{gate.statusLabel}</span>
          </summary>
          {gate.diagnostics.length
            ? <ul className="circuit-gate-diagnostics">{gate.diagnostics.map((diagnostic, index) => <li key={`${gate.id}-${index}`}><span>{diagnostic}</span>{gate.diagnosticActions?.filter(action => action.diagnosticIndex === index).map((action, actionIndex) => <div className="circuit-diagnostic-action" key={actionIndex}>
              <p>{action.nextStep}</p>
              {onInspect && <button type="button" data-diagnostic-target={action.target.kind} onClick={() => onInspect(gate.id, action)}>{action.target.kind === 'endpoint' ? 'Xem chân' : action.target.kind === 'wire' ? 'Xem dây' : 'Xem linh kiện'}</button>}
            </div>)}</li>)}</ul>
            : <p className="circuit-gate-empty">{gate.emptyNote}</p>}
        </details>
      </li>)}
    </ul>
  </section>
}
