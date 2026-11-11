import {Vector3,MathUtils} from 'three';
import {oblasts,isOblast,mapBounds,clusterBounds} from './geography.js';

export const fov=41;
export {finaleDuration} from './timing.js';
export const far=300;
const localPoses=[[2.1,3.3,4.3],[1.7,2.9,3.85],[2.65,2.7,3.6],[1.5,3.3,3.7]];

// Fit the entire map or the active exhibit into the current viewport.
export function framing(regionIndex,phase,aspect){
  const focus=isOblast(regionIndex);
  const summary=regionIndex===3,finale=regionIndex===4;
  const [x,z]=focus?oblasts[regionIndex].center:summary?[4.7,-3.71]:[-.2,2.3];
  const look=new Vector3(x,focus?.65:.1,z);
  const offset=new Vector3(...(focus?localPoses[phase]:summary?[.5,15,7]:finale?[0,31,5]:[3.5,35,14]));
  const back=offset.clone().normalize();
  const right=new Vector3(0,1,0).cross(back).normalize();
  const up=back.clone().cross(right);
  const vertical=Math.tan(MathUtils.degToRad(fov/2))*.88;
  const horizontal=vertical*Math.max(.1,aspect);
  const bounds=focus?[[x-.96,x+.96],[0,1.34],[z-.91,z+.91]]:summary?clusterBounds:mapBounds;
  let distance=offset.length();
  for(const bx of bounds[0])for(const by of bounds[1])for(const bz of bounds[2]){
    const point=new Vector3(bx,by,bz).sub(look);
    distance=Math.max(distance,point.dot(back)+Math.max(Math.abs(point.dot(right))/horizontal,Math.abs(point.dot(up))/vertical));
  }
  return {position:back.multiplyScalar(distance).add(look),look,bounds};
}

export function flightPosition(start,end,t,position,look,arcing=true){
  const p=MathUtils.clamp(t,0,1);
  const ease=p*p*(3-2*p);
  const arc=arcing?Math.sin(Math.PI*p)**2:0;
  const distance=start.look.distanceTo(end.look);
  position.lerpVectors(start.position,end.position,ease);
  position.y+=arc*MathUtils.clamp(distance*.8,2,7.4);
  position.z-=arc*1.45;
  look.lerpVectors(start.look,end.look,ease);
}
