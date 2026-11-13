import { getComponentIllustrationKind } from '../lib/componentIllustrationKind'

type Props = { id: string; name: string; className?: string }

/** Small, local teaching drawings. These are symbols/illustrations, not product CAD. */
export function ComponentIllustration({ id, name, className = '' }: Props) {
  const kind = getComponentIllustrationKind(id)
  const gradientId = `component-body-${id.replace(/[^a-z0-9_-]/gi, '-')}`
  return <figure className={`component-illustration ${className}`}>
    <svg viewBox="0 0 240 140" role="img" aria-label={`Hình minh họa ${name}`}>
      <defs><linearGradient id={gradientId} x1="0" x2="1"><stop stopColor="#1eb9ad"/><stop offset="1" stopColor="#116c6a"/></linearGradient></defs>
      <path d="M12 112H228" stroke="#40545a" strokeWidth="2" strokeDasharray="4 5"/>
      {kind === 'resistor' && <><path d="M15 70h48m114 0h48" stroke="#d5a55d" strokeWidth="5"/><rect x="62" y="52" width="116" height="36" rx="15" fill="#d5b77b"/><path d="M92 53v34m25-34v34m25-34v34" stroke="#9a432c" strokeWidth="7"/></>}
      {kind === 'led' && <><path d="M58 100V69m124 31V69" stroke="#d7b06a" strokeWidth="5"/><path d="M72 66a48 48 0 0 1 96 0v20H72z" fill={`url(#${gradientId})`} stroke="#7ce5d7" strokeWidth="3"/><path d="m95 38 15-17m18 17 15-17" stroke="#71eee0" strokeWidth="4"/><path d="m104 21 7 0-2 7m10-7 7 0-2 7" fill="none" stroke="#71eee0" strokeWidth="3"/></>}
      {kind === 'pot' && <><path d="M38 105h164" stroke="#d7b06a" strokeWidth="5"/><circle cx="120" cy="69" r="43" fill="#273b40" stroke="#70dfd1" strokeWidth="4"/><circle cx="120" cy="69" r="27" fill="#1b292d" stroke="#8da3a4" strokeWidth="3"/><path d="m120 67 19-18" stroke="#f0c872" strokeWidth="5"/><circle cx="120" cy="69" r="5" fill="#f0c872"/></>}
      {kind === 'button' && <><path d="M67 108V92m106 16V92" stroke="#d7b06a" strokeWidth="6"/><rect x="58" y="53" width="124" height="42" rx="8" fill="#b9c4bf" stroke="#e5eee9" strokeWidth="3"/><rect x="91" y="32" width="58" height="42" rx="8" fill="#34494d" stroke="#7de2d4" strokeWidth="3"/><path d="M103 32h34" stroke="#b9c4bf" strokeWidth="4"/></>}
      {kind === 'capacitor' && <><path d="M93 105V76m54 29V76" stroke="#d7b06a" strokeWidth="5"/><rect x="78" y="35" width="84" height="48" rx="7" fill="#34494d" stroke="#7de2d4" strokeWidth="3"/><path d="M92 39v40m14-40v40" stroke="#d1e5dd" strokeWidth="3"/><text x="120" y="62" textAnchor="middle" fill="#eef7f4" fontSize="12">+ / −</text></>}
      {kind === 'diode' && <><path d="M15 71h52m106 0h52" stroke="#d7b06a" strokeWidth="5"/><path d="m77 45 58 26-58 26z" fill="#45cabb" stroke="#b3f5eb" strokeWidth="3"/><path d="M141 45v52" stroke="#e8f3ee" strokeWidth="6"/></>}
      {kind === 'ldr' && <><path d="M38 105 68 83m104 0 30 22" stroke="#d7b06a" strokeWidth="5"/><circle cx="120" cy="69" r="42" fill="#31484b" stroke="#78e4d6" strokeWidth="4"/><path d="M99 81q21-26 42 0m-40-23q18-21 37-1" fill="none" stroke="#d7b06a" strokeWidth="5"/><path d="m80 26 14 11m66-12-14 12" stroke="#f0c872" strokeWidth="4"/></>}
      {kind === 'ultrasonic' && <><rect x="36" y="36" width="168" height="66" rx="9" fill="#28535a" stroke="#78e4d6" strokeWidth="3"/><circle cx="82" cy="68" r="25" fill="#b6c2b9" stroke="#e8f3ec" strokeWidth="4"/><circle cx="158" cy="68" r="25" fill="#b6c2b9" stroke="#e8f3ec" strokeWidth="4"/><circle cx="82" cy="68" r="14" fill="#33464b"/><circle cx="158" cy="68" r="14" fill="#33464b"/><text x="120" y="120" textAnchor="middle" fill="#9bb2b4" fontSize="12">TRIG · ECHO · VCC · GND</text></>}
      {kind === 'motor' && <><path d="M35 88h34m102 0h34" stroke="#d7b06a" strokeWidth="5"/><rect x="67" y="42" width="106" height="60" rx="10" fill="#68787a" stroke="#d9e2dc" strokeWidth="3"/><path d="M173 53h18v38h-18" fill="#aeb9b2"/><circle cx="95" cy="72" r="15" fill="#324449" stroke="#8fe8da" strokeWidth="3"/><path d="M87 72h16m-8-8v16" stroke="#d9e2dc" strokeWidth="3"/></>}
      {kind === 'display' && <><rect x="68" y="25" width="104" height="95" rx="8" fill="#1b292d" stroke="#71dfd1" strokeWidth="3"/>{['M91 38h58v10H91z','M149 49v25h-9V49z','M149 78v24h-9V78z','M91 100h58v10H91z','M91 78v24h-9V78z','M91 49v25h-9V49z','M91 69h58v10H91z'].map((d,i)=><path key={i} d={d} fill="#f15a49" opacity={i===0||i===1||i===2||i===3||i===4||i===5?1:.45}/>)}</>}
      {kind === 'buzzer' && <><path d="M45 106 78 84m84 0 33 22" stroke="#d7b06a" strokeWidth="5"/><path d="M73 89V51q47-39 94 0v38z" fill="#263c41" stroke="#7de2d4" strokeWidth="4"/><path d="M82 55q38-30 76 0m-65 16q27-21 54 0" fill="none" stroke="#f0c872" strokeWidth="3"/></>}
      {kind === 'wire' && <><path d="M36 92c38-74 130 44 168-32" fill="none" stroke="#2dd4bf" strokeWidth="7" strokeLinecap="round"/><rect x="20" y="86" width="26" height="14" rx="3" fill="#1b292d" stroke="#71dfd0" strokeWidth="2"/><rect x="194" y="52" width="26" height="14" rx="3" fill="#1b292d" stroke="#71dfd0" strokeWidth="2"/></>}
      {kind === 'breadboard' && <><rect x="40" y="30" width="160" height="82" rx="6" fill="#dfe6df" stroke="#9fb0a6" strokeWidth="2"/><path d="M40 71h160" stroke="#9fb0a6" strokeWidth="4"/><path d="M54 48h132M54 58h132M54 84h132M54 94h132" stroke="#55676b" strokeWidth="4" strokeDasharray="4 8"/></>}
      {kind === 'supply' && <><rect x="58" y="42" width="112" height="60" rx="8" fill={`url(#${gradientId})`} stroke="#7ce5d7" strokeWidth="3"/><rect x="170" y="60" width="12" height="24" rx="3" fill="#7ce5d7"/><path d="M78 72h20m-10-10v20M128 72h20" stroke="#04211f" strokeWidth="5" strokeLinecap="round"/></>}
      {(kind === 'board' || kind === 'module') && <><rect x="51" y="35" width="138" height="73" rx="8" fill="#17483f" stroke="#77e4d6" strokeWidth="3"/><rect x="94" y="49" width="54" height="43" rx="4" fill="#438b87" stroke="#b4ebe2" strokeWidth="2"/><path d="M59 43v58m122-58v58" stroke="#d7b06a" strokeWidth="4" strokeDasharray="3 6"/><text x="120" y="126" textAnchor="middle" fill="#9bb2b4" fontSize="11">PCB · MINH HỌA</text></>}
    </svg>
    <figcaption>Hình minh họa giáo dục · không phải CAD sản phẩm</figcaption>
  </figure>
}
