import test from 'node:test';
import assert from 'node:assert/strict';
import {finaleProjection} from '../src/finale-transition.js';

const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
test('the first full-screen frame is centered and clipped at the original panel',()=>{
  const panel=rect(1019,316,290,210),screen=rect(0,0,1363,936);
  const state=finaleProjection(panel,screen);
  assert.equal(state.clipPath,'inset(316px 54px 410px 1019px)');
  const [x,y,,scale]=state.transform.match(/-?\d+(?:\.\d+)?(?=px|\))/g).map(Number);
  assert.equal(screen.width/2+x,panel.left+panel.width/2);
  assert.equal(screen.height/2+y,panel.top+panel.height/2);
  assert(screen.width*scale>=panel.width-.001&&screen.height*scale>=panel.height-.001);
});

test('portrait expansion crops a centered map without distorting its aspect ratio',()=>{
  const panel=rect(18,75,354,210),screen=rect(0,0,390,844);
  const state=finaleProjection(panel,screen);
  assert.equal(state.clipPath,'inset(75px 18px 559px 18px)');
  assert.match(state.transform,/^translate3d\(0px,-242px,0\) scale\(/);
  assert.equal(finaleProjection(rect(0,900,354,210),screen),null);
});
