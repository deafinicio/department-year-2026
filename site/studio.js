import * as THREE from 'three';

// A miniature recording studio, modelled as geometry rather than a classroom screen.
export function createPodcastStudio(parent,{accent='#ffd379'}={}){
 const room=new THREE.Group();room.name='podcast-studio';parent.add(room);
 const materials=new Map();
 function material(color,glow=0){const key=color+':'+glow;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.18,emissive:color,emissiveIntensity:glow,side:THREE.DoubleSide}));return materials.get(key);}
 function add(geometry,color,position,holder=room,glow=0){const m=new THREE.Mesh(geometry,material(color,glow));m.position.set(...position);m.castShadow=true;m.receiveShadow=true;holder.add(m);return m;}
 function box(w,h,d,p,color,holder=room,glow=0){return add(new THREE.BoxGeometry(w,h,d),color,p,holder,glow);}
 function rod(a,b,r=.018,color=0x202836,holder=room){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const m=add(new THREE.CylinderGeometry(r,r,delta.length(),8),color,start.clone().add(end).multiplyScalar(.5).toArray(),holder);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
 function group(name,x=0,z=0){const g=new THREE.Group();g.name=name;g.position.set(x,0,z);room.add(g);return g;}
 function screen(w,h,p,draw,holder=room){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=432;draw(canvas.getContext('2d'),768,432);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  box(w+.04,h+.04,.055,[p[0],p[1],p[2]-.027],0x0b1018,holder);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,toneMapped:false}));m.position.set(...p);holder.add(m);return m;
 }
 function feed(ctx,w,h,multiview=false){
  ctx.fillStyle='#081725';ctx.fillRect(0,0,w,h);
  const panes=multiview?4:1;
  for(let i=0;i<panes;i++){
   const pw=multiview?w/2:w,ph=multiview?h/2:h,x=multiview?(i%2)*pw:0,y=multiview?Math.floor(i/2)*ph:0;
   ctx.strokeStyle=i===3?'#ffd379':'#5be7ff';ctx.lineWidth=4;ctx.strokeRect(x+7,y+7,pw-14,ph-14);
   ctx.fillStyle='#74563f';ctx.beginPath();ctx.ellipse(x+pw*.5,y+ph*.73,pw*.31,ph*.12,0,0,Math.PI*2);ctx.fill();
   for(let k=0;k<3;k++){const px=x+pw*(.28+k*.22);ctx.fillStyle='#82909a';ctx.beginPath();ctx.arc(px,y+ph*.39,ph*.055,0,Math.PI*2);ctx.fill();ctx.fillRect(px-ph*.055,y+ph*.46,ph*.11,ph*.12);}
   ctx.fillStyle='#a8eaff';ctx.font='24px Rubik,Arial,sans-serif';ctx.fillText(multiview?(i===3?'ПРОГРАМА':'КАМ '+(i+1)):'СТУДІЯ',x+18,y+37);
  }
 }
 // Open walls keep the camera view clear; the acoustic treatment reads as a studio.
 box(4.16,.04,2.85,[0,.37,-.03],0x172331);
 const rug=add(new THREE.CylinderGeometry(1.02,1.02,.018,40),0x363b43,[-.44,.403,-.05]);rug.scale.z=.75;
 box(4.16,2.35,.09,[0,1.56,-1.40],0x1b2a3b);
 box(.09,2.35,2.65,[-2.04,1.56,-.12],0x172537);
 box(3.95,.025,.025,[0,.45,-1.34],accent,room,.65);
 box(.025,2.22,.025,[-1.98,1.56,-1.33],accent,room,.5);
 for(const x of [-1.79,-1.62,-1.45,1.25,1.42,1.59,1.76])box(.115,1.32,.10,[x,1.38,-1.30],0x101720);
 for(const z of [-.70,-.49,-.28,-.07,.14,.35,.56])box(.10,1.28,.13,[-1.96,1.39,z],0x101720);
 // Back-wall identity, rather than a teaching display.
 const emblem=add(new THREE.CylinderGeometry(.18,.18,.018,32),0xe6e0d0,[-1.05,2.18,-1.33]);emblem.rotation.x=Math.PI/2;
 box(.22,.07,.023,[-1.05,2.18,-1.30],0xb52b35);box(.07,.22,.023,[-1.05,2.18,-1.30],0xb52b35);
 screen(1.60,.46,[.03,2.17,-1.33],(ctx,w,h)=>{ctx.fillStyle='#1b2a3b';ctx.fillRect(0,0,w,h);ctx.fillStyle='#ffe7b0';ctx.textAlign='center';ctx.font='500 66px Rubik,Arial,sans-serif';ctx.fillText('ЦИФРОВИЙ',w/2,165);ctx.fillText('ОСВІТНІЙ ПРОСТІР',w/2,265);});
 // One oval podcast table and three upholstered chairs.
 const table=group('podcast-table',-.45,-.10);
 const top=add(new THREE.CylinderGeometry(.88,.88,.075,48),0x805b3d,[0,1.04,0],table);top.scale.z=.66;
 for(const x of [-.48,.48])for(const z of [-.26,.26])rod([x,.43,z],[x*.84,1.0,z*.84],.027,0x161d26,table);
 function chair(name,x,z,targetX,targetZ,scale=1){
  const g=group(name,x,z);g.rotation.y=Math.atan2(targetX-x,targetZ-z);g.position.y=.4*(1-scale);g.scale.setScalar(scale);
  const seat=add(new THREE.CylinderGeometry(.245,.23,.09,24),0x63707a,[0,.74,0],g);seat.scale.z=.9;
  add(new THREE.CylinderGeometry(.26,.24,.38,20,1,true,Math.PI/2,Math.PI),0x63707a,[0,1.0,0],g);
  box(.07,.07,.30,[-.235,.92,.02],0x63707a,g);box(.07,.07,.30,[.235,.92,.02],0x63707a,g);
  for(const x of [-.16,.16])for(const z of [-.13,.13])rod([x*1.13,.42,z*1.13],[x,.70,z],.018,0x161d26,g);
  return g;
 }
 chair('podcast-chair-1',-1.36,.02,-.45,-.10);
 chair('podcast-chair-2',-.45,-.91,-.45,-.10);
 chair('podcast-chair-3',.45,.02,-.45,-.10);
 const micPositions=[
  [[-1.04,1.08,.18],[-.90,1.66,.10],[-1.14,1.43,-.03]],
  [[-.45,1.08,-.35],[-.61,1.69,-.33],[-.45,1.43,-.61]],
  [[.16,1.08,.18],[.03,1.66,.10],[.25,1.43,-.03]]
 ];
 micPositions.forEach(([base,elbow,tip],i)=>{
  const g=group('podcast-microphone-'+(i+1));
  add(new THREE.CylinderGeometry(.047,.047,.06,12),0x171e27,base,g);
  rod(base,elbow,.022,0x151c25,g);rod(elbow,tip,.022,0x151c25,g);
  add(new THREE.SphereGeometry(.037,10,8),0x4d5b65,elbow,g);
  const end=[tip[0]+(i===0?-.10:i===2?.10:0),tip[1]-.025,tip[2]+(i===1?-.10:0)];
  rod(tip,end,.046,0x0c121a,g);
  add(new THREE.SphereGeometry(.047,12,8),0x242e39,end,g);
 });
 // Three mirrorless cameras, with lenses and rear LCDs, on proper tripod legs.
 function stand(g,height,spread){
  rod([0,.76,0],[0,height,0],.018,0x26313e,g);
  for(let k=0;k<3;k++){const a=k*Math.PI*2/3;rod([0,.88,0],[Math.sin(a)*spread,.41,Math.cos(a)*spread],.021,0x202a36,g);}
 }
 [[-1.57,.96],[-.42,1.19],[.74,.96]].forEach(([x,z],i)=>{
  const g=group('studio-camera-'+(i+1),x,z);stand(g,1.17,.17);
  const head=new THREE.Group();head.name='camera-head';head.position.y=1.23;g.add(head);head.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(-.45-x,.05,-.10-z).normalize());
  box(.29,.18,.16,[0,0,0],0x111824,head);box(.10,.045,.09,[.035,.11,0],0x1e2936,head);
  const lens=add(new THREE.CylinderGeometry(.074,.087,.16,18),0x182432,[0,0,.14],head);lens.rotation.x=Math.PI/2;
  const glass=add(new THREE.CircleGeometry(.063,18),0x4194ad,[0,0,.224],head,.35);glass.castShadow=false;
  const rear=new THREE.Group();rear.position.z=-.091;rear.rotation.y=Math.PI;head.add(rear);screen(.205,.113,[0,0,0],(ctx,w,h)=>feed(ctx,w,h),rear);
  add(new THREE.SphereGeometry(.018,8,6),0xff5261,[.11,.055,-.092],head,.7);
 });
 // Two tall octagonal softboxes, each with a diffusion panel and an eggcrate grid.
 [[-1.79,.22],[.84,-.93]].forEach(([x,z],i)=>{
  const g=group('studio-softbox-'+(i+1),x,z);stand(g,2.14,.19);
  const head=new THREE.Group();head.position.y=2.14;g.add(head);head.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(-.45-x,-.96,-.10-z).normalize());
  const body=add(new THREE.CylinderGeometry(.30,.21,.20,8),0x17212e,[0,0,0],head);body.rotation.x=Math.PI/2;
  const diffuser=add(new THREE.CircleGeometry(.275,8),0xffeac8,[0,0,.107],head,1.1);diffuser.castShadow=false;
  const pts=[];for(const offset of [-.14,0,.14]){const end=Math.sqrt(.265*.265-offset*offset);pts.push(-end,offset,.112,end,offset,.112,offset,-end,.112,offset,end,.112);}
  const grid=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(pts,3)),new THREE.LineBasicMaterial({color:0x2a2a29}));head.add(grid);
 });
 // Separate operator desk: multiview, laptop, video switcher and audio mixer.
 const desk=group('studio-operator-desk',1.43,-.42);
 box(1.10,.065,.79,[0,.94,0],0x6a4d37,desk);
 for(const x of [-.45,.45])for(const z of [-.29,.29])rod([x,.42,z],[x,.91,z],.021,0x202a36,desk);
 const monitor=screen(.88,.51,[0,1.39,-.32],(ctx,w,h)=>feed(ctx,w,h,true),desk);monitor.parent.name='studio-operator-desk';
 box(.055,.18,.055,[0,1.04,-.34],0x2b3745,desk);box(.32,.025,.18,[0,.985,-.29],0x26313e,desk);
 box(.34,.025,.22,[-.28,.99,.13],0x2b3745,desk);
 screen(.32,.20,[-.28,1.105,.045],(ctx,w,h)=>{ctx.fillStyle='#111f32';ctx.fillRect(0,0,w,h);ctx.fillStyle='#5be7ff';for(let i=0;i<5;i++)ctx.fillRect(55+i*125,100+(i%2)*50,78,150-(i%2)*50);},desk);
 const mixer=group('studio-audio-mixer');mixer.position.set(1.67,.985,-.22);
 box(.36,.045,.30,[0,0,0],0x17212e,mixer);
 for(let i=0;i<4;i++){const x=-.12+i*.08;add(new THREE.CylinderGeometry(.016,.016,.023,8),0x8b9aa6,[x,.035,-.07],mixer);box(.018,.012,.10,[x,.032,.035],0x6a7b8f,mixer);box(.039,.02,.022,[x,.048,.015+(i%2)*.035],accent,mixer,.15);}
 for(let i=0;i<4;i++)box(.052,.016,.038,[-.11+i*.072,.034,.113],i===1?0xc25464:0x4fa4af,mixer,.2);
 const switcher=group('studio-video-switcher');switcher.position.set(1.16,.988,-.06);
 box(.30,.025,.12,[0,0,0],0x182431,switcher);
 for(let i=0;i<4;i++)box(.047,.014,.042,[-.105+i*.07,.022,0],i===0?0xff6977:0x75c8cd,switcher,.25);
 chair('studio-operator-chair',1.47,.45,1.43,-.42,.88);
 return room;
}
