import { useState } from 'react'
import type { BoardSummary } from '../../data/boards'
import { getBoardCatalogImage, type BoardCatalogImage } from '../../lib/boardCatalogMedia'

export function BoardCatalogMedia({ board, image = getBoardCatalogImage(board), thumbnail = false }: {
  board: BoardSummary
  image?: BoardCatalogImage
  thumbnail?: boolean
}) {
  const [failedImage, setFailedImage] = useState('')
  const available = image && image.src !== failedImage
  return <div className={thumbnail ? 'board-catalog-media board-catalog-media--thumbnail' : 'board-catalog-media'}>
    <div className="board-catalog-picture" data-board-media={available ? 'image' : 'profile'}>
      {available
        ? <img src={image.src} alt={thumbnail ? '' : image.label + ' · ' + board.name} width={image.width}
          height={image.height} loading={thumbnail ? 'lazy' : undefined} decoding="async" onError={() => setFailedImage(image.src)} />
        : <div className="board-catalog-picture-fallback">
          <strong>{board.mcu ?? board.name}</strong>
          <span>{image ? 'Ảnh hiện không tải được' : 'Xem hình trong tài liệu hãng'}</span>
        </div>}
    </div>
    {!thumbnail && available && <p className="board-catalog-credit">
      <strong>{image.label}</strong>
      {image.note && <span>{image.note}</span>}
      {image.creditUrl && <a href={image.creditUrl} target="_blank" rel="noreferrer">Nguồn ảnh</a>}
    </p>}
  </div>
}
