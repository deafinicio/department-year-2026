import test from 'node:test';
import assert from 'node:assert/strict';
import {regions,slides,sharedColumns,sharedRows,sections} from '../src/content.js';

test('matches the 14-page source and preserves the order of speakers',()=>{
  assert.equal(slides.length,14);
  assert.equal(slides[0].kind,'opening');
  assert.equal(slides.at(-1).kind,'shared');
  assert.equal(new Set(slides.map(s=>s.id)).size,slides.length);
  assert.deepEqual(regions.map(r=>r.id),['chernihiv','sumy','kharkiv']);
  for(let i=0;i<regions.length;i++){
    const chapter=slides.slice(1+4*i,5+4*i);
    assert.deepEqual(chapter.map(s=>s.kind),sections.map(s=>s[0]));
    assert(chapter.every(s=>s.region===regions[i]&&s.regionIndex===i));
  }
});

test('regional tables retain all rows and figures are only provided where sourced',()=>{
  assert.deepEqual(regions.map(r=>r.results.length),[3,8,4]);
  assert.deepEqual(regions.map(r=>r.achievements.length),[3,4,3]);
  assert.deepEqual(regions.map(r=>r.plans.length),[5,5,6]);
  assert.deepEqual(regions.map(r=>r.metrics.map(m=>m[0])),[['4 797','56,85 %','43,15 %'],['10 552','731'],[]]);
  assert(regions.flatMap(r=>r.results).every(row=>row.length===3&&row[0]&&row[1]));
});

test('shared discussion table has the three original prompts and five rows',()=>{
  assert.deepEqual(sharedColumns,['Що завадило?','Як ми реагували?','Що змінили в роботі?']);
  assert.equal(sharedRows.length,5);
  assert(sharedRows.every(row=>row.length===sharedColumns.length&&row.every(v=>typeof v==='string')));
});

test('Sumy audience groups sum to the supplied total and percentages are rounded correctly',()=>{
  const sumy=regions.find(r=>r.id==='sumy'),total=Number(sumy.metrics[0][0].replaceAll(' ',''));
  assert.deepEqual(sumy.audience.map(a=>a.count),[5494,5058]);
  assert.equal(sumy.audience.reduce((sum,a)=>sum+a.count,0),total);
  for(const a of sumy.audience)assert.equal(Number((a.count/total*100).toFixed(1)),a.percent);
});
