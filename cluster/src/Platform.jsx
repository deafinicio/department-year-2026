import {useEffect,useMemo,useRef} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {Environment,Lightformer,RoundedBox} from '@react-three/drei';
import {Bloom,EffectComposer,Vignette} from '@react-three/postprocessing';
import * as THREE from 'three';
import {regions} from './content.js';

import {fov,far,framing,flightPosition,finaleDuration} from './camera.js';
import {mapAreas,oblasts,isOblast} from './geography.js';
const dark=new THREE.Color('#0b1526');
const accent=(color,level)=>new THREE.Color(color).multiplyScalar(level);
const cablePaths=[0,1].map(i=>{
  const [x,z]=oblasts[i].center,[u,v]=oblasts[i+1].center;
  return new THREE.CatmullRomCurve3([new THREE.Vector3(x,.15,z),new THREE.Vector3((x+u)/2,.22,(z+v)/2-.68),new THREE.Vector3(u,.15,v)]);
});

function Camera({regionIndex,phase,animate,arrival}){
  const camera=useThree(s=>s.camera),size=useThree(s=>s.size);
  const aspect=regionIndex===4?window.innerWidth/Math.max(1,window.innerHeight):size.width/Math.max(1,size.height);
  const pose=useMemo(()=>framing(regionIndex,phase,aspect),[regionIndex,phase,aspect]);
  const target=useRef(pose.look.clone()),last=useRef(null),travel=useRef(null);
  useFrame((_,dt)=>{
    if(!last.current||!animate){
      camera.position.copy(pose.position);target.current.copy(pose.look);
      travel.current=null;arrival.current=1;
    }else if(last.current.region!==regionIndex){
      const from={position:camera.position.clone(),look:target.current.clone()};
      travel.current={from,elapsed:0,duration:regionIndex===4?finaleDuration:isOblast(last.current.region)&&isOblast(regionIndex)?1.65:1.25};
      arrival.current=0;
    }
    last.current={region:regionIndex};
    if(travel.current){
      const fly=travel.current;
      fly.elapsed+=Math.min(dt,.09);
      arrival.current=Math.min(1,fly.elapsed/fly.duration);
      flightPosition(fly.from,pose,arrival.current,camera.position,target.current);
      if(arrival.current===1)travel.current=null;
    }else if(animate){
      const t=1-Math.exp(-Math.min(dt,.06)*4.5);
      camera.position.lerp(pose.position,t);target.current.lerp(pose.look,t);
    }
    camera.lookAt(target.current);
  },-1);
  return null;
}

function MapTile({area,color,active}){
  const shapes=useMemo(()=>area.polygons.map(rings=>{
    function trace(path,ring){
      ring.forEach(([x,z],i)=>i===0?path.moveTo(x,-z):path.lineTo(x,-z));
      path.closePath();return path;
    }
    const s=trace(new THREE.Shape(),rings[0]);
    for(const hole of rings.slice(1))s.holes.push(trace(new THREE.Path(),hole));
    return s;
  }),[area]);
  return <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.24,0]} receiveShadow>
    <extrudeGeometry args={[shapes,{depth:.32,bevelEnabled:false,curveSegments:1}]}/>
    <meshStandardMaterial attach="material-0" color={color} metalness={.4} roughness={.66} emissive={color} emissiveIntensity={active?.2:.035}/>
    <meshStandardMaterial attach="material-1" color="#10253a" metalness={.38} roughness={.64}/>
  </mesh>;
}

function UkraineMap({regionIndex}){
  const outline=useMemo(()=>mapAreas.map(a=>{
    const vertices=[];
    a.polygons.forEach(p=>p.forEach(r=>r.slice(1).forEach(([x,z],i)=>vertices.push(r[i][0],.089,r[i][1],x,.089,z))));
    return new Float32Array(vertices);
  }),[]);
  return mapAreas.map((a,i)=>{
    const active=a.index===regionIndex&&a.index>=0;
    const tone=a.index<0?'#253c55':regions[a.index].color;
    return <group key={a.name}>
      <MapTile area={a} active={active} color={a.index<0?tone:accent(tone,active?.58:.29)}/>
      <lineSegments>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[outline[i],3]}/></bufferGeometry>
        <lineBasicMaterial color={a.index<0?'#607c94':tone} transparent opacity={active?.9:a.index<0?.45:.66}/>
      </lineSegments>
    </group>;
  });
}

function Route({path,color,enabled,animate}){
  const geometry=useMemo(()=>new THREE.TubeGeometry(path,72,.018,6,false),[path]);
  const material=useMemo(()=>new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0},uPower:{value:.35},uColor:{value:new THREE.Color(color)}},
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec2 vUv; uniform float uTime; uniform float uPower; uniform vec3 uColor; void main(){float flow=pow(0.5+0.5*cos(6.283*(vUv.x*2.0-uTime*.45)),12.0);gl_FragColor=vec4(uColor*uPower*(.75+flow*2.7),1.0);}',
    toneMapped:false,
  }),[color]);
  useEffect(()=>()=>{geometry.dispose();material.dispose();},[geometry,material]);
  useFrame(({clock})=>{
    material.uniforms.uTime.value=animate?clock.elapsedTime:0;
    material.uniforms.uPower.value=enabled?1.25:.32;
  });
  return <mesh geometry={geometry} material={material}/>;
}

function Plaque({region,number}){
  const texture=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=224;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#111e2e';ctx.fillRect(0,0,768,224);
    ctx.fillStyle=region.color;ctx.fillRect(24,32,5,158);
    ctx.font='600 38px system-ui';ctx.fillText('0'+number+' / РЕГІОН',53,80);
    ctx.fillStyle='#f4f8ff';ctx.font='700 58px system-ui';ctx.fillText(region.short,53,161);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
  },[region,number]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <mesh position={[0,.77,1.315]}><planeGeometry args={[2.44,.46]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>;
}

function Exhibit({type,color,on,animate}){
  const group=useRef(),v=useRef(on?1:0);
  useFrame((_,dt)=>{
    if(!group.current)return;
    v.current=animate?THREE.MathUtils.damp(v.current,on?1:0,7,Math.min(dt,.06)):Number(on);
    group.current.visible=v.current>.006;group.current.scale.setScalar(Math.max(.005,v.current));
    group.current.position.y=1.07+(1-v.current)*.36;
  });
  const x=[-.72,.04,.76][type];
  return <group ref={group} position={[x,1.07,-.25]}>
    <mesh castShadow receiveShadow position={[0,.04,0]}><cylinderGeometry args={[.29,.33,.09,32]}/><meshStandardMaterial color="#263953" metalness={.75} roughness={.25}/></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.095,0]}><ringGeometry args={[.245,.265,40]}/><meshBasicMaterial color={accent(color,1.5)} toneMapped={false} side={THREE.DoubleSide}/></mesh>
    {type===0?[.29,.47,.71].map((h,j)=><RoundedBox key={j} args={[.114,h,.18]} radius={.025} smoothness={3} position={[(j-1)*.16,h/2+.1,0]} castShadow><meshPhysicalMaterial color={color} metalness={.38} roughness={.17} clearcoat={1} emissive={color} emissiveIntensity={.13}/></RoundedBox>):
    type===1?<mesh castShadow position={[0,.49,0]} rotation={[.18,0,.18]}><icosahedronGeometry args={[.29,0]}/><meshPhysicalMaterial color={color} metalness={.38} roughness={.14} clearcoat={1} emissive={color} emissiveIntensity={.18}/></mesh>:
    <group position={[0,.48,0]}>
      <mesh castShadow rotation={[.12,.18,0]}><torusGeometry args={[.26,.055,16,44]}/><meshPhysicalMaterial color={color} metalness={.58} roughness={.21} clearcoat={1}/></mesh>
      <mesh><sphereGeometry args={[.065,14,12]}/><meshBasicMaterial color={accent(color,2.2)} toneMapped={false}/></mesh>
    </group>}
  </group>;
}

function Module({i,regionIndex,phase,animate,quality,arrival}){
  const r=regions[i],active=regionIndex===i,assembled=regionIndex>=i;
  const group=useRef(),band=useRef(),beacon=useRef();
  useFrame((_,dt)=>{
    const visible=assembled&&(!active||arrival.current>.74||!animate);
    const scale=animate?THREE.MathUtils.damp(group.current.scale.x,visible?1:.005,8,Math.min(dt,.06)):visible?1:.005;
    group.current.scale.setScalar(scale);
    group.current.visible=scale>.012;
    const y=active?.13:0;
    group.current.position.y=animate?THREE.MathUtils.damp(group.current.position.y,y,5,Math.min(dt,.06)):y;
    const boost=active?1.75:assembled?1.12:.50;
    band.current.color.lerp(accent(r.color,boost),animate?1-Math.exp(-Math.min(dt,.06)*7):1);
    beacon.current.emissiveIntensity=active?.45:assembled?.2:.08;
  });
  return <group position={[oblasts[i].center[0],.095,oblasts[i].center[1]]}>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.012,0]}><ringGeometry args={[.21,.28,42]}/><meshBasicMaterial color={accent(r.color,1.4)} toneMapped={false} side={THREE.DoubleSide}/></mesh>
    <group scale={.57} position={[0,-.285,0]}>
    <group ref={group} scale={.005}>
      <RoundedBox args={[2.83,.34,2.61]} radius={.10} smoothness={4} position={[0,.68,0]} castShadow receiveShadow><meshPhysicalMaterial color="#1f3149" metalness={.62} roughness={.27} clearcoat={1} clearcoatRoughness={.2}/></RoundedBox>
      <RoundedBox args={[2.70,.048,2.46]} radius={.022} smoothness={3} position={[0,.861,0]}><meshBasicMaterial ref={band} color={accent(r.color,.55)} toneMapped={false}/></RoundedBox>
      <RoundedBox args={[2.65,.14,2.41]} radius={.065} smoothness={4} position={[0,.96,0]} castShadow receiveShadow>
        <meshPhysicalMaterial color={r.color} metalness={.18} roughness={.19} transmission={quality==='high'?.42:0} thickness={.26} ior={1.43} clearcoat={1} clearcoatRoughness={.1} envMapIntensity={1.25}/>
      </RoundedBox>
      <Plaque region={r} number={i+1}/>
      <mesh position={[-.91,1.29,-.76]} castShadow><octahedronGeometry args={[.24,0]}/><meshPhysicalMaterial ref={beacon} color={r.color} metalness={.28} roughness={.12} clearcoat={1} emissive={r.color} emissiveIntensity={.24}/></mesh>
      {[0,1,2].map((type)=><Exhibit key={type} type={type} color={r.color} on={regionIndex>i||(active&&phase>type)} animate={animate}/>)}
    </group>
    </group>
  </group>;
}

function Deck({regionIndex,phase,animate,quality}){
  const arrival=useRef(1);
  return <>
    <color attach="background" args={['#0b1526']}/>
    <fog attach="fog" args={['#0b1526',55,185]}/>
    <hemisphereLight args={['#cfebff','#33465e',1.05]}/>
    <directionalLight position={[-3,22,11]} color="#fff2d7" intensity={3.15} castShadow shadow-mapSize-width={quality==='high'?1536:1024} shadow-mapSize-height={quality==='high'?1536:1024} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={19} shadow-camera-bottom={-16} shadow-camera-far={65} shadow-normalBias={.035} shadow-bias={-.0002} shadow-radius={3}/>
    <directionalLight position={[6,4,-5]} color="#8dccf7" intensity={2.2}/>
    <pointLight position={[0,3,3]} color="#94d9ff" intensity={16} distance={12} decay={2}/>
    <Environment resolution={quality==='high'?256:128}>
      <Lightformer intensity={5} position={[-4,5,3]} scale={[5,7,1]} color="#fff2dc" target={[0,0,0]}/>
      <Lightformer intensity={4} position={[5,3,-4]} scale={[4,6,1]} color="#b9dfff" target={[0,0,0]}/>
      <Lightformer intensity={2} position={[0,7,0]} scale={[8,4,1]} target={[0,0,0]}/>
    </Environment>
    <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-.39,0]}><planeGeometry args={[150,150]}/><meshPhysicalMaterial color={dark} metalness={.22} roughness={.55} clearcoat={.24}/></mesh>
    <UkraineMap regionIndex={regionIndex}/>
    {cablePaths.map((path,i)=><Route key={i} path={path} color={regions[i+1].color} enabled={regionIndex>i} animate={animate}/>)}
    {regions.map((r,i)=><Module key={r.id} i={i} regionIndex={regionIndex} phase={phase} animate={animate} quality={quality} arrival={arrival}/>)}
    <Camera regionIndex={regionIndex} phase={phase} animate={animate} arrival={arrival}/>
    {quality==='high'&&<EffectComposer multisampling={0} enableNormalPass={false}><Bloom intensity={.56} luminanceThreshold={1.06} luminanceSmoothing={.24} mipmapBlur/><Vignette offset={.23} darkness={.44}/></EffectComposer>}
  </>;
}

function ContextWatch({onFailure}){
  const renderer=useThree(s=>s.gl);
  useEffect(()=>{
    const onLost=e=>{e.preventDefault();onFailure();};
    renderer.domElement.addEventListener('webglcontextlost',onLost);
    return ()=>renderer.domElement.removeEventListener('webglcontextlost',onLost);
  },[renderer,onFailure]);
  return null;
}

export default function Platform({onFailure,...props}){
  return <Canvas frameloop={props.animate?'always':'demand'} shadows="percentage" camera={{position:[4,35,14],fov,near:.1,far}}
    dpr={props.quality==='high'?[1,1.5]:1}
    gl={{antialias:true,alpha:false,powerPreference:'high-performance',stencil:false}}
    onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.1;}}
    fallback={null}>
    <Deck {...props}/>
    <ContextWatch onFailure={onFailure}/>
  </Canvas>;
}
