import { getComponentDefinition } from '../data/componentRegistry'
import { findLedSeriesPath } from './circuitNets'
import type { CircuitGraph } from './circuitGraph'
import type { BuilderLessonId } from '../data/builderLessons'
import type { BoardCapability } from '../data/boardCapabilityRegistry'

export type CircuitDiagnostic = { severity: 'error'|'warning'|'info'; code: string; message: string; affectedPartIds: string[]; suggestedFix?: string }

export function validateCircuit(graph:CircuitGraph,lesson:BuilderLessonId,boardCapability?:BoardCapability):CircuitDiagnostic[] {
  const result:CircuitDiagnostic[]=[]
  const parts=new Map(graph.parts.map(part=>[part.id,part]))
  const valid=new Set<string>()
  const seen=new Set<string>()
  const connectedPins=new Set<string>()
  const wireAdjacency=new Map<string,Set<string>>()
  for(const wire of graph.wires){
    const a=parts.get(wire.from.partId),b=parts.get(wire.to.partId)
    const ap=a&&getComponentDefinition(a.type)?.pins.find(pin=>pin.id===wire.from.pinId)
    const bp=b&&getComponentDefinition(b.type)?.pins.find(pin=>pin.id===wire.to.pinId)
    if(!a||!b||!ap||!bp){result.push({severity:'error',code:'invalid-endpoint',message:'Dây đang nối tới linh kiện hoặc chân không còn tồn tại.',affectedPartIds:[wire.from.partId,wire.to.partId],suggestedFix:'Xóa dây hỏng hoặc đặt lại bài thực hành.'});continue}
    if(a.id===b.id){result.push({severity:'error',code:'self-wire',message:'Không thể nối hai chân của cùng một linh kiện trong bài mẫu này.',suggestedFix:'Xóa dây này rồi nối chân tới linh kiện khác.',affectedPartIds:[a.id]});continue}
    const pair=[`${a.id}:${ap.id}`,`${b.id}:${bp.id}`].sort().join('|')
    if(seen.has(pair)){result.push({severity:'warning',code:'duplicate-wire',message:'Có dây trùng giữa cùng một cặp chân.',affectedPartIds:[a.id,b.id]});continue}
    seen.add(pair);valid.add(`${a.id}:${ap.id}`);valid.add(`${b.id}:${bp.id}`);connectedPins.add(`${a.id}:${ap.id}`);connectedPins.add(`${b.id}:${bp.id}`)
    const aKey=`${a.id}:${ap.id}`,bKey=`${b.id}:${bp.id}`
    if(!wireAdjacency.has(aKey))wireAdjacency.set(aKey,new Set());if(!wireAdjacency.has(bKey))wireAdjacency.set(bKey,new Set());wireAdjacency.get(aKey)!.add(bKey);wireAdjacency.get(bKey)!.add(aKey)
    if((ap.electricalType==='power'&&bp.electricalType==='ground')||(ap.electricalType==='ground'&&bp.electricalType==='power')) result.push({severity:'warning',code:'direct-power-ground',message:`Dây nối trực tiếp ${ap.label} với ${bp.label}; có thể tạo ngắn mạch nguồn.`,affectedPartIds:[a.id,b.id],suggestedFix:'Kiểm tra sơ đồ nguồn và chỉ nối các rail này qua tải hoặc mạch bảo vệ phù hợp.'})
    if(ap.electricalType==='output'&&bp.electricalType==='output') result.push({severity:'warning',code:'output-contention',message:`Hai ngõ ra ${ap.label} và ${bp.label} đang nối trực tiếp với nhau.`,affectedPartIds:[a.id,b.id],suggestedFix:'Tránh nối trực tiếp hai GPIO/ngõ ra; dùng mạch đệm hoặc điện trở theo thiết kế.'})
    for(const [part,ownPin,other,otherPin] of [[a,ap,b,bp],[b,bp,a,ap]] as const){
      if((part.type==='capacitor'||part.type==='diode'||part.type==='led')&&ownPin.polarity==='positive'&&(otherPin.polarity==='negative'||otherPin.electricalType==='ground'))result.push({severity:'warning',code:`polarized-positive-to-ground-${part.id}`,message:`Cực dương ${ownPin.label} của ${getComponentDefinition(part.type)?.label??part.type} đang nối về ${otherPin.label}; kiểm tra lại cực tính.`,affectedPartIds:[part.id,other.id],suggestedFix:'Đối chiếu vạch/cực của linh kiện và sơ đồ đúng module trước khi cấp nguồn.'})
      if((part.type==='capacitor'||part.type==='diode'||part.type==='led')&&ownPin.polarity==='negative'&&(otherPin.polarity==='positive'||otherPin.electricalType==='power'))result.push({severity:'warning',code:`polarized-negative-to-power-${part.id}`,message:`Cực âm ${ownPin.label} của ${getComponentDefinition(part.type)?.label??part.type} đang nối vào đường nguồn ${otherPin.label}; kiểm tra lại cực tính.`,affectedPartIds:[part.id,other.id],suggestedFix:'Đối chiếu vạch/cực của linh kiện và sơ đồ đúng module trước khi cấp nguồn.'})
    }
  }
  for(const part of graph.parts){
    if(part.type==='board'||part.type==='breadboard')continue
    const definition=getComponentDefinition(part.type)
    const openPins=definition?.pins.filter(pin=>!connectedPins.has(`${part.id}:${pin.id}`))??[]
    if(openPins.length)result.push({severity:'info',code:`open-part-${part.id}`,message:`${definition?.label??part.type} còn ${openPins.length} chân chưa nối (${openPins.map(pin=>pin.label).join(', ')}).`,affectedPartIds:[part.id],suggestedFix:'Nối các chân cần dùng theo sơ đồ linh kiện; chân dự phòng có thể để hở nếu datasheet cho phép.'})
  }
  const breadboards=graph.parts.filter(part=>part.type==='breadboard')
  if(breadboards.length)result.push({severity:'info',code:'breadboard-abstract-nodes',message:'Breadboard trong workspace chỉ có bốn node logic rail+, rail−, hàng A và hàng B; chưa mô phỏng nhóm lỗ/điểm cắm thực tế. Kiểm tra này chỉ xét các dây nối tới những node đó.',affectedPartIds:breadboards.map(part=>part.id),suggestedFix:'Dùng sơ đồ breadboard như minh họa khái niệm; đối chiếu sơ đồ nối chân và continuity của breadboard thật trước khi cấp nguồn.'})
  const roleTypes:Record<string,string[]>={'board-1':['board'],'led-1':['led'],'res-1':['resistor'],'resistor-1':['resistor'],'button-1':['button'],'ir-1':['ir-sensor'],'sonar-1':['ultrasonic'],'display-1':['seven-segment'],'battery-1':['battery'],'tb6612-1':['tb6612'],'motor-1':['dc-motor'],'dc-motor-1':['dc-motor'],'mosfet-1':['mosfet'],'diode-1':['diode'],'converter-1':['buck-converter','boost-converter']}
  const resolveRole=(id:string)=>parts.has(id)?id:graph.parts.find(part=>roleTypes[id]?.includes(part.type))?.id
  const sameWireNet=(left:string,right:string)=>{if(left===right)return true;const seenPins=new Set([left]),queue=[left];while(queue.length){for(const next of wireAdjacency.get(queue.shift()!)??[])if(next===right)return true;else if(!seenPins.has(next)){seenPins.add(next);queue.push(next)}}return false}
  const has=(a:string,p:string,b:string,q:string)=>sameWireNet(`${resolveRole(a)??a}:${p}`,`${resolveRole(b)??b}:${q}`)
  const seriesThrough=(type:string,from:string,to:string)=>graph.parts.filter(part=>part.type===type).some(part=>{const pins=getComponentDefinition(part.type)?.pins??[],first=`${part.id}:${pins[0]?.id}`,second=`${part.id}:${pins[1]?.id}`;return (sameWireNet(from,first)&&sameWireNet(second,to))||(sameWireNet(from,second)&&sameWireNet(first,to))})
  const boardPin=(pin:string)=>`${resolveRole('board-1')}:${pin}`
  const touchesBoard=(type:string)=>graph.wires.some(wire=>{const a=parts.get(wire.from.partId)?.type,b=parts.get(wire.to.partId)?.type;return (a==='board'&&b===type)||(a===type&&b==='board')})
  const ledHasSeriesPath=(led:CircuitGraph['parts'][number],reversed=false)=>Boolean(findLedSeriesPath(graph.parts,led,sameWireNet,reversed))
  for(const part of graph.parts.filter(item=>item.type==='led')){
    const definition=getComponentDefinition(part.type);const connected=connectedPins.has(`${part.id}:${definition?.pins[0]?.id}`)||connectedPins.has(`${part.id}:${definition?.pins[1]?.id}`)
    if(!connected)continue
    if(ledHasSeriesPath(part))continue
    if(ledHasSeriesPath(part,true))result.push({severity:'error',code:`led-reversed-${part.id}`,message:'LED đang được mắc ngược chiều: anode cần ở phía nguồn, cathode ở phía đường hồi.',affectedPartIds:[part.id],suggestedFix:'Đảo hai chân LED; điện trở nối tiếp có thể giữ nguyên.'})
    else result.push({severity:'error',code:`led-no-series-resistor-${part.id}`,message:'Chưa tìm thấy đường nối tiếp từ nguồn qua LED và điện trở về đường hồi.',affectedPartIds:[part.id,...graph.parts.filter(item=>item.type==='resistor').map(item=>item.id)],suggestedFix:'Đặt một điện trở nối tiếp ở phía anode hoặc cathode; kiểm tra nguồn, đường hồi và cực LED.'})
  }
  if(lesson==='ultrasonic-distance'&&boardCapability?.logicLevel.includes('3.3'))result.push({severity:'warning',code:'hcsr04-echo-logic-level',message:'HC-SR04 thường dùng nguồn 5 V; chân ECHO có thể đưa mức gần 5 V vượt giới hạn GPIO 3,3 V.',affectedPartIds:['sonar-1','board-1'],suggestedFix:'Dùng bộ chia áp/level shifter phù hợp và xác minh mức điện áp trên đúng module trước khi nối.'})
  if(boardCapability?.logicLevel.includes('3.3'))for(const part of graph.parts.filter(item=>item.type==='oled'))if(connectedPins.has(`${part.id}:sda`)||connectedPins.has(`${part.id}:scl`))result.push({severity:'warning',code:`i2c-pullup-check-${part.id}`,message:'Điện áp pull-up SDA/SCL phụ thuộc breakout OLED; pull-up 5 V có thể vượt giới hạn board 3,3 V.',affectedPartIds:[part.id,'board-1'],suggestedFix:'Kiểm tra điện áp pull-up thực tế và dùng level shifter nếu cần.'})
  if(graph.wires.some(wire=>{const a=parts.get(wire.from.partId),b=parts.get(wire.to.partId);return (['boost-converter','buck-converter'].includes(a?.type??'')&&a&&wire.from.pinId==='outPlus'&&b?.type==='board'&&['vcc','input'].includes(wire.to.pinId))||(a?.type==='board'&&['vcc','input'].includes(wire.from.pinId)&&['boost-converter','buck-converter'].includes(b?.type??'')&&b&&wire.to.pinId==='outPlus')}))result.push({severity:'warning',code:'converter-output-to-board',message:'Đầu ra DC–DC đang nối tới board. Mô hình không xác nhận điện áp module phù hợp với board.',affectedPartIds:graph.parts.filter(part=>part.type==='board'||part.type==='boost-converter'||part.type==='buck-converter').map(part=>part.id),suggestedFix:'Đo VOUT trước khi kết nối và đối chiếu giới hạn tuyệt đối của chân nguồn/tín hiệu board đang chọn.'})
  if(lesson==='blink'||lesson==='source-led'||lesson==='button-led'||lesson==='ir-alert'||lesson==='ultrasonic-distance'){
    const led=graph.parts.find(part=>part.type==='led')
    const ledPathReported=result.some(item=>item.code.startsWith('led-no-series-resistor-')||item.code.startsWith('led-reversed-'))
    if(!ledPathReported&&(!led||!ledHasSeriesPath(led))) result.push({severity:'error',code:'led-series-path',message:'Chưa tìm thấy đường nối tiếp từ nguồn qua anode LED, điện trở và đường hồi. Điện trở có thể nằm ở phía anode hoặc cathode.',affectedPartIds:['board-1','res-1','led-1'],suggestedFix:'Nối nguồn → anode LED → cathode → điện trở → GND (hoặc đặt điện trở trước LED); đảo hai chân điện trở không làm đổi chức năng.'})
  }
  if(lesson==='button-led'&&!seriesThrough('button',boardPin('input'),boardPin('gnd'))) result.push({severity:'error',code:'button-input-open',message:'Nút cần nối một tiếp điểm tới GPIO IN và tiếp điểm còn lại về GND (INPUT_PULLUP).',affectedPartIds:['board-1','button-1'],suggestedFix:'Nối GPIO IN tới một tiếp điểm và GND tới tiếp điểm còn lại; đảo hai tiếp điểm không làm đổi chức năng.'})
  if(lesson==='analog-ldr'){
    const led=graph.parts.find(part=>part.type==='led')
    const hasLedPath=Boolean(led&&ledHasSeriesPath(led))
    const hasDivider=seriesThrough('ldr',boardPin('vcc'),boardPin('input'))&&seriesThrough('resistor',boardPin('input'),boardPin('gnd'))
    if(!hasLedPath)result.push({severity:'error',code:'ldr-led-path-open',message:'Nhánh LED cần đường nối tiếp từ GPIO qua LED và điện trở về GND; điện trở có thể nằm trước hoặc sau LED.',affectedPartIds:['board-1',...(led?[led.id]:[]),...graph.parts.filter(part=>part.type==='resistor').map(part=>part.id)],suggestedFix:'Khôi phục dây của nhánh LED mẫu và giữ điện trở nối tiếp; đảo hai chân điện trở được.'})
    if(!hasDivider)result.push({severity:'error',code:'ldr-divider-open',message:'Bộ chia áp mẫu cần VCC → LDR → điểm giữa (GPIO analog và đầu điện trở cố định) → GND.',affectedPartIds:['board-1','ldr-1','resistor-ldr-1'],suggestedFix:'Nối LDR giữa VCC và điểm giữa; nối điểm giữa tới GPIO analog và một đầu điện trở; nối đầu còn lại của điện trở về GND.'})
  }
  if(lesson==='analog-potentiometer'){
    const pot=graph.parts.find(part=>part.type==='potentiometer')
    if(!pot||!has('board-1','vcc',pot.id,'vcc')||!has('board-1','input',pot.id,'wiper')||!has('board-1','gnd',pot.id,'gnd')) result.push({severity:'error',code:'potentiometer-divider-open',message:'Biến trở cần VCC, chân giữa (wiper) tới GPIO analog và GND.',affectedPartIds:['board-1',...(pot?[pot.id]:[])],suggestedFix:'Nối hai chân ngoài biến trở tới VCC/GND và chân giữa tới GPIO analog.'})
    const led=graph.parts.find(part=>part.type==='led')
    if(!led||!ledHasSeriesPath(led)) result.push({severity:'error',code:'potentiometer-led-path-open',message:'Nhánh LED cần đường nối tiếp từ nguồn qua LED và điện trở về GND; điện trở có thể đặt ở phía anode hoặc cathode.',affectedPartIds:['board-1','led-1'],suggestedFix:'Nối lại nhánh LED qua điện trở nối tiếp; đảo hai chân điện trở được.'})
  }
  if(lesson==='ir-alert'&&(!has('board-1','input','ir-1','out')||!has('board-1','vcc','ir-1','vcc')||!has('board-1','gnd','ir-1','gnd'))) result.push({severity:'error',code:'ir-signal-open',message:'Cảm biến IR cần OUT về GPIO IN, VCC và GND.',affectedPartIds:['board-1','ir-1'],suggestedFix:'Nối đủ ba dây OUT, VCC, GND.'})
  if(lesson==='ultrasonic-distance'&&(!has('board-1','trig','sonar-1','trig')||!has('board-1','echo','sonar-1','echo')||!has('board-1','vcc','sonar-1','vcc')||!has('board-1','gnd','sonar-1','gnd'))) result.push({severity:'error',code:'sonar-signal-open',message:'HC-SR04 cần TRIG, ECHO, VCC và GND.',affectedPartIds:['board-1','sonar-1'],suggestedFix:'Nối đủ bốn đường; ECHO của HC-SR04 thường cần chia áp trước GPIO 3,3 V.'})
  if(lesson==='seven-segment-counter'){
    for(let i=0;i<7;i++)if(!seriesThrough('resistor',boardPin(`seg${i}`),`${resolveRole('display-1')}:${['a','b','c','d','e','f','g'][i]}`)) result.push({severity:'error',code:`segment-${i}-open`,message:`Đoạn ${'ABCDEFG'[i]} cần một điện trở nối tiếp riêng.`,suggestedFix:'Nối chân board tới một điện trở riêng, rồi nối điện trở đó tới đúng đoạn của LED 7 đoạn.',affectedPartIds:['board-1',`seg-res-${i}`,'display-1']})
    if(!has('display-1','com1','board-1','gnd')||!has('display-1','com2','board-1','gnd'))result.push({severity:'error',code:'segment-common-open',message:'Hai chân COM chưa cùng nối về GND cho cấu hình cathode chung.',suggestedFix:'Nối cả hai chân COM của LED 7 đoạn về GND.',affectedPartIds:['display-1','board-1']})
  }
  if(lesson==='buck-boost-concept'){
    const converter=resolveRole('converter-1'),led=resolveRole('led-1')
    const ok=has('battery-1','positive','converter-1','inPlus')&&has('battery-1','negative','converter-1','inMinus')&&((seriesThrough('resistor',`${converter}:outPlus`,`${led}:anode`)&&has('led-1','cathode','converter-1','outMinus'))||(has('converter-1','outPlus','led-1','anode')&&seriesThrough('resistor',`${led}:cathode`,`${converter}:outMinus`)))
    if(!ok)result.push({severity:'error',code:'converter-topology-open',message:'Mạch khái niệm cần nguồn vào đúng cực IN+/IN− và đường OUT+ → điện trở → anode LED → cathode → OUT−.',affectedPartIds:['battery-1','converter-1','res-1','led-1'],suggestedFix:'Nối lại đúng cực và giữ điện trở nối tiếp LED. Đầu ra module thật cần được đo riêng trước khi nối board.'})
    if(has('converter-1','outPlus','converter-1','inPlus'))result.push({severity:'error',code:'converter-output-loop',message:'Không nối OUT+ trực tiếp về IN+ trong bài học này.',suggestedFix:'Xóa dây từ OUT+ về IN+; OUT+ chỉ nối tới tải.',affectedPartIds:['converter-1']})
  }
  if(lesson==='dc-motor-driver'){
    const ok=has('board-1','vcc','tb6612-1','vcc')&&has('battery-1','positive','tb6612-1','vm')&&has('board-1','gnd','tb6612-1','gnd')&&has('battery-1','negative','tb6612-1','gnd')&&has('board-1','input','tb6612-1','ain1')&&has('board-1','trig','tb6612-1','ain2')&&has('board-1','echo','tb6612-1','pwma')&&has('board-1','seg0','tb6612-1','stby')&&has('tb6612-1','a01','motor-1','positive')&&has('tb6612-1','a02','motor-1','negative')
    if(!ok)result.push({severity:'error',code:'motor-driver-topology-open',message:'Motor cần đi qua TB6612: VCC logic, VM nguồn motor, AIN1/AIN2, PWMA, STBY, AO1/AO2 và GND chung.',affectedPartIds:['board-1','battery-1','tb6612-1','motor-1'],suggestedFix:'Không nối motor trực tiếp GPIO. Kiểm tra nguồn VM riêng, STBY hoạt động và chung GND theo đúng module.'})
    if(touchesBoard('dc-motor'))result.push({severity:'error',code:'motor-direct-gpio',message:'Không nối motor trực tiếp vào chân MCU.',affectedPartIds:['board-1','motor-1'],suggestedFix:'Chèn driver hoặc MOSFET phù hợp theo topology bài học.'})
    result.push({severity:'warning',code:'motor-driver-limits',message:'PWM/chiều chỉ là trạng thái logic minh họa; không dự đoán dòng, nhiệt, tốc độ hay mô-men.',affectedPartIds:['tb6612-1','motor-1']})
  }
  if(lesson==='mosfet-switch'){
    const ok=seriesThrough('resistor',boardPin('input'),`${resolveRole('mosfet-1')}:gate`)&&has('mosfet-1','source','board-1','gnd')&&has('battery-1','positive','dc-motor-1','positive')&&has('dc-motor-1','negative','mosfet-1','drain')&&has('battery-1','negative','board-1','gnd')&&has('diode-1','anode','dc-motor-1','negative')&&has('diode-1','cathode','dc-motor-1','positive')
    if(!ok)result.push({severity:'error',code:'mosfet-low-side-open',message:'Bài cần GPIO qua điện trở tới Gate, Source về GND, tải giữa nguồn+ và Drain, GND chung và diode hồi tiếp đúng chiều.',affectedPartIds:['board-1','battery-1','resistor-1','mosfet-1','dc-motor-1','diode-1'],suggestedFix:'Kiểm tra thứ tự chân G/D/S của đúng package và mắc cathode diode về phía nguồn dương.'})
    if(touchesBoard('dc-motor'))result.push({severity:'error',code:'load-direct-gpio',message:'Không nối motor trực tiếp GPIO.',suggestedFix:'Xóa dây từ board tới motor; để MOSFET đóng ngắt motor.',affectedPartIds:['board-1','dc-motor-1']})
    result.push({severity:'warning',code:'mosfet-device-limits',message:'VGS, dòng tải, tản nhiệt và diode bảo vệ phụ thuộc linh kiện thực; sơ đồ không phải xác nhận thiết kế.',affectedPartIds:['mosfet-1','diode-1','dc-motor-1']})
  }
  if(!result.some(item=>item.severity==='error')) result.push({severity:'info',code:'topology-checked',message:'Topology yêu cầu của bài học đã được nối. Đây không phải kiểm tra dòng, điện áp hay ERC tổng quát.',affectedPartIds:[]})
  return result
}
