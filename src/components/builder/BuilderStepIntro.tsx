import type { Ref } from 'react'

type Props = { title: string; instruction: string; helper?: string; headingRef?: Ref<HTMLHeadingElement> }

export function BuilderStepIntro({ title, instruction, helper, headingRef }: Props) {
  return <header className="builder-step-intro">
    <div><p className="eyebrow">BƯỚC THỰC HÀNH</p><h2 ref={headingRef} tabIndex={-1}>{title}</h2></div>
    <div><p>{instruction}</p>{helper && <small>{helper}</small>}</div>
  </header>
}
