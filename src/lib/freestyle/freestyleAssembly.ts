import { assemblyHolePoint, getAssemblyPlanV2, localToWorld, footprintBox, type AssemblyPlan, type Vec3 } from '../assemblyLayout'
import { getSimulationTarget } from '../../data/simulationTargets'
import { getR2cBreadboard } from '../../data/catalogR2cBoards'
import { parseHole } from '../breadboardGrid'
import type { CircuitDocV2, CircuitEndpointV2 } from '../circuitDocV2'
import type { PinMap } from './freestyleCircuit'
import { getComponentMesh } from '../../data/componentModels'
import { getKitPartProfile } from '../../data/kitPartProfiles'
import { freestyleModelBounds, freestylePinAnchor, freestylePresentation } from './freestylePresentation'

/** Reuse canonical part/hole geometry, replace lesson aliases with the user's actual mapped board pads. */
export function freestyleAssembly(doc: CircuitDocV2, boardId: string, pinMap: PinMap): AssemblyPlan {
  const view=boardId?freestylePresentation(boardId,pinMap,doc):undefined
  const projection=doc.breadboards.length && !doc.parts.some(p=>p.type==='breadboard') ? {...doc,parts:[...doc.parts,{id:doc.breadboards[0].id,type:'breadboard',mount:{kind:'bench' as const,lane:'bottom' as const,order:0}}]} : doc
  const plan=getAssemblyPlanV2(projection,{boardId:view?.canonicalId??'',target:getSimulationTarget(boardId),lessonId:'blink'})
  const board=plan.placements.find(p=>p.type==='board')
  const pinPoints={...plan.pinPoints}
  if(board&&view){
    const bounds=view.bounds ?? freestyleModelBounds[view.canonicalId], width=bounds.max[0]-bounds.min[0]
    board.kind='board-cad';board.assetUrl=view.model.assetUrl;board.boundsMm=bounds
    board.originMm=[(bounds.min[0]+bounds.max[0])/2,bounds.min[1],(bounds.min[2]+bounds.max[2])/2]
    const bb=plan.placements.find(p=>p.type==='breadboard')
    board.positionMm=[bb?footprintBox(bb).minX-12-width/2:0,0,0]
    for(const key of Object.keys(pinPoints))if(key.startsWith(board.partId+':'))delete pinPoints[key]
    for(const role of Object.keys(view.pinLabels)){
      const anchor=freestylePinAnchor(view,pinMap,role)
      if(anchor)pinPoints[`${board.partId}:${role}`]=localToWorld(board,anchor)
    }
  }
  const resolve=(endpoint:CircuitEndpointV2):Vec3|undefined=>{
    if(endpoint.kind==='pin'){
      const placement=plan.placements.find(p=>p.partId===endpoint.partId)
      if(!placement || placement.kind==='fallback-box')return undefined
      if(placement.type!=='board' && !placement.legs?.some(leg=>leg.pinId===endpoint.pinId) && !getComponentMesh(placement.type)?.pinsMm?.[endpoint.pinId])return undefined
      return pinPoints[`${endpoint.partId}:${endpoint.pinId}`]
    }
    return assemblyHolePoint(endpoint.holeId,plan.grid)
  }
  const wireEnds:AssemblyPlan['wireEnds']={},wireEvidence:NonNullable<AssemblyPlan['wireEvidence']>={},diagnostics:NonNullable<AssemblyPlan['diagnostics']>=[]
  const evidence=(endpoint:CircuitEndpointV2):NonNullable<AssemblyPlan['wireEvidence']>[string]['from']=>{
    if(endpoint.kind==='hole')return {kind:'hole',evidence:!getR2cBreadboard(plan.grid?.spec)&&parseHole(endpoint.holeId)?.kind==='rail'?'unknown':'parametric',sourceKey:endpoint.holeId}
    const placement=plan.placements.find(p=>p.partId===endpoint.partId)
    return {kind:'pin',evidence:placement?.kind==='board-cad'||placement?.kind==='component-cad'?'cad':'parametric',sourceKey:`${endpoint.partId}:${endpoint.pinId}`}
  }
  for(const wire of doc.wires){const a=resolve(wire.from),b=resolve(wire.to);if(a&&b){wireEnds[wire.id]=[a,b];wireEvidence[wire.id]={from:evidence(wire.from),to:evidence(wire.to)}}else diagnostics.push({code:'UNRESOLVED_ENDPOINT',wireId:wire.id,message:`${wire.id}: chưa có tọa độ chân đúng board/pinMap; không vẽ đầu dây đoán.`})}
  const placements = plan.placements.filter(part => !getKitPartProfile(part.type) || Boolean(getComponentMesh(part.type)))
  return {...plan,placements,pinPoints,wireEnds,wireEvidence,diagnostics}
}
