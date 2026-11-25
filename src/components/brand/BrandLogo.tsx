import logo from '../../../assets/brand/concepts/2026-11-15/mach-mo-wordmark.webp'
import mark from '../../../assets/brand/concepts/2026-11-15/mach-mo-mark.webp'
import './BrandLogo.css'

/** Displays the exact founder-selected artwork, including the Vietnamese wordmark. */
export function BrandLogo({compact=false}:{compact?:boolean}) {
  return <span className={`brand-logo${compact?' brand-logo-compact':''}`} aria-hidden="true"><img src={compact ? mark : logo} alt="" width={compact ? 72 : 352} height={compact ? 72 : 83} /></span>
}
