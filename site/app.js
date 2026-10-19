import {chapters,elements,team,places,visibleLayers,FINAL_INDEX} from './story.js';
import {createInspector} from './inspector.js';
import {createCinema} from './cinema.js';
const $=id=>document.getElementById(id);
let index=0,scene=null,autoTimer=null,showingOverview=false,cinema=null,cinemaOrigin=null;
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrative=document.querySelector('.narrative');
function stopAuto(){if(autoTimer)clearInterval(autoTimer);autoTimer=null;$('autoplay').setAttribute('aria-pressed','false');$('play-icon').textContent='▷';$('play-label').textContent='Автопоказ';}
const inspector=createInspector({onOpen:()=>{stopAuto();cinema?.close();},isReduced:()=>reduced});
cinema=createCinema({isReduced:()=>reduced,onShot:(kind,step,shot)=>{stopAuto();scene?.cinematicShot(kind,step,shot);},onExit:kind=>{if(kind==='studio')cinemaOrigin=scene?.cinematicOrigin();scene?.clearCinematic();const c=chapters[index];scene?.setChapter(index,c.camera,c.look,{instant:true});},onComplete:kind=>{if(kind==='intro')go(1);else if(kind==='studio')inspector.openElement('digital-space',cinemaOrigin);}});
function launchCinema(kind){if(!scene){$('announcement').textContent='3D-сцена ще завантажується. Спробуйте за мить.';return;}cinema.start(kind);}
function togglePresenter(){const value=!document.body.classList.contains('presenter-mode');document.body.classList.toggle('presenter-mode',value);$('presenter').setAttribute('aria-pressed',String(value));$('presenter-hint').hidden=!value;scene?.resize();}
const pointOf=el=>{const r=el.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];};
function openCurrent(){if(index<1||index>elements.length)return;inspector.openElement(elements[index-1].id,scene?.origin(index)||pointOf($('open-section')));}
function update(){
 const c=chapters[index],count=visibleLayers(index);document.documentElement.style.setProperty('--active',c.accent);narrative.classList.toggle('final-chapter',index===FINAL_INDEX);
 $('eyebrow').textContent=index===0?`2026 / ${elements.length} СКЛАДОВИХ`:index===FINAL_INDEX?`${String(FINAL_INDEX).padStart(2,'0')} / ЦІЛІСНА КОМПОЗИЦІЯ`:c.eyebrow;
 const em=document.createElement('em');em.textContent=c.title[1];$('title').replaceChildren(document.createTextNode(c.title[0]),document.createElement('br'),em);$('description').textContent=c.description;
 $('layer-count').textContent=String(count).padStart(2,'0');$('layer-total').textContent='/ '+elements.length;$('layer-caption').textContent=count===elements.length?`Усі ${elements.length} складових на платформі`:count?elements[count-1].name:'Початок історії';$('step-counter').textContent=`${String(index).padStart(2,'0')} / ${String(FINAL_INDEX).padStart(2,'0')}`;
 $('layer-indicator').querySelectorAll('i').forEach((el,i)=>el.classList.toggle('on',i<count));
 $('chapters').querySelectorAll('button').forEach((el,i)=>{el.classList.toggle('active',i===index);el.classList.toggle('passed',i<=index&&index>0);if(i===index)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
 $('next-label').textContent=index===FINAL_INDEX?'Скласти ще раз':index===elements.length?'Побачити весь рік':elements[index].addLabel;
 $('cinema-start').hidden=![0,8,FINAL_INDEX].includes(index);$('cinema-start').textContent=index===0?'▶ Рік починається з людей':index===8?'◉ Зануритися у студію':'▶ За кожним результатом — люди';
 $('open-section').hidden=index===0||index===FINAL_INDEX;$('previous').disabled=index===0;$('overview').disabled=index===0;$('catalog').disabled=count===0;
 $('overview').setAttribute('aria-pressed','false');$('scene-caption').textContent=index===0?'Додавайте елементи. Натискайте, щоб відкрити історії.':index===FINAL_INDEX?'Усі об’єкти клікабельні. Оберіть історію.':'Натисніть на об’єкт, щоб відкрити деталі.';
 $('quick-actions').replaceChildren();
 if(index===1){const b=document.createElement('button');b.textContent='Уся команда · '+team.length+' профілів';b.addEventListener('click',()=>inspector.openElement('people',scene?.origin(1)||pointOf(b)));$('quick-actions').append(b);}
 if(elements[index-1]?.id==='geography')for(const [id,p] of Object.entries(places)){const b=document.createElement('button');b.textContent=p.title;b.addEventListener('click',()=>inspector.openElement('geography',scene?.origin(index)||pointOf(b),id));$('quick-actions').append(b);}
 $('announcement').textContent=`${count} із ${elements.length} елементів додано. ${c.name}.`;
 narrative.classList.remove('changing');requestAnimationFrame(()=>narrative.classList.add('changing'));
}
function go(next,{automated=false,instant=false,hash=true}={}){cinema?.close();if(!automated)stopAuto();index=Math.max(0,Math.min(FINAL_INDEX,next));showingOverview=false;const c=chapters[index];scene?.setChapter(index,c.camera,c.look,{instant});update();if(hash)history.replaceState(null,'','#'+c.id);if(index===FINAL_INDEX){stopAuto();if(!instant&&scene)launchCinema('finale');}}
function advance(automated=false){go(index===FINAL_INDEX?0:index+1,{automated});}
chapters.forEach((c,i)=>{const b=document.createElement('button');b.className='chapter';const n=document.createElement('span');n.textContent=String(i).padStart(2,'0');b.append(n,document.createTextNode(c.short||c.name));b.addEventListener('click',()=>go(i));$('chapters').append(b);});
elements.forEach(()=>{$('layer-indicator').append(document.createElement('i'));});
$('cinema-start').addEventListener('click',()=>launchCinema(index===0?'intro':index===8?'studio':'finale'));$('presenter').addEventListener('click',togglePresenter);
$('next').addEventListener('click',()=>advance());$('previous').addEventListener('click',()=>go(index-1));$('restart').addEventListener('click',()=>go(0));$('home').addEventListener('click',e=>{e.preventDefault();go(0);});$('open-section').addEventListener('click',openCurrent);
$('catalog').addEventListener('click',()=>inspector.catalog(visibleLayers(index),pointOf($('catalog'))));
$('autoplay').addEventListener('click',()=>{if(autoTimer){stopAuto();return;}if(index===FINAL_INDEX)go(0);$('autoplay').setAttribute('aria-pressed','true');$('play-icon').textContent='Ⅱ';$('play-label').textContent='Зупинити показ';advance(true);if(index<FINAL_INDEX)autoTimer=setInterval(()=>advance(true),9000);});
$('overview').addEventListener('click',()=>{stopAuto();showingOverview=!showingOverview;const c=showingOverview?chapters[FINAL_INDEX]:chapters[index];scene?.overview(c.camera,c.look);$('overview').setAttribute('aria-pressed',String(showingOverview));$('scene-caption').textContent=showingOverview?'Усі вже додані елементи. Кожен відкриває свою історію.':'Натисніть на об’єкт, щоб відкрити деталі.';});
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else $('announcement').textContent='Браузер не підтримує повноекранний режим.';}catch{$('announcement').textContent='Браузер не дозволив повноекранний режим.';}}
$('fullscreen').addEventListener('click',fullscreen);
function applyMotion(){document.body.classList.toggle('no-motion',reduced);scene?.setReduced(reduced);cinema?.motionChanged();$('motion').setAttribute('aria-pressed',String(reduced));const label=reduced?'Увімкнути анімацію':'Вимкнути анімацію';$('motion').title=label;$('motion').setAttribute('aria-label',label);}
$('motion').addEventListener('click',()=>{reduced=!reduced;applyMotion();});
document.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||inspector.isOpen||cinema.active||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();advance();}else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();go(index-1);}else if(e.key==='Enter'&&e.target===document.body){e.preventDefault();if(index===8)launchCinema('studio');else openCurrent();}else if((e.code==='KeyP'||e.key.toLowerCase()==='p'))togglePresenter();else if((e.code==='KeyF'||e.key.toLowerCase()==='f'))fullscreen();else if(e.key==='Escape'&&!document.fullscreenElement)go(0);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAuto();});
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{scene?.resize();if(cinema.active){cinema.resize();return;}const c=showingOverview?chapters[FINAL_INDEX]:chapters[index];scene?.overview(c.camera,c.look);},100);});
window.addEventListener('hashchange',()=>{const i=chapters.findIndex(c=>c.id===location.hash.slice(1));go(i<0?0:i,{hash:false});});
function error(message){stopAuto();cinema?.close();$('loading')?.remove();if(document.querySelector('.error'))return;const block=document.createElement('div');block.className='error';block.setAttribute('role','alert');block.append(document.createTextNode(message));const b=document.createElement('button');b.textContent='Спробувати ще раз';b.addEventListener('click',()=>location.reload());block.append(b);document.body.append(block);}
applyMotion();const initial=chapters.findIndex(c=>c.id===location.hash.slice(1));go(initial<0?0:initial,{hash:false,instant:true});
try{await document.fonts?.load('500 24px Rubik');const {createYearScene}=await import('./scene.js');scene=createYearScene($('viewport'),{onOpen:data=>{if(data.person!==undefined)inspector.openPerson(data.person,data.point);else if(data.element==='digital-space')launchCinema('studio');else inspector.openElement(data.element,data.point,data.place||null);},onReady:()=>$('loading')?.remove(),onError:error});scene.setReduced(reduced);const c=chapters[index];scene.setChapter(index,c.camera,c.look,{instant:true});}catch(e){console.error('3D initialization failed',e);error('Не вдалося запустити 3D-сцену. Перевірте підтримку WebGL 2 та апаратного прискорення. Історії доданих елементів доступні також через кнопки й каталог.');}
