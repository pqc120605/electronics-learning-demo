import { useState } from 'react'
import type { ComponentReference } from '../data/componentReferences'

type Photos = NonNullable<ComponentReference['photos']>

function PhotoFigure({ photo }: { photo: Photos[number] }) {
  const [failed, setFailed] = useState(false)

  return <figure className="component-reference-photo">
    {failed
      ? <div className="component-reference-photo-fallback" role="img" aria-label={photo.alt}>Ảnh tham khảo hiện không tải được</div>
      : <img src={photo.src} alt={photo.alt} loading="lazy" onError={() => setFailed(true)} />}
    <figcaption>
      <strong>{photo.label}</strong>
      <span>{photo.scopeNote}</span>
      <small>Ảnh: {photo.creator} · {photo.license} · {photo.changes} · <a href={photo.sourceUrl} target="_blank" rel="noreferrer">Nguồn ↗</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">Giấy phép ↗</a></small>
    </figcaption>
  </figure>
}

export function ComponentReferencePhotoGallery({ photos }: { photos: Photos }) {
  if (!photos.length) return null

  return <section className="component-reference-photos" aria-label="Ảnh linh kiện tham khảo">
    <h3>Ảnh linh kiện tham khảo</h3>
    <div className="component-reference-photo-grid">{photos.map((photo) => <PhotoFigure key={`${photo.src}:${photo.sourceUrl}`} photo={photo} />)}</div>
  </section>
}
