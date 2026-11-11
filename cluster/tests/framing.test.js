import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {fov,far,framing,flightPosition} from '../src/camera.js';
import {slides} from '../src/content.js';

test('every camera destination fits its exhibit or deck on narrow, desktop and wide stages',()=>{
  for(const aspect of [.36,.72,1,1.4,2.2])for(const slide of slides){
    const {position,look,bounds}=framing(slide.regionIndex,slide.phase,aspect);
    const camera=new PerspectiveCamera(fov,aspect,.1,far);
    camera.position.copy(position);
    camera.lookAt(look);
    camera.updateMatrixWorld();
    for(const x of bounds[0])for(const y of bounds[1])for(const z of bounds[2]){
      const ndc=new Vector3(x,y,z).project(camera);
      assert(Math.abs(ndc.x)<=.881&&Math.abs(ndc.y)<=.881&&Math.abs(ndc.z)<=1,`${slide.id}, aspect ${aspect}`);
    }
  }
});

test('regional flights climb above both endpoints and land exactly at the destination',()=>{
  const p=new Vector3(),look=new Vector3();
  for(const [a,b] of [[0,1],[1,2],[2,1],[2,0]]){
    const start=framing(a,3,1),end=framing(b,0,1);
    flightPosition(start,end,.5,p,look);
    assert(p.y>Math.max(start.position.y,end.position.y));
    assert(look.x>Math.min(start.look.x,end.look.x)&&look.x<Math.max(start.look.x,end.look.x));
    flightPosition(start,end,1,p,look);
    assert(p.distanceTo(end.position)<1e-8&&look.distanceTo(end.look)<1e-8);
  }
});
