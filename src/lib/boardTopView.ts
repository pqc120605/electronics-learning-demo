import atlas from '../data/boardTopViews.json'
import type { BoardModelManifest, BoardPin } from '../components/board/boardSceneTypes'

export type TopViewBounds = {minX:number;maxX:number;minZ:number;maxZ:number}
export type BoardTopView = {id:string;image:string;width:number;height:number;boundsMm:TopViewBounds;projection:'orthographic-xz';asset:string;assetSha256:string;imageSha256:string;revision:string}
export type BoardDiagramPresentation = {id:string;name:string;revision:string;pinLabels:Record<string,string>;pinAnchors:Record<string,readonly number[]>;topView?:BoardTopView;model?:BoardModelManifest}
export function getBoardTopView(id:string):BoardTopView|undefined {
 return (atlas as Record<string,BoardTopView>)[id]
}
export function boardPinMatchesAnchor(pin: BoardPin, anchor: readonly number[] | undefined): boolean {
 return Boolean(anchor && pin.anchor?.every((meters, axis) => Math.abs(meters * 1000 - anchor[axis]) < 1e-6))
}
/** The image renderer uses this same linear X/Z projection. Height has no effect. */
export function projectTopViewPoint(bounds:TopViewBounds,rect:{x:number;y:number;width:number;height:number},point:readonly number[]):{x:number;y:number}|null {
 const values=[bounds.minX,bounds.maxX,bounds.minZ,bounds.maxZ,rect.x,rect.y,rect.width,rect.height,...point]
 if(point.length!==3||values.some(value=>!Number.isFinite(value))||bounds.maxX<=bounds.minX||bounds.maxZ<=bounds.minZ||rect.width<=0||rect.height<=0)return null
 const u=(point[0]-bounds.minX)/(bounds.maxX-bounds.minX),v=(point[2]-bounds.minZ)/(bounds.maxZ-bounds.minZ)
 if(u<0||u>1||v<0||v>1)return null
 return {x:rect.x+u*rect.width,y:rect.y+v*rect.height}
}
