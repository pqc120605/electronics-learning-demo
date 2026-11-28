import { isDhtPart, keypadKeys } from '../data/kitPartProfiles'
import { ComponentIllustration } from './ComponentIllustration'

const packageImages: Record<string, { file: string; label: string }> = {
  'logic-74hc00': { file: 'r1-dip14', label: 'DIP-14' },
  'logic-74hc4511': { file: 'r1-dip16', label: 'DIP-16' },
  'timer-ne555': { file: 'r2b-dip8', label: 'DIP-8' },
}

/** Recognition artwork. Package references and teaching diagrams do not set pin or pad data. */
export function CatalogPartArtwork({ id, name }: { id: string; name: string }) {
  const reference = packageImages[id]
  if (reference) return <img className="parts-thumbnail-image" src={'/component-catalog/' + reference.file + '.webp'}
    alt={reference.label + ' · vỏ tham khảo'} loading="lazy" decoding="async" />
  const illustrated = isDhtPart(id) || id === 'keypad-4x4' || id === 'seven-segment-anode' || id === 'display-max7219'
  if (!illustrated) return <ComponentIllustration id={id} name={name} />

  return <svg className="parts-artwork" viewBox="0 0 180 126" role="img" aria-label={'Minh họa ' + name}>
    {isDhtPart(id) && <>
      <path d="M72 99v16m12-16v16m12-16v16m12-16v16" stroke="#9b8764" strokeWidth="4" strokeLinecap="round" />
      <rect x="58" y="13" width="64" height="88" rx="6" fill={id === 'dht11' ? '#126e98' : '#dae1df'} stroke="#264653" strokeWidth="2" />
      {Array.from({ length: 5 }, (_, row) => <rect key={row} x="67" y={23 + row * 11} width="46" height="6" rx="2" fill="#16333e" />)}
      <text x="90" y="93" textAnchor="middle" fontSize="10" fontWeight="700" fill={id === 'dht11' ? '#fff' : '#183541'}>
        {id === 'dht11' ? 'DHT11' : 'DHT22'}
      </text>
    </>}
    {id === 'keypad-4x4' && <>
      <path d="M73 86v22h34V86" fill="#ad8e54" stroke="#7d673d" strokeWidth="2" />
      <rect x="73" y="103" width="34" height="7" rx="1" fill="#d4ba86" />
      <rect x="34" y="10" width="112" height="87" rx="7" fill="#223a48" />
      {keypadKeys.map((key, index) => <g key={key} transform={`translate(${44 + index % 4 * 24}, ${18 + Math.floor(index / 4) * 18})`}>
        <rect width="20" height="15" rx="3" fill={index % 4 === 3 ? '#b64736' : '#edf1ed'} />
        <text x="10" y="11" textAnchor="middle" fontSize="9" fontWeight="700" fill={index % 4 === 3 ? '#fff' : '#123541'}>{key}</text>
      </g>)}
    </>}
    {id === 'seven-segment-anode' && <>
      <path d="M65 16v8m12-8v8m12-8v8m12-8v8m12-8v8m-48 80v8m12-8v8m12-8v8m12-8v8m12-8v8" stroke="#93856d" strokeWidth="4" strokeLinecap="round" />
      <rect x="53" y="23" width="74" height="81" rx="6" fill="#252b30" />
      <path d="M72 36h28m5 6v17m0 7v17m-33 6h28m-33-6V66m0-7V42m5 20h28" stroke="#f47768" strokeWidth="5" strokeLinecap="round" />
      <circle cx="115" cy="89" r="3" fill="#f47768" />
    </>}
    {id === 'display-max7219' && <>
      {Array.from({ length: 12 }, (_, index) => <path key={index} d={`M${30 + index * 11} 33v18m0 24v18`}
        stroke="#a89b82" strokeWidth="5" strokeLinecap="round" />)}
      <path d="M18 40h144v46H18V71a8 8 0 0 0 0-16Z" fill="#252c31" stroke="#172832" strokeWidth="2" />
      <circle cx="34" cy="48" r="2.5" fill="#cbd1cf" />
      <text x="90" y="67" textAnchor="middle" fontSize="13" fontWeight="700" fill="#e8edea">MAX7219</text>
    </>}
  </svg>
}
