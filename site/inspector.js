import {elements,team,places} from './story.js';
import {renderStatistics} from './charts.js';
const $=id=>document.getElementById(id);
const figure=(src,alt,caption='Ілюстративний матеріал · реальне фото ще не додано')=>`<figure class="media-main"><img src="${src}" alt="${alt}"><figcaption>${caption}</figcaption></figure>`;
const gallery=e=>`<div class="media-gallery">${[e.image,'assets/people.svg','assets/sessions.svg'].map((src,i)=>`<figure><img src="${src}" alt="Демонстраційний матеріал ${i+1}"><figcaption>КАДР ${String(i+1).padStart(2,'0')} / МІСЦЕ ДЛЯ ФОТО</figcaption></figure>`).join('')}</div>`;
export function createInspector({onOpen=()=>{},onClose=()=>{},isReduced=()=>false}){
 const dialog=$('inspector'),body=$('inspector-body');let view=null,closing=null,selectedPlace=null;
 const chartState={metric:'sessions',period:'all',view:'line',formats:[0,1]};
 function total(){if(view.type==='catalog')return 1;if(view.type==='person')return 2;return view.element.slides.length;}
 function origin(point){const [x,y]=point||[innerWidth*.65,innerHeight*.45];dialog.style.setProperty('--origin-x',Math.max(0,Math.min(100,x/innerWidth*100))+'%');dialog.style.setProperty('--origin-y',Math.max(0,Math.min(100,y/innerHeight*100))+'%');}
 function display(point){if(closing){clearTimeout(closing);closing=null;}dialog.classList.remove('closing');if(point||!dialog.open)origin(point);render();if(!dialog.open){onOpen();dialog.showModal();}}
 function close(){if(closing||!dialog.open)return;if(isReduced()){dialog.close();return;}dialog.classList.add('closing');closing=setTimeout(()=>{closing=null;dialog.classList.remove('closing');dialog.close();},240);}
 function openElement(id,point,place=null){const e=elements.find(e=>e.id===id);if(!e)return;view={type:'element',element:e,page:0};selectedPlace=place;display(point);}
 function openPerson(person,point){if(!team[person])return;view={type:'person',person,page:0,element:elements[0]};display(point);}
 function catalog(count,point){view={type:'catalog',count,page:0};display(point);}
 function bindPeople(){body.querySelectorAll('[data-person]').forEach(b=>b.addEventListener('click',()=>openPerson(Number(b.dataset.person))));}
 function renderMap(){
  const e=view.element,s=e.slides[0];body.innerHTML=`<div class="slide-layout"><section class="slide-copy"><span class="slide-number">ГЕОГРАФІЯ / 01</span><h2 id="inspector-title">${s.title}</h2><p>${s.text}</p><div id="location-detail" class="location-detail">Натисніть на точку А, Б або В, щоб відкрити картку.</div></section><div class="map-panel"><svg viewBox="0 0 450 350" role="img" aria-label="Умовна мапа для демонстрації"><path d="M160 30l56 10 42-15 57 54-11 35 36 40-21 45 24 45-44 14-30 39-38-18-43 32-35-38-42 9-3-43-37-27 26-40-18-38 25-38-1-39 44-1z" fill="#1b514b" stroke="#78f3bf" stroke-width="1.5"/><path d="M250 60q-80 70-30 130t-20 100" fill="none" stroke="#5be7ff55" stroke-width="2"/></svg><button class="map-location a" data-place="A">Точка А</button><button class="map-location b" data-place="Б">Точка Б</button><button class="map-location c" data-place="В">Точка В</button></div></div>`;
  const select=name=>{const p=places[name];if(!p)return;const strong=document.createElement('strong');strong.textContent=p.title;$('location-detail').replaceChildren(strong,document.createTextNode(p.text));body.querySelectorAll('[data-place]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.place===name)));};body.querySelectorAll('[data-place]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.place)));if(selectedPlace)select(selectedPlace);
 }
 function renderPerson(){
  const p=team[view.person],page=view.page;body.innerHTML=`<div class="person-toolbar"><button id="back-team">← Уся команда</button><button id="person-prev">← Попередній учасник</button><button id="person-next">Наступний учасник →</button></div><div class="slide-layout"><section class="slide-copy"><span class="slide-number">КОМАНДА / ${String(view.person+1).padStart(2,'0')} ІЗ ${String(team.length).padStart(2,'0')}</span><h2 id="inspector-title">${page===0?p.name:'Особиста історія року'}</h2><p>${page===0?'Окремий профіль члена команди. Сюди буде додано справжнє ім’я, посаду, фотографію й коротку розповідь про роботу протягом року.':'Другий екран профілю: ключові завдання, фотографії з діяльності та внесок у спільну роботу. Дані заповнюються окремо для кожної людини.'}</p>${page===0?`<div class="profile-facts"><div><span>Ім’я та прізвище</span><strong>Буде додано</strong></div><div><span>Посада</span><strong>Буде додано</strong></div><div><span>Напрями роботи</span><strong>Буде додано</strong></div></div>`:'<ul><li>Завдання протягом року</li><li>Ключові події за участю людини</li><li>Фотографії та коротка особиста історія</li></ul>'}</section>${figure(page===0?p.image:'assets/people.svg',page===0?'Ілюстративний портрет '+p.name:'Місце для робочих фотографій')}</div>`;
  $('back-team').addEventListener('click',()=>openElement('people'));$('person-prev').addEventListener('click',()=>openPerson((view.person-1+team.length)%team.length));$('person-next').addEventListener('click',()=>openPerson((view.person+1)%team.length));
 }
 function render(){
  if(!view)return;const e=view.element;dialog.style.setProperty('--active',view.type==='person'?team[view.person].color:e?.accent||'#5be7ff');
  $('inspector-breadcrumb').textContent=view.type==='person'?'Команда / '+team[view.person].name:view.type==='catalog'?'Зібрана композиція':e.name;
  if(view.type==='catalog'){
   body.innerHTML=`<header class="section-heading"><h2 id="inspector-title">Усі додані елементи</h2><p>Оберіть об’єкт, щоб відкрити його історію. Тут доступні лише ті складові, які вже додані на платформу.</p></header>${view.count?`<div class="catalog-grid">${elements.slice(0,view.count).map((e,i)=>`<button class="catalog-card" data-element="${e.id}" style="--card-color:${e.accent}"><span>${String(i+1).padStart(2,'0')} / ВІДКРИТИ ↗</span><strong>${e.name}</strong><small>${e.slides.length} екрани історії</small></button>`).join('')}</div>`:'<p class="empty-catalog">Поки що платформа порожня. Додайте перший елемент, щоб відкрити його історію.</p>'}`;
   body.querySelectorAll('[data-element]').forEach(b=>b.addEventListener('click',()=>openElement(b.dataset.element)));
  }else if(view.type==='person')renderPerson();
  else{
   const s=e.slides[view.page];
   if(s.type==='statistics'){body.innerHTML=`<h2 id="inspector-title" class="stats-slide-heading">${s.title}</h2><div class="stats-root"></div>`;renderStatistics(body.querySelector('.stats-root'),chartState);}
   else if(s.type==='team'){body.innerHTML=`<header class="section-heading"><h2 id="inspector-title">${s.title}</h2><p>${s.text}</p></header><div class="team-grid">${team.map((p,i)=>`<button class="person-card" data-person="${i}" style="--person-color:${p.color}"><img src="${p.image}" alt="Ілюстративний портрет ${p.name}"><strong>${p.name} ↗</strong><small>${p.role}</small></button>`).join('')}</div>`;bindPeople();}
   else if(s.type==='map')renderMap();
   else body.innerHTML=`<div class="slide-layout"><section class="slide-copy"><span class="slide-number">${String(elements.indexOf(e)+1).padStart(2,'0')} / ЕКРАН ${String(view.page+1).padStart(2,'0')}</span><h2 id="inspector-title">${s.title}</h2><p>${s.text}</p>${s.bullets?'<ul>'+s.bullets.map(t=>'<li>'+t+'</li>').join('')+'</ul>':''}</section>${s.gallery?gallery(e):figure(e.image,'Ілюстративний матеріал: '+e.name)}</div>`;
  }
  const n=total();$('slide-count').textContent=view.type==='catalog'?`${view.count} / ${elements.length}`:`${String(view.page+1).padStart(2,'0')} / ${String(n).padStart(2,'0')}`;
  $('slide-prev').disabled=view.page===0;$('slide-prev').hidden=view.type==='catalog';$('slide-next').hidden=view.type==='catalog';$('slide-next').textContent=view.page===n-1?'Повернутися до сцени ↗':'Наступний екран →';
  $('slide-dots').replaceChildren();if(view.type!=='catalog')for(let i=0;i<n;i++){const b=document.createElement('button');b.className=i===view.page?'active':'';b.setAttribute('aria-label','Екран '+(i+1));if(i===view.page)b.setAttribute('aria-current','step');b.addEventListener('click',()=>{view.page=i;render();});$('slide-dots').append(b);}
  body.scrollTop=0;body.classList.remove('changing');requestAnimationFrame(()=>body.classList.add('changing'));
 }
 function next(){if(!view)return;if(view.page>=total()-1){close();return;}view.page++;render();}
 function previous(){if(!view||!view.page)return;view.page--;render();}
 $('slide-next').addEventListener('click',next);$('slide-prev').addEventListener('click',previous);$('close-inspector').addEventListener('click',close);
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('close',()=>{dialog.classList.remove('closing');if(closing)clearTimeout(closing);closing=null;onClose();});
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();});
 dialog.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.target.closest('.stats-root'))return;if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();next();}if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();previous();}});
 return {openElement,openPerson,catalog,close,get isOpen(){return dialog.open;}};
}
