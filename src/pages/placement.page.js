'use strict';
(function(){
const C=SMT3D.init({camPos:[-2900,2500,3300],camTgt:[0,800,0],esd:4600,contact:[4300,3200]});
SMT_LINE.install(C);
C.source({id:'spi',x:-1700,length:800,lanes:[1,2],label:'FROM SPI  ▶',stage:'printed',interval:1});
const m=C.build('placement',{x:0,standalone:true});
C.sink({id:'reflow',x:1700,length:800,lanes:[1,2],label:'▶  TO REFLOW'});
const $=id=>document.getElementById(id),put=(id,t)=>{const e=$(id);if(e)e.textContent=t;};
const colors={chip:'#8a7a62',led:'#42c86a',ic:'#3b4250',ecap:'#b8c0c8',tant:'#d9a12a',conn:'#15171a'};
Object.entries(colors).forEach(([k,c])=>{const s=document.createElement('span'),i=document.createElement('i');i.style.background=c;s.append(i,document.createTextNode(k));$('legend').append(s);});
const grids=['noz-f','noz-r'].map(id=>Array.from({length:16},()=>{const e=document.createElement('div');$(id).append(e);return e;}));
document.querySelectorAll('.s-total').forEach(e=>e.textContent='/ '+m.job.length);
document.querySelectorAll('[data-cover]').forEach(b=>b.onclick=()=>{
 m.setCovers(b.dataset.cover);document.querySelectorAll('[data-cover]').forEach(e=>e.setAttribute('aria-pressed',String(e===b)));
});
['door-f','door-r'].forEach((id,i)=>$(id).onclick=()=>{m.setDoor(i,!m.doors[i].open);});
$('trail').onchange=()=>m.setPath($('trail').checked);
function timeline(){
 const c=$('lanes'),r=c.getBoundingClientRect(),d=window.devicePixelRatio||1;
 if(!r.width)return;c.width=Math.round(r.width*d);c.height=Math.round(r.height*d);
 const g=c.getContext('2d');g.scale(d,d);
 m.heads.forEach((h,i)=>{
  const total=h.schedule.length?h.schedule[h.schedule.length-1].t1:1,y=i*26;
  for(const s of h.schedule){g.globalAlpha=s.kind==='move'?.25:.85;g.fillStyle=['anc','scan','fiducial','reject'].includes(s.kind)?'#f0b840':i?'#c78af0':'#3cc7c3';g.fillRect(s.t0/total*r.width,y,Math.max(.5,(s.t1-s.t0)/total*r.width),21);}
  g.globalAlpha=1;g.fillStyle='#ffffff';g.fillRect(h.time/total*r.width,y,2,21);
 });
}
C.onHud(()=>{
 ['door-f','door-r'].forEach((id,i)=>{const on=m.doors[i].open;$(id).setAttribute('aria-pressed',String(on));put(id,(on?'Close ':'Open ')+(i?'rear':'front')+' door');});
 $('tip').style.display=m.doors.some(d=>d.open)?'none':'';
 m.heads.forEach((h,i)=>{
  const p=m.pose(i),s=p.seg;put('now-'+i,m.down?'ALARM':h.status==='STARVED'?'Waiting for clamped board':s.label);put('cmd-'+i,m.down?m.detail:s.cmd);
  put('now-c'+i,h.conveyor);put('cmd-c'+i,'IN '+(h.queue?'BUSY':'FREE')+' · WORK '+(h.work?'#'+h.work.sn:'FREE')+' · OUT '+(h.out?'BUSY':'FREE'));
  put('s-p'+i,h.placed);put('m'+i+'-n',h.placed+' / '+m.job.length);put(i?'hr-trip':'hf-trip','trip '+(s.trip+1)+' / '+m.program.trips.length);
  const ps=h.programStats;
  put('program-'+i,ps?ps.trips+' trips · '+ps.ancVisits+' ANC · '+ps.changes+' changes · '+ps.cycle.toFixed(2)+' s':'Setting up');
  put('rate-'+i,Math.round(h.totalPlaced/Math.max(1,C.T.sim)*3600).toLocaleString()+' cph');
  put('ppm-'+i,Math.round(h.rejects/Math.max(1,h.picks)*1e6)+' ppm');
  grids[i].forEach((e,k)=>{e.textContent={small:'S',medium:'M',large:'L',special:'XL'}[h.classes[k]];
    e.title='N'+(k+1)+' · '+h.classes[k]+' · vacuum '+(h.holding[k]?'ON':'OFF');e.classList.toggle('full',!!h.holding[k]);e.classList.toggle('act',s.k===k||!!s.changes?.some(c=>c.k===k));});
  const c=$('map'+i),g=c.getContext('2d');g.fillStyle='#0e5a30';g.fillRect(0,0,500,400);
  // Place order can differ from the job order, so derive completed parts from executed events.
  const done=new Set(h.schedule.slice(0,h.idx).filter(s=>s.kind==='place').map(s=>s.p.job));
  if(s.kind==='place'&&h.time>=(s.t0+s.t1)/2)done.add(s.p.job);
  m.job.forEach(p=>{const x=(p.u+.125-p.hw)*2000,y=(.1-p.v-p.hh)*2000,w=Math.max(3,p.hw*4000),hh=Math.max(3,p.hh*4000),on=done.has(p);
   g.fillStyle=on?colors[p.kind]:'rgba(205,187,134,.45)';g.fillRect(x,y,w,hh);
   if(on){g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=1;g.strokeRect(x+.5,y+.5,w-1,hh-1);}});   /* placed parts outlined, as in the original */
 });
 put('s-out',m.counters.out);put('s-cph',Math.round(m.stats.placed/Math.max(1,C.T.sim)*3600).toLocaleString());
 put('s-cycle','last '+m.ct.toFixed(1)+' s');put('live-sub',m.state);
 ['changes','rejects','alarms'].forEach(k=>put('s-'+k,m.stats[k]));
 put('clock-now',m.heads[0].time.toFixed(1));const sched=m.heads[0].schedule;put('clock-total',sched.length?sched[sched.length-1].t1.toFixed(1):'0');
 SMT.cycle(m.ct?m.ct.toFixed(1)+' s':'—','per lane · '+m.job.length+' parts · '+m.counters.out+' boards out');
 $('log').replaceChildren(...m.log.slice(0,4).map(e=>{const d=document.createElement('div');d.textContent=e.text;d.className=e.cls;return d;}));
 timeline();
});
C.T.speed=1;C.line.connect();C.start();window.simReady=true;
})();
