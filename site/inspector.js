import {elements,team,places,teamFacts,teamForFilter} from './story.js';
import {renderStatistics} from './charts.js';
import {createGeography} from './geo-map.js';
const $=id=>document.getElementById(id);
const figure=(src,alt,caption='')=>`<figure class="media-main"><img src="${src}" alt="${alt}">${caption?`<figcaption>${caption}</figcaption>`:''}</figure>`;
const bullets=items=>items?.length?'<ul>'+items.map(t=>'<li>'+t+'</li>').join('')+'</ul>':'';
const toolURL='https://deafinicio.github.io/mine-risk-map/';
export function createInspector({onOpen=()=>{},onClose=()=>{},isReduced=()=>false}){
 const dialog=$('inspector'),body=$('inspector-body');let view=null,closing=null,selectedPlace=null,teamFilter='all',mapController=null;
 const chartState={metric:'sessions',period:'all',view:'line',formats:[0,1]};
 function cleanup(){mapController?.dispose();mapController=null;body.querySelectorAll('iframe').forEach(f=>f.remove());}
 function total(){if(view.type==='catalog')return 1;if(view.type==='person')return 2;return view.element.slides.length;}
 function origin(point){const [x,y]=point||[innerWidth*.65,innerHeight*.45];dialog.style.setProperty('--origin-x',Math.max(0,Math.min(100,x/innerWidth*100))+'%');dialog.style.setProperty('--origin-y',Math.max(0,Math.min(100,y/innerHeight*100))+'%');}
 function display(point){if(closing){clearTimeout(closing);closing=null;}dialog.classList.remove('closing');if(point||!dialog.open)origin(point);render();if(!dialog.open){onOpen();dialog.showModal();}}
 function close(){if(closing||!dialog.open)return;cleanup();if(isReduced()){dialog.close();return;}dialog.classList.add('closing');closing=setTimeout(()=>{closing=null;dialog.classList.remove('closing');dialog.close();},240);}
 function openElement(id,point,place=null){const e=elements.find(e=>e.id===id);if(!e)return;view={type:'element',element:e,page:0};selectedPlace=place;display(point);}
 function openPerson(person,point){if(!team[person])return;view={type:'person',person,page:0,element:elements[0]};display(point);}
 function catalog(count,point){view={type:'catalog',count:Math.max(0,Math.min(elements.length,count)),page:0};display(point);}
 function bindPeople(){body.querySelectorAll('[data-person]').forEach(b=>b.addEventListener('click',()=>openPerson(Number(b.dataset.person))));}
 function cards(people){return `<div class="team-grid">${people.map(p=>`<button class="person-card" data-person="${team.indexOf(p)}" style="--person-color:${p.color}"><img src="${p.image}" alt="${p.name}"><strong>${p.name} ↗</strong><small>${p.role} · ${p.location}</small><span class="person-status" style="color:${p.color}">${p.status}</span></button>`).join('')}</div>`;}
 function renderMap(s){
  body.innerHTML=`<div class="geo-shell"><header class="section-heading"><h2 id="inspector-title">${s.title}</h2><p>${s.text}</p></header><div class="geo-layout"><section class="geo-card"><nav class="location-tabs" aria-label="Міста команди">${Object.entries(places).map(([id,p])=>`<button data-place="${id}" aria-pressed="false">${p.title}</button>`).join('')}</nav><div class="location-detail" aria-live="polite"></div><p class="location-note">Міста позначають локації команди. Це не адреси сесій і не оцінка безпечності територій.</p></section><section class="geo-map-card"><div class="geo-viewport map-fallback" role="region" aria-label="Інтерактивна мапа Харківської області"></div><div class="map-bottom"><p class="map-status" role="status">Завантажуємо мапу…</p><button data-map-overview>Уся область ↗</button></div></section></div></div>`;
  mapController=createGeography(body.querySelector('.geo-shell'),{selected:selectedPlace||'kharkiv',isReduced});
 }
 function teamSummary(){return `<div class="team-summary"><div><strong>${teamFacts.baseline}</strong><span>Базовий склад</span><small>${teamFacts.baselineInstructors} інструкторів + координатор</small></div><div><strong>−${teamFacts.left}</strong><span>Завершили діяльність</span><small>Серпень–вересень</small></div><div><strong>+${teamFacts.joined}</strong><span>Приєдналися</span><small>Жовтень</small></div><div><strong>${teamFacts.afterChanges}</strong><span>Після змін</span><small>${teamFacts.afterInstructors} інструкторів + координатор</small></div></div><p class="team-unique">${teamFacts.uniquePeople} людей — координатор і ${team.length-1} інструкторів — долучилися до роботи відділу протягом року.</p>`;}
 function renderTeam(s){
  const filters=[['all','Усі учасники',team.length],['baseline','Базовий склад',teamFacts.baseline],['after','Після змін',teamFacts.afterChanges],['new','Нові',teamFacts.joined],['former','Завершили діяльність',teamFacts.left]];
  body.innerHTML=`<header class="section-heading"><h2 id="inspector-title">${s.title}</h2><p>${s.text}</p></header>${teamSummary()}<nav class="team-filters" aria-label="Склад команди">${filters.map(([id,name,count])=>`<button data-team-filter="${id}" aria-pressed="${teamFilter===id}">${name}<b>${count}</b></button>`).join('')}</nav>${cards(teamForFilter(teamFilter))}`;
  bindPeople();body.querySelectorAll('[data-team-filter]').forEach(b=>b.addEventListener('click',()=>{teamFilter=b.dataset.teamFilter;render();body.querySelector(`[data-team-filter="${teamFilter}"]`).focus();}));
 }
 function renderTeamTimeline(s){
  body.innerHTML=`<header class="section-heading"><h2 id="inspector-title">${s.title}</h2><p>${s.text}</p></header><div class="team-timeline"><article><span>БАЗОВИЙ СКЛАД</span><strong>${teamFacts.baseline}</strong><h3>7 інструкторів і координатор</h3><p>Берестинський, Лозівський, Ізюмський райони та місто Харків.</p></article><article><span>СЕРПЕНЬ–ВЕРЕСЕНЬ</span><strong>−2</strong><h3>Завершення діяльності</h3><p>Вадим Гарбузов — серпень. Кирило Завадський — вересень, доєднання до лав ЗСУ.</p></article><article><span>ЖОВТЕНЬ</span><strong>+5</strong><h3>Нові учасники</h3><p>Катерина Романча, Вікторія Пірлик, Оксана Берко, Уляна Бурлакова та Євген Хірін.</p></article><article><span>ПІСЛЯ ЗМІН</span><strong>${teamFacts.afterChanges}</strong><h3>10 інструкторів і координатор</h3><p>8 − 2 + 5 = 11. За рік у роботі відділу взяли участь 13 людей.</p></article></div>`;
 }
 function renderPerson(){
  const p=team[view.person],first=view.page===0;
  body.innerHTML=`<div class="person-toolbar"><button id="back-team">← Уся команда</button><button id="person-prev">← Попередній учасник</button><button id="person-next">Наступний учасник →</button></div><div class="slide-layout"><section class="slide-copy"><span class="slide-number">КОМАНДА / ${String(view.person+1).padStart(2,'0')} ІЗ ${String(team.length).padStart(2,'0')}</span><h2 id="inspector-title">${first?p.name:'Внесок у спільну роботу'}</h2><p>${first?p.role+'. '+p.location+'. '+p.period+'.':p.history}</p>${first?`<div class="profile-facts"><div><span>Функція в команді</span><strong>${p.role}</strong></div><div><span>Локація</span><strong>${p.location}</strong></div><div><span>Участь у команді</span><strong>${p.period}</strong></div></div>`:bullets(p.tasks)}</section>${figure(p.image,p.name)}</div>`;
  $('back-team').addEventListener('click',()=>openElement('people'));$('person-prev').addEventListener('click',()=>openPerson((view.person-1+team.length)%team.length));$('person-next').addEventListener('click',()=>openPerson((view.person+1)%team.length));
 }
 function renderTool(s){
  body.innerHTML=`<div class="tool-story"><div class="slide-layout"><section class="slide-copy"><span class="slide-number">MINE RISK MAP / ХАРКІВСЬКА ОБЛАСТЬ</span><h2 id="inspector-title">${s.title}</h2><p>${s.text}</p><div class="tool-actions"><button id="load-tool">Показати інструмент тут ↗</button><a href="${toolURL}" target="_blank" rel="noopener noreferrer">${s.linkLabel||'Відкрити окремо'} ↗</a>${s.crossLink?'<button id="open-mapping-story">Докладніше про інструмент →</button>':''}</div><p class="tool-note">Жива карта. Період задається у фільтрах інструменту; дані можуть оновлюватися.</p></section>${figure('assets/mapping.svg','Введення даних, геоприв’язка, карта та аналіз')}</div><div id="tool-embed" class="tool-embed" hidden></div></div>`;
  $('load-tool').addEventListener('click',()=>{const host=$('tool-embed');if(host.querySelector('iframe')){host.scrollIntoView({behavior:isReduced()?'instant':'smooth',block:'start'});return;}host.hidden=false;const toolbar=document.createElement('div');toolbar.className='embed-toolbar';toolbar.innerHTML='<span role="status">Підключаємо Mine Risk Map…</span><a href="'+toolURL+'" target="_blank" rel="noopener noreferrer">Відкрити окремою вкладкою ↗</a>';host.append(toolbar);const frame=document.createElement('iframe');frame.title='Mine Risk Map — карта інформаційних сесій';frame.src=toolURL;frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';frame.addEventListener('load',()=>{toolbar.querySelector('span').textContent='Mine Risk Map · жива карта';});host.append(frame);host.scrollIntoView({behavior:isReduced()?'instant':'smooth',block:'start'});$('load-tool').textContent='Перейти до відкритої карти ↓';});
  $('open-mapping-story')?.addEventListener('click',()=>openElement('mapping'));
 }
 function render(){
  if(!view)return;cleanup();const e=view.element;dialog.style.setProperty('--active',view.type==='person'?team[view.person].color:e?.accent||'#5be7ff');
  dialog.querySelector('.content-badge').textContent='РІК ЛЮДЕЙ ТА СПІЛЬНИХ ДІЙ';
  $('inspector-breadcrumb').textContent=view.type==='person'?'Команда / '+team[view.person].name:view.type==='catalog'?'Зібрана композиція':e.name;
  if(view.type==='catalog'){
   body.innerHTML=`<header class="section-heading"><h2 id="inspector-title">Усі додані елементи</h2><p>Оберіть об’єкт, щоб відкрити його історію.</p></header>${view.count?`<div class="catalog-grid">${elements.slice(0,view.count).map((e,i)=>`<button class="catalog-card" data-element="${e.id}" style="--card-color:${e.accent}"><span>${String(i+1).padStart(2,'0')} / ВІДКРИТИ ↗</span><strong>${e.name}</strong><small>${e.slides.length} екрани історії</small></button>`).join('')}</div>`:'<p class="empty-catalog">Додайте перший елемент, щоб відкрити його історію.</p>'}`;
   body.querySelectorAll('[data-element]').forEach(b=>b.addEventListener('click',()=>openElement(b.dataset.element)));
  }else if(view.type==='person')renderPerson();
  else{
   const s=e.slides[view.page];
   if(s.type==='statistics'){body.innerHTML=`<h2 id="inspector-title" class="stats-slide-heading">${s.title}</h2><div class="stats-root"></div>`;renderStatistics(body.querySelector('.stats-root'),chartState);}
   else if(s.type==='team')renderTeam(s);
   else if(s.type==='teamTimeline')renderTeamTimeline(s);
   else if(s.type==='map')renderMap(s);
   else if(s.type==='tool')renderTool(s);
   else if(s.type==='peopleLinks'){body.innerHTML=`<header class="section-heading"><h2 id="inspector-title">${s.title}</h2><p>${s.text}</p></header>${cards(team.filter(p=>s.people.includes(p.id)))}`;bindPeople();}
   else body.innerHTML=`<div class="slide-layout"><section class="slide-copy"><span class="slide-number">${String(elements.indexOf(e)+1).padStart(2,'0')} / ЕКРАН ${String(view.page+1).padStart(2,'0')}</span><h2 id="inspector-title">${s.title}</h2><p>${s.text}</p>${bullets(s.bullets)}</section>${figure(s.image||e.image,s.caption||e.name,s.caption||'')}</div>`;
  }
  const n=total();$('slide-count').textContent=view.type==='catalog'?`${view.count} / ${elements.length}`:`${String(view.page+1).padStart(2,'0')} / ${String(n).padStart(2,'0')}`;
  $('slide-prev').disabled=view.page===0;$('slide-prev').hidden=view.type==='catalog';$('slide-next').hidden=view.type==='catalog';$('slide-next').textContent=view.page===n-1?'Повернутися до сцени ↗':'Наступний екран →';
  $('slide-dots').replaceChildren();if(view.type!=='catalog')for(let i=0;i<n;i++){const b=document.createElement('button');b.className=i===view.page?'active':'';b.setAttribute('aria-label','Екран '+(i+1));if(i===view.page)b.setAttribute('aria-current','step');b.addEventListener('click',()=>{view.page=i;render();});$('slide-dots').append(b);}
  body.scrollTop=0;body.classList.remove('changing');requestAnimationFrame(()=>body.classList.add('changing'));
 }
 function next(){if(!view)return;if(view.page>=total()-1){close();return;}view.page++;render();}
 function previous(){if(!view||!view.page)return;view.page--;render();}
 $('slide-next').addEventListener('click',next);$('slide-prev').addEventListener('click',previous);$('close-inspector').addEventListener('click',close);
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('close',()=>{cleanup();dialog.classList.remove('closing');if(closing)clearTimeout(closing);closing=null;onClose();});
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();});
 dialog.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.target.closest('.stats-root,.geo-shell,iframe'))return;if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();next();}if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();previous();}});
 return {openElement,openPerson,catalog,close,get isOpen(){return dialog.open;}};
}
