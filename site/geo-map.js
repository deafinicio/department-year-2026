import {places} from './story.js';
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
 loadLibrary().then(lib=>{
  if(!alive)return;
  try{
   map=new lib.Map({container:viewport,center:places[current].coords,zoom:8,pitch:0,minZoom:6,maxZoom:14,maxBounds:[[33.8,47.8],[39.3,51.3]],renderWorldCopies:false,attributionControl:{compact:true},style:{version:8,sources:{
    basemap:{type:'raster',tiles:['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],tileSize:256,maxzoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> © <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>'},
    region:{type:'geojson',data:new URL('./assets/kharkiv-region.geojson',import.meta.url).href}
   },layers:[{id:'background',type:'background',paint:{'background-color':'#0b1827'}},{id:'basemap',type:'raster',source:'basemap',paint:{'raster-opacity':.8}},{id:'region-fill',type:'fill',source:'region',paint:{'fill-color':'#42e8be','fill-opacity':.09}},{id:'region-line',type:'line',source:'region',paint:{'line-color':'#78f3bf','line-width':1.5}}]}});
   map.addControl(new lib.NavigationControl({showCompass:false}),'top-right');
   map.on('load',()=>{if(!alive)return;viewport.classList.remove('map-fallback');status.textContent='Оберіть місто або пересувайте мапу. Коліщатко змінює масштаб.';map.resize();select(current);});
   let tileWarning=false;
   map.on('error',e=>{if(!alive)return;if(e.sourceId==='basemap'&&!tileWarning){tileWarning=true;status.textContent='Фонова підкладка недоступна. Контур області, міста та картки залишаються доступними.';}else if(e.error?.message?.includes('WebGL'))fallback('Інтерактивний вигляд недоступний. Оберіть місто, щоб переглянути його картку.');});
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
