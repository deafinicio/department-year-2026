import React,{Component,lazy,Suspense,useCallback,useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MotionConfig,motion,useReducedMotion} from 'motion/react';
import {ArrowDownRight,ArrowLeft,ArrowRight,Layers3,Maximize,Minimize,Pause,Play,ScanLine,Sparkles} from 'lucide-react';
import '@fontsource-variable/manrope';
import {regions,slides,sharedRows,sharedColumns,sections} from './content.js';
import FallbackPlatform from './FallbackPlatform.jsx';
import './style.css';

const Platform=lazy(()=>import('./Platform.jsx'));
const resultColumns=['Заплановано на 2026 рік','Фактично виконано','Коментар / причина'];
const pad=n=>String(n).padStart(2,'0');
const slideFromHash=()=>Math.max(0,slides.findIndex(s=>s.id===location.hash.slice(1)));
function supported(){
  try{
    const gl=document.createElement('canvas').getContext('webgl2');
    if(!gl)return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  }catch{return false;}
}

class SceneBoundary extends Component{
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(){this.props.onFailure();}
  render(){return this.state.failed?this.props.fallback:this.props.children;}
}
function DataTable({columns,rows,kind}){
  return <div className={'table-scroll '+kind}>
    <table aria-label={kind==='shared-table'?'Спільні виклики':'Порівняння планів і результатів'}>
      <thead><tr>{columns.map(column=><th key={column} scope="col">{column}</th>)}</tr></thead>
      <tbody>{rows.map((row,i)=><tr key={i}>{row.map((value,k)=><td key={k} data-label={columns[k]}>{value|| (kind==='shared-table'?'':'—')}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}
function Body({slide}){
  const r=slide.region;
  if(slide.kind==='opening')return <>
    <p className="lead">Підсумки діяльності за 2026 рік</p>
    <div className="opening-rule"/>
    <p className="intro-copy">Три області представлять свої результати, досягнення та плани на 2027 рік. Наприкінці — спільне обговорення викликів.</p>
  </>;
  if(slide.kind==='overview')return <>
    <p className="lead">Результати діяльності за 2026 рік</p>
    {r.metrics.length>0&&<>
      <p className="data-date">{r.cutoff}</p>
      <dl className="metrics">{r.metrics.map(([number,label])=><div key={label}><dt>{label}</dt><dd>{number}</dd></div>)}</dl>
    </>}
    <div className="speaker"><span className="speaker-dot"/><div><strong>{r.speaker}</strong><small>{r.role||'Доповідь області'}</small></div></div>
  </>;
  if(slide.kind==='results')return <DataTable columns={resultColumns} rows={r.results} kind="results-table"/>;
  if(slide.kind==='shared')return <DataTable columns={sharedColumns} rows={sharedRows} kind="shared-table"/>;
  const items=slide.kind==='achievements'?r.achievements:r.plans.map(title=>[title,'']);
  return <ol className={'item-list '+slide.kind}>{items.map(([title,detail],i)=><li key={title}>
    <span className="item-number">{pad(i+1)}</span><div><strong>{title}</strong>{detail&&<p>{detail}</p>}</div>
  </li>)}</ol>;
}

function App(){
  const [index,setIndex]=useState(slideFromHash);
  const [canRender,setCanRender]=useState(supported);
  const [quality,setQuality]=useState(()=>window.matchMedia('(max-width: 800px)').matches?'eco':'high');
  const [paused,setPaused]=useState(false);
  const [fullscreen,setFullscreen]=useState(false);
  const osReduced=useReducedMotion(),animate=!osReduced&&!paused;
  const panel=useRef(null);
  const slide=slides[index],active=slide.regionIndex,compact=['results','shared'].includes(slide.kind);
  const go=useCallback((value)=>setIndex(current=>Math.max(0,Math.min(slides.length-1,typeof value==='function'?value(current):value))),[]);
  const failure=useCallback(()=>setCanRender(false),[]);
  const toggleFullscreen=useCallback(async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen?.();}catch{}
  },[]);
  useEffect(()=>{
    const id=slides[index].id;
    if(location.hash!=='#'+id)history.replaceState(null,'','#'+id);
    panel.current?.scrollTo(0,0);
  },[index]);
  useEffect(()=>{
    function hash(){go(slideFromHash());}
    function full(){setFullscreen(Boolean(document.fullscreenElement));}
    function key(e){
      if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;
      if(['ArrowRight','PageDown'].includes(e.key)||(e.code==='Space'&&e.target===document.body)){e.preventDefault();if(e.target.tagName==='BUTTON')e.target.blur();go(i=>i+1);}
      else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();if(e.target.tagName==='BUTTON')e.target.blur();go(i=>i-1);}
      else if(e.key==='Home'){e.preventDefault();go(0);}
      else if(e.key==='End'){e.preventDefault();go(slides.length-1);}
      else if(e.code==='KeyF'){e.preventDefault();toggleFullscreen();}
    }
    window.addEventListener('hashchange',hash);document.addEventListener('fullscreenchange',full);window.addEventListener('keydown',key);
    return()=>{window.removeEventListener('hashchange',hash);document.removeEventListener('fullscreenchange',full);window.removeEventListener('keydown',key);};
  },[go,toggleFullscreen]);
  const fallback=<FallbackPlatform regionIndex={active} phase={slide.phase}/>;
  const chapter=slide.region?slide.region.short:slide.kind==='shared'?'Спільний підсумок':'Підсумки діяльності';
  return <MotionConfig reducedMotion={animate?'never':'always'}>
    <div className={'app '+slide.kind+(animate?'':' no-motion')} style={{'--accent':slide.region?.color||'#9bdef3'}}>
      <header className="top">
        <div className="brand"><span className="brand-icon"><Layers3 size={22}/></span><div><strong>Північно-східний кластер</strong><small>УКРАЇНСЬКИЙ ЧЕРВОНИЙ ХРЕСТ</small></div></div>
        <div className="top-right">
          <span className="edition">ЗВІТНІСТЬ КООРДИНАТОРІВ <b> / 2026</b></span>
          <button className="icon" disabled={!canRender} aria-label={quality==='high'?'Увімкнути економну графіку':'Увімкнути покращену графіку'} title={quality==='high'?'Покращена графіка':'Економна графіка'} aria-pressed={quality==='high'} onClick={()=>setQuality(q=>q==='high'?'eco':'high')}><Sparkles size={17}/></button>
          <button className="icon" aria-label={animate?'Призупинити анімацію':'Увімкнути анімацію'} title={animate?'Призупинити анімацію':'Увімкнути анімацію'} aria-pressed={!animate} disabled={osReduced} onClick={()=>setPaused(p=>!p)}>{animate?<Pause size={17}/>:<Play size={17}/>}</button>
          <button className="icon" aria-label={fullscreen?'Вийти з повноекранного режиму':'Повний екран'} title="Повний екран · F" onClick={toggleFullscreen}>{fullscreen?<Minimize size={17}/>:<Maximize size={17}/>}</button>
        </div>
      </header>
      <main className="workspace">
        <section className="copy-panel" ref={panel} aria-label="Поточний слайд">
            <motion.article key={slide.id} className="slide" initial={animate?{opacity:0,y:10}:false} animate={{opacity:1,y:0}} transition={{duration:animate?.34:0,ease:[.22,1,.36,1]}}>
              <p className="kicker"><span className="status-light"/>{slide.region?slide.region.name:chapter}<span className="phase">{slide.region?pad(slide.phase+1)+' / 04':slide.kind==='shared'?'ТРИ ОБЛАСТІ':'11.11.2026'}</span></p>
              <h1>{slide.title}</h1>
              <Body slide={slide}/>
            </motion.article>
        </section>
        <section className="stage" aria-label="Просторова платформа кластеру">
          <div className="stage-top"><span><ScanLine size={15}/> ПЛАТФОРМА КЛАСТЕРУ</span><span>{canRender?'3D':'ІЗОМЕТРІЯ'}</span></div>
          <div className="visual">
            {canRender?<SceneBoundary fallback={fallback} onFailure={failure}>
              <Suspense fallback={fallback}><Platform onFailure={failure} regionIndex={active} phase={slide.phase} animate={animate} quality={quality} compact={compact}/></Suspense>
            </SceneBoundary>:fallback}
          </div>
          <div className="stage-bottom">
            {regions.map((r,i)=><button type="button" key={r.id} className={'region-key '+(active===i?'selected':'')} onClick={()=>go(1+i*4)} aria-label={'Перейти: '+r.name} style={{'--r-color':r.color}}>
              <i/><span>{r.short}</span>
            </button>)}
          </div>
        </section>
      </main>
      <footer className="control">
        <nav className="rail" aria-label="Розділи презентації">
          <button onClick={()=>go(0)} aria-current={index===0?'page':undefined}><small>01</small>Вступ</button>
          {regions.map((r,i)=><button key={r.id} onClick={()=>go(1+i*4)} aria-current={active===i?'page':undefined} style={{'--segment':r.color}}><small>{pad(2+i*4)}–{pad(5+i*4)}</small>{r.short}</button>)}
          <button onClick={()=>go(13)} aria-current={index===13?'page':undefined}><small>14</small>Спільний підсумок</button>
        </nav>
        <div className="controls-row">
          <button className="prev" onClick={()=>go(i=>i-1)} disabled={!index} aria-label="Попередній слайд"><ArrowLeft size={18}/></button>
          <span className="counter"><b>{pad(index+1)}</b> / {slides.length}</span>
          {slide.region&&<nav className="scene-steps" aria-label="Сцени області">{sections.map((s,i)=><button key={s[0]} aria-label={s[1]} title={s[1]} aria-current={slide.phase===i?'step':undefined} onClick={()=>go(1+active*4+i)}/>)}</nav>}
          <span className="keyboard">← → &nbsp; PageUp / PageDown</span>
          <button className="next" onClick={()=>go(i=>i+1)} disabled={index===slides.length-1}>{index===0?'Почати виступ':index===slides.length-1?'Фінальний слайд':'Далі'} {index===slides.length-1?<ArrowDownRight size={17}/>:<ArrowRight size={17}/>}</button>
        </div>
      </footer>
      <p className="sr-only" aria-live="polite">Слайд {index+1} з {slides.length}. {slide.title}.</p>
    </div>
  </MotionConfig>;
}

createRoot(document.getElementById('root')).render(<App/>);
