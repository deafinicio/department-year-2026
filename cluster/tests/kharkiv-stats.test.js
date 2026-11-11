import test from 'node:test';
import assert from 'node:assert/strict';
import {ages,locations,male,female,total,audience} from '../src/kharkiv-stats.js';

test('Kharkiv numbers reconcile to the October source across age, sex and location',()=>{
  assert.deepEqual([total,male,female],[6985,2607,4378]);
  assert.deepEqual(ages.map(a=>a.total),[39,468,2230,1749,2016,483]);
  assert.deepEqual(locations.map(a=>a.total),[3008,2014,1963,0]);
  assert.deepEqual(audience.map(a=>[a.count,a.percent]),[[2737,39.2],[4248,60.8]]);
});
