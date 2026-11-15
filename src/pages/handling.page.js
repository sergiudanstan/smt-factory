/* HANDLING — stand-alone page: loader -> shuttle -> inspection conveyor -> merge -> unloader */
'use strict';
(function(){
const C=SMT3D.init({camPos:[0,3600,9800],camTgt:[-60,650,0],maxDist:25000,shadow:7000,shadowFar:16000,followShadow:true,contact:[10000,3000],esd:11000});
SMT_LINE.install(C);
/* rails of neighbouring machines meet: gap = outReach + inReach */
const L=C.build('loader',{x:-2860,standalone:true,prepare:b=>{if(C.rnd()<.05)b.spi={ng:true};}});
const S=C.build('shuttle',{x:-1270,standalone:true});
const V=C.build('conveyor',{x:0,length:1200,lanes:[1,2],inspection:true,standalone:true,onBoard:b=>{if(C.rnd()<.08){b.result='NG';b.ngBy='INSP';}}});
const G=C.build('merge',{x:1270,standalone:true});
const U=C.build('unloader',{x:2860,standalone:true});
C.line.connect();
const ms=[[L,'ld'],[S,'sh'],[V,'cv'],[G,'mg'],[U,'ul']];
const vmap={over:()=>C.flyTo([0,3600,9800],[-60,650,0])};
ms.forEach(([m,p])=>Object.entries(m.views).forEach(([k,v])=>{vmap[p+'_'+k]=()=>{ms.forEach(a=>{if(a[0].setHood)a[0].setHood(!!(v.hood&&a[0]===m));if(a[0].setDoor)a[0].setDoor(!!(v.door&&a[0]===m));});const O=m.origin();const t=[v.t[0]+O.x,v.t[1],v.t[2]+O.z];C.flyTo([v.p[0]+O.x,v.p[1],v.p[2]+O.z],t);};}));
C.addViews(vmap);
let hoods=false;const $=id=>document.getElementById(id);
$('bHood').onclick=()=>{hoods=!hoods;ms.forEach(a=>a[0].setHood(hoods));$('bHood').textContent=hoods?'Close covers':'Open covers';$('bHood').classList.toggle('on',hoods);};
$('bRep').onclick=()=>{L.replenish(3);U.replenish(3);};
$('bEmp').onclick=()=>{L.emptyFull();U.emptyFull();S.emptyRack();G.emptyRack();};
const rows=$('rows');ms.forEach(([m])=>{const d=document.createElement('div');d.className='mr';d.innerHTML='<div class="n"><span>'+m.name+'</span><span class="pill idle">—</span></div><div class="d"></div>';rows.appendChild(d);m._row=d;});
C.onHud(()=>{
 const sum=m=>m.kind==='loader'?'released '+m.counters.out+' · mag '+(m.st.mag?m.st.mag.n:0)+'/50 · full buf '+m.st.buf.length+'/3':
  m.kind==='unloader'?'stored '+m.st.stored+' · mag '+(m.st.mag?m.st.mag.n:0)+'/50 · full out '+m.st.fullM:
  m.kind==='shuttle'?'in '+m.counters.in+' · out '+m.counters.out+' · rejected '+m.counters.ng+' · rack '+m.st.rackN+'/10':
  m.kind==='merge'?'in '+m.counters.in+' · out '+m.counters.out+' · NG '+m.counters.ng+' · buf '+m.st.rackN+'/20 · real '+m.st.real+' / FC '+m.st.fc:
  'in '+m.counters.in+' · out '+m.counters.out+' · inspected '+m.st.insp;
 ms.forEach(([m])=>{const p=m._row.querySelector('.pill');p.textContent=m.state;p.className='pill '+(m.state==='DOWN'?'ng':m.state==='RUN'?'ok':m.state==='IDLE'?'idle':'cl');
  m._row.querySelector('.d').textContent=m.step+(m.detail?' · '+m.detail:'')+' | '+sum(m);});
 const ln=C.line,r=ln.rate();SMT.cycle(U.st.stored+' boards','rate '+Math.round(r)+' boards/h · loader cycle '+(L.avgCt()?L.avgCt().toFixed(1)+' s':'—')+' · WIP '+ln.wip(),'LINE OUTPUT');
 const lg=$('log');const ev=C.events.slice(0,6);const key=ev.length+':'+(ev[0]&&ev[0].t);if(lg._k!==key){lg._k=key;lg.innerHTML='';ev.forEach(e=>{const d=document.createElement('div');d.textContent=e.m+': '+e.text;if(e.cls)d.className=e.cls;lg.appendChild(d);});}
});
C.expose({loader:L,shuttle:S,conveyor:V,merge:G,unloader:U,summary:()=>({loader:L.counters,shuttle:{...S.counters,rack:S.st.rackN,svc:S.st.svc,rej:S.st.rejTotal},conveyor:V.counters,merge:{...G.counters,buf:G.st.rackN,real:G.st.real,fc:G.st.fc,svc:G.st.svc},unloader:{stored:U.st.stored,out:U.counters.out,fullM:U.st.fullM},lineOut:C.line.out,loaderCt:L.avgCt()})});
C.start();
})();
