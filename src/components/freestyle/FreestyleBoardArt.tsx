import type { BoardDiagramPresentation } from '../../lib/boardTopView'
/** Straight source-model top view. Connectors are projected separately with identical bounds. */
export function FreestyleBoardArt({view,x,y,width,height}:{view:BoardDiagramPresentation;x:number;y:number;width:number;height:number}) {
  return <g data-board-art={view.id} aria-label={`${view.name} · ${view.revision}`}>
    <title>{`${view.name} · nhìn thẳng từ trên · ${view.revision}`}</title>
    {view.topView&&<image href={view.topView.image} x={x} y={y} width={width} height={height} preserveAspectRatio="none"/>}
    {!view.topView&&<text x={x} y={y+30} style={{fill:'#203b43',fontSize:13}}>Chưa có hình top-down đủ nguồn cho board này</text>}
    <text x={x} y={y+height+22} style={{fill:'#203b43',fontSize:14,fontWeight:700}}>{view.name}</text>
  </g>
}
