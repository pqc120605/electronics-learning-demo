import logo from '../../../assets/brand/concepts/2026-11-15/mach-mo-logo-concept-v1.webp'
import './BrandLogo.css'

/** Displays the exact founder-selected artwork, including the Vietnamese wordmark. */
export function BrandLogo({compact=false}:{compact?:boolean}) {
  return <span className={`brand-logo${compact?' brand-logo-compact':''}`} aria-hidden="true"><img src={logo} alt="" width="540" height="180" decoding="async" /></span>
}
