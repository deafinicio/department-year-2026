import {useEffect,useImperativeHandle,useRef,useState} from 'react';
import {ArrowRight,ChartNoAxesCombined,ExternalLink,Map,X} from 'lucide-react';

export const mapUrl='https://deafinicio.github.io/mine-risk-map/';
const dashboardUrl=new URL('dashboard.html',mapUrl).href;

// The published presentation and tool have the same origin. Rebind after
// every iframe load so the clicker works after interacting with either view.
export default function MapDemo({advanceRef,onNext,onClose}){
  const dialog=useRef(null),frame=useRef(null),unbind=useRef(null);
  const [src,setSrc]=useState(mapUrl);
  const [view,setView]=useState('map');
  const currentView=useRef('map');
  const callbacks=useRef({onNext,onClose});
  useEffect(()=>{callbacks.current={onNext,onClose};},[onNext,onClose]);

  useEffect(()=>{
    const element=dialog.current;
    element.showModal();
    return ()=>{unbind.current?.();if(element.open)element.close();};
  },[]);

  function trackView(value){
    currentView.current=value;
    setView(value);
  }

  function advance(){
    if(currentView.current==='map')showView(dashboardUrl);
    else callbacks.current.onNext();
  }
  useImperativeHandle(advanceRef,()=>advance);

  function connectFrame(){
    unbind.current?.();
    unbind.current=null;
    const win=frame.current?.contentWindow;
    try{
      if(!win||win.location.origin!==window.location.origin||!win.location.pathname.startsWith('/mine-risk-map/'))return;
      trackView(win.location.pathname.endsWith('/dashboard.html')?'dashboard':'map');
      const doc=win.document;
      const key=e=>{
        if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||e.repeat)return;
        const editable=e.target?.closest?.('input, textarea, select, [contenteditable="true"]');
        if(e.key==='PageDown'||(e.key==='ArrowRight'&&!editable)){
          e.preventDefault();e.stopImmediatePropagation();advance();
        }else if(e.key==='Escape'&&!editable){
          e.preventDefault();e.stopImmediatePropagation();callbacks.current.onClose();
        }
      };
      doc.addEventListener('keydown',key,true);
      unbind.current=()=>doc.removeEventListener('keydown',key,true);
    }catch{/* A navigation to another origin is handled by the parent controls. */}
  }

  function showView(url){
    trackView(url===dashboardUrl?'dashboard':'map');
    // Use the current frame even when the embedded tool has navigated itself.
    if(frame.current?.getAttribute('src')===url){
      frame.current.src=url;
    }else setSrc(url);
  }

  return <dialog ref={dialog} className="map-demo-dialog" aria-label="Демонстрація Mine Risk Map"
    onCancel={e=>{e.preventDefault();onClose();}}>
    <header className="map-demo-bar">
      <strong>Mine Risk Map <small>· Харківщина</small></strong>
      <nav aria-label="Розділи демонстрації">
        <button aria-pressed={view==='map'} onClick={()=>showView(mapUrl)}><Map size={17}/> Мапа сесій</button>
        <button aria-pressed={view==='dashboard'} onClick={()=>showView(dashboardUrl)}><ChartNoAxesCombined size={17}/> Дашборд</button>
      </nav>
      <a href={mapUrl} target="_blank" rel="noreferrer" aria-label="Відкрити Mine Risk Map в окремій вкладці" title="Відкрити в окремій вкладці"><ExternalLink size={17}/></a>
      <button className="map-demo-close" onClick={onClose} aria-label="Закрити демонстрацію" title="Закрити · Esc"><X size={19}/></button>
      <button className="map-demo-next" onClick={advance} autoFocus>{view==='map'?'До дашборда':'Далі'} <ArrowRight size={17}/></button>
    </header>
    <iframe ref={frame} src={src} onLoad={connectFrame} title="Інтерактивна мапа та дашборд EORE Analytics"/>
  </dialog>;
}
