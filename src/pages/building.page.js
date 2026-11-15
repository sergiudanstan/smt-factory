/* PLANT — stand-alone preview of the hall. Line machines are not loaded. */
'use strict';
(function(){
const C=SMT3D.init({camPos:[-52000,30000,52000],camTgt:[0,0,0],maxDist:140000,far:300000,floorSize:140000,
  shadow:9000,shadowFar:40000,esdLines:false,contactShadow:false,followShadow:true});
SMT_LINE.install(C);
const hall=SMT_FACTORY.building(C,{});
SMT_FACTORY.areas(C,hall,{});
/* opaque pads where the two lines will sit (10 mm, dark) plus a yellow outline */
const pad=C.std(0x12161c,.92,.04),yb=C.std(0xf0c423,.55,.02);
hall.lines.forEach(ln=>{
  const len=21000,dep=2500,x=ln.x0+len/2;
  C.box(C.scene,len,10,dep,pad,x,34,ln.z,{cast:false});
  C.box(C.scene,len,6,80,yb,x,42,ln.z+dep/2,{cast:false});
  C.box(C.scene,len,6,80,yb,x,42,ln.z-dep/2,{cast:false});
  C.box(C.scene,80,6,dep,yb,x-len/2,42,ln.z,{cast:false});
  C.box(C.scene,80,6,dep,yb,x+len/2,42,ln.z,{cast:false});
  C.label(C.scene,ln.id,2400,320,x,56,ln.z,{rx:-Math.PI/2,bg:'#1e6fd9',fg:'#ffffff',pw:1024,size:.5});
});
C.addViews(hall.views);
const list=document.getElementById('zoneList');
const title={warehouse:'Goods in / out',store:'Component store',smt:'SMT lines',postsmt:'Post-SMT',
  packing:'Packing',offices:'Offices',utility:'Utility room',entrance:'ESD entrance'};
if(list)Object.keys(hall.zones).forEach(k=>{
  const z=hall.zones[k],d=document.createElement('div');
  d.innerHTML='<span>'+(title[k]||k)+'</span><span>'+((z.x1-z.x0)/1000).toFixed(0)+' × '+((z.z1-z.z0)/1000).toFixed(0)+' m</span>';
  list.appendChild(d);
});
C.expose({summary:()=>({
  zones:Object.keys(hall.zones),lines:hall.lines.map(l=>l.id),
  andons:hall.andons.length,movers:hall.movers.length,
  people:hall.movers.filter(m=>m.kind==='person').length,
  amrs:hall.movers.filter(m=>m.kind==='amr').length
})});
C.start();
})();
