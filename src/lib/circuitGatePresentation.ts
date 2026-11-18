import type { CircuitGateId, CircuitGateReport, CircuitGateStatus } from './circuitGates'

const gateTitles: Record<CircuitGateId, string> = {
  G1: 'Cấu trúc mạch',
  G2: 'Linh kiện và hình học tham chiếu',
  G3: 'Chân linh kiện được khai báo',
  G4: 'Lỗ và điểm nối hợp lệ',
  G5: 'Vị trí linh kiện không chồng lấn',
  G6: 'Dây có đường đi hợp lệ',
  G7: 'Chân hở có lý do',
  G8: 'Nguồn và mass',
  G9: 'Phân tích mạch analog',
  G10: 'Khớp vị trí chân giữa 2D và 3D',
}

const statusLabels: Record<CircuitGateStatus, string> = {
  pass: 'Đạt trong mô hình',
  fail: 'Cần sửa',
  warning: 'Cần lưu ý',
  not_applicable: 'Không áp dụng',
}

function emptyNote(id: CircuitGateId, status: CircuitGateStatus): string {
  if (status === 'pass') return 'Không phát hiện vấn đề trong phạm vi kiểm tra này.'
  if (status === 'fail') return 'Xem các lỗi bên dưới rồi sửa mạch trước khi chạy lại.'
  if (status === 'not_applicable' && id === 'G9') return 'Bài này không có phân tích analog cần chuyển sang SPICE.'
  if (status === 'warning') return 'Có dữ liệu tham chiếu chưa được xác thực; không xem đây là kết quả đo.'
  return 'Cổng này chưa áp dụng cho cấu hình hiện tại.'
}

export function presentCircuitGateReport(report: CircuitGateReport) {
  const counts = {
    applicable: report.gates.filter(gate => gate.status !== 'not_applicable').length,
    passed: report.gates.filter(gate => gate.status === 'pass').length,
    failed: report.gates.filter(gate => gate.status === 'fail').length,
    warnings: report.gates.filter(gate => gate.status === 'warning').length,
    notApplicable: report.gates.filter(gate => gate.status === 'not_applicable').length,
  }

  const overall = counts.failed > 0 ? 'fail' : counts.warnings > 0 ? 'warning' : 'pass'

  return {
    summary: { ...counts, overall },
    scopeNote: 'Kiểm tra cấu trúc, topology và hình học tham chiếu; không phải phép đo điện hay xác nhận phần cứng thật.',
    gates: report.gates.map(gate => ({
      id: gate.id,
      title: gateTitles[gate.id],
      status: gate.status,
      statusLabel: statusLabels[gate.status],
      diagnostics: [...gate.diagnostics],
      diagnosticActions: gate.diagnosticActions?.map(action => ({ ...action, target: structuredClone(action.target) })),
      emptyNote: emptyNote(gate.id, gate.status),
    })),
  }
}
