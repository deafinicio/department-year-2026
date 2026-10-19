import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
import * as THREE from '../site/vendor/three.module.js';
import * as story from '../site/story.js';
const root=new URL('../site/',import.meta.url).pathname;let frame;const events={};let opened=[];
const noop=()=>{},gradient={addColorStop:noop};const ctx=new Proxy({measureText:s=>({width:s.length*22}),createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:noop});
const dom={style:{},setAttribute:noop,addEventListener:(n,f)=>events[n]=f,getBoundingClientRect:()=>({left:0,top:68,width:1440,height:675})};
class Renderer{constructor(){this.domElement=dom;this.shadowMap={};}setSize(){}setPixelRatio(){}dispose(){}render(s,c){s.updateMatrixWorld(true);c.updateMatrixWorld(true);}}
const context=vm.createContext({console,performance,devicePixelRatio:1,innerWidth:1440,innerHeight:900,document:{createElement:()=>({getContext:()=>ctx})},requestAnimationFrame:f=>frame=f});
const three= new vm.SyntheticModule(Object.keys(THREE),function(){for(const[k,v]of Object.entries(THREE))this.setExport(k,k==='WebGLRenderer'?Renderer:v);},{context});
const storyM=new vm.SyntheticModule(Object.keys(story),function(){for(const[k,v]of Object.entries(story))this.setExport(k,v);},{context});
const fontM=new vm.SourceTextModule(fs.readFileSync(root+'vendor/FontLoader.js','utf8'),{context});await fontM.link(()=>three);await fontM.evaluate();
const textM=new vm.SourceTextModule(fs.readFileSync(root+'vendor/TextGeometry.js','utf8'),{context});await textM.link(()=>three);await textM.evaluate();
const font=new fontM.namespace.FontLoader().parse(JSON.parse(fs.readFileSync(root+'vendor/helvetiker_regular.typeface.json','utf8')));class LocalFont{load(u,cb){cb(font);}}
const localFont=new vm.SyntheticModule(['FontLoader'],function(){this.setExport('FontLoader',LocalFont);},{context});
const studioM=new vm.SourceTextModule(fs.readFileSync(root+'studio.js','utf8'),{context});await studioM.link(()=>three);await studioM.evaluate();
const sceneM=new vm.SourceTextModule(fs.readFileSync(root+'scene.js','utf8'),{context});await sceneM.link(s=>s==='three'?three:s.endsWith('FontLoader.js')?localFont:s.endsWith('story.js')?storyM:s.endsWith('studio.js')?studioM:textM);await sceneM.evaluate();
const model=sceneM.namespace.createYearScene({append:noop,getBoundingClientRect:dom.getBoundingClientRect},{onOpen:d=>opened.push(d),onReady:noop,onError:m=>{throw Error(m);}});model.setReduced(true);
for(const i of [0,1,2,3,4,5,6,7,8,9,10,11,12,4,0,12]){model.setChapter(i,story.chapters[i].camera,story.chapters[i].look,{instant:true});frame(performance.now()+100);assert.equal(model.layers.filter(g=>g.visible).length,story.visibleLayers(i));}
function clickWorld(point){const v=point.clone().project(model.camera),e={clientX:(v.x+1)*720,clientY:68+(1-v.y)*337.5};events.pointerdown(e);events.pointerup(e);}
model.setChapter(1,story.chapters[1].camera,story.chapters[1].look,{instant:true});frame(performance.now()+100);
for(let i=0;i<story.team.length;i++){const g=model.layers[0].children.find(g=>g.userData.person===i),face=g.children.find(m=>m.geometry?.type==='PlaneGeometry');clickWorld(face.getWorldPosition(new THREE.Vector3()));assert.equal(opened.at(-1)?.person,i,'Individual portrait hit: '+i);}
for(let i=1;i<=story.elements.length;i++){model.setChapter(i,story.chapters[i].camera,story.chapters[i].look,{instant:true});frame(performance.now()+100);const e=story.elements[i-1];clickWorld(new THREE.Vector3(e.pos[0],.34,e.pos[1]+1.45));assert.equal(opened.at(-1)?.element,e.id,'Pedestal hit: '+e.id);}
model.setChapter(4,story.chapters[4].camera,story.chapters[4].look,{instant:true});frame(performance.now()+100);
for(const name of Object.keys(story.places)){let pin;model.layers[3].traverse(o=>{if(o.userData.place===name)pin=o;});const head=pin.children.find(o=>o.geometry?.type==='SphereGeometry');clickWorld(head.getWorldPosition(new THREE.Vector3()));assert.equal(opened.at(-1)?.place,name,'Map marker hit: '+name);}
const studio=model.layers[7].getObjectByName('podcast-studio');assert(studio,'Studio geometry exists');
for(const [prefix,n]of [['studio-camera-',3],['studio-softbox-',2],['podcast-microphone-',3],['podcast-chair-',3]])assert.equal(studio.children.filter(o=>o.name.startsWith(prefix)).length,n,prefix);
assert(studio.getObjectByName('studio-operator-desk'));assert(studio.getObjectByName('studio-audio-mixer'));assert(studio.getObjectByName('studio-video-switcher'));
const local=studio.clone();local.position.set(0,0,0);local.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(local);assert(bounds.min.x>=-2.3&&bounds.max.x<=2.3&&bounds.min.z>=-1.5&&bounds.max.z<=1.4,'Studio stays on pedestal');
model.setChapter(8,story.chapters[8].camera,story.chapters[8].look,{instant:true});frame(performance.now()+100);
for(const name of ['studio-camera-1','studio-camera-2','studio-camera-3','studio-softbox-1','studio-softbox-2','podcast-table','studio-operator-desk']){const part=studio.getObjectByName(name);clickWorld(new THREE.Box3().setFromObject(part).getCenter(new THREE.Vector3()));assert.equal(opened.at(-1)?.element,'digital-space','Studio detail remains clickable: '+name);}
const probeRay=new THREE.Raycaster();
for(const name of ['studio-camera-1','studio-camera-2','studio-camera-3','studio-softbox-1','studio-softbox-2']){
 const part=studio.getObjectByName(name),head=part.children.find(o=>o.isGroup),center=new THREE.Box3().setFromObject(head).getCenter(new THREE.Vector3());
 const ndc=center.clone().project(model.camera);assert(Math.abs(ndc.x)<1&&Math.abs(ndc.y)<1,'Equipment inside view: '+name);
 probeRay.setFromCamera(new THREE.Vector2(ndc.x,ndc.y),model.camera);
 const visible=probeRay.intersectObject(studio,true).find(h=>h.object.isMesh)?.object;
 let n=visible,belongs=false;while(n){if(n===part)belongs=true;n=n.parent;}assert(belongs,'Equipment head visible, not behind wall: '+name);
}

const {sequences}=await import('../site/cinema-story.js');
for(const width of [1440,390]){
 vm.runInContext(`innerWidth=${width};innerHeight=844`,context);
 dom.getBoundingClientRect=()=>({left:0,top:0,width,height:844});
 for(const [kind,seq] of Object.entries(sequences))for(const [step,shot]of seq.shots.entries()){
  model.cinematicShot(kind,step,shot);frame(performance.now()+10000);
  assert.equal(model.layers.filter(g=>g.visible).length,shot.count,kind+': layer count');
  assert(model.camera.position.toArray().every(Number.isFinite));
  const target=new THREE.Vector3(...shot.look).project(model.camera);assert(Math.abs(target.x)<.7&&Math.abs(target.y)<.7,kind+': target framed');
  if(kind==='studio'){
   const table=new THREE.Vector3(10.55,1.12,3.9);
   const monitor=new THREE.Vector3(12.43,1.39,3.26);const p=(step===3?monitor:table).project(model.camera);
   assert(Math.abs(p.x)<1&&Math.abs(p.y)<1,kind+': main subject in viewport '+width+' shot '+step+' '+p.toArray());
  }
 }
 model.clearCinematic();model.setChapter(0,story.chapters[0].camera,story.chapters[0].look,{instant:true});frame(performance.now()+10000);assert.equal(model.layers.filter(g=>g.visible).length,0);
 model.setChapter(1,story.chapters[1].camera,story.chapters[1].look,{instant:true});frame(performance.now()+10000);assert(portraitsRestored());
}
function portraitsRestored(){return model.layers[0].children.filter(g=>g.userData.person!==undefined).every(g=>g.visible&&g.scale.x===1);}
model.dispose();console.log('PASS: all 11 cinematic shots at desktop/mobile widths, expected layer counts, framed subjects and clean exit/reset. GPU renderer mocked.');
