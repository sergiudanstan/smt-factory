/* ===================================================================
   SMT PLANT — factory page: building + areas + two complete dual-lane SMT lines.
   Every machine is the same module as on its stand-alone page (standalone:false).
   =================================================================== */
'use strict';
(function(){
const $=id=>document.getElementById(id);
const Q=new URLSearchParams(location.search);
const C=SMT3D.init({camPos:[-34000,21000,32000],camTgt:[-4000,0,0],maxDist:150000,far:320000,fov:40,shadow:9000,shadowFar:40000,
  esdLines:false,contactShadow:false,followShadow:true,floorSize:240000});
SMT_LINE.install(C);
const {THREE,PI}=C;
const F=window.SMT_FACTORY||{};
let hall=null;
try{hall=F.building?F.building(C,{}):null;}catch(e){console.error('building failed',e);}
try{if(F.areas&&hall)F.areas(C,hall,{});}catch(e){console.error('areas failed',e);}
/* the building paints demo figures on its andon boards; this page paints live line KPIs instead */
const ANDONS=(hall&&hall.andons)?hall.andons.slice():[];if(hall)hall.andons=[];

/* ---------- line definition ---------- */
/* body length along X and how far each machine's own conveyor sticks out of the body (in / out side) */
const DIMS={loader:{len:1600,inR:0,outR:120},printer:{len:1180,inR:250,outR:250},spi:{len:1000,inR:250,outR:250},
  shuttle:{len:1100,inR:120,outR:120},placement:{len:1280,inR:150,outR:150},conveyor:{len:900,inR:0,outR:0},
  reflow:{len:5800,inR:400,outR:400},aoi:{len:1250,inR:235,outR:235},merge:{len:1100,inR:120,outR:120},unloader:{len:1600,inR:120,outR:0}};
/* auto:true = the handling machines' own operators replenish magazines, empty the reject rack / NG buffer and take full magazines away */
const SPEC=[
  {kind:'loader',name:'LOADER',auto:true},
  {kind:'printer',name:'PRINTER',pasteDemo:2},
  {kind:'spi',name:'SPI'},
  {kind:'shuttle',name:'SHUTTLE',auto:true},
  {kind:'placement',id:'placementA',name:'PLACEMENT A',job:[0,.62]},
  {kind:'placement',id:'placementB',name:'PLACEMENT B',job:[.62,1],defectRate:.03},   /* mature line: ~3 % of boards with a placement defect */
  {kind:'conveyor',id:'insp',name:'INSPECTION CONVEYOR',length:900,lanes:[1,2],inspection:true},
  {kind:'reflow',name:'REFLOW OVEN',defectRate:.02},
  {kind:'conveyor',id:'cool',name:'COOLING CONVEYOR',length:900,lanes:[1,2]},
  {kind:'aoi',name:'AOI'},
  {kind:'merge',name:'MERGE / NG BUFFER',auto:true},
  {kind:'unloader',name:'UNLOADER',auto:true}
];
const PAGE={printer:'printer.html',placement:'placement.html',aoi:'aoi.html',spi:'spi.html',reflow:'reflow.html',
  loader:'handling.html',unloader:'handling.html',shuttle:'handling.html',merge:'handling.html',conveyor:'handling.html'};
const LANES={loader:[1],printer:[1],spi:[1],unloader:[1]};
const dims=s=>{const d=Object.assign({},DIMS[s.kind]||{len:1000,inR:0,outR:0});if(s.length)d.len=s.length;return d;};
const X0=-15500;
const LINES=[{id:'L1',name:'LINE 1',z:3600},{id:'L2',name:'LINE 2',z:-3600}].slice(0,+(Q.get('lines')||2));

/* stand-in for a module that is not available (keeps the line flowing) */
function placeholder(s,x,ln,id){
  const d=dims(s);
  if(s.kind==='loader')return C.source({id,name:s.name,x,length:d.len,depth:1000,lanes:[1],label:'LOADER',stage:'bare',interval:22,line:ln});
  if(s.kind==='unloader')return C.sink({id,name:s.name,x,length:d.len,depth:1000,lanes:[1,2],label:'UNLOADER',line:ln});
  const lanes=s.lanes||LANES[s.kind]||[1,2];
  const m=C.linkConveyor({id,name:s.name,x,length:d.len,lanes:s.kind==='shuttle'?[1]:lanes,line:ln});
  if(s.kind==='shuttle'){m.lanesOut=[1];}
  if(s.kind==='merge'){m.lanesOut=[1,2];}
  const body=C.box(m.group,d.len-40,1300,1300,C.stubMat,0,650,0,C.NOSH);body.position.y=650;
  C.label(m.group,s.name,Math.min(900,d.len-80),110,0,1302,0,{rx:-PI/2,bg:'#1e6fd9',pw:900,size:.42});
  m.kind=s.kind;m.placeholder=true;return m;
}

/* ---------- build the lines ---------- */
const lineObjs=LINES.map((L,i)=>{
  const ln=i===0?C.line:C.newLine({id:L.id,name:L.name});
  ln.id=L.id;ln.name=L.name;ln.root.position.set(X0,0,L.z);ln.ms=[];ln.z=L.z;
  let cursor=0,prevOut=0;
  SPEC.forEach((s,k)=>{
    const d=dims(s),gap=k?prevOut+d.inR+12:0,x=cursor+gap+d.len/2,id=L.id+'-'+(s.id||s.kind);
    const opts=Object.assign({},s,{x,line:ln,id,name:s.name});
    let m=null;
    try{m=SMT3D.registry[s.kind]?C.build(s.kind,opts):null;}catch(e){console.error('module '+s.kind+' failed',e);m=null;}
    if(!m)m=placeholder(s,x,ln,id);
    m.label=s.name;m.lineName=L.name;ln.ms.push(m);
    cursor=x+d.len/2;prevOut=d.outR;
  });
  ln.length=cursor;ln.connect();
  /* AOI verdict statistics (first-pass yield) */
  ln.aoiOk=0;ln.aoiNg=0;
  const aoi=ln.ms.find(m=>m.kind==='aoi');
  if(aoi){const rel=aoi.release;aoi.release=(b,l)=>{if(b.result==='NG')ln.aoiNg++;else ln.aoiOk++;return rel(b,l);};}
  return ln;
});
const allM=lineObjs.flatMap(l=>l.ms);
allM.forEach(m=>{if(m.group)C.clickable(m.group,()=>select(m,false));});
allM.forEach(m=>{if(m.group)C.tag(m.label,m.group,0,(m.height||1500)+380,0);});
if(hall&&hall.zones)Object.entries(hall.zones).forEach(([k,z])=>{if(z&&z.x0!==undefined){const o=new THREE.Object3D();o.position.set((z.x0+z.x1)/2,0,(z.z0+z.z1)/2);C.scene.add(o);C.tag(k.toUpperCase(),o,0,3200,0);}});

/* ---------- camera views ---------- */
const views={};
const lineView=(ln,side)=>{const cx=X0+ln.length/2;return{p:[cx-7000,5600,ln.z+side*9000],t:[cx+600,700,ln.z]};};
views.plant={p:[-34000,21000,32000],t:[-4000,0,0]};
lineObjs.forEach((ln,i)=>{views['line'+(i+1)]=lineView(ln,i===0?1:-1);});
const zv=(n,def)=>{const v=hall&&hall.views&&hall.views[n];if(v&&v.p&&v.t)return{p:v.p,t:v.t};
  const z=hall&&hall.zones&&hall.zones[n];if(z&&z.x0!==undefined){const cx=(z.x0+z.x1)/2,cz=(z.z0+z.z1)/2,w=Math.max(z.x1-z.x0,z.z1-z.z0);return{p:[cx-w*.55,w*.55+3000,cz+w*.75],t:[cx,0,cz]};}return def;};
views.store=zv('store',{p:[-27000,7000,9000],t:[-19500,500,0]});
views.warehouse=zv('warehouse',{p:[-42000,12000,14000],t:[-29000,500,0]});
views.postsmt=zv('postsmt',{p:[6000,8000,13000],t:[15000,500,0]});
views.offices=zv('offices',{p:[12000,9000,6000],t:[19000,1000,18000]});
views.utility=zv('utility',{p:[-13000,7000,8000],t:[-7000,800,18000]});
views.walk={p:[-14800,1650,0],t:[-11000,1450,0]};
views.entrance=zv('entrance',{p:[-7800,2600,-14000],t:[-10500,900,-19600]});
const vfn={};Object.entries(views).forEach(([k,v])=>{vfn[k]=()=>C.flyTo(v.p,v.t,1.6);});
if(hall&&hall.views&&typeof hall.views.walk==='function')vfn.tour=hall.views.walk;   /* automatic walk along the main aisle (moves with sim time) */
C.addViews(vfn);

/* ---------- WASD walking ---------- */
const keys={};
addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;keys[e.code]=true;});
addEventListener('keyup',e=>{keys[e.code]=false;});
const _f=new THREE.Vector3(),_r=new THREE.Vector3(),_up=new THREE.Vector3(0,1,0);
C.onFrame((dt,rdt)=>{
  const fw=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),rt=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  if(!fw&&!rt)return;
  const cam=C.camera,ct=C.controls;_f.subVectors(ct.target,cam.position);_f.y=0;if(_f.lengthSq()<1)return;_f.normalize();_r.crossVectors(_f,_up);
  const d=Math.max(cam.position.distanceTo(ct.target),2000),v=(keys.ShiftLeft||keys.ShiftRight?3:1)*Math.min(12000,d*.9)*(rdt||.016);
  const mv=_f.multiplyScalar(fw*v).add(_r.multiplyScalar(rt*v));cam.position.add(mv);ct.target.add(mv);
});

/* ---------- side panel: KPIs, line lists, legend, events ---------- */
const STATES=['RUN','IDLE','STARVED','BLOCKED','DOWN','SETUP'];
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const scol=s=>css('--s'+s)||'#888';
$('legend').innerHTML=STATES.map(s=>`<span><i class="dot" style="background:var(--s${s})"></i>${s==='STARVED'?'STARVED (no input)':s==='BLOCKED'?'BLOCKED (output full)':s==='DOWN'?'DOWN (alarm)':s}</span>`).join('');
const list=$('lineList');
lineObjs.forEach(ln=>{
  const blk=document.createElement('div');blk.className='lineblk';
  blk.innerHTML=`<h4><span>${ln.name}</span><em id="lr-${ln.id}">—</em></h4><div class="mchips"></div>`;
  const chips=blk.querySelector('.mchips');
  ln.ms.forEach(m=>{const c=document.createElement('span');c.className='mchip';c._m=m;c.innerHTML=`<i></i>${m.label.replace(' CONVEYOR',' CONV.').replace('MERGE / NG BUFFER','MERGE/NG')}`;c.onclick=()=>select(m,true);chips.appendChild(c);m._chip=c;});
  list.appendChild(blk);
  const o=document.createElement('option');o.value=ln.id;o.textContent=ln.name;$('gLine').appendChild(o);
});
function fmt(n,d=0){return (n===undefined||n===null||!isFinite(n))?'—':(+n).toFixed(d);}
function lineKpis(ln){
  const T=Math.max(1,C.T.sim-ln.started),insp=ln.aoiOk+ln.aoiNg,fpy=insp?ln.aoiOk/insp:null;
  const bn=ln.bottleneck(),rate=ln.rate();
  /* OEE of the bottleneck: A = 1 - (DOWN+SETUP)/T, P = RUN / (T - DOWN - SETUP), Q = FPY  =>  OEE = RUN/T x FPY */
  let A=null,P=null,O=null;
  if(bn&&C.T.sim-ln.started>240){const u=ln.busy(bn);A=1-u.down;P=A>0?Math.min(1,u.run/A):0;if(fpy!==null)O=A*P*fpy;}
  return {out:ln.out,rate,wip:ln.wip(),fpy,ng:ln.aoiNg,bn,A,P,O};
}
function drawKpis(){
  const ks=lineObjs.map(lineKpis);
  const tot=ks.reduce((a,k)=>a+k.out,0),rate=ks.reduce((a,k)=>a+k.rate,0),wip=ks.reduce((a,k)=>a+k.wip,0);
  const ok=lineObjs.reduce((a,l)=>a+l.aoiOk,0),ng=lineObjs.reduce((a,l)=>a+l.aoiNg,0);
  const oee=ks.filter(k=>k.O!==null);
  const down=allM.filter(m=>m.state==='DOWN').length;
  const tiles=[
    ['Boards out',tot,'',`${ks.map(k=>k.out).join(' + ')} by line`],
    ['Output rate',fmt(rate),'b/h',ks.map(k=>fmt(k.rate)).join(' + ')+' boards/h'],
    ['Work in process',wip,'boards','on conveyors and in machines'],
    ['First-pass yield',ok+ng?fmt(ok/(ok+ng)*100,1):'—','%',`${ok} pass · ${ng} flagged at AOI`],
    ['OEE (bottleneck)',oee.length?fmt(oee.reduce((a,k)=>a+k.O,0)/oee.length*100,0):'—','%',ks.map(k=>k.bn?k.bn.label:'—').join(' · ')],
    ['Alarms now',down,'machines',down?allM.filter(m=>m.state==='DOWN').map(m=>m.id).join(', '):'all running']
  ];
  $('kpis').innerHTML=tiles.map(t=>`<div class="stat"><small>${t[0]}</small><div class="value">${t[1]}<em>${t[2]}</em></div><div class="sub">${t[3]}</div></div>`).join('');
  const h=Math.floor(C.T.sim/3600),mm=Math.floor(C.T.sim%3600/60);$('kpiT').textContent='· shift time '+h+' h '+String(mm).padStart(2,'0')+' min';
  lineObjs.forEach((ln,i)=>{const e=$('lr-'+ln.id);if(e)e.textContent=fmt(ks[i].rate)+' b/h · '+ks[i].out+' out';});
  SMT.cycle(fmt(rate)+' b/h',`${tot} boards out · WIP ${wip} · FPY ${ok+ng?fmt(ok/(ok+ng)*100,1)+' %':'—'} · ${lineObjs.length} lines`,'PLANT OUTPUT');
  $('titleSub').textContent=`${lineObjs.length} SMT lines · ${allM.length} machines · component store · post-SMT · warehouse · offices`;
  allM.forEach(m=>{if(m._chip)m._chip.querySelector('i').style.background=scol(m.state);});
  const ev=C.events.slice(0,14);$('plog').innerHTML=ev.map(e=>{const t=e.t,mm=Math.floor(t/60),ss=Math.floor(t%60);return `<div class="${e.cls||''}">${String(mm).padStart(3,' ')}:${String(ss).padStart(2,'0')} <b>${e.m}</b> ${e.text}</div>`;}).join('');
}

/* ---------- machine inspector ---------- */
let sel=null;
const insetEntry=C.inset('minset',null,()=>{});
function select(m,fly){
  sel=m;allM.forEach(x=>x._chip&&x._chip.classList.toggle('sel',x===m));
  $('mName').textContent=(m.lineName+' · '+m.label);
  $('mSub').textContent=m.placeholder?'Module not available yet — a pass-through stand-in keeps the line flowing.':(m.spec?Object.entries(m.spec).slice(0,3).map(e=>e[1]).join(' · '):m.kind.toUpperCase());
  setCam(m,0);
  const vk=Object.keys(m.views||{}).filter(k=>m.views[k]&&m.views[k].p);
  $('mViews').innerHTML=vk.map(k=>`<button data-mv="${k}">${k.replace(/^(ld|ul|sh|mg|cv)_/,'')}</button>`).join('');
  $('mViews').querySelectorAll('[data-mv]').forEach(b=>b.onclick=()=>applyView(m,b.dataset.mv));
  const pg=PAGE[m.kind];$('mPage').style.display=pg?'':'none';if(pg)$('mPage').href=pg;
  if(fly)flyToMachine(m);
  drawInspector();
}
function applyView(m,k){
  const v=m.views&&m.views[k];if(!v||!v.p||!v.t)return;const O=m.origin();
  allM.forEach(x=>{if(x!==m&&x.setHood)try{x.setHood(0);}catch(e){}});
  if(m.setHood)try{m.setHood(v.hood?1:0);}catch(e){}
  if(m.setSten)try{m.setSten(!!v.sten);}catch(e){}
  C.flyTo([O.x+v.p[0],v.p[1],O.z+v.p[2]],[O.x+v.t[0],v.t[1],O.z+v.t[2]],1.3);
  document.querySelectorAll('[data-v]').forEach(b=>b.classList.remove('on'));
}
let camIdx=0;
function setCam(m,i){const cs=m.cameras||[];$('mCam').style.display=cs.length>1?'':'none';if(!cs.length){insetEntry.cam=null;$('minset').classList.add('none');return;}
  camIdx=(i+cs.length)%cs.length;const cam=cs[camIdx];insetEntry.cam=cam.cam;insetEntry.prepare=cam.prepare;insetEntry.override=cam.override||null;
  $('minset').classList.remove('none');$('minsetT').textContent=(cam.name||'CAMERA').toUpperCase()+(cs.length>1?'  ('+(camIdx+1)+'/'+cs.length+')':'');}
function flyToMachine(m){
  document.querySelectorAll('[data-v]').forEach(b=>b.classList.remove('on'));
  const O=m.origin(),v=m.views&&(m.views.over||m.views.iso||Object.values(m.views)[0]);
  if(v&&v.p&&v.t)C.flyTo([O.x+v.p[0],v.p[1],O.z+v.p[2]],[O.x+v.t[0],v.t[1],O.z+v.t[2]],1.4);
  else C.flyTo([O.x-2200,2600,O.z+3800],[O.x,900,O.z],1.4);
}
$('mFly').onclick=()=>sel&&flyToMachine(sel);
$('mCam').onclick=()=>sel&&setCam(sel,camIdx+1);
const step=d=>{const i=sel?allM.indexOf(sel):-1;select(allM[(i+d+allM.length)%allM.length],true);};
$('mPrev').onclick=()=>step(-1);$('mNext').onclick=()=>step(1);
function drawInspector(){
  if(!sel)return;const m=sel;
  const st=$('mState');st.textContent=m.state;st.className='pill '+(m.state==='RUN'?'ok':m.state==='DOWN'?'ng':(m.state==='IDLE'?'idle':'cl'));
  let rows=[];try{rows=m.info?m.info():[];}catch(e){rows=[['info()',String(e).slice(0,40)]];}
  const T=Math.max(1,C.T.sim),stt=Object.assign({},m.stateTime);stt[m.state]+=C.T.sim-m.stateSince;
  rows=[['Step',m.step||'—'],['Detail',m.detail||'—']].concat(rows).concat([
    ['Boards in / out',m.counters.in+' / '+m.counters.out],['Avg cycle (last 10)',m.avgCt()?m.avgCt().toFixed(1)+' s':'—'],
    ['RUN · STARVED · BLOCKED · DOWN',['RUN','STARVED','BLOCKED','DOWN'].map(s=>Math.round(stt[s]/T*100)+'%').join(' · ')]]);
  const seen=new Set();rows=rows.filter(r=>{const k=String(r[0]);if(seen.has(k))return false;seen.add(k);return true;});
  $('mrows').innerHTML=rows.slice(0,16).map(r=>`<div class="row"><span>${r[0]}</span><span>${r[1]===undefined?'—':r[1]}</span></div>`).join('');
  $('mlog').innerHTML=(m.log||[]).slice(0,6).map(e=>`<div class="${e.cls||''}">${e.text}</div>`).join('');
}

/* ---------- state timeline (Gantt) ---------- */
const gc=$('ganttC'),WIN=600;
function drawGantt(){
  const panel=$('gantt');if(panel.classList.contains('ov-off')||getComputedStyle(panel).display==='none')return;
  const r=gc.getBoundingClientRect(),dpr=devicePixelRatio||1;if(!r.width)return;
  if(gc.width!==Math.round(r.width*dpr)||gc.height!==Math.round(r.height*dpr)){gc.width=Math.round(r.width*dpr);gc.height=Math.round(r.height*dpr);}
  const g=gc.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,r.width,r.height);
  const ln=lineObjs.find(l=>l.id===$('gLine').value)||lineObjs[0],ms=ln.ms,LW=138,H=r.height-16,rh=Math.max(6,Math.min(15,H/ms.length)),t1=C.T.sim,t0=t1-WIN,W=r.width-LW-10;
  const X=t=>LW+(Math.max(t0,t)-t0)/WIN*W;
  g.font=`600 ${Math.max(7.5,Math.min(10.5,rh-1.5)).toFixed(1)}px "Segoe UI",Arial`;g.textBaseline='middle';
  ms.forEach((m,i)=>{const y=4+i*rh;
    g.fillStyle=m===sel?css('--acc2'):css('--mut');g.fillText(m.label.slice(0,20),8,y+rh/2);
    g.fillStyle=css('--btn');g.fillRect(LW,y+1,W,rh-2);
    const segs=m.gantt.length?m.gantt:[{s:m.state,t0:m.stateSince,t1:t1}];
    segs.forEach((sg,k)=>{const e=k===segs.length-1?t1:sg.t1;if(e<t0)return;g.fillStyle=scol(sg.s);g.fillRect(X(sg.t0),y+1,Math.max(1,X(e)-X(sg.t0)),rh-2);});
  });
  g.fillStyle=css('--mut');g.font='500 10px Consolas,monospace';
  for(let k=0;k<=10;k+=2){const t=t0+k*60,x=X(t);g.fillRect(x,H+2,1,4);g.fillText((k-10)+' min',Math.min(x+3,r.width-40),H+9);}
}
$('gLine').onchange=drawGantt;

/* ---------- plant map ---------- */
const mc=$('mapC');
const HS=hall&&hall.size,HB=HS&&HS.x0!==undefined?{x0:HS.x0,x1:HS.x1,z0:HS.z0,z1:HS.z1}:(Array.isArray(HS)?{x0:-HS[0]/2,x1:HS[0]/2,z0:-HS[1]/2,z1:HS[1]/2}:{x0:-36000,x1:36000,z0:-21000,z1:21000});
let mapT=null;
function mapXf(r){const pad=8,sx=(r.width-2*pad)/(HB.x1-HB.x0),sz=(r.height-2*pad)/(HB.z1-HB.z0),s=Math.min(sx,sz),ox=(r.width-(HB.x1-HB.x0)*s)/2,oz=(r.height-(HB.z1-HB.z0)*s)/2;
  return{s,X:x=>ox+(x-HB.x0)*s,Z:z=>oz+(z-HB.z0)*s,inv:(px,pz)=>[(px-ox)/s+HB.x0,(pz-oz)/s+HB.z0]};}
const _wp=new THREE.Vector3();
function drawMap(){
  const panel=$('map');if(panel.classList.contains('ov-off')||getComputedStyle(panel).display==='none')return;
  const r=mc.getBoundingClientRect(),dpr=devicePixelRatio||1;if(!r.width)return;
  if(mc.width!==Math.round(r.width*dpr)||mc.height!==Math.round(r.height*dpr)){mc.width=Math.round(r.width*dpr);mc.height=Math.round(r.height*dpr);}
  const g=mc.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,r.width,r.height);
  const T=mapT=mapXf(r);
  g.strokeStyle=css('--mut');g.lineWidth=1.2;g.strokeRect(T.X(HB.x0),T.Z(HB.z0),(HB.x1-HB.x0)*T.s,(HB.z1-HB.z0)*T.s);
  if(hall&&hall.zones){g.font='600 8.5px "Segoe UI",Arial';Object.entries(hall.zones).forEach(([k,z])=>{if(!z||z.x0===undefined)return;
    g.fillStyle='rgba(120,160,220,.10)';g.fillRect(T.X(z.x0),T.Z(z.z0),(z.x1-z.x0)*T.s,(z.z1-z.z0)*T.s);
    g.strokeStyle='rgba(120,160,220,.35)';g.strokeRect(T.X(z.x0),T.Z(z.z0),(z.x1-z.x0)*T.s,(z.z1-z.z0)*T.s);
    if(k!=='smt'){g.fillStyle=css('--mut');g.textAlign='center';g.fillText(k.toUpperCase(),T.X((z.x0+z.x1)/2),T.Z((z.z0+z.z1)/2)+3);g.textAlign='left';}});}
  allM.forEach(m=>{const O=m.origin(),L=m.length||1000,D=m.depth||1200;g.fillStyle=scol(m.state);g.globalAlpha=m===sel?1:.85;
    g.fillRect(T.X(O.x-L/2),T.Z(O.z-D/2),Math.max(2,L*T.s),Math.max(2,D*T.s));g.globalAlpha=1;
    if(m===sel){g.strokeStyle=css('--tx');g.lineWidth=1.5;g.strokeRect(T.X(O.x-L/2)-1.5,T.Z(O.z-D/2)-1.5,L*T.s+3,D*T.s+3);}});
  g.fillStyle='#ffffff';C.allBoards.forEach(b=>{b.g.getWorldPosition(_wp);g.fillRect(T.X(_wp.x)-1,T.Z(_wp.z)-1,2,2);});
  if(hall&&hall.movers)(hall.movers||[]).forEach(mv=>{const o=mv&&(mv.obj||mv.group||mv.g||mv.mesh||mv);if(!o||!o.getWorldPosition)return;o.getWorldPosition(_wp);
    g.fillStyle=(mv.kind||mv.type||'').toString().match(/amr|agv|fork/i)?'#f0b040':'#8fc8ff';g.beginPath();g.arc(T.X(_wp.x),T.Z(_wp.z),2.2,0,7);g.fill();});
  const cp=C.camera.position,ct=C.controls.target;g.strokeStyle=css('--acc2');g.lineWidth=1.5;g.beginPath();g.moveTo(T.X(cp.x),T.Z(cp.z));g.lineTo(T.X(ct.x),T.Z(ct.z));g.stroke();
  g.fillStyle=css('--acc2');g.beginPath();g.arc(T.X(cp.x),T.Z(cp.z),3.5,0,7);g.fill();
}
mc.addEventListener('click',e=>{if(!mapT)return;const r=mc.getBoundingClientRect(),[x,z]=mapT.inv(e.clientX-r.left,e.clientY-r.top);
  const cam=C.camera.position,ct=C.controls.target,off=cam.clone().sub(ct);const d=off.length(),k=Math.min(1,16000/d);off.multiplyScalar(k);
  C.flyTo([x+off.x,Math.max(1600,off.y),z+off.z],[x,600,z],1.2);});

/* ---------- andon boards above the lines ---------- */
function andonOf(a){const o=(a&&(a.board||a.group))||a,u=(o&&o.userData)||{};return{obj:o,ctx:a.ctx||u.ctx,tex:a.tex||u.tex,line:a.line||u.line};}
const _ap=new THREE.Vector3();
function andonLine(A){if(A.obj&&A.obj.getWorldPosition){A.obj.getWorldPosition(_ap);let best=null,bd=1e12;lineObjs.forEach(l=>{const d=Math.abs(l.z-_ap.z);if(d<bd){bd=d;best=l;}});if(best)return best;}
  return lineObjs.find(l=>l.id===A.line||l.name===A.line)||lineObjs[0];}
function drawAndons(){
  ANDONS.forEach((a,i)=>{const A=andonOf(a);if(!A.ctx)return;const ln=andonLine(A);if(!ln)return;
    const g=A.ctx,W=g.canvas.width,H=g.canvas.height,k=lineKpis(ln);
    g.fillStyle='#0b1018';g.fillRect(0,0,W,H);g.fillStyle='#1e6fd9';g.fillRect(0,0,W,H*.14);
    g.fillStyle='#fff';g.font=`900 ${H*.09}px Arial`;g.textBaseline='middle';g.textAlign='left';g.fillText(ln.name+'  ·  SMT',W*.03,H*.07);
    g.textAlign='right';g.font=`700 ${H*.06}px Consolas,monospace`;const hh=Math.floor(C.T.sim/3600),mm=Math.floor(C.T.sim%3600/60);g.fillText('SHIFT '+hh+':'+String(mm).padStart(2,'0'),W*.97,H*.07);
    const tiles=[['OUTPUT',k.out],['RATE b/h',fmt(k.rate)],['FPY %',k.fpy===null?'—':fmt(k.fpy*100,1)],['OEE %',k.O===null?'—':fmt(k.O*100,0)]];
    tiles.forEach((t,j)=>{const x=W*.03+j*W*.24;g.textAlign='left';g.fillStyle='#8fa3bd';g.font=`700 ${H*.05}px Arial`;g.fillText(t[0],x,H*.22);
      g.fillStyle='#fff';g.font=`800 ${H*.12}px Consolas,monospace`;g.fillText(String(t[1]),x,H*.33);});
    const n=ln.ms.length,bw=(W*.94)/n;
    ln.ms.forEach((m,j)=>{const x=W*.03+j*bw;g.fillStyle=scol(m.state);g.fillRect(x+2,H*.46,bw-4,H*.2);
      g.save();g.translate(x+bw/2,H*.72);g.rotate(-PI/2.8);g.fillStyle='#cfd8e3';g.font=`600 ${H*.035}px Arial`;g.textAlign='right';g.fillText(m.label.replace(' CONVEYOR',' CONV').slice(0,14),0,0);g.restore();});
    g.textAlign='left';g.fillStyle=k.bn?'#f0b040':'#8fa3bd';g.font=`700 ${H*.045}px Arial`;g.fillText('BOTTLENECK: '+(k.bn?k.bn.label+' · '+fmt(k.bn.avgCt(),1)+' s':'—'),W*.03,H*.95);
    if(A.tex)A.tex.needsUpdate=true;});
}

/* ---------- periodic UI ---------- */
let uiT=0,andT=0;
C.onHud(()=>{drawInspector();});
C.onSlow(()=>{drawKpis();drawGantt();drawMap();andT+=.2;if(andT>=1){andT=0;drawAndons();}});

/* ---------- automation hook ---------- */
C.expose({summary:()=>({lines:lineObjs.map(ln=>{const k=lineKpis(ln);return{id:ln.id,len:Math.round(ln.length),out:ln.out,rate:+k.rate.toFixed(1),wip:k.wip,fpy:k.fpy,oee:k.O,
  bottleneck:k.bn&&k.bn.id,states:ln.ms.map(m=>m.id.replace(ln.id+'-','')+':'+m.state+':'+m.counters.in+'/'+m.counters.out+(m.placeholder?'(stub)':''))};})}),
  select:id=>{const m=allM.find(x=>x.id===id);if(m)select(m,true);return !!m;},lineObjs,hall});

/* ---------- start: render, then warm the plant up so lines are full when the user looks ---------- */
C.start();
select(allM.find(m=>m.kind==='printer')||allM[0],false);
const warm=+(Q.get('prefill')||1200);
requestAnimationFrame(()=>requestAnimationFrame(()=>{
  $('loadSub').textContent=warm>0?`simulating the first ${Math.round(warm/60)} minutes of production`:'';
  setTimeout(()=>{const t0=performance.now();if(warm>0)window.__sim.ff(warm,.05);console.log('[plant] prefill '+warm+' s in '+Math.round(performance.now()-t0)+' ms');
    $('loading').classList.add('done');drawKpis();drawAndons();},40);
}));
})();
