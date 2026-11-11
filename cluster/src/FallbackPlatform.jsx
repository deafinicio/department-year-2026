import {regions} from './content.js';

// Isometric cutaway preserves the same three modules without a graphics context.
export default function FallbackPlatform({regionIndex,phase}){
  return <svg className="platform-drawing" viewBox="0 0 720 530" role="img" aria-label="Платформа з трьома обласними модулями">
    <defs>
      <linearGradient id="deck-top" x1="0" x2="1" y1="0" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#233e58"/><stop offset="1" stopColor="#101d31"/></linearGradient>
      <linearGradient id="deck-side"><stop stopColor="#142338"/><stop offset="1" stopColor="#25435a"/></linearGradient>
      <radialGradient id="stage-light"><stop stopColor="#5396ba" stopOpacity=".24"/><stop offset="1" stopColor="#17253b" stopOpacity="0"/></radialGradient>
      <pattern id="iso-grid" width="41" height="22" patternUnits="userSpaceOnUse"><path d="M-20 11 21-11M0 22 41 0M21 33 62 11M-20 11 21 33M0 0l41 22M21-11l41 22" fill="none" stroke="#8bc0e8" strokeOpacity=".16" strokeWidth=".7"/></pattern>
    </defs>
    <ellipse cx="360" cy="327" rx="350" ry="165" fill="url(#stage-light)"/>
    <ellipse cx="360" cy="405" rx="275" ry="52" fill="#020710" opacity=".62"/>
    <path d="M54 323 359 161l307 162v26L359 512 54 350z" fill="url(#deck-side)" stroke="#4d708b"/>
    <path d="M54 323 359 161l307 162-307 162z" fill="url(#deck-top)" stroke="#80d3f2" strokeWidth="1.6"/>
    <path d="M54 323 359 161l307 162-307 162z" fill="url(#iso-grid)"/>
    <path d="m54 329 305 162 307-162" fill="none" stroke="#72d4fb" strokeWidth="2" opacity=".75"/>
    <path d="m178 326 183 97 182-97m-182 97V301" fill="none" stroke="#88ddf4" strokeOpacity=".53" strokeWidth="2"/>
    {[1,0,2].map(i=>{
      const r=regions[i],active=regionIndex===i,n=regionIndex>i?3:active?phase:0,x=[188,359,531][i],y=[304,246,304][i];
      return <g key={r.id} transform={`translate(${x} ${y-(active?16:0)})`} opacity={active||regionIndex===3?.99:.77}>
        <ellipse cy="49" rx="91" ry="33" fill="#080e1c" opacity=".55"/>
        <path d="M-94 0 0-48l94 48v25L0 76l-94-51z" fill="#172d43" stroke="#4c708c"/>
        <path d="M-94 0 0-48l94 48L0 50z" fill="#2d4d67" stroke={r.color} strokeWidth={active?2.5:1.2}/>
        <path d="M-90 16 0 65l90-49" fill="none" stroke={r.color} opacity={active?1:.6} strokeWidth="2"/>
        <path d="M-82-6 0-48l82 42L0 38z" fill={r.color} opacity=".14"/>
        <path d="M-56-28-43-57l13 29-13 14z" fill={r.color}/>
        {[0,1,2].slice(0,n).map(k=><g key={k} transform={`translate(${-18+k*30} ${-16+k*5})`}>
          {k===0?<path d="M-12 3v-21h6V3m4 0v-31h6V3m4 0v-40h6V3" fill={r.color}/>:k===1?<path d="m0-34 17 18L0 2l-17-18z" fill={r.color}/>:<circle cy="-17" r="15" fill="none" stroke={r.color} strokeWidth="5"/>}
        </g>)}
        <text x="0" y="48" textAnchor="middle" fill="#f1f7ff" fontSize="13" fontWeight="800">{r.short.toUpperCase()}</text>
      </g>;
    })}
  </svg>;
}
