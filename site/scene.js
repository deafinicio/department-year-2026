import * as THREE from 'three';
import { FontLoader } from './vendor/FontLoader.js';
import { TextGeometry } from './vendor/TextGeometry.js';
import {elements,team,FINAL_INDEX} from './story.js';
import {createPodcastStudio} from './studio.js';
const clamp=x=>Math.max(0,Math.min(1,x));
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.58,metalness:.25,...extra});
const neon=color=>new THREE.MeshBasicMaterial({color,toneMapped:false});
function mesh(geometry,material,parent,p=[0,0,0]){const m=new THREE.Mesh(geometry,material);m.position.set(...p);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(parent,w,h,d,x,y,z,color=0x101d32){return mesh(new THREE.BoxGeometry(w,h,d),mat(color),parent,[x,y,z]);}
function texture(draw,w=768,h=1024){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function text(ctx,value,x,y,size=30,color='#c0e6ff',font='Rubik',align='left'){ctx.fillStyle=color;ctx.font=`${size}px ${font}`;ctx.textAlign=align;ctx.fillText(value,x,y);}
function label(parent,value,x,y,z,w=3.8,h=.28,color='#82b6cf'){
 const t=texture((ctx,cw,ch)=>{ctx.clearRect(0,0,cw,ch);text(ctx,value,cw/2,ch*.65,Math.min(57,cw/(value.length*.58)),color,'Rubik','center');},1024,150);
 const m=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}),parent,[x,y,z]);m.rotation.x=-Math.PI/2;m.castShadow=false;m.userData.decoration=true;return m;
}
function outline(parent,w,h,d,p,color){const l=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w,h,d)),new THREE.LineBasicMaterial({color,toneMapped:false,transparent:true,opacity:.8}));l.position.set(...p);parent.add(l);return l;}
function plaque(parent,draw,{x=0,y=1.4,z=0,w=1.5,h=2,angle=0,color='#5be7ff'}={}){
 const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=angle;parent.add(g);
 box(g,w+.07,h+.07,.12,0,0,-.07,0x0b1425);outline(g,w+.075,h+.075,.13,[0,0,-.065],color);
 const face=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture(draw),roughness:.65,emissive:0x46617b,emissiveIntensity:.35}),g,[0,0,.002]);face.castShadow=false;return {group:g,face};
}
function card(ctx,w,h,{title='2026',subtitle='ВІДДІЛ ПРОТИМІННОЇ ДІЯЛЬНОСТІ',color='#5be7ff',kind='lines',person=0}={}){
 ctx.fillStyle='#0b1425';ctx.fillRect(0,0,w,h);ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(22,22,w-44,h-44);
 ctx.fillStyle=color+'16';ctx.fillRect(45,45,w-90,h*.62);
 if(kind==='person'){
  const skin=['#9ac4d1','#b6a9d0','#d1a4bd','#aad0be'][person%4];ctx.fillStyle=color+'66';ctx.beginPath();ctx.ellipse(w*.5,h*.62,w*.30,h*.17,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle=skin;ctx.beginPath();ctx.ellipse(w*.5,h*.30,w*.12,h*.12,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#223348';ctx.beginPath();ctx.ellipse(w*.5,h*.22,w*.13,h*.055,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle=color;ctx.fillRect(w*.35,h*.53,w*.30,7);
 }else if(kind==='building'){
  ctx.fillStyle='#213c4e';ctx.fillRect(w*.18,h*.28,w*.64,h*.29);ctx.strokeStyle=color;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(w*.12,h*.28);ctx.lineTo(w*.5,h*.13);ctx.lineTo(w*.88,h*.28);ctx.stroke();for(let i=0;i<3;i++){ctx.fillStyle=color+'77';ctx.fillRect(w*(.26+i*.18),h*.34,w*.10,h*.12);}
 }else if(kind==='chart'){
  ctx.strokeStyle='#29435f';ctx.lineWidth=2;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(80,170+i*95);ctx.lineTo(w-70,170+i*95);ctx.stroke();}ctx.strokeStyle=color;ctx.lineWidth=8;ctx.beginPath();[[.13,.51],[.28,.42],[.43,.48],[.6,.30],[.75,.34],[.88,.19]].forEach(([x,y],i)=>i?ctx.lineTo(w*x,h*y):ctx.moveTo(w*x,h*y));ctx.stroke();
 }else{
  ctx.strokeStyle=color+'99';ctx.lineWidth=4;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(85,180+i*85);ctx.lineTo(w*(i%2?.71:.86),180+i*85);ctx.stroke();}ctx.fillStyle=color;ctx.fillRect(85,120,80,9);
 }
 text(ctx,title,w/2,h*.76,Math.min(51,650/(title.length*.58)),color,'Rubik','center');text(ctx,subtitle,w/2,h*.84,20,'#6c8da5','Rubik','center');text(ctx,'ХОО ТЧХУ / 2026',w/2,h*.93,18,'#44617c','Rubik','center');
}
function glowTexture(){return texture((ctx,w,h)=>{const g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'#ffffff55');g.addColorStop(.38,'#ffffff20');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);},256,256);}
export function createYearScene(container,{onOpen,onReady,onError}){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Темна неонова платформа з одинадцятьма інтерактивними елементами');container.append(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x060b16);scene.fog=new THREE.Fog(0x060b16,65,155);
 const camera=new THREE.PerspectiveCamera(37,1,.1,220);camera.position.set(31,29,39);const look=new THREE.Vector3(0,.7,0),camBase=camera.position.clone();
 const ambient=new THREE.HemisphereLight(0x86b5ff,0x12162a,1.8);scene.add(ambient);
 const sun=new THREE.DirectionalLight(0x91bbff,3.2);sun.position.set(-15,25,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:95});sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;sun.shadow.radius=4;scene.add(sun);
 const fill=new THREE.DirectionalLight(0xa45cff,1.5);fill.position.set(16,9,-14);scene.add(fill);
 const ground=mesh(new THREE.PlaneGeometry(300,300),mat(0x060b16,{metalness:.45}),scene,[0,-.48,0]);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
 const world=new THREE.Group();scene.add(world);
 box(world,32,.42,24,0,-.25,0,0x091322);box(world,31.8,.09,23.8,0,.005,0,0x0d182a);
 outline(world,32.03,.43,24.03,[0,-.24,0],0x3279ac);outline(world,31.84,.05,23.84,[0,.04,0],0x56dfff);
 const grid=new THREE.GridHelper(31,31,0x24577d,0x18314e);grid.position.y=.06;grid.scale.z=.765;grid.material.transparent=true;grid.material.opacity=.38;world.add(grid);
 const glow=glowTexture();
 const year=new THREE.Group();year.position.set(0,.08,-.1);world.add(year);
 const fallback=plaque(year,(ctx,w,h)=>card(ctx,w,h,{title:'2026',color:'#5be7ff',kind:'chart'}),{x:0,y:1,z:0,w:5.2,h:1.8});
 new FontLoader().load('./vendor/helvetiker_regular.typeface.json',font=>{const g=new TextGeometry('2026',{font,size:2.1,depth:.42,curveSegments:8,bevelEnabled:true,bevelThickness:.035,bevelSize:.025,bevelSegments:2});g.computeBoundingBox();const width=g.boundingBox.max.x-g.boundingBox.min.x;mesh(g,mat(0x183044,{emissive:0x2589b1,emissiveIntensity:.7,metalness:.5}),year,[-width/2,.08,0]);year.remove(fallback.group);},undefined,()=>{});
 label(world,'МИ СКЛАДАЄМО РІК',0,.10,2.3,6,.4,'#8acde4');label(world,'ВІДДІЛ ПРОТИМІННОЇ ДІЯЛЬНОСТІ',0,.10,3,5.3,.22,'#426e8e');
 const layers=[],halos=[],routes=[];
 function podium(e,i){
  const g=new THREE.Group();g.position.set(e.pos[0],0,e.pos[1]);g.userData={index:i+1,element:e.id,reveal:0,target:0,delay:0};world.add(g);layers.push(g);
  box(g,4.6,.20,3.65,0,.17,0,0x0a1222);box(g,4.5,.06,3.55,0,.30,0,0x152039);
  const line=outline(g,4.65,.25,3.70,[0,.17,0],e.accent);g.userData.line=line;
  label(g,String(i+1).padStart(2,'0')+' / '+e.name.toUpperCase(),0,.345,1.55,4,.24,e.accent);
  const halo=mesh(new THREE.PlaneGeometry(7.8,6.5),new THREE.MeshBasicMaterial({map:glow,color:e.accent,transparent:true,opacity:.28,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}),g,[0,.075,0]);halo.rotation.x=-Math.PI/2;halo.castShadow=false;halo.userData.decoration=true;halo.raycast=()=>{};g.userData.halo=halo;
  return g;
 }
 elements.forEach((e,i)=>{
  const g=podium(e,i);
  if(e.id==='people'){
   team.forEach((p,k)=>{const row=Math.floor(k/5),col=k%5,cols=Math.min(5,team.length-row*5),x=(col-(cols-1)/2)*.80,y=.99+row*1.19;const photo=plaque(g,(ctx,w,h)=>card(ctx,w,h,{title:p.name.toUpperCase(),subtitle:p.role.toUpperCase(),color:p.color,kind:'person',person:k}),{x,y,z:0,w:.72,h:1.05,angle:0,color:p.color});photo.group.userData.person=k;});
  }else if(e.id==='learning'){
   plaque(g,(ctx,w,h)=>card(ctx,w,h,{title:'ПІДГОТОВКА',color:e.accent}),{x:-.7,y:1.52,z:-.1,w:1.8,h:2.25,angle:.12,color:e.accent});
   for(let k=0;k<5;k++)box(g,1.45,.11,1.2,.9,.43+k*.12,.35,k%2?0x263153:0x18243b);
   label(g,'ЗНАННЯ → ПРАКТИКА',.9,1.06,.35,1.55,.18,e.accent);
  }else if(e.id==='sessions'||e.id==='milestones'){
   [-1.15,0,1.15].forEach((x,k)=>{plaque(g,(ctx,w,h)=>card(ctx,w,h,{title:e.id==='sessions'?'СЕСІЯ / '+(k+1):'ІСТОРІЯ / '+(k+1),color:e.accent,kind:k%2?'lines':'building'}),{x,y:k===1?1.62:1.4,z:k===1?-.30:.12,w:1.05,h:k===1?2.1:1.8,angle:(k-1)*-.13,color:e.accent});});
  }else if(e.id==='geography'){
   box(g,3.6,.06,2.75,0,.41,-.10,0x102a30);
   const coords=[[-.65,-1.13],[-.1,-1.04],[.27,-1.2],[.71,-.87],[.6,-.57],[1.12,-.45],[1.02,-.1],[1.31,.21],[1.01,.48],[1.12,.87],[.66,.91],[.43,1.2],[.07,1],[-.3,1.3],[-.56,.99],[-.95,1.03],[-.95,.68],[-1.25,.5],[-1.06,.14],[-1.3,-.15],[-1.02,-.48],[-1.02,-.83],[-.69,-.78]];
   const shape=new THREE.Shape();coords.forEach(([x,y],k)=>k?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const region=mesh(new THREE.ExtrudeGeometry(shape,{depth:.15,bevelEnabled:true,bevelSize:.02,bevelThickness:.015,bevelSegments:1,steps:1}),mat(0x1b514b,{emissive:0x257b60,emissiveIntensity:.25}),g,[0,.46,-.08]);region.rotation.x=-Math.PI/2;
   [[-.5,-.4,'kharkiv'],[-.8,.45,'berestyn'],[.15,.8,'lozova'],[.65,.1,'izium']].forEach(([x,z,name])=>{const pin=new THREE.Group();pin.position.set(x,.65,z);pin.userData.place=name;g.add(pin);mesh(new THREE.CylinderGeometry(.025,.025,.5,8),neon(e.accent),pin,[0,.25,0]);mesh(new THREE.SphereGeometry(.13,16,12),neon(e.accent),pin,[0,.53,0]);const hit=mesh(new THREE.SphereGeometry(.25,8,8),new THREE.MeshBasicMaterial({visible:false}),pin,[0,.43,0]);hit.userData.hitArea=true;const ring=mesh(new THREE.RingGeometry(.18,.22,32),new THREE.MeshBasicMaterial({color:e.accent,side:THREE.DoubleSide,transparent:true,opacity:.6,toneMapped:false}),pin,[0,.005,0]);ring.rotation.x=-Math.PI/2;ring.userData.decoration=true;ring.raycast=()=>{};halos.push(ring);});
   label(g,'ХАРКІВСЬКА ОБЛАСТЬ',0,.48,-1.3,2.8,.17,e.accent);
  }else if(e.id==='mapping'){
   plaque(g,(ctx,w,h)=>card(ctx,w,h,{title:'MINE RISK MAP',subtitle:'ДАНІ → КАРТА → АНАЛІЗ',color:e.accent,kind:'chart'}),{x:0,y:1.6,z:-.35,w:3.15,h:1.95,color:e.accent});
   box(g,3.35,.12,1.65,0,.42,.2,0x183443);outline(g,3.40,.14,1.70,[0,.43,.2],e.accent);
   [-.8,0,.8].forEach((x,k)=>{mesh(new THREE.CylinderGeometry(.11,.11,.18,16),neon(e.accent),g,[x,.59,.55]);});
  }else if(e.id==='community'){
   for(let k=0;k<3;k++){const x=(k-1)*1.1;box(g,.85,.85,.78,x,.78,0,0x28303a);const roof=mesh(new THREE.ConeGeometry(.72,.48,4),mat(0x493c38,{emissive:0x9c6422,emissiveIntensity:.18}),g,[x,1.44,0]);roof.rotation.y=Math.PI/4;box(g,.22,.3,.02,x,1,.401,0x66a4a4);}
   const arc=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.4,1.9,-.3),new THREE.Vector3(0,2.6,-.3),new THREE.Vector3(1.4,1.9,-.3)]);mesh(new THREE.TubeGeometry(arc,32,.025,7,false),neon(e.accent),g);
  }else if(e.id==='resources'){
   plaque(g,(ctx,w,h)=>card(ctx,w,h,{title:'ІНСТРУМЕНТИ',color:e.accent,kind:'chart'}),{x:0,y:1.5,z:-.3,w:2.65,h:1.7,color:e.accent});box(g,2.7,.10,1.3,0,.42,.2,0x21324d);outline(g,2.75,.10,1.35,[0,.43,.2],e.accent);
  }else if(e.id==='digital-space'){
   createPodcastStudio(g,{accent:e.accent});
  }else if(e.id==='partners'){
   [-.65,.65].forEach((x,k)=>{const torus=mesh(new THREE.TorusGeometry(.8,.12,12,50),mat(0x503669,{emissive:k?0x3043b0:0x7c2db0,emissiveIntensity:.65,metalness:.65}),g,[x,1.45,0]);torus.rotation.y=k?.30:-.30;});label(g,'ВЗАЄМОДІЯ',0,.37,.85,2.5,.25,e.accent);
  }else if(e.id==='statistics'){
   [-1.15,-.4,.4,1.15].forEach((x,k)=>{const h=[.7,1.15,1.55,2][k];box(g,.5,h,.75,x,.36+h/2,0,0x153b50);outline(g,.52,h+.02,.77,[x,.36+h/2,0],e.accent);});
   plaque(g,(ctx,w,h)=>card(ctx,w,h,{title:'ДАНІ / 2026',color:e.accent,kind:'chart'}),{x:0,y:2.35,z:-.5,w:2.6,h:1.2,color:e.accent});
  }
 });
 const routePoints=[[0,2.7],...elements.map(e=>e.pos)];
 elements.forEach((e,i)=>{const from=routePoints[i],to=e.pos;const mid=[(from[0]+to[0])/2,(from[1]+to[1])/2];const path=new THREE.CatmullRomCurve3([new THREE.Vector3(from[0],.10,from[1]),new THREE.Vector3(mid[0]*1.08,.10,mid[1]*1.08),new THREE.Vector3(to[0],.10,to[1])]);const route=mesh(new THREE.TubeGeometry(path,48,.032,6,false),neon(e.accent),world);route.castShadow=false;route.userData.decoration=true;route.raycast=()=>{};routes.push(route);});
 // A second set of connections expresses the contribution of people to every part of the year.
 const teamLinks=[];elements.slice(1).forEach((e,i)=>{const from=new THREE.Vector3(-11,.12,6),to=new THREE.Vector3(e.pos[0],.12,e.pos[1]);const mid=from.clone().lerp(to,.5);mid.y=.35;const path=new THREE.CatmullRomCurve3([from,mid,to]);const line=mesh(new THREE.TubeGeometry(path,64,.018,5,false),new THREE.MeshBasicMaterial({color:e.accent,transparent:true,opacity:.45,toneMapped:false,blending:THREE.AdditiveBlending,depthWrite:false}),world);line.userData.decoration=true;line.raycast=()=>{};const pulse=mesh(new THREE.SphereGeometry(.07,8,6),neon(e.accent),world);pulse.userData.decoration=true;pulse.raycast=()=>{};line.visible=pulse.visible=false;teamLinks.push({line,pulse,path});});
 const layerMaterials=layers.map(g=>{const materials=new Set();g.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])if(m.color)materials.add(m);});return [...materials].map(material=>({material,color:material.color.clone(),emissive:material.emissive?.clone()}));});
 const portraitGroups=layers[0].children.filter(o=>o.userData.person!==undefined);
 const equipmentHighlights=[];const studio=layers[7].getObjectByName('podcast-studio');
 studio.traverse(part=>{if(/^(studio-camera-\d|podcast-microphone-\d|studio-operator-desk)$/.test(part.name)){const helper=new THREE.BoxHelper(part,0xffd379);helper.material.transparent=true;helper.material.opacity=.48;helper.material.toneMapped=false;helper.visible=false;helper.userData.decoration=true;helper.raycast=()=>{};scene.add(helper);equipmentHighlights.push({part,helper});}});
 let cinematic=null,cinematicStarted=0;
 const focus=new THREE.PointLight(0x5be7ff,22,13,2);scene.add(focus);
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let hovered=null,moving=null,previousTime=performance.now(),reduced=false,stageIndex=0,alive=true,ready=false,mouseX=0,mouseY=0;
 function resize(){const {width,height}=container.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=cinematic?(innerWidth<=700?52:43):innerWidth<=700?44:37;const offset=cinematic?(cinematic.mode==='studio'&&innerWidth>700?-width*.18:0):innerWidth<=700?0:-width*.13;camera.setViewOffset(width,height,offset,0,width,height);camera.updateProjectionMatrix();}
 function frame(position,target,instant=false,whole=false){const t=new THREE.Vector3(...target),p=new THREE.Vector3(...position);if(innerWidth<=700)p.sub(t).multiplyScalar(whole||stageIndex===0||stageIndex===FINAL_INDEX?1.18:1.12).add(t);moving={start:performance.now(),duration:instant||reduced?0:1800,lift:1.2,from:camBase.clone(),to:p,lookFrom:look.clone(),lookTo:t};}
 function setChapter(index,position,target,{instant=false}={}){stageIndex=index;const count=Math.min(elements.length,index),now=performance.now();let newly=0;layers.forEach((g,i)=>{const v=i<count;if(v&&g.userData.target===0){g.userData.delay=now+newly*110;newly++;}g.userData.target=v?1:0;if(instant||reduced){g.userData.reveal=g.userData.target;g.userData.delay=0;}});const active=layers[count-1];focus.intensity=active&&index!==FINAL_INDEX?30:8;if(active){focus.position.set(active.position.x,3.5,active.position.z+1);focus.color.set(elements[count-1].accent);}frame(position,target,instant);}
 function cinematicShot(mode,step,shot){
  cinematic={mode,step,shot};cinematicStarted=performance.now();resize();
  layers.forEach((g,i)=>{g.userData.target=i<shot.count?1:0;g.userData.delay=0;if(mode!=='intro'||!shot.portraits||reduced)g.userData.reveal=g.userData.target;});
  portraitGroups.forEach(g=>{g.visible=true;g.scale.setScalar(1);});
  const p=new THREE.Vector3(...shot.camera),t=new THREE.Vector3(...shot.look);
  if(innerWidth<=700){if(mode==='studio'){p.sub(t).multiplyScalar(1.25).add(t);t.y-=.25;}else p.sub(t).multiplyScalar(1.15).add(t);}
  moving={start:performance.now(),duration:reduced?0:shot.duration,lift:mode==='studio'?.15:.8,from:camBase.clone(),to:p,lookFrom:look.clone(),lookTo:t};
  year.visible=mode!=='intro'||step>1;layers.forEach(g=>{g.position.y=(1-g.userData.reveal)*3.4;g.scale.setScalar(.78+g.userData.reveal*.22);g.rotation.y=(1-g.userData.reveal)*-.12;});world.updateMatrixWorld(true);equipmentHighlights.forEach(({part,helper})=>{helper.visible=mode==='studio'&&!!shot.highlight&&part.name.startsWith(shot.highlight);if(helper.visible)helper.update();});
  layerMaterials.forEach((entries,i)=>{const dim=shot.teamFocus&&i>0?.32:1;entries.forEach(({material,color,emissive})=>{material.color.copy(color).multiplyScalar(dim);if(emissive)material.emissive.copy(emissive).multiplyScalar(dim);});});
  ambient.intensity=mode==='intro'&&step===0?.45:1.8;sun.intensity=mode==='intro'&&step===0?.65:3.2;
  focus.color.set(mode==='studio'?'#ffd379':'#5be7ff');focus.intensity=shot.teamFocus?42:mode==='studio'?6:20;focus.position.set(mode==='studio'?11:-11,mode==='studio'?2.8:4,mode==='studio'?4:6);focus.distance=mode==='studio'?6:13;
 }
 function clearCinematic(){cinematic=null;equipmentHighlights.forEach(({helper})=>helper.visible=false);teamLinks.forEach(({line,pulse})=>line.visible=pulse.visible=false);portraitGroups.forEach(g=>{g.visible=true;g.scale.setScalar(1);});layerMaterials.flat().forEach(({material,color,emissive})=>{material.color.copy(color);if(emissive)material.emissive.copy(emissive);});ambient.intensity=1.8;sun.intensity=3.2;year.visible=true;focus.distance=13;resize();}
 function cinematicOrigin(){const p=new THREE.Vector3(12.43,1.39,3.26).project(camera),r=renderer.domElement.getBoundingClientRect();return [r.left+(p.x+1)*r.width/2,r.top+(1-p.y)*r.height/2];}
 function metadata(object){const data={};let n=object;while(n){if(n.userData.person!==undefined)data.person=n.userData.person;if(n.userData.place)data.place=n.userData.place;if(n.userData.index){if(!n.visible||n.userData.target!==1||n.userData.reveal<.88)return null;data.index=n.userData.index;data.element=n.userData.element;return data;}n=n.parent;}return null;}
 function effectiveVisible(o){let n=o;while(n){if(!n.visible)return false;n=n.parent;}return true;}
 function hit(event){if(cinematic)return null;const r=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(world.children,true);for(const h of hits){if(!effectiveVisible(h.object)||h.object.userData.decoration||h.object.isLineSegments||h.object.isGridHelper)continue;const d=metadata(h.object);return d?{...d,point:[event.clientX,event.clientY]}:null;}return null;}
 renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){const r=renderer.domElement.getBoundingClientRect();mouseX=(e.clientX-r.left)/r.width-.5;mouseY=(e.clientY-r.top)/r.height-.5;}const h=hit(e);hovered=h?.index||null;renderer.domElement.style.cursor=h?'pointer':'default';});
 renderer.domElement.addEventListener('pointerleave',()=>{hovered=null;mouseX=mouseY=0;});let down=null;renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down)return;const moved=Math.hypot(e.clientX-down[0],e.clientY-down[1]);down=null;if(moved>9)return;const h=hit(e);if(h)onOpen(h);});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();alive=false;onError('3D-сцену призупинено браузером. Оновіть сторінку, щоб відновити показ.');});
 function animate(now){if(!alive)return;requestAnimationFrame(animate);const dt=Math.min(.05,Math.max(0,(now-previousTime)/1000));previousTime=now;if(moving){const r=moving.duration?clamp((now-moving.start)/moving.duration):1,t=r<.5?4*r*r*r:1-Math.pow(-2*r+2,3)/2;camBase.lerpVectors(moving.from,moving.to,t);camBase.y+=Math.sin(r*Math.PI)*moving.lift;look.lerpVectors(moving.lookFrom,moving.lookTo,t);if(r===1)moving=null;}camera.position.copy(camBase);if(!reduced&&!cinematic){camera.position.x+=mouseX*.28;camera.position.y-=mouseY*.16;}camera.lookAt(look);
  layers.forEach((g,i)=>{const d=g.userData;if(now<d.delay&&d.target){g.visible=false;routes[i].visible=false;return;}d.reveal+=(d.target-d.reveal)*(reduced?1:1-Math.exp(-dt*5.3));if(Math.abs(d.target-d.reveal)<.001)d.reveal=d.target;g.visible=d.reveal>.005;g.position.y=(1-d.reveal)*3.4;g.scale.setScalar(.78+d.reveal*.22);g.rotation.y=(1-d.reveal)*-.12;d.line.material.opacity=hovered===i+1?1:.7;d.halo.material.opacity=hovered===i+1?.62:stageIndex===i+1?.43:.20;const route=routes[i];route.visible=g.visible;route.geometry.setDrawRange(0,Math.floor(route.geometry.index.count*d.reveal/3)*3);});
  if(cinematic){const {mode,shot}=cinematic,elapsed=now-cinematicStarted;
   if(mode==='intro'&&shot.portraits)portraitGroups.forEach((g,i)=>{const r=reduced?1:clamp((elapsed-i*220)/800);g.visible=r>0;g.scale.setScalar(.7+r*.3);});
   teamLinks.forEach(({line,pulse,path},i)=>{line.visible=!!shot.connections;pulse.visible=line.visible&&!reduced;const r=reduced?1:clamp((elapsed-i*110)/1900);line.geometry.setDrawRange(0,Math.floor(line.geometry.index.count*r/3)*3);if(pulse.visible)pulse.position.copy(path.getPointAt((elapsed/4500+i*.1)%1));});
  }
  halos.forEach((h,i)=>h.scale.setScalar(reduced?1:1.02+Math.sin(now*.0018+i)*.12));renderer.render(scene,camera);if(!ready){ready=true;onReady();}}
 resize();requestAnimationFrame(animate);
 return {setChapter,resize,cinematicShot,clearCinematic,cinematicOrigin,overview(p,t){frame(p,t,false,true);},setReduced(v){reduced=v;if(v){layers.forEach(g=>{g.userData.reveal=g.userData.target;g.userData.delay=0;});if(moving)moving.duration=0;}},origin(i){const g=layers[i-1];if(!g)return [innerWidth*.65,innerHeight*.45];const p=g.getWorldPosition(new THREE.Vector3());p.y+=1.4;p.project(camera);const r=renderer.domElement.getBoundingClientRect();return [r.left+(p.x+1)*r.width/2,r.top+(1-p.y)*r.height/2];},camera,scene,layers,dispose(){alive=false;renderer.dispose();}};
}
