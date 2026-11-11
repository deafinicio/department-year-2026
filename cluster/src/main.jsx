import React,{Component,lazy,Suspense,useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MotionConfig,motion,useReducedMotion} from 'motion/react';
import {ArrowDownRight,ArrowLeft,ArrowRight,ChartNoAxesCombined,Image as PhotoIcon,Layers3,Maximize,Minimize,Pause,Play,ScanLine,Sparkles} from 'lucide-react';
import '@fontsource-variable/manrope';
import {regions,slides,sharedRows,sharedColumns,regionalSlideIndices,sharedIndex} from './content.js';
import FallbackPlatform from './FallbackPlatform.jsx';
import {slidePhotos} from './photos.js';
import {PhotoGallery,PhotoDialog} from './Photos.jsx';
import KharkivBreakdown from './KharkivBreakdown.jsx';
import MapDemo from './MapDemo.jsx';
import {finaleDuration} from './timing.js';
import {finaleProjection} from './finale-transition.js';
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
function DataTable({columns,rows,kind,photos=[],onOpen}){
  return <div className={'table-scroll '+kind}>
    <table aria-label={kind==='shared-table'?'Спільні виклики':'Порівняння планів і результатів'}>
      <thead><tr>{columns.map(column=><th key={column} scope="col">{column}</th>)}</tr></thead>
      <tbody>{rows.map((row,i)=><tr key={i}>{row.map((value,k)=><td key={k} data-label={columns[k]}>{value|| (kind==='shared-table'?'':'—')}{k===0&&<PhotoLink index={photos.findIndex(p=>p.row===i)} onOpen={onOpen} title={value}/>}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}
function PhotoLink({index,onOpen,title}){
  return index>=0?<button className="inline-photo" aria-label={'Переглянути зображення: '+title} onClick={()=>onOpen(index)}><PhotoIcon size={12}/> Зображення</button>:null;
}
function Audience({audience}){
  return <section className="audience" aria-label="Віковий розподіл охоплених осіб">
    <p>Віковий розподіл</p>
    <div className="audience-bar" aria-hidden="true">{audience.map(a=><i key={a.label} style={{width:a.percent+'%'}}/>)}</div>
    <dl>{audience.map(a=><div key={a.label}><dt>{a.label}</dt><dd>{a.count.toLocaleString('uk-UA')} <span>· {a.percent.toLocaleString('uk-UA')}%</span></dd></div>)}</dl>
  </section>;
}
function Body({slide,photos,onOpen,onDemo}){
  if(slide.kind==='finale')return null;
  const r=slide.region;
  if(slide.kind==='opening')return <>
    <p className="lead">Підсумки діяльності за 2026 рік</p>
    <div className="opening-rule"/>
    <p className="intro-copy">Три області представлять свої результати, досягнення та плани на 2027 рік. Наприкінці — спільне обговорення викликів.</p>
  </>;
  if(slide.kind==='overview')return <>
    <p className="lead">Результати діяльності за 2026 рік</p>
    {r.metrics.length>0&&<>
      {r.cutoff&&<p className="data-date">{r.cutoff}</p>}
      <dl className="metrics">{r.metrics.map(([number,label,date])=><div key={label}><dt>{label}{date&&<small>{date}</small>}</dt><dd>{number}</dd></div>)}</dl>
    </>}
    {r.audience&&<Audience audience={r.audience}/>}
    {r.id==='kharkiv'&&<KharkivBreakdown/>}
    <div className="speaker"><span className="speaker-dot"/><div><strong>{r.speaker}</strong><small>{r.role||'Доповідь області'}</small></div></div>
  </>;
  if(slide.kind==='demo')return <>
    <p className="lead">Mine Risk Map · EORE Analytics</p>
    <p className="intro-copy demo-intro">Команда Харківщини створила власний вебінструмент для картографування сесій інформування про мінну небезпеку та аналізу результатів.</p>
    <ul className="item-list demo-features">
      <li><ScanLine size={19}/><div><strong>Мапа сесій</strong><p>Точки проведених сесій, тепловий шар і фільтри.</p></div></li>
      <li><ChartNoAxesCombined size={19}/><div><strong>Дашборд</strong><p>Показники охоплення, склад аудиторії та динаміка проведення сесій.</p></div></li>
    </ul>
    <button className="next demo-launch" onClick={onDemo}>Відкрити демонстрацію <ArrowRight size={17}/></button>
  </>;
  if(slide.kind==='results')return <DataTable columns={resultColumns} rows={r.results} kind="results-table" photos={photos} onOpen={onOpen}/>;
  if(slide.kind==='shared')return <DataTable columns={sharedColumns} rows={sharedRows} kind="shared-table"/>;
  const items=slide.kind==='achievements'?r.achievements:r.plans.map(title=>[title,'']);
  return <ol className={'item-list '+slide.kind}>{items.map(([title,detail],i)=><li key={title}>
    <span className="item-number">{pad(i+1)}</span><div><strong>{title}</strong>{detail&&<p>{detail}</p>}<PhotoLink index={photos.findIndex(p=>p.row===i)} onOpen={onOpen} title={title}/></div>
  </li>)}</ol>;
}

function App(){
  const [index,setIndex]=useState(slideFromHash);
  const [canRender,setCanRender]=useState(supported);
  const [quality,setQuality]=useState(()=>window.matchMedia('(max-width: 800px)').matches?'eco':'high');
  const [paused,setPaused]=useState(false);
  const [fullscreen,setFullscreen]=useState(false);
  const [demoOpen,setDemoOpen]=useState(false);
  const demoSession=useRef(null),demoAdvance=useRef(null);
  const osReduced=useReducedMotion(),animate=!osReduced&&!paused;
  const panel=useRef(null),dialogRef=useRef(null),stageRef=useRef(null),beforeFinale=useRef(null);
  const [photoChoice,setPhotoChoice]=useState({id:null,index:0});
  const [skippedGallery,setSkippedGallery]=useState(false);
  const slide=slides[index],active=slide.regionIndex;
  const finale=slide.kind==='finale';
  const regionSteps=regionalSlideIndices[active]||[];
  const photos=slidePhotos[slide.id]||[];
  const selected=photoChoice.id===slide.id?photoChoice.index:0;
  const selectPhoto=useCallback(i=>setPhotoChoice({id:slide.id,index:i}),[slide.id]);
  const openPhoto=useCallback(i=>{selectPhoto(i);dialogRef.current?.showModal();},[selectPhoto]);
  const go=useCallback(value=>{
    const visual=stageRef.current?.querySelector('.visual');
    beforeFinale.current=visual?.getBoundingClientRect();
    setIndex(current=>Math.max(0,Math.min(slides.length-1,typeof value==='function'?value(current):value)));
  },[]);
  useLayoutEffect(()=>{
    if(!finale)return;
    const from=beforeFinale.current;
    beforeFinale.current=null;
    if(!animate||!from)return;
    const stage=stageRef.current,visual=stage.querySelector('.visual');
    const initial=finaleProjection(from,stage.getBoundingClientRect());
    if(!initial||!visual||!stage.animate)return;
    const timing={duration:finaleDuration*1000,easing:'cubic-bezier(.42,0,.58,1)',fill:'both'};
    const reveal=stage.animate([{clipPath:initial.clipPath},{clipPath:'inset(0px 0px 0px 0px)'}],timing);
    const expand=visual.animate([{transform:initial.transform},{transform:'translate3d(0px,0px,0) scale(1)'}],timing);
    const start=document.timeline.currentTime;
    if(start!==null){reveal.startTime=start;expand.startTime=start;}
    return ()=>{reveal.cancel();expand.cancel();};
  },[finale,animate]);
  const openDemo=useCallback(()=>{
    if(demoSession.current)return;
    const session={native:null};
    demoSession.current=session;
    setDemoOpen(true);
    if(!document.fullscreenElement&&document.documentElement.requestFullscreen){
      session.native=document.documentElement.requestFullscreen().then(()=>true,()=>false);
    }
  },[]);
  const closeDemo=useCallback(()=>{
    const session=demoSession.current;
    demoSession.current=null;
    setDemoOpen(false);
    session?.native?.then(owned=>{
      if(owned&&!demoSession.current&&document.fullscreenElement===document.documentElement)document.exitFullscreen().catch(()=>{});
    });
  },[]);
  const step=useCallback(direction=>{
    if(demoSession.current){if(direction>0)demoAdvance.current?.();else closeDemo();return;}
    if(direction>0&&slide.kind==='demo'){openDemo();return;}
    const dialog=dialogRef.current;
    if(dialog?.open){
      const next=selected+direction;
      if(next>=0&&next<photos.length){selectPhoto(next);return;}
      dialog.close();
      if(direction>0)go(i=>i+1);
      return;
    }
    if(direction>0&&photos.length&&!skippedGallery){openPhoto(0);return;}
    go(i=>i+direction);
  },[selected,photos.length,skippedGallery,selectPhoto,openPhoto,go,slide.kind,openDemo,closeDemo]);
  const dismissPhoto=()=>{setSkippedGallery(true);dialogRef.current?.close();};
  const failure=useCallback(()=>setCanRender(false),[]);
  const toggleFullscreen=useCallback(async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen?.();}catch{}
  },[]);
  useEffect(()=>{
    const id=slides[index].id;
    if(location.hash!=='#'+id)history.replaceState(null,'','#'+id);
    panel.current?.scrollTo(0,0);
    setSkippedGallery(false);
    if(dialogRef.current?.open)dialogRef.current.close();
    if(demoSession.current)closeDemo();
  },[index,closeDemo]);
  useEffect(()=>{
    function hash(){go(slideFromHash());}
    function full(){setFullscreen(Boolean(document.fullscreenElement));}
    function key(e){
      if((slide.kind==='demo'&&e.repeat)||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;
      if(['ArrowRight','PageDown'].includes(e.key)||(e.code==='Space'&&e.target===document.body)){e.preventDefault();if(e.target.tagName==='BUTTON')e.target.blur();step(1);}
      else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();if(e.target.tagName==='BUTTON')e.target.blur();step(-1);}
      else if(e.key==='Home'){e.preventDefault();go(0);}
      else if(e.key==='End'){e.preventDefault();go(slides.length-1);}
      else if(e.code==='KeyF'){e.preventDefault();toggleFullscreen();}
    }
    window.addEventListener('hashchange',hash);document.addEventListener('fullscreenchange',full);window.addEventListener('keydown',key);
    return()=>{window.removeEventListener('hashchange',hash);document.removeEventListener('fullscreenchange',full);window.removeEventListener('keydown',key);};
  },[go,step,toggleFullscreen,slide.kind]);
  const fallback=<FallbackPlatform regionIndex={active} phase={slide.phase} animate={animate}/>;
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
        <section className="copy-panel" ref={panel} hidden={finale} aria-label="Поточний слайд">
            <motion.article key={slide.id} className="slide" initial={animate?{opacity:0,y:10}:false} animate={{opacity:1,y:0}} transition={{duration:animate?.34:0,ease:[.22,1,.36,1]}}>
              <p className="kicker"><span className="status-light"/>{slide.region?slide.region.name:chapter}<span className="phase">{slide.region?pad(regionSteps.indexOf(index)+1)+' / '+pad(regionSteps.length):slide.kind==='shared'?'ТРИ ОБЛАСТІ':'11.11.2026'}</span></p>
              <h1>{slide.title}</h1>
              <Body slide={slide} photos={photos} onOpen={openPhoto} onDemo={openDemo}/>
            </motion.article>
        </section>
        <section ref={stageRef} className={photos.length?'stage has-photos':'stage'} aria-label="Мапа та ілюстрації">
          {finale&&<div className="finale-overlay">
            <div><small>ПІВНІЧНО-СХІДНИЙ КЛАСТЕР · 2026</small><h1>{slide.title}</h1></div>
            <button type="button" onClick={()=>go(sharedIndex)} aria-label="Повернутися до підсумкової таблиці" title="Повернутися до таблиці · Page Up"><ArrowLeft size={19}/></button>
          </div>}
          <div className="stage-top"><span><ScanLine size={15}/> МАПА УКРАЇНИ</span><span>{canRender?'3D':'2D'}</span></div>
          <div className="visual">
            {canRender?<SceneBoundary fallback={fallback} onFailure={failure}>
              <Suspense fallback={fallback}><Platform onFailure={failure} regionIndex={active} phase={slide.phase} animate={animate} quality={quality}/></Suspense>
            </SceneBoundary>:fallback}
          </div>
          <div className="map-credit"><a href="https://www.geoboundaries.org/" target="_blank" rel="noreferrer">geoBoundaries</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></div>
          {photos.length>0&&<PhotoGallery photos={photos} selected={selected} onSelect={selectPhoto} onOpen={openPhoto}/>}
          <div className="stage-bottom">
            {regions.map((r,i)=><button type="button" key={r.id} className={'region-key '+(active===i?'selected':'')} onClick={()=>go(regionalSlideIndices[i][0])} aria-label={'Перейти: '+r.name} style={{'--r-color':r.color}}>
              <i/><span>{r.short}</span>
            </button>)}
          </div>
        </section>
      </main>
      <footer className="control">
        <nav className="rail" aria-label="Розділи презентації">
          <button onClick={()=>go(0)} aria-current={index===0?'page':undefined}><small>01</small>Вступ</button>
          {regions.map((r,i)=><button key={r.id} onClick={()=>go(regionalSlideIndices[i][0])} aria-current={active===i?'page':undefined} style={{'--segment':r.color}}><small>{pad(regionalSlideIndices[i][0]+1)}–{pad(regionalSlideIndices[i].at(-1)+1)}</small>{r.short}</button>)}
          <button onClick={()=>go(sharedIndex)} aria-current={index===sharedIndex?'page':undefined}><small>{pad(sharedIndex+1)}</small>Спільний підсумок</button>
        </nav>
        <div className="controls-row">
          <button className="prev" onClick={()=>go(i=>i-1)} disabled={!index} aria-label="Попередній слайд"><ArrowLeft size={18}/></button>
          <span className="counter"><b>{pad(index+1)}</b> / {slides.length}</span>
          {slide.region&&<nav className="scene-steps" aria-label="Сцени області">{regionSteps.map(i=><button key={slides[i].id} aria-label={slides[i].short} title={slides[i].short} aria-current={index===i?'step':undefined} onClick={()=>go(i)}/>)}</nav>}
          <span className="keyboard">← → &nbsp; PageUp / PageDown</span>
          <button className="next" onClick={()=>step(1)} disabled={index===slides.length-1}>{index===0?'Почати виступ':index===slides.length-1?'Фінальний слайд':slide.kind==='demo'?'Відкрити інструмент':slide.kind==='shared'?'До фіналу':photos.length&&!skippedGallery?'Показати фото':'Далі'} {index===slides.length-1?<ArrowDownRight size={17}/>:<ArrowRight size={17}/>}</button>
        </div>
      </footer>
      {demoOpen&&<MapDemo advanceRef={demoAdvance} onNext={()=>{closeDemo();go(i=>i+1);}} onClose={closeDemo}/>}
      <PhotoDialog dialogRef={dialogRef} photos={photos} selected={selected} onStep={step} onDismiss={dismissPhoto}/>
      <p className="sr-only" aria-live="polite">Слайд {index+1} з {slides.length}. {slide.title}.</p>
    </div>
  </MotionConfig>;
}

createRoot(document.getElementById('root')).render(<App/>);
