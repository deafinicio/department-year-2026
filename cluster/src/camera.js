import {Vector3,MathUtils} from 'three';

export const centers=[-3.5,0,3.5];
export const fov=41;

// Fit the physical deck (or the active podium) inside the actual stage viewport.
export function framing(regionIndex,phase,aspect){
  const focus=regionIndex>=0&&regionIndex<3;
  const x=focus?centers[regionIndex]:0;
  const look=new Vector3(x,focus?.93:.65,0);
  const poses=[[4.4,5.4,8.3],[3.4,4.1,7],[4.5,4.5,6.5],[2.9,5.6,7.3]];
  const offset=new Vector3(...(focus?poses[phase]:regionIndex===3?[3.4,8.3,12.9]:[6.8,9.6,12.9]));
  offset.y-=look.y;
  const back=offset.clone().normalize();
  const right=new Vector3(0,1,0).cross(back).normalize();
  const up=back.clone().cross(right);
  const vertical=Math.tan(MathUtils.degToRad(fov/2))*.88;
  const horizontal=vertical*Math.max(.1,aspect);
  const bounds=focus?[[x-1.5,x+1.5],[.5,2.14],[-1.45,1.45]]:[[-5.67,5.67],[-.05,2.04],[-2.55,2.55]];
  let distance=offset.length();
  for(const bx of bounds[0])for(const by of bounds[1])for(const bz of bounds[2]){
    const point=new Vector3(bx,by,bz).sub(look);
    distance=Math.max(distance,point.dot(back)+Math.max(Math.abs(point.dot(right))/horizontal,Math.abs(point.dot(up))/vertical));
  }
  return {position:back.multiplyScalar(distance).add(look),look,bounds};
}
