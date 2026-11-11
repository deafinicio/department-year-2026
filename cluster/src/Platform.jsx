import {useEffect,useMemo,useRef} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {Environment,Lightformer,RoundedBox} from '@react-three/drei';
import {Bloom,EffectComposer,Vignette} from '@react-three/postprocessing';
import * as THREE from 'three';
import {regions} from './content.js';

const centers=[-3.5,0,3.5];
const dark=new THREE.Color('#0b1526');
const accent=(color,level)=>new THREE.Color(color).multiplyScalar(level);
const curvePoints=(points)=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
const cablePaths=[
  curvePoints([[-3.5,.54,.18],[-3.5,.53,1.62],[-3.5,.52,2.14],[0,.52,2.14],[0,.53,1.62],[0,.54,.18]]),
  curvePoints([[0,.54,.18],[0,.53,1.62],[0,.52,2.14],[3.5,.52,2.14],[3.5,.53,1.62],[3.5,.54,.18]]),
];

function Camera({regionIndex,phase,animate,compact}){
  const camera=useThree(s=>s.camera),size=useThree(s=>s.size);
  const target=useRef(new THREE.Vector3(0,.65,0));
  const position=useMemo(()=>new THREE.Vector3(),[]),look=useMemo(()=>new THREE.Vector3(),[]);
  useFrame((_,dt)=>{
    const region=regionIndex>=0&&regionIndex<3;
    const x=region?centers[regionIndex]:0;
    const narrow=size.width/Math.max(1,size.height)<1.1;
    const distance=(narrow?1.29:1)*(compact?1.05:1);
    if(region){
      const poses=[[4.4,5.4,8.3],[3.4,4.1,7.0],[4.5,4.5,6.5],[2.9,5.6,7.3]];
      const [a,b,c]=poses[phase];
      position.set(x+a*distance,b*distance,c*distance);
      look.set(x,.93,0);
    }else{
      position.set((regionIndex===3?3.4:6.8)*distance,(regionIndex===3?8.3:9.6)*distance,12.9*distance);
      look.set(0,.5,0);
    }
    const t=animate?1-Math.exp(-Math.min(dt,.06)*3.8):1;
    camera.position.lerp(position,t);target.current.lerp(look,t);camera.lookAt(target.current);
  });
  return null;
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
  return <mesh position={[0,.77,1.27]}><planeGeometry args={[2.44,.46]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>;
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

function Module({i,regionIndex,phase,animate,quality}){
  const r=regions[i],active=regionIndex===i,assembled=regionIndex>=i;
  const group=useRef(),band=useRef(),beacon=useRef();
  useFrame((_,dt)=>{
    const y=active?.13:0;
    group.current.position.y=animate?THREE.MathUtils.damp(group.current.position.y,y,5,Math.min(dt,.06)):y;
    const boost=active?1.75:assembled?1.12:.50;
    band.current.color.lerp(accent(r.color,boost),animate?1-Math.exp(-Math.min(dt,.06)*7):1);
    beacon.current.emissiveIntensity=active?.45:assembled?.2:.08;
  });
  return <group position={[centers[i],0,0]}>
    <group ref={group}>
      <RoundedBox args={[2.83,.34,2.61]} radius={.10} smoothness={4} position={[0,.68,0]} castShadow receiveShadow><meshPhysicalMaterial color="#1f3149" metalness={.62} roughness={.27} clearcoat={1} clearcoatRoughness={.2}/></RoundedBox>
      <RoundedBox args={[2.70,.048,2.46]} radius={.022} smoothness={3} position={[0,.861,0]}><meshBasicMaterial ref={band} color={accent(r.color,.55)} toneMapped={false}/></RoundedBox>
      <RoundedBox args={[2.65,.14,2.41]} radius={.065} smoothness={4} position={[0,.96,0]} castShadow receiveShadow>
        <meshPhysicalMaterial color={r.color} metalness={.18} roughness={.19} transmission={quality==='high'?.42:0} thickness={.26} ior={1.43} clearcoat={1} clearcoatRoughness={.1} envMapIntensity={1.25}/>
      </RoundedBox>
      <Plaque region={r} number={i+1}/>
      <mesh position={[-.91,1.29,-.76]} castShadow><octahedronGeometry args={[.24,0]}/><meshPhysicalMaterial ref={beacon} color={r.color} metalness={.28} roughness={.12} clearcoat={1} emissive={r.color} emissiveIntensity={.24}/></mesh>
      {[0,1,2].map((type)=><Exhibit key={type} type={type} color={r.color} on={regionIndex>i||(active&&phase>type)} animate={animate}/>)}
    </group>
  </group>;
}

function Deck({regionIndex,phase,animate,quality,compact}){
  return <>
    <color attach="background" args={['#0b1526']}/>
    <fog attach="fog" args={['#0b1526',18,34]}/>
    <hemisphereLight args={['#cfebff','#33465e',1.05]}/>
    <directionalLight position={[-5,9,6]} color="#fff2d7" intensity={3.15} castShadow shadow-mapSize-width={quality==='high'?1536:1024} shadow-mapSize-height={quality==='high'?1536:1024} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-normalBias={.035} shadow-bias={-.0002} shadow-radius={3}/>
    <directionalLight position={[6,4,-5]} color="#8dccf7" intensity={2.2}/>
    <pointLight position={[0,3,3]} color="#94d9ff" intensity={16} distance={12} decay={2}/>
    <Environment resolution={quality==='high'?256:128}>
      <Lightformer intensity={5} position={[-4,5,3]} scale={[5,7,1]} color="#fff2dc" target={[0,0,0]}/>
      <Lightformer intensity={4} position={[5,3,-4]} scale={[4,6,1]} color="#b9dfff" target={[0,0,0]}/>
      <Lightformer intensity={2} position={[0,7,0]} scale={[8,4,1]} target={[0,0,0]}/>
    </Environment>
    <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-.065,0]}><planeGeometry args={[150,150]}/><meshPhysicalMaterial color={dark} metalness={.22} roughness={.55} clearcoat={.24}/></mesh>
    <RoundedBox args={[11.27,.34,5.04]} radius={.13} smoothness={4} position={[0,.13,0]} castShadow receiveShadow><meshPhysicalMaterial color="#182539" roughness={.31} metalness={.7} clearcoat={1}/></RoundedBox>
    <RoundedBox args={[11.16,.055,4.94]} radius={.025} smoothness={3} position={[0,.326,0]}><meshBasicMaterial color={accent('#6bbce4',1.38)} toneMapped={false}/></RoundedBox>
    <RoundedBox args={[11.05,.18,4.83]} radius={.08} smoothness={4} position={[0,.433,0]} castShadow receiveShadow><meshPhysicalMaterial color="#1a2c45" roughness={.24} metalness={.6} clearcoat={1} clearcoatRoughness={.16}/></RoundedBox>
    <gridHelper position={[0,.525,0]} args={[10.8,36,'#496e8a','#2e4c66']} scale={[1,1,.431]}/>
    {cablePaths.map((path,i)=><Route key={i} path={path} color={regions[i+1].color} enabled={regionIndex>i} animate={animate}/>)}
    {regions.map((r,i)=><Module key={r.id} i={i} regionIndex={regionIndex} phase={phase} animate={animate} quality={quality}/>)}
    <Camera regionIndex={regionIndex} phase={phase} animate={animate} compact={compact}/>
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
  return <Canvas frameloop={props.animate?'always':'demand'} shadows="percentage" camera={{position:[7,10,14],fov:41,near:.1,far:90}}
    dpr={props.quality==='high'?[1,1.5]:1}
    gl={{antialias:true,alpha:false,powerPreference:'high-performance',stencil:false}}
    onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.1;}}
    fallback={null}>
    <Deck {...props}/>
    <ContextWatch onFailure={onFailure}/>
  </Canvas>;
}
