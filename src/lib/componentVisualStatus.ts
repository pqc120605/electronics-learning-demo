export type ComponentVisualNoticeInput = {
  hasPartMesh: boolean
  boardModelHref?: string
}

export type ComponentVisualNotice = {
  title: string
  description: string
  href?: string
  linkLabel?: string
}

/** Keep a board-level CAD viewer distinct from a 3D mesh for an individual part. */
export function getComponentVisualNotice({ hasPartMesh, boardModelHref }: ComponentVisualNoticeInput): ComponentVisualNotice | null {
  if (hasPartMesh) return null
  if (boardModelHref) {
    return {
      title: 'Chưa có model 3D riêng cho linh kiện này',
      description: 'Board có mô hình CAD 3D tham khảo.',
      href: boardModelHref,
      linkLabel: 'Xem mô hình board 3D',
    }
  }
  return {
    title: 'Chưa có model 3D',
    description: 'Hình trên là minh họa 2D.',
  }
}
