import {useEffect,useRef} from 'react';
import {motion} from 'motion/react';
import {regions} from './content.js';
import {finaleDuration} from './timing.js';
import {mapAreas,oblasts,mapBox,isOblast,routePath} from './geography.js';

export default function FallbackPlatform({regionIndex,phase,animate}){
  const previous=useRef(regionIndex);
  const box=mapBox(regionIndex),from=previous.current;
  useEffect(()=>{previous.current=regionIndex;},[regionIndex]);
  const flight=animate&&isOblast(from)&&isOblast(regionIndex)&&from!==regionIndex;
  const regionFocus=isOblast(regionIndex);
  return <motion.svg className="platform-drawing map-drawing" initial={false}
    viewBox={box} animate={{viewBox:flight?[mapBox(from),mapBox(-1),box]:box}}
    transition={{duration:animate?(regionIndex===4?finaleDuration:flight?1.65:.62):0,ease:'easeInOut'}}
    role="img" aria-label="Мапа України: Чернігівська, Сумська та Харківська області">
    <defs>
      <linearGradient id="land-tone" x2="1" y2="1"><stop stopColor="#263f5a"/><stop offset="1" stopColor="#15253b"/></linearGradient>
    </defs>
    <g transform="translate(0 .24)" fill="#080d18" stroke="#1d3551" strokeWidth=".1">
      {mapAreas.map(a=><path key={a.name} d={a.path} fillRule="evenodd"/>)}
    </g>
    {mapAreas.map(a=><path key={a.name} d={a.path} fillRule="evenodd"
      fill={a.index<0?'url(#land-tone)':regions[a.index].color}
      fillOpacity={a.index<0?1:regionIndex===a.index?.43:.2}
      stroke={a.index<0?'#52718d':regions[a.index].color} strokeWidth=".045"/>)}
    {[0,1].map(i=><path key={i} d={routePath(i,i+1)} fill="none" stroke={regions[i+1].color} strokeWidth=".07" opacity={regionIndex>i?.9:.45} strokeDasharray=".16 .13"/>)}
    {oblasts.map(({center:[x,z]},i)=>{
      const r=regions[i],active=regionIndex===i,complete=regionIndex>i?3:active?phase:0;
      return <motion.g key={r.id} initial={false} animate={{opacity:active||!regionFocus?1:.78}}
        style={{color:r.color}}>
        <circle cx={x} cy={z} r={active?.39:.31} fill="#0b1726" stroke="currentColor" strokeWidth=".07"/>
        <circle cx={x} cy={z} r=".13" fill="currentColor"/>
        {complete>0&&[0,1,2].slice(0,complete).map(j=><rect key={j} x={x-.33+j*.24} y={z-.65} width=".17" height=".17" rx=".04" fill="currentColor"/>)}
        <text x={x} y={z+.88} textAnchor="middle" fill="#f3f8ff" paintOrder="stroke" stroke="#0b1526" strokeWidth=".11" fontSize={regionFocus?.38:.46} fontWeight="800">{r.short}</text>
      </motion.g>;
    })}
  </motion.svg>;
}
