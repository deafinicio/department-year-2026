import {places} from './story.js';
export function composeMapStyle(base){
 const layers=[...base.layers],firstLabel=layers.findIndex(layer=>layer.type==='symbol');
 layers.splice(firstLabel<0?layers.length:firstLabel,0,
  {id:'region-fill',type:'fill',source:'region',paint:{'fill-color':'#42e8be','fill-opacity':.06}},
  {id:'region-line',type:'line',source:'region',paint:{'line-color':'#78f3bf','line-width':1.5}});
 return {...base,sources:{...base.sources,region:{type:'geojson',data:new URL('./assets/kharkiv-region.geojson',import.meta.url).href}},layers};
}
let libraryPromise;
function loadLibrary(){
 if(window.maplibregl)return Promise.resolve(window.maplibregl);
 if(!libraryPromise)libraryPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=new URL('./vendor/maplibre-gl.js',import.meta.url).href;
  script.onload=()=>{if(window.maplibregl)resolve(window.maplibregl);else{script.remove();libraryPromise=null;reject(new Error('Map library unavailable'));}};
  script.onerror=()=>{script.remove();libraryPromise=null;reject(new Error('Map library unavailable'));};document.head.append(script);
 });
 return libraryPromise;
}
// Location cards remain functional if WebGL or online tiles fail.
export function createGeography(container,{selected='kharkiv',isReduced=()=>false}={}){
 let alive=true,map=null,observer=null,current=places[selected]?selected:'kharkiv';const markers=[];
 const viewport=container.querySelector('.geo-viewport'),detail=container.querySelector('.location-detail'),status=container.querySelector('.map-status');
 function select(id,{move=true}={}){
  const p=places[id];if(!p||!alive)return;current=id;
  detail.innerHTML=`<span>${p.region}</span><h3>${p.title}</h3><p>${p.text}</p>`;
  container.querySelectorAll('[data-place]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.place===id)));
  markers.forEach(({id:markerId,button})=>button.setAttribute('aria-pressed',String(markerId===id)));
  if(map&&move)map.flyTo({center:p.coords,zoom:10.2,pitch:25,bearing:0,duration:isReduced()?0:1800,essential:false});
 }
 container.querySelectorAll('[data-place]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.place)));
 container.querySelector('[data-map-overview]').addEventListener('click',()=>{if(map)map.fitBounds([[34.85,48.45],[38.25,50.5]],{padding:35,duration:isReduced()?0:1400,pitch:0});});
 select(current,{move:false});
 const fallback=message=>{if(!alive)return;status.textContent=message;viewport.classList.add('map-fallback');};
 loadLibrary().then(async lib=>{
  const response=await fetch(new URL('./assets/basemap-dark.json',import.meta.url));
  if(!response.ok)throw new Error('Map style unavailable');
  const baseStyle=await response.json();
  if(!alive)return;
  try{
   map=new lib.Map({container:viewport,center:places[current].coords,zoom:8,pitch:0,minZoom:6,maxZoom:14,maxBounds:[[33.8,47.8],[39.3,51.3]],renderWorldCopies:false,attributionControl:{compact:true},style:composeMapStyle(baseStyle)});
   map.addControl(new lib.NavigationControl({showCompass:false}),'top-right');
   let tileWarning=false;
   const tileMessage='Фонова підкладка недоступна. Контур області, міста та картки залишаються доступними.';
   map.on('load',()=>{if(!alive)return;viewport.classList.remove('map-fallback');status.textContent=tileWarning?tileMessage:'Оберіть місто або пересувайте мапу. Коліщатко змінює масштаб.';map.resize();select(current);});
   map.on('error',e=>{if(!alive)return;if(e.error?.message?.includes('WebGL'))fallback('Інтерактивний вигляд недоступний. Оберіть місто, щоб переглянути його картку.');else if(e.sourceId!=='region'&&!tileWarning){tileWarning=true;status.textContent=tileMessage;}});
   for(const [id,p] of Object.entries(places)){
    const button=document.createElement('button');button.className='geo-marker';button.type='button';button.setAttribute('aria-label','Показати '+p.title);button.setAttribute('aria-pressed',String(id===current));button.innerHTML=`<i></i><span>${p.title.replace('м. ','')}</span>`;button.addEventListener('click',()=>select(id));
    const marker=new lib.Marker({element:button,anchor:'bottom'}).setLngLat(p.coords).addTo(map);markers.push({id,button,marker});
   }
   if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(()=>{if(alive)map?.resize();});observer.observe(viewport);}
   requestAnimationFrame(()=>{if(alive)map?.resize();});
  }catch(e){map?.remove();map=null;fallback('Інтерактивний вигляд недоступний. Оберіть місто, щоб переглянути його картку.');}
 }).catch(()=>fallback('Не вдалося завантажити інтерактивний вигляд. Картки міст доступні нижче.'));
 return {select,get selected(){return current;},dispose(){alive=false;observer?.disconnect();markers.forEach(m=>m.marker.remove());map?.remove();map=null;}};
}
