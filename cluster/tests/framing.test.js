import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {fov,framing} from '../src/camera.js';
import {slides} from '../src/content.js';

test('every camera destination fits its exhibit or deck on narrow, desktop and wide stages',()=>{
  for(const aspect of [.36,.72,1,1.4,2.2])for(const slide of slides){
    const {position,look,bounds}=framing(slide.regionIndex,slide.phase,aspect);
    const camera=new PerspectiveCamera(fov,aspect,.1,110);
    camera.position.copy(position);
    camera.lookAt(look);
    camera.updateMatrixWorld();
    for(const x of bounds[0])for(const y of bounds[1])for(const z of bounds[2]){
      const ndc=new Vector3(x,y,z).project(camera);
      assert(Math.abs(ndc.x)<=.881&&Math.abs(ndc.y)<=.881&&Math.abs(ndc.z)<=1,`${slide.id}, aspect ${aspect}`);
    }
  }
});
