import assert from 'node:assert/strict';
import {elements,chapters,team,teamFacts,teamForFilter,places,reportData,FINAL_INDEX} from '../site/story.js';
assert.equal(elements.length,11);
assert.equal(FINAL_INDEX,12);
assert.equal(chapters.length,13);
assert.equal(team.length,13);
assert.equal(new Set(team.map(p=>p.id)).size,team.length);
assert.equal(new Set(team.map(p=>p.name)).size,team.length);
for(const [filter,count] of [['baseline',8],['after',11],['new',5],['former',2],['all',13]])assert.equal(teamForFilter(filter).length,count,filter);
assert.equal(teamFacts.baseline-teamFacts.left+teamFacts.joined,teamFacts.afterChanges);
assert.equal(teamFacts.baseline+teamFacts.joined,team.length);
assert(team.filter(p=>p.cohort==='new').every(p=>p.period.includes('жовтні')));
assert.equal(team.filter(p=>p.role==='Інструктор-волонтер').length,3);
assert.equal(Object.keys(places).length,4);
assert.equal(elements.findIndex(e=>e.id==='mapping'),elements.findIndex(e=>e.id==='geography')+1);
for(const e of elements){assert(e.slides.length>=2,e.id);assert(Number.isFinite(e.pos[0]));assert(e.slides.every(s=>s.title));}
for(const p of Object.values(places))assert(p.coords.length===2&&p.coords.every(Number.isFinite));
for(const key of ['sessions','participants'])assert(reportData[key].length===12&&reportData[key].every(v=>v===null));
assert.equal(reportData.formats.length,0);
assert.equal(reportData.ages.length,0);
const camp=elements.find(e=>e.id==='milestones').slides.find(s=>s.type==='peopleLinks');
assert.deepEqual(camp.people,['khirin','burlakova']);
assert(camp.people.every(id=>team.some(p=>p.id===id)));
for(let i=0;i<elements.length;i++)for(let j=i+1;j<elements.length;j++){
 const a=elements[i].pos,b=elements[j].pos;
 assert(Math.abs(a[0]-b[0])>=4.65||Math.abs(a[1]-b[1])>=3.7,'Overlapping pedestals');
}
console.log('PASS: 11 elements, 13 named profiles, 8−2+5=11, cohort filters, 4 locations, Camp links, empty statistics, non-overlapping pedestals');
