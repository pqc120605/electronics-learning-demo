export type BeginnerActivityId =
  | 'closed-loop'
  | 'breadboard'
  | 'led-polarity'
  | 'button-logic'
  | 'sensor-threshold'

export type BeginnerActivity = {
  id: BeginnerActivityId
  title: string
  goal: string
  instruction: string
  explanationQuestion: string
  explanationChoices: readonly { id: string; label: string }[]
  correctExplanationId: string
  hints: readonly string[]
}

export const BEGINNER_ACTIVITIES: readonly BeginnerActivity[] = [
  {
    id: 'closed-loop',
    title: 'Khép kín đường đi',
    goal: 'Tìm đường đi từ cực dương, qua điện trở và LED, về cực âm.',
    instruction: 'Dự đoán LED khi dây hồi đang hở. Quan sát, rồi nối lại dây hồi và dự đoán lần nữa.',
    explanationQuestion: 'Vì sao LED tắt khi ngắt dây hồi?',
    explanationChoices: [
      { id: 'loop-return', label: 'Đường đi qua LED về cực âm bị hở nên mạch chưa khép kín.' },
      { id: 'one-wire', label: 'Chỉ cần nối cực dương tới LED là đủ để LED sáng.' },
      { id: 'ground-consumes', label: 'Cực âm đã dùng hết điện của nguồn.' },
    ],
    correctExplanationId: 'loop-return',
    hints: [
      'Tìm dây từ cathode LED quay về nguồn.',
      'Một mạch kín cần cả đường đi và đường hồi. Trong mẫu này, cực âm là điểm tham chiếu.',
      'Khi dây hồi hở, đường qua điện trở và LED bị ngắt. Nối lại đúng dây để khép kín đường đi.',
    ],
  },
  {
    id: 'breadboard',
    title: 'Đọc dải nối breadboard',
    goal: 'Phân biệt một dải năm lỗ và hai nửa cách nhau bởi rãnh giữa.',
    instruction: 'So sánh 10a với 10e, rồi 10e với 10f. Dự đoán mỗi cặp có nối nội bộ trong mô hình hay không.',
    explanationQuestion: 'Quy tắc nào đúng với mô hình breadboard này?',
    explanationChoices: [
      { id: 'strip-five', label: 'a–e cùng cột nối nhau; f–j cùng cột nối nhau; rãnh giữa tách hai nửa.' },
      { id: 'all-row', label: 'Tất cả các lỗ trên một hàng chữ đều nối nhau.' },
      { id: 'nearby', label: 'Hai lỗ gần nhau trên hình luôn nối điện với nhau.' },
    ],
    correctExplanationId: 'strip-five',
    hints: [
      'Tìm chữ a–j và số cột 10.',
      '10a và 10e nằm cùng nửa. 10e và 10f nằm hai phía rãnh giữa.',
      'Trong mô hình hiện tại, dải 10a–10e là một nút, dải 10f–10j là nút khác.',
    ],
  },
  {
    id: 'led-polarity',
    title: 'Đặt LED đúng chiều',
    goal: 'Nhận biết anode, cathode và vai trò điện trở nối tiếp.',
    instruction: 'Giữ đường hồi kín. Quan sát LED đúng chiều và đảo chiều. Thử bỏ điện trở để xem điều kiện còn thiếu.',
    explanationQuestion: 'Mạch LED mẫu cần điều kiện nào?',
    explanationChoices: [
      { id: 'series-polarity', label: 'LED có đúng chiều phân cực và điện trở hạn dòng nằm nối tiếp trên đường đi.' },
      { id: 'either-way', label: 'LED sáng giống nhau ở cả hai chiều.' },
      { id: 'direct-source', label: 'Có thể bỏ điện trở và nối LED thẳng vào nguồn.' },
    ],
    correctExplanationId: 'series-polarity',
    hints: [
      'Tìm nhãn anode (+) và cathode (−) trên LED.',
      'Điện trở nối tiếp giới hạn dòng trong mạch thật. Đảo LED làm đổi chiều phân cực.',
      'Khôi phục điện trở và đặt anode phía điện trở, cathode phía dây hồi để hoàn thành mạch mẫu.',
    ],
  },
  {
    id: 'button-logic',
    title: 'Đọc nút và lần theo code',
    goal: 'Lần theo INPUT_PULLUP từ mức đọc, điều kiện if/else tới LED.',
    instruction: 'Chọn board. Dự đoán khi thả và nhấn nút, rồi thử đảo điều kiện LOW thành HIGH lúc đang nhấn.',
    explanationQuestion: 'Khi dùng INPUT_PULLUP trong mẫu này, nhấn nút tác động thế nào?',
    explanationChoices: [
      { id: 'pullup-low', label: 'Nút nối đầu vào về GND nên đọc LOW; điều kiện trong code quyết định LED sáng hay tắt.' },
      { id: 'pressed-high', label: 'Nhấn nút luôn tạo HIGH dù cấu hình đầu vào thế nào.' },
      { id: 'no-code', label: 'LED luôn theo nút và không phụ thuộc nhánh trong code.' },
    ],
    correctExplanationId: 'pullup-low',
    hints: [
      'Xem dòng pinMode(buttonPin, INPUT_PULLUP).',
      'Thả nút đọc HIGH, nhấn nút đọc LOW. Sau đó xem code đang so sánh với LOW hay HIGH.',
      'Với điều kiện LOW, nhấn đi vào nhánh bật LED. Đổi thành HIGH thì cùng thao tác nhấn đi vào nhánh tắt LED.',
    ],
  },
  {
    id: 'sensor-threshold',
    title: 'Thử sát ngưỡng cảm biến',
    goal: 'Kiểm tra ba trường hợp dưới, bằng và trên ngưỡng trong code.',
    instruction: 'Dự đoán ba giá trị quanh ngưỡng. Đổi ngưỡng và thử lại để quan sát quyết định của chương trình.',
    explanationQuestion: 'Với điều kiện potPercent > ngưỡng, giá trị bằng ngưỡng cho kết quả gì?',
    explanationChoices: [
      { id: 'strict-boundary', label: 'Điều kiện sai khi bằng ngưỡng; chỉ giá trị lớn hơn mới đi vào nhánh bật LED.' },
      { id: 'equal-on', label: 'Bằng ngưỡng cũng thỏa dấu > và bật LED.' },
      { id: 'always-on', label: 'Có cảm biến thì LED luôn sáng.' },
    ],
    correctExplanationId: 'strict-boundary',
    hints: [
      'Xem dấu so sánh trong dòng if.',
      'Dấu > yêu cầu lớn hơn hẳn. Giá trị bằng ngưỡng cần được thử riêng.',
      'Thử ngưỡng−1, ngưỡng và ngưỡng+1. Mẫu này cho LED tắt, tắt, sáng tương ứng.',
    ],
  },
]

export function getBeginnerActivity(id: string): BeginnerActivity {
  return BEGINNER_ACTIVITIES.find(activity => activity.id === id) ?? BEGINNER_ACTIVITIES[0]
}
