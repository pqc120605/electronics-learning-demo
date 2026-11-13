export type BoardSummary = {
  id: string
  name: string
  description: string
  availability: 'lesson' | 'preview'
  platform?: 'ESP' | 'STM32' | 'Arduino' | 'Raspberry Pi'
  mcu?: string
  revision?: string
  sourceUrl?: string
  sourceEvidenceUrl?: string
  referenceDocs?: Array<{ label: string; url: string }>
  photos?: Array<{ label: string; src: string; alt: string; creator: string; sourceUrl: string; license: string; licenseUrl: string; variantNote: string; changes: string }>
  cadDownloadUrl?: string
  cadDownloadLabel?: string
  cadViewerUrl?: string
  alternateModelUrl?: string
  alternateModelLabel?: string
  modelNote?: string
  logicLevel?: string
  interfaceSummary?: string
  bestFor?: string
  tradeoffs?: string
}

const additionalBoardPhotos: Record<string, NonNullable<BoardSummary['photos']>> = {
  'arduino-uno-r3': [{
    label: 'Mặt sau · ảnh cộng đồng Uno R3',
    src: '/board-reference/arduino-uno-r3-back-reference.jpg',
    alt: 'Mặt sau của một board tương thích Arduino Uno R3, có thể đọc bố trí linh kiện và chữ in mặt dưới',
    creator: 'R.hampl',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Arduinounor3back.jpg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    variantNote: 'Ảnh tham khảo từ cộng đồng; không xác nhận cùng nhà sản xuất, revision hay board trong CAD.',
    changes: 'Tải bản JPEG Commons; giữ nguyên ảnh, không cắt ghép.',
  }],
  'arduino-nano-classic': [{
    label: 'Mặt dưới · ảnh Arduino Nano có USB-serial FTDI',
    src: '/board-reference/arduino-nano-bottom-reference.jpg',
    alt: 'Mặt dưới của một Arduino Nano có giao tiếp USB-serial FTDI',
    creator: 'MakeMagazinDE',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Arduino_nano_bottm.jpg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    variantNote: 'Ảnh Nano có FTDI; không xác nhận cùng nhà sản xuất, revision hay board trong CAD và không đại diện mọi clone.',
    changes: 'Tải bản JPEG Commons; giữ nguyên ảnh, không cắt ghép.',
  }],
  'arduino-mega-2560-r3': [{
    label: 'Mặt sau · board tương thích Mega 2560 R3',
    src: '/board-reference/arduino-mega-2560-r3-back-reference.jpg',
    alt: 'Mặt sau của board tương thích Arduino Mega 2560 R3 do nhà sản xuất khác chế tạo',
    creator: 'Dsimic',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Arduino_MEGA_2560_R3,_back_side.jpg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    variantNote: 'Nguồn ảnh ghi đây là board tương thích của nhà sản xuất khác; không xác nhận cùng mẫu với ảnh trước hoặc board trong CAD.',
    changes: 'Tải bản JPEG Commons; giữ nguyên ảnh, không cắt ghép.',
  }],
  'raspberry-pi-pico-2': [{
    label: 'Ảnh board Raspberry Pi Pico 2',
    src: '/board-reference/raspberry-pi-pico-2-reference.jpg',
    alt: 'Ảnh cộng đồng của board Raspberry Pi Pico 2',
    creator: 'Suyash Dwivedi',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Raspberry_PI_Pico_2-01.jpg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    variantNote: 'Ảnh cộng đồng giúp nhận diện Pico 2; không xác nhận revision, tình trạng lắp ráp hay độ khớp với model CAD.',
    changes: 'Tải thumbnail JPEG Commons; giữ nguyên nội dung, không cắt ghép.',
  }, {
    label: 'Mặt dưới · nhãn GPIO Raspberry Pi Pico 2',
    src: '/board-reference/raspberry-pi-pico-2-bottom-reference.jpg',
    alt: 'Mặt dưới Raspberry Pi Pico 2 với nhãn GPIO và thông tin quản lý in trên board',
    creator: 'Profpcde',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Bottom_view_of_a_Raspberry_Pi_Pico_2_microcontroller_board.jpg',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    variantNote: 'Ảnh mặt dưới của một Pico 2; nhãn giúp nhận diện chân nhưng không xác nhận cùng mẫu/revision hoặc hình học của board trong CAD.',
    changes: 'Tải JPEG Commons nguyên bản 3024 × 4032; không cắt ghép.',
  }],
  'raspberry-pi-pico-w': [{
    label: 'Ảnh sản phẩm · Raspberry Pi Pico W',
    src: '/board-reference/raspberry-pi-pico-w-reference.jpg',
    alt: 'Ảnh sản phẩm Raspberry Pi Pico W do SparkFun cung cấp',
    creator: 'SparkFun Electronics',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:RPI_PICO_W_1.jpg',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
    variantNote: 'Ảnh sản phẩm Pico W từ SparkFun; dùng nhận diện, không xác nhận biến thể Pico 2 W, revision hoặc độ khớp model CAD.',
    changes: 'Tải JPEG Commons nguyên bản 600 × 600; không cắt ghép.',
  }],
  'arduino-uno-r4-wifi': [{
    label: 'Ảnh cộng đồng · Arduino UNO R4 WiFi',
    src: '/board-reference/arduino-uno-r4-wifi-reference.jpg',
    alt: 'Ảnh cộng đồng chụp Arduino UNO R4 WiFi với ma trận LED 12 × 8',
    creator: 'Lomrjyo',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Arduino_UNO_R4_WiFi.jpg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    variantNote: 'Ảnh cộng đồng của UNO R4 WiFi; không xác nhận revision hoặc cấu hình lắp trong model CAD.',
    changes: 'Tải thumbnail Commons JPEG rộng 1280 px; không cắt nội dung.',
  }],
  'arduino-uno-r4-minima': [{
    label: 'Ảnh sản phẩm · Arduino UNO R4 Minima',
    src: '/board-reference/arduino-uno-r4-minima-reference.webp',
    alt: 'Ảnh sản phẩm Arduino UNO R4 Minima do Arduino phát hành',
    creator: 'Arduino',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Arduino_Uno_R4_Minima_perspective.webp',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    variantNote: 'Không xác nhận revision hay board vật lý; đây là render sản phẩm của Arduino, không phải ảnh chụp.',
    changes: 'Tải WebP Commons nguyên bản 1000 × 750; không chỉnh sửa.',
  }],
  'stm32-nucleo': [{
    label: 'Ảnh thực tế · STM32 NUCLEO-F401RE tại Embedded World 2016',
    src: '/board-reference/stm32-nucleo-f401re-reference.jpg',
    alt: 'Ảnh STM32 NUCLEO-F401RE MB1136 rev C với STM32F401RET6, ST-LINK và header Arduino/Morpho',
    creator: 'Ordercrazy (Thomas Springer)',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Embedded_World_2016,_STM_Nucleo_401.jpg',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    variantNote: 'Ảnh hội chợ được ghi là NUCLEO-F401RET6, MB1136 rev C; hồ sơ CAD của dự án ghi C04. Không xác nhận cùng revision, không dùng ảnh để đo model hoặc suy ra BOM.',
    changes: 'Tải thumbnail Commons 960 × 1076; không chỉnh sửa nội dung.',
  }],
  'stm32-blue-pill-f103': [{
    label: 'Ảnh tham khảo cộng đồng · STM32F103C8T6 Blue Pill',
    src: '/board-reference/stm32-blue-pill-f103-reference.jpg',
    alt: 'Ảnh board cộng đồng STM32F103C8T6 Blue Pill với cổng micro-USB, MCU, thạch anh và header hai hàng',
    creator: 'Avandalen',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Blue_Pill.jpg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    variantNote: 'Blue Pill là tên chung của nhiều board clone; ảnh này chỉ nhận diện một bố cục F103C8T6, không đại diện mọi vendor/revision và không dùng để xác nhận model cơ khí/pinout.',
    changes: 'Tải JPEG Commons nguyên bản 874 × 362; không chỉnh sửa.',
  }],
  'esp32-devkit': [{
    label: 'Ảnh cộng đồng · ESP32 development board trên breadboard',
    src: '/board-reference/esp32-dev-board-reference.jpg',
    alt: 'Ảnh cộng đồng chụp một board ESP32 development đặt trên breadboard, nhìn thấy module có shield và hai hàng chân',
    creator: 'Edwiyanto',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:ESP32_Dev_Board.jpg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    variantNote: 'Nguồn chỉ gọi đây là ESP32 development board; ảnh có bố cục hẹp 30 chân nhưng không xác nhận DOIT, đúng clone/revision trong CAD, USB-serial, BOM hay kích thước. Dùng để nhận diện chung, không làm bằng chứng pinout/model.',
    changes: 'Tải thumbnail Commons 960 × 1280 px; giữ nguyên nội dung, không cắt ghép.',
  }],
}

const boardProfiles: BoardSummary[] = [
  {
    id: 'seeed-xiao-esp32c3',
    name: 'Seeed Studio XIAO ESP32-C3',
    description: 'Board IoT siêu nhỏ dùng ESP32-C3, Wi‑Fi 2,4 GHz, BLE và USB-C.',
    availability: 'preview',
    platform: 'ESP',
    mcu: 'ESP32-C3',
    revision: 'XIAO ESP32-C3 · schematic v1.3 · 2026-01-15',
    logicLevel: '3.3 V GPIO',
    interfaceSummary: 'Wi‑Fi 2,4 GHz; BLE 5; 11 GPIO/PWM; 4 ADC; UART; I²C; SPI; USB-C',
    bestFor: 'IoT mini, thiết bị đeo và dự án cần board ESP32-C3 nhỏ.',
    tradeoffs: 'GPIO2, GPIO8 và GPIO9 là chân strapping; kiểm tra tài liệu trước khi đấu. 3V3 không chịu mức logic 5 V.',
    sourceUrl: 'https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/',
    sourceEvidenceUrl: 'https://files.seeedstudio.com/wiki/XIAO_WiFi/Resources/XIAO_ESP32C3_v1.3_SCH_260116.pdf',
    referenceDocs: [
      { label: 'Hướng dẫn, thông số và pin map', url: 'https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/' },
      { label: 'Schematic XIAO ESP32-C3 v1.3 · CC BY-SA 4.0', url: 'https://files.seeedstudio.com/wiki/XIAO_WiFi/Resources/XIAO_ESP32C3_v1.3_SCH_260116.pdf' },
      { label: 'Seeed XIAO Hardware Resources · Design Kit', url: 'https://www.seeedstudio.com/xiao-series-page/res/' },
      { label: 'KiCad project XIAO ESP32-C3 v1.3 · ZIP', url: 'https://files.seeedstudio.com/wiki/XIAO_WiFi/Resources/XIAO_ESP32C3_v1.3_KiCad_260116.zip' },
      { label: 'KiCad footprints dòng XIAO · ZIP', url: 'https://files.seeedstudio.com/wiki/XIAO-KiCad-Library/New_XIAO_Series_Footprints.zip' },
      { label: 'Schematic symbols dòng XIAO · ZIP', url: 'https://files.seeedstudio.com/wiki/XIAO-KiCad-Library/XIAO_Series_SCH_Symbols.zip' },
      { label: 'Pin multiplexing theo ESP32-C3', url: 'https://wiki.seeedstudio.com/XIAO_ESP32C3_Pin_Multiplexing/' },
      { label: 'DXF kích thước board · ZIP', url: 'https://files.seeedstudio.com/wiki/XIAO_WiFi/Resources/XIAO-ESP32C3-DXF.zip' },
      { label: 'Bảng pinout hãng · XLSX', url: 'https://files.seeedstudio.com/wiki/XIAO_WiFi/Resources/XIAO-ESP32C3-pinout_sheet.xlsx' },
      { label: 'Trang nguồn CAD và 3D chính hãng', url: 'https://wiki.seeedstudio.com/SeeedStudio_XIAO_Series_Introduction/' },
      { label: 'Điều khoản nội dung tài liệu Seeed · CC BY-SA 4.0', url: 'https://wiki.seeedstudio.com/License/' },
    ],
    alternateModelUrl: 'https://grabcad.com/library/seeed-studio-xiao-esp32-c3-1',
    alternateModelLabel: 'Mở model STEP hãng liên kết trên GrabCAD',
    cadViewerUrl: '/models/seeed-xiao-esp32-c3.glb',
    modelNote: 'Viewer 3D giáo dục xuất từ PCB KiCad v1.3: có 68 footprint CAD chọn được, 47 mesh package tham khảo và bảng tra pad/net theo nguồn PCB. Có thể chọn 14 chân header J1/J2 trong cảnh hoặc danh sách pinout; lựa chọn không tô net/đường đồng. Mesh package không phải model marking chính xác của từng part; footprint không có mesh vẫn xem trong danh sách. Giữ CC BY-SA/ghi công trong NOTICE; archive không có LICENSE độc lập. Chưa chạy firmware, mô phỏng điện hay kiểm chứng board thật.',
    photos: [
      { label: 'Sơ đồ pinout · mặt trước XIAO ESP32-C3', src: '/board-reference/seeed-xiao-esp32c3-front.png', alt: 'Sơ đồ Seeed chỉ tên chân và linh kiện ở mặt trước XIAO ESP32-C3', creator: 'Seeed Studio', sourceUrl: 'https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/', license: 'CC BY-SA 4.0', licenseUrl: 'https://wiki.seeedstudio.com/License/', variantNote: 'Sơ đồ pinout trong tài liệu hãng; đối chiếu revision trên board thật trước khi đấu.', changes: 'Sao chép PNG nguồn nguyên trạng.' },
      { label: 'Sơ đồ pinout · mặt sau XIAO ESP32-C3', src: '/board-reference/seeed-xiao-esp32c3-back.png', alt: 'Sơ đồ Seeed chỉ tên chân và linh kiện ở mặt sau XIAO ESP32-C3', creator: 'Seeed Studio', sourceUrl: 'https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/', license: 'CC BY-SA 4.0', licenseUrl: 'https://wiki.seeedstudio.com/License/', variantNote: 'Sơ đồ pinout trong tài liệu hãng; không phải ảnh chụp board vật lý.', changes: 'Sao chép PNG nguồn nguyên trạng.' },
    ],
  },
  {
    id: 'seeed-xiao-esp32-s3',
    name: 'Seeed Studio XIAO ESP32-S3',
    description: 'Board IoT cỡ ngón tay dùng ESP32-S3R8, Wi-Fi, BLE và USB-C; đây là bản thường, không phải Sense hoặc Plus.',
    availability: 'preview',
    platform: 'ESP',
    mcu: 'ESP32-S3R8',
    revision: 'XIAO ESP32-S3 · STEP chính hãng v2 · bản thường (không phải Sense/Plus)',
    logicLevel: '3.3 V GPIO',
    interfaceSummary: 'Wi-Fi 2,4 GHz; BLE 5; 11 GPIO/PWM; ADC; UART; I²C; I²S; SPI; USB-C',
    bestFor: 'Khám phá board ESP32-S3 nhỏ gọn, cảm biến và dự án IoT/wearable.',
    tradeoffs: 'Mặc định không hàn sẵn header; GPIO 3,3 V. Board thường không có camera, microphone hay khe SD của bản Sense. Có thể chọn 14 pad J1/J2 theo PCB Seeed OPL đã căn với STEP; file OPL không ghi revision và chưa được kiểm tra trên board thật.',
    sourceUrl: 'https://wiki.seeedstudio.com/xiao_esp32s3_getting_started/',
    sourceEvidenceUrl: 'https://files.seeedstudio.com/wiki/SeeedStudio-XIAO-ESP32S3/res/XIAO_ESP32S3_V1.3_SCH_260115.pdf',
    referenceDocs: [
      { label: 'Hướng dẫn, pin map bản thường và phân biệt Sense/Plus', url: 'https://wiki.seeedstudio.com/xiao_esp32s3_getting_started/' },
      { label: 'Schematic XIAO ESP32-S3 v1.3 · CC BY-SA 4.0', url: 'https://files.seeedstudio.com/wiki/SeeedStudio-XIAO-ESP32S3/res/XIAO_ESP32S3_V1.3_SCH_260115.pdf' },
      { label: 'PCB KiCad Seeed OPL · nguồn anchor header', url: 'https://github.com/Seeed-Studio/OPL_Kicad_Library/blob/master/Seeed%20Studio%20XIAO%20ESP32S3/ESP32S3.kicad_pcb' },
      { label: 'DXF kích thước board · v1.1', url: 'https://files.seeedstudio.com/wiki/SeeedStudio-XIAO-ESP32S3/res/XIAO_ESP32S3_v1.1_Dimensioning.dxf' },
      { label: 'Model 3D Seeed Studio · CC BY-SA 4.0', url: 'https://www.printables.com/model/1344060-3d-model-for-seeed-studio-xiao-esp32-s3' },
      { label: 'Ghi công và giấy phép model', url: '/models/seeed-xiao-esp32-s3.NOTICE.txt' },
    ],
    photos: [
      { label: 'Render CAD mặt trên · XIAO ESP32-S3 thường', src: '/board-reference/seeed-xiao-esp32-s3-top.jpg', alt: 'Render CAD nhìn mặt trên board Seeed Studio XIAO ESP32-S3 bản thường', creator: 'Seeed Studio', sourceUrl: 'https://wiki.seeedstudio.com/xiao_esp32s3_getting_started/', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', variantNote: 'Hình render từ tài nguyên model hãng; không phải ảnh board vật lý hoặc kiểm chứng revision bán lẻ.', changes: 'Đóng gói từ archive Seeed nguyên bản; không chỉnh sửa ảnh.' },
      { label: 'Render CAD mặt dưới · XIAO ESP32-S3 thường', src: '/board-reference/seeed-xiao-esp32-s3-bottom.jpg', alt: 'Render CAD nhìn mặt dưới board Seeed Studio XIAO ESP32-S3 bản thường, có nhãn chân', creator: 'Seeed Studio', sourceUrl: 'https://wiki.seeedstudio.com/xiao_esp32s3_getting_started/', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', variantNote: 'Danh sách pinout theo tên đã được nhập từ guide hãng; ảnh này chưa được dùng để đo anchor hoặc xác nhận vị trí pad.', changes: 'Đóng gói từ archive Seeed nguyên bản; không chỉnh sửa ảnh.' },
    ],
    cadDownloadUrl: '/cad/seeed-xiao-esp32-s3.step',
    cadDownloadLabel: 'Tải STEP nguồn · CC BY-SA 4.0',
    cadViewerUrl: '/models/seeed-xiao-esp32-s3.glb',
    modelNote: 'Viewer dùng STEP v2 Seeed CC BY-SA 4.0. Có thể chọn 14 pad J1/J2 căn từ PCB Seeed OPL; sai số outline tối đa 0,095 mm dọc. GPIO/chức năng theo guide hiện hành; revision OPL chưa xác định, chưa có board thật, BOM ghép mesh, netlist, firmware hoặc mô phỏng. Sense/Plus là biến thể khác.',
  },
  { id:'adafruit-qtpy-esp32-c3-5405',name:'Adafruit QT Py ESP32-C3',description:'Board IoT nhỏ gọn dùng ESP32-C3FH4, USB-C và đầu nối STEMMA QT.',availability:'preview',platform:'ESP',mcu:'ESP32-C3FH4',revision:'Adafruit QT Py ESP32-C3 Rev B · #5405',logicLevel:'3.3 V',interfaceSummary:'Wi‑Fi 2,4 GHz; Bluetooth LE; USB-C; GPIO; ADC; PWM; UART; I²C; SPI',bestFor:'Khám phá board ESP32-C3 nhỏ gọn, đầu nối STEMMA QT và linh kiện trên CAD.',tradeoffs:'Board preview chỉ để khám phá CAD; pinout 14 pad chỉ tra cứu tĩnh, chưa hỗ trợ bài học/simulator, net/copper hoặc pin MCU.',sourceUrl:'https://learn.adafruit.com/adafruit-qt-py-esp32-c3-wifi-dev-board',sourceEvidenceUrl:'https://github.com/adafruit/Adafruit-QT-Py-ESP32-C3-PCB',referenceDocs:[{label:'Hướng dẫn và pinout',url:'https://learn.adafruit.com/adafruit-qt-py-esp32-c3-wifi-dev-board/pinouts'},{label:'CAD board, schematic và pinout PDF',url:'https://github.com/adafruit/Adafruit-QT-Py-ESP32-C3-PCB'},{label:'Giấy phép/ghi công model và model gốc',url:'/models/adafruit-qtpy-esp32-c3-5405.NOTICE.txt'}],cadViewerUrl:'/cad/adafruit-qt-py-esp32-c3-rev-b/5405-qtpy-esp32-c3.step',modelNote:'Viewer nội bộ chuyển từ CAD chính hãng Rev B/#5405. Designator/footprint ghép theo Eagle CAD; 14 pad JP1/JP3 có anchor CAD để chọn trên model và tra pinout Adafruit. Đây là tra cứu tĩnh, chưa tô net/copper hoặc mô phỏng.' },
  { id:'adafruit-feather-esp32-s3-tft-5483',name:'Adafruit Feather ESP32-S3 TFT · #5483',description:'Board ESP32-S3 Feather có TFT màu 1,14 inch 240×135, USB-C, sạc pin, 4 MB flash và 2 MB PSRAM.',availability:'preview',platform:'ESP',mcu:'ESP32-S3-MINI-1',revision:'Adafruit Feather ESP32-S3 TFT · PID #5483 · 4 MB flash · 2 MB PSRAM',logicLevel:'3.3 V',interfaceSummary:'Wi‑Fi; Bluetooth LE; USB-C native; TFT SPI; GPIO; ADC; sạc LiPo',bestFor:'Khám phá board ESP32-S3 có màn hình tích hợp và bố trí linh kiện theo CAD chính hãng.',tradeoffs:'Chỉ xem CAD tham chiếu; 28 pad JP1/JP3 có tra cứu pinout tĩnh theo đúng biến thể TFT; không chạy bài/simulator, tô net/copper hoặc mô phỏng TFT. Không nhầm với PID #5323, #5477, #5691 hoặc #5885.',sourceUrl:'https://learn.adafruit.com/adafruit-esp32-s3-tft-feather',sourceEvidenceUrl:'https://github.com/adafruit/Adafruit-ESP32-S3-TFT-Feather-PCB',referenceDocs:[{label:'Hướng dẫn và pinout TFT',url:'https://learn.adafruit.com/adafruit-esp32-s3-tft-feather/pinouts'},{label:'Arduino ESP32 core variant · GPIO của #5483',url:'https://raw.githubusercontent.com/espressif/arduino-esp32/master/variants/adafruit_feather_esp32s3_tft/pins_arduino.h'},{label:'Eagle CAD, schematic và README nguồn',url:'https://github.com/adafruit/Adafruit-ESP32-S3-TFT-Feather-PCB'},{label:'Nguồn model STEP #5483',url:'https://github.com/adafruit/Adafruit_CAD_Parts/tree/main/5483%20Feather%20ESP32-S3%20TFT'},{label:'Model và điều khoản/ghi công',url:'/models/adafruit-feather-esp32-s3-tft-5483.NOTICE.txt'}],cadViewerUrl:'/cad/adafruit-feather-esp32-s3-tft-5483/5483%20Feather%20ESP32-S3%20TFT.step',modelNote:'Viewer chuyển từ STEP chính hãng; 37/54 designator có mesh ghép từ CAD; 17 footprint vẫn chỉ tra cứu, 114 mesh chưa định danh. Chọn 28 pad header JP1/JP3 để đọc net CAD và pinout riêng của PID #5483.' },
  { id:'adafruit-feather-esp32-s3-5323',name:'Adafruit Feather ESP32-S3 · #5323',description:'Board ESP32-S3 Feather chính hãng, USB-C, sạc LiPo và 8 MB flash; biến thể này không có PSRAM. Có footprint BME280 dự phòng nhưng không lắp sẵn cảm biến.',availability:'preview',platform:'ESP',mcu:'ESP32-S3-MINI-1',revision:'Adafruit Feather ESP32-S3 · PID #5323 · 8 MB flash · no PSRAM',logicLevel:'3.3 V',interfaceSummary:'Wi‑Fi; Bluetooth LE; USB-C native; GPIO; ADC; I²C; sạc LiPo; NeoPixel',bestFor:'Khám phá Feather ESP32-S3 #5323 theo CAD và tra cứu 28 pad header đúng PID.',tradeoffs:'Chỉ xem CAD tham chiếu; 28 pad JP1/JP3 có tra cứu pinout tĩnh; không chạy bài/simulator, tô net/copper hoặc firmware. Footprint BME280 là vị trí dự phòng, không phải cảm biến tích hợp. Không nhầm với PID #5477 có PSRAM hoặc #5885.',sourceUrl:'https://learn.adafruit.com/adafruit-esp32-s3-feather',sourceEvidenceUrl:'https://github.com/adafruit/Adafruit-Feather-ESP32-S3-PCB',referenceDocs:[{label:'Hướng dẫn, pinout và biến thể bộ nhớ',url:'https://learn.adafruit.com/adafruit-esp32-s3-feather/pinouts'},{label:'Arduino ESP32 core variant · GPIO của #5323',url:'https://raw.githubusercontent.com/espressif/arduino-esp32/master/variants/adafruit_feather_esp32s3/pins_arduino.h'},{label:'Eagle CAD, schematic và README nguồn',url:'https://github.com/adafruit/Adafruit-Feather-ESP32-S3-PCB'},{label:'Nguồn model STEP #5323',url:'https://github.com/adafruit/Adafruit_CAD_Parts/tree/main/5323%20Feather%20ESP32-S3'},{label:'Model và điều khoản/ghi công',url:'/models/adafruit-feather-esp32-s3-5323.NOTICE.txt'}],cadViewerUrl:'/cad/adafruit-feather-esp32-s3-5323/5323%20Feather%20ESP32-S3.step',modelNote:'Viewer chuyển từ STEP chính hãng; 33/47 designator có mesh đối chiếu được. Các footprint còn lại vẫn có tên/vị trí CAD nhưng thiếu mesh; 129 mesh chưa khớp được giữ riêng. Chọn 28 pad header JP1/JP3 để tra net CAD và GPIO theo PID #5323.' },
  { id:'esp32-devkit',name:'ESP32 DevKit V1',description:'Bo mạch nhỏ có Wi‑Fi, Bluetooth và GPIO để bắt đầu với IoT.',availability:'lesson',platform:'ESP',mcu:'ESP32-WROOM-32',revision:'ESP32 Dev Kit Clone · thiết kế 30 chân',logicLevel:'3.3 V',interfaceSummary:'GPIO; ADC; PWM; UART; I²C; SPI; Wi‑Fi; Bluetooth Classic/BLE',bestFor:'IoT, cảm biến không dây, dự án cần Wi‑Fi/Bluetooth.',tradeoffs:'I/O 3,3 V; không đưa 5 V trực tiếp vào GPIO. Số chân khả dụng phụ thuộc board và chân boot.',sourceUrl:'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32/esp32-devkitc/index.html',sourceEvidenceUrl:'https://github.com/BrijModi/ESP32-Dev-Kit-Clone',referenceDocs:[{label:'Schematic + PCB nguồn clone 30 chân',url:'https://github.com/BrijModi/ESP32-Dev-Kit-Clone'}],modelNote:'Model tương tác theo thiết kế clone 30 chân cụ thể; không đại diện mọi board bán dưới tên DevKit V1.' },
  { id:'arduino-uno-r3',name:'Arduino Uno R3',description:'Board tham chiếu tương tác: ATmega328P, chân digital/analog, USB-B và nguồn.',availability:'lesson',platform:'Arduino',mcu:'ATmega328P',revision:'Uno Rev3',logicLevel:'5 V',interfaceSummary:'14 digital (6 PWM); 6 analog; UART; I²C; SPI',bestFor:'Bài học nhập môn, mạch breadboard và ví dụ Arduino phổ biến.',tradeoffs:'Bộ nhớ và số chân hạn chế hơn Mega; không có Wi‑Fi/Bluetooth tích hợp.',sourceUrl:'https://docs.arduino.cc/hardware/uno-rev3',sourceEvidenceUrl:'https://docs.arduino.cc/hardware/uno-rev3',photos:[{label:'Mặt trước · ảnh board Uno R3',src:'/board-reference/arduino-uno-r3-reference.jpg',alt:'Ảnh tham khảo mặt trước của một board Arduino Uno R3',creator:'Mr Revolution',sourceUrl:'https://commons.wikimedia.org/wiki/File:Arduino_Uno_R3.JPG',license:'CC BY 3.0',licenseUrl:'https://creativecommons.org/licenses/by/3.0/',variantNote:'Ảnh cộng đồng tham khảo; có thể khác nhà sản xuất, màu sắc và linh kiện của board trong CAD.',changes:'Thu nhỏ còn tối đa 1200 px và nén JPEG chất lượng 84 để tải nhanh.'}] },
  { id:'arduino-nano-classic',name:'Arduino Nano classic',description:'Board tham chiếu nhỏ gọn, hai hàng chân, ATmega328P và cổng Mini-B.',availability:'lesson',platform:'Arduino',mcu:'ATmega328P',revision:'Nano classic',logicLevel:'5 V',interfaceSummary:'14 digital (6 PWM); 8 analog; UART; I²C; SPI',bestFor:'Mạch nhỏ gọn, lắp lên breadboard và dự án cần tiết kiệm diện tích.',tradeoffs:'Ít tiện khi thao tác trực tiếp hơn Uno; các bản clone có thể khác USB-serial và linh kiện.',sourceUrl:'https://docs.arduino.cc/hardware/nano',sourceEvidenceUrl:'https://docs.arduino.cc/hardware/nano',photos:[{label:'Ảnh board Arduino Nano classic',src:'/board-reference/arduino-nano-v3-reference.jpg',alt:'Ảnh tham khảo board Arduino Nano phiên bản V3',creator:'Nevit Dilmen',sourceUrl:'https://commons.wikimedia.org/wiki/File:Arduino_Nano_v3_20140410.jpg',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/',variantNote:'Ảnh Nano V3 cộng đồng, chụp cùng cáp USB; không dùng để xác nhận linh kiện của mọi Nano classic/clone.',changes:'Thu nhỏ còn tối đa 1200 px và nén JPEG chất lượng 84 để tải nhanh.'}] },
  { id:'arduino-mega-2560-r3',name:'Arduino Mega 2560 R3',description:'Board tham chiếu nhiều chân I/O và UART cho dự án nhiều thiết bị.',availability:'lesson',platform:'Arduino',mcu:'ATmega2560',revision:'Mega 2560 Rev3',logicLevel:'5 V',interfaceSummary:'54 digital (15 PWM); 16 analog; 4 UART; I²C; SPI',bestFor:'Robot hoặc hệ thống có nhiều cảm biến, màn hình và thiết bị nối tiếp.',tradeoffs:'Kích thước lớn hơn Uno/Nano; vẫn không có kết nối không dây tích hợp.',sourceUrl:'https://docs.arduino.cc/hardware/mega-2560',sourceEvidenceUrl:'https://docs.arduino.cc/hardware/mega-2560',photos:[{label:'Ảnh tham khảo mặt trước · Mega 2560 Rev3',src:'/board-reference/arduino-mega-2560-r3-reference.png',alt:'Ảnh mặt trước board Arduino Mega 2560 Rev3',creator:'Arduino',sourceUrl:'https://commons.wikimedia.org/wiki/File:Arduino_MEGA2560.png',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',variantNote:'Ảnh board tham chiếu Rev3 do Arduino đăng trên Commons; đối chiếu CAD/BOM của model riêng trước khi suy luận vị trí từng linh kiện.',changes:'Giữ nguyên PNG 954 × 539 px; không chỉnh sửa.'}] },
  { id:'stm32-nucleo',name:'STM32 NUCLEO-F401RE',description:'Board Nucleo chính hãng để học STM32, GPIO, timer và debug bằng ST-LINK.',availability:'preview',platform:'STM32',mcu:'STM32F401RET6',revision:'MB1136-F401RE-C04 · project package v1.1',logicLevel:'3.3 V I/O',interfaceSummary:'GPIO; ADC; PWM; UART; I²C; SPI; ST-LINK/V2-1',bestFor:'Học STM32, timer, debug phần cứng và quy trình phát triển chuyên sâu hơn.',tradeoffs:'Cần làm quen STM32CubeIDE/HAL; model 3D tương tác chưa sẵn sàng.',sourceUrl:'https://www.st.com/en/evaluation-tools/nucleo-f401re.html',sourceEvidenceUrl:'https://www.st.com/resource/en/user_manual/dm00105823-nucleo-f401re-user-manual-stmicroelectronics.pdf',alternateModelUrl:'https://tracedparts.com/part/nu/nucleo-f401re/stmicroelectronics/',alternateModelLabel:'Thử model STEP bên thứ ba',modelNote:'DigiKey/SnapMagic hiện không trả preview ổn định. ST cung cấp CAD Altium/BOM; TracedParts liệt kê STEP, nhưng điều khoản tái phân phối model ngoài chưa được xác minh. Chưa dùng model đó trong viewer.' },
  { id:'esp32-c3-devkitm-1',name:'ESP32-C3-DevKitM-1',description:'Board nhỏ gọn với Wi‑Fi 2,4 GHz, Bluetooth LE và USB Serial/JTAG.',availability:'preview',platform:'ESP',mcu:'ESP32-C3-MINI-1',revision:'ESP32-C3-DevKitM-1-N4X · thiết kế V1.0',logicLevel:'3.3 V',interfaceSummary:'Wi‑Fi; Bluetooth LE; USB Serial/JTAG; GPIO; ADC; PWM',bestFor:'IoT tiết kiệm chi phí, BLE và thiết bị có kích thước nhỏ.',tradeoffs:'Ít ngoại vi/chân hơn một số board ESP32 lớn; model đang ở trạng thái preview.',sourceUrl:'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32c3/esp32-c3-devkitm-1/user_guide.html',sourceEvidenceUrl:'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32c3/esp32-c3-devkitm-1/user_guide.html',referenceDocs:[{label:'Schematic V1.0',url:'https://dl.espressif.com/dl/schematics/SCH_ESP32-C3-DEVKITM-1_V1_20200915A.pdf'},{label:'PCB layout Rev 1.0',url:'https://dl.espressif.com/dl/schematics/PCB_ESP32-C3-DEVKITM-1_V1_20200915AA.pdf'},{label:'Kích thước PDF',url:'https://dl.espressif.com/dl/schematics/DIMENSION_ESP32-C3-DEVKITM-1_V1_20200915AA.pdf'},{label:'Kích thước DXF',url:'https://dl.espressif.com/dl/schematics/DIMENSION_ESP32-C3-DEVKITM-1_V1_20200915AA.dxf'},{label:'Espressif KiCad library · footprint board và model 3D module/SoC · CC BY-SA 4.0',url:'https://github.com/espressif/kicad-libraries'}],modelNote:'Đã gắn schematic, PCB layout, kích thước và thư viện KiCad chính thức. Thư viện có footprint board cùng model 3D module/SoC; không có assembly 3D hoàn chỉnh cho DevKitM-1 trong viewer này.' },
  { id:'esp32-devkitm-1',name:'ESP32-DevKitM-1',description:'Board chính hãng dùng module ESP32-MINI-1, có USB-to-UART, nút BOOT/RESET và header GPIO.',availability:'preview',platform:'ESP',mcu:'ESP32-MINI-1 · ESP32',revision:'ESP32-DevKitM-1 · tài liệu tham chiếu chính hãng',logicLevel:'3.3 V',interfaceSummary:'Wi‑Fi; Bluetooth; GPIO; ADC; PWM; UART; I²C; SPI',bestFor:'Khám phá dạng module ESP32 nhỏ gọn và luồng nguồn/USB/GPIO.',tradeoffs:'Không nhầm module ESP32-MINI-1 với board DevKitM-1; model 3D tương tác chưa được xác minh.',sourceUrl:'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32/esp32-devkitm-1/user_guide.html',sourceEvidenceUrl:'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32/esp32-devkitm-1/user_guide.html',referenceDocs:[{label:'Schematic',url:'https://dl.espressif.com/dl/schematics/SCH_ESP32-DEVKITM-1_V1_20200910A.pdf'},{label:'PCB layout',url:'https://dl.espressif.com/dl/schematics/PCB_ESP32-DevKitM-1_V1_20200910AE.pdf'},{label:'DXF layout',url:'https://dl.espressif.com/dl/schematics/ESP32-DevKitM-1_V1.dxf'},{label:'Espressif KiCad library · footprint board và model 3D module/SoC · CC BY-SA 4.0',url:'https://github.com/espressif/kicad-libraries'}],modelNote:'Hồ sơ có schematic, PCB layout, DXF và thư viện KiCad chính thức. Thư viện có footprint board cùng model 3D module/SoC; không có assembly 3D hoàn chỉnh cho DevKitM-1 trong viewer này.' },
  { id:'esp32-s3-devkitc-1',name:'ESP32-S3-DevKitC-1',description:'Board ESP32-S3 phổ biến cho USB, Wi‑Fi/Bluetooth LE và ứng dụng nhiều GPIO.',availability:'preview',platform:'ESP',mcu:'ESP32-S3-WROOM-1 · biến thể bộ nhớ theo module lắp',revision:'ESP32-S3-DevKitC-1 · PCB V1.1',logicLevel:'3.3 V',interfaceSummary:'Wi‑Fi; Bluetooth LE; USB; GPIO; ADC; PWM; UART; I²C; SPI',bestFor:'Dự án cần USB, Wi‑Fi/BLE và tài nguyên tính toán hoặc bộ nhớ rộng hơn.',tradeoffs:'Nhiều chức năng/chân hơn khiến người mới cần sơ đồ chân rõ; viewer 3D là tái dựng giáo dục từ PADS nhập; có lỗi DRC, chưa đo board thật và không dùng chế tạo.',sourceUrl:'https://documentation.espressif.com/ESP32-S3-DevKitC-1_Reference_Design.zip',sourceEvidenceUrl:'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s3/esp32-s3-devkitc-1/user_guide_v1.1.html',referenceDocs:[{label:'Hướng dẫn V1.1 · linh kiện & pinout',url:'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s3/esp32-s3-devkitc-1/user_guide_v1.1.html'},{label:'Reference design chính hãng',url:'https://documentation.espressif.com/ESP32-S3-DevKitC-1_Reference_Design.zip'},{label:'Espressif KiCad library · module/SoC 3D models · CC BY-SA 4.0',url:'https://github.com/espressif/kicad-libraries'},{label:'Model 3D, attribution và giới hạn',url:'/models/esp32-s3-devkitc-1-v1.1.NOTICE.txt'}],modelNote:'Tái dựng giáo dục từ PADS ASCII/BOM V1.1: 48 footprint có mesh package, 44 anchor header. DRC import lỗi; 47 mesh là package chung, module memory không được BOM khóa biến thể. Outline PADS lệch 0,125 mm với PDF kích thước; chưa đối chiếu board thật, không dùng chế tạo. RGB LED trên V1.1 theo GPIO38.' },
  { id:'stm32-blue-pill-f103',name:'STM32F103C8T6 Blue Pill',description:'Họ module STM32F103C8T6 phổ biến dạng dài; tên Blue Pill không xác định một hãng hay một revision PCB duy nhất.',availability:'preview',platform:'STM32',mcu:'STM32F103C8T6',revision:'Họ board clone · revision/vendor chưa xác định',logicLevel:'3.3 V I/O · xác minh theo board thực',interfaceSummary:'GPIO; ADC; PWM; UART; I²C; SPI; USB tùy revision',bestFor:'Tra cứu pinout STM32F103 và học ngoại vi cơ bản; không dùng mô hình thay datasheet.',tradeoffs:'Board clone khác nhau về linh kiện, regulator, USB và chất lượng lắp ráp; chưa có model 3D chuẩn được chọn.',sourceUrl:'https://stm32-base.org/boards/STM32F103C8T6-Blue-Pill.html',sourceEvidenceUrl:'https://www.st.com/resource/en/datasheet/stm32f103c8.pdf',modelNote:'Chưa có model CAD chuẩn dùng chung cho họ Blue Pill. Viewer custom đã được gỡ khỏi danh mục; cần xác định vendor/revision cụ thể trước khi thêm model.' },
  { id:'raspberry-pi-pico',name:'Raspberry Pi Pico',description:'Board RP2040 nhỏ gọn, phù hợp học C/C++, MicroPython, GPIO và PIO.',availability:'preview',platform:'Raspberry Pi',mcu:'RP2040',revision:'Pico R3 · thiết kế tham chiếu chính hãng',logicLevel:'3.3 V',interfaceSummary:'26 GPIO; 2× SPI; 2× I²C; 2× UART; 3 ADC; 16 PWM',bestFor:'Nhập môn embedded, cảm biến, điều khiển thời gian thực và MicroPython.',tradeoffs:'Không có Wi‑Fi/Bluetooth tích hợp.',sourceUrl:'https://pip.raspberrypi.com/categories/610-raspberry-pi-pico',sourceEvidenceUrl:'https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html',referenceDocs:[{label:'Datasheet, schematic & design files',url:'https://datasheets.raspberrypi.com/pico/pico-datasheet.pdf'}],cadDownloadUrl:'/cad/raspberry-pi-pico-r3-step.zip',cadDownloadLabel:'Tải CAD STEP (260 KB)',cadViewerUrl:'/cad/raspberry-pi-pico-r3.step',modelNote:'Viewer là CAD cơ khí tham chiếu. Danh sách chọn mesh nay tách rõ MCU/nút/LED đã nhận diện khỏi hình học chưa định danh; mesh không có designator không được gán chức năng suy đoán.',photos:[{label:'Ảnh hai mặt · Raspberry Pi Pico',src:'/board-reference/raspberry-pi-pico-reference.jpg',alt:'Ảnh cộng đồng thể hiện mặt trước và mặt sau của Raspberry Pi Pico',creator:'Michael H. (Laserlicht)',sourceUrl:'https://commons.wikimedia.org/wiki/File:Raspberry_pi_pico.jpg',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',variantNote:'Ảnh tham khảo Pico RP2040; không xác nhận Pico W, Pico 2 hoặc mọi revision/nhà phân phối.',changes:'Tạo thumbnail rộng tối đa 1200 px từ ảnh Commons; giữ nguyên nội dung ảnh.'}] },
  { id:'raspberry-pi-pico-w',name:'Raspberry Pi Pico W',description:'Board RP2040 tích hợp Wi‑Fi và Bluetooth LE cho các bài IoT kết nối.',availability:'preview',platform:'Raspberry Pi',mcu:'RP2040',revision:'Pico W · thiết kế tham chiếu chính hãng',logicLevel:'3.3 V',interfaceSummary:'GPIO; ADC; PWM; SPI; I²C; UART; Wi‑Fi; Bluetooth LE',bestFor:'IoT nhập môn, điều khiển qua mạng và gửi dữ liệu cảm biến.',tradeoffs:'Cần phân biệt Pico W với Pico 2 W.',sourceUrl:'https://pip.raspberrypi.com/categories/686-raspberry-pi-pico-w',sourceEvidenceUrl:'https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html',referenceDocs:[{label:'Datasheet, schematic & design files',url:'https://datasheets.raspberrypi.com/picow/pico-w-datasheet.pdf'}],cadDownloadUrl:'/cad/raspberry-pi-pico-w-step.zip',cadDownloadLabel:'Tải CAD STEP (820 KB)',cadViewerUrl:'/cad/raspberry-pi-pico-w.stp',modelNote:'Viewer là CAD cơ khí tham chiếu. Vỏ RF và package được gọi theo CAD; anten có điều kiện cấp phép riêng, không xem mesh CAD là mô hình anten hoặc mô phỏng RF.' },
  { id:'raspberry-pi-pico-2',name:'Raspberry Pi Pico 2',description:'Board vi điều khiển RP2350 với GPIO, ADC, PWM, PIO và hai lõi xử lý.',availability:'preview',platform:'Raspberry Pi',mcu:'RP2350',revision:'Pico 2 · thiết kế tham chiếu chính hãng · không header',logicLevel:'3.3 V',interfaceSummary:'26 GPIO; 2× SPI; 2× I²C; 2× UART; 3 ADC; 16 PWM; PIO',bestFor:'Học MicroPython/C++, GPIO, PIO và so sánh RP2350 với RP2040.',tradeoffs:'Viewer là CAD cơ khí tham chiếu; pinout 40 pad J0 kế thừa layout Pico theo tài liệu hãng. Chưa có netlist hay mô phỏng firmware/điện; đối chiếu board/revision trước khi lắp.',sourceUrl:'https://pip.raspberrypi.com/categories/1005-raspberry-pi-pico-2',sourceEvidenceUrl:'https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html',referenceDocs:[{label:'Pico 2 · trang sản phẩm và model CAD',url:'https://pip.raspberrypi.com/categories/1005-raspberry-pi-pico-2'},{label:'Datasheet, schematic, pinout và license thiết kế',url:'https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html'},{label:'Điều khoản/ghi công model Raspberry Pi',url:'/cad/raspberry-pi-model-license.txt'}],cadDownloadUrl:'/cad/raspberry-pi-pico-2-step.zip',cadDownloadLabel:'Tải CAD STEP (2.2 MB)',cadViewerUrl:'/cad/raspberry-pi-pico-2.step',modelNote:'Viewer CAD chính hãng cho Pico 2 không header; không dùng thay Pico 2 H có header hoặc Pico 2 W. Mesh mang tên CAD nhưng thiếu BOM/netlist đối chiếu nên không suy ra đầy đủ chức năng hay kết nối điện.' },
  { id:'raspberry-pi-pico-2-h',name:'Raspberry Pi Pico 2 H',description:'Board RP2350 chính hãng có header hàn sẵn để cắm breadboard; là biến thể cơ khí riêng của Pico 2.',availability:'preview',platform:'Raspberry Pi',mcu:'RP2350',revision:'Pico 2 H · SC1632 · with headers',logicLevel:'3.3 V',interfaceSummary:'26 GPIO; 2× SPI; 2× I²C; 2× UART; 3 ADC; 16 PWM; PIO',bestFor:'Khám phá hình học Pico 2 có header hàn sẵn và đầu nối debug JST-style theo model hãng.',tradeoffs:'Viewer CAD tham chiếu; pinout 40 pad J0 kế thừa layout Pico theo tài liệu hãng. Chưa có netlist hay mô phỏng firmware/điện; đối chiếu board/revision trước khi lắp.',sourceUrl:'https://pip.raspberrypi.com/categories/1264-raspberry-pi-pico-2-h',sourceEvidenceUrl:'https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html',referenceDocs:[{label:'Product Information Portal · Pico 2 H STEP',url:'https://pip.raspberrypi.com/categories/1264-raspberry-pi-pico-2-h'},{label:'Tài liệu Pico series, pinout và license thiết kế',url:'https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html'},{label:'Ghi công và giấy phép model',url:'/models/raspberry-pi-pico-2-h.NOTICE.txt'}],cadDownloadUrl:'/cad/raspberry-pi-pico-2-h-step.zip',cadDownloadLabel:'Tải CAD STEP (2.2 MB)',cadViewerUrl:'/cad/raspberry-pi-pico-2-h-step-source/rpi_pico2h.step',modelNote:'Model STEP chính hãng cho Pico 2 H có header hàn sẵn. Raspberry Pi cảnh báo model chỉ dùng hướng dẫn/fit-check và có thể không khớp phiên bản mới nhất; không đại diện Pico 2 không header hay Pico 2 W. Có thể chọn chân theo layout chung Pico; tọa độ chưa đối chiếu Allegro riêng Pico 2 H.' },
  { id:'esp32-c6-devkitc-1',name:'ESP32-C6-DevKitC-1',description:'Board IoT hỗ trợ Wi‑Fi 6, Bluetooth LE và giao thức Thread/Zigbee.',availability:'preview',platform:'ESP',mcu:'ESP32-C6-WROOM-1',revision:'DevKitC-1 v1.2 · N8',logicLevel:'3.3 V',interfaceSummary:'Wi‑Fi 6; Bluetooth 5 LE; IEEE 802.15.4; USB; GPIO; ADC; PWM',bestFor:'IoT hiện đại, mạng Thread/Zigbee và thử nghiệm chuẩn không dây mới.',tradeoffs:'Pinout và linh kiện thay đổi theo revision; chưa có model tương tác được xác minh trong viewer.',sourceUrl:'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32c6/esp32-c6-devkitc-1/user_guide.html',sourceEvidenceUrl:'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32c6/esp32-c6-devkitc-1/user_guide.html',referenceDocs:[{label:'Hướng dẫn board chính hãng',url:'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32c6/esp32-c6-devkitc-1/user_guide.html'}],modelNote:'Có tài liệu hãng để tra phần cứng và pinout; chưa có model board-level đã kiểm chứng trong viewer.' },
  { id:'stm32-nucleo-f411re',name:'STM32 NUCLEO-F411RE',description:'Board Nucleo-64 dùng Cortex-M4F cho thực hành STM32 và debug qua ST-LINK.',availability:'preview',platform:'STM32',mcu:'STM32F411RET6',revision:'NUCLEO-64 · MB1136',logicLevel:'3.3 V I/O',interfaceSummary:'GPIO; ADC; PWM; UART; I²C; SPI; ST-LINK/V2-1',bestFor:'Lập trình STM32 HAL, timer, ADC và so sánh năng lực các dòng F4.',tradeoffs:'Cần đối chiếu đúng board revision; không dùng chung model F401RE để giả lập F411RE.',sourceUrl:'https://www.st.com/en/evaluation-tools/nucleo-f411re.html',sourceEvidenceUrl:'https://www.st.com/en/evaluation-tools/nucleo-f411re.html',modelNote:'ST cung cấp tài liệu và CAD resource; chưa xác minh file 3D có thể phân phối, vì vậy chưa đưa vào viewer.' },
  { id:'arduino-uno-r4-minima',name:'Arduino UNO R4 Minima',description:'Board 32-bit dùng Renesas RA4M1, tương thích hệ sinh thái Arduino UNO.',availability:'preview',platform:'Arduino',mcu:'Renesas RA4M1',revision:'UNO R4 Minima · official reference',logicLevel:'5 V I/O (kiểm tra hướng dẫn board)',interfaceSummary:'GPIO; ADC; PWM; UART; I²C; SPI; USB-C',bestFor:'So sánh kiến trúc 32-bit với Uno R3 trong các dự án Arduino.',tradeoffs:'Không dùng pin điện áp/đặc tính UNO R3 để suy ra mọi ngoại vi; chưa có viewer xác thực.',sourceUrl:'https://docs.arduino.cc/hardware/uno-r4-minima',sourceEvidenceUrl:'https://docs.arduino.cc/hardware/uno-r4-minima',modelNote:'Chỉ có thông tin/catalogue tham chiếu; cần nhập CAD theo đúng revision trước khi dựng 3D.' },
  { id:'arduino-uno-r4-wifi',name:'Arduino UNO R4 WiFi',description:'UNO R4 có RA4M1 và module ESP32-S3 cho kết nối không dây.',availability:'preview',platform:'Arduino',mcu:'Renesas RA4M1 + ESP32-S3',revision:'UNO R4 WiFi · official reference',logicLevel:'5 V board I/O; module radio 3,3 V',interfaceSummary:'GPIO; ADC; PWM; UART; I²C; SPI; Wi‑Fi; BLE',bestFor:'Dự án Arduino cần mạng và so sánh MCU kết hợp coprocessor.',tradeoffs:'Kiến trúc hai chip có phân công chức năng; không dùng pin map ESP32 trực tiếp cho header UNO.',sourceUrl:'https://docs.arduino.cc/hardware/uno-r4-wifi',sourceEvidenceUrl:'https://docs.arduino.cc/hardware/uno-r4-wifi',modelNote:'Chưa có model viewer được xác minh trong dự án.' },
  { id:'arduino-nano-esp32',name:'Arduino Nano ESP32',description:'Board dạng Nano dựa trên ESP32-S3 với hỗ trợ Arduino và kết nối Wi‑Fi/BLE.',availability:'preview',platform:'Arduino',mcu:'ESP32-S3',revision:'Nano ESP32 · official reference',logicLevel:'3.3 V I/O',interfaceSummary:'Wi‑Fi; BLE; GPIO; ADC; PWM; UART; I²C; SPI',bestFor:'Dự án IoT dạng nhỏ gọn, dùng Arduino IDE và nền tảng ESP32.',tradeoffs:'Không tương thích điện áp/chân như Nano classic ATmega328P.',sourceUrl:'https://docs.arduino.cc/hardware/nano-esp32',sourceEvidenceUrl:'https://docs.arduino.cc/hardware/nano-esp32',modelNote:'Board tham chiếu; pinout và variant cần gắn đúng revision khi có model.' },
  { id:'arduino-nano-every',name:'Arduino Nano Every',description:'Board dạng Nano dùng ATmega4809, phù hợp bài học Arduino gọn.',availability:'preview',platform:'Arduino',mcu:'ATmega4809',revision:'Nano Every · official reference',logicLevel:'5 V',interfaceSummary:'GPIO; ADC; PWM; UART; I²C; SPI',bestFor:'So sánh nền tảng Nano và các ngoại vi AVR.',tradeoffs:'Không nhầm với Nano classic ATmega328P; thư viện/đặc tính chip khác nhau.',sourceUrl:'https://docs.arduino.cc/hardware/nano-every',sourceEvidenceUrl:'https://docs.arduino.cc/hardware/nano-every',modelNote:'Chưa có model viewer được xác minh.' },
  { id:'esp32-s2-devkitc-1',name:'ESP32-S2-DevKitC-1',description:'Board ESP32-S2 có Wi‑Fi và USB OTG, không có Bluetooth.',availability:'preview',platform:'ESP',mcu:'ESP32-S2',revision:'DevKitC-1 · module/flash variants',logicLevel:'3.3 V',interfaceSummary:'Wi‑Fi; USB OTG; GPIO; ADC; PWM; UART; I²C; SPI',bestFor:'Học USB device/OTG và IoT Wi‑Fi.',tradeoffs:'Không có Bluetooth; GPIO và module phụ thuộc variant.',sourceUrl:'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s2/esp32-s2-devkitc-1/user_guide.html',sourceEvidenceUrl:'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s2/esp32-s2-devkitc-1/user_guide.html',referenceDocs:[{label:'Hướng dẫn board chính hãng',url:'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s2/esp32-s2-devkitc-1/user_guide.html'}],modelNote:'Có tài liệu hãng để tra phần cứng và pinout; chưa có model board-level đã kiểm chứng trong viewer.' },
  { id:'esp32-h2-devkitm-1',name:'ESP32-H2-DevKitM-1',description:'Board 802.15.4/Bluetooth LE cho ứng dụng Thread và Zigbee.',availability:'preview',platform:'ESP',mcu:'ESP32-H2',revision:'DevKitM-1 · module variant',logicLevel:'3.3 V',interfaceSummary:'Bluetooth LE; IEEE 802.15.4; GPIO; UART; I²C; SPI',bestFor:'Khám phá giao thức mạng IoT Thread/Zigbee.',tradeoffs:'Không có Wi‑Fi; khác rõ với ESP32/C3/S3.',sourceUrl:'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32h2/esp32-h2-devkitm-1/user_guide.html',sourceEvidenceUrl:'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32h2/esp32-h2-devkitm-1/user_guide.html',referenceDocs:[{label:'Hướng dẫn board chính hãng',url:'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32h2/esp32-h2-devkitm-1/user_guide.html'}],modelNote:'Có tài liệu hãng để tra phần cứng và pinout; chưa có model board-level đã kiểm chứng trong viewer.' },
  { id:'stm32-nucleo-l476rg',name:'STM32 NUCLEO-L476RG',description:'Board Nucleo-64 dùng Cortex-M4 tiết kiệm năng lượng.',availability:'preview',platform:'STM32',mcu:'STM32L476RG',revision:'NUCLEO-64 · MB1136',logicLevel:'3.3 V I/O',interfaceSummary:'GPIO; ADC; DAC; PWM; UART; I²C; SPI; ST-LINK',bestFor:'Low-power embedded, ADC/DAC và STM32Cube.',tradeoffs:'Đối chiếu đúng BOM và revision; chưa có model web.',sourceUrl:'https://www.st.com/en/evaluation-tools/nucleo-l476rg.html',sourceEvidenceUrl:'https://www.st.com/resource/en/user_manual/um1724-stm32-nucleo64-boards-mb1136-stmicroelectronics.pdf',modelNote:'Catalog reference dựa trên tài liệu ST; model 3D chưa được kiểm chứng/tích hợp.' },
  { id:'stm32-nucleo-f446re',name:'STM32 NUCLEO-F446RE',description:'Board Nucleo-64 dùng Cortex-M4 hiệu năng cao hơn cho bài embedded.',availability:'preview',platform:'STM32',mcu:'STM32F446RE',revision:'NUCLEO-64 · MB1136',logicLevel:'3.3 V I/O',interfaceSummary:'GPIO; ADC; DAC; PWM; UART; I²C; SPI; ST-LINK',bestFor:'Timer, DSP cơ bản, giao tiếp và so sánh dòng STM32F4.',tradeoffs:'Không dùng chung thông số ngoại vi chi tiết của F401; model 3D chưa có.',sourceUrl:'https://www.st.com/en/evaluation-tools/nucleo-f446re.html',sourceEvidenceUrl:'https://www.st.com/resource/en/user_manual/um1724-stm32-nucleo64-boards-mb1136-stmicroelectronics.pdf',modelNote:'Catalog reference dựa trên tài liệu ST; model 3D chưa được kiểm chứng/tích hợp.' },
]

export const boards: BoardSummary[] = boardProfiles.map((board) => {
  const extraPhotos = additionalBoardPhotos[board.id]
  return extraPhotos?.length ? { ...board, photos: [...(board.photos ?? []), ...extraPhotos] } : board
})

/** The generic "Tài liệu hãng" link, or undefined when a labelled reference doc already points at the same file. */
export const getCatalogEvidenceUrl = (board: BoardSummary) =>
  board.sourceEvidenceUrl && !(board.referenceDocs ?? []).some((doc) => doc.url === board.sourceEvidenceUrl) ? board.sourceEvidenceUrl : undefined
