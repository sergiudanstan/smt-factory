/* ===================================================================
   SMT FACTORY SUITE — hall areas, people and AMRs.
   Uses SMT_PROPS when it is loaded; otherwise a labelled box of the
   documented size. Line footprints (z 2200..5000 and -5000..-2200,
   x -16000..8000) stay empty for the machines the coordinator places.
   SMT_FACTORY.areas(C, hall, opts) fills hall.andons and hall.movers.
   =================================================================== */
'use strict';
window.SMT_FACTORY=window.SMT_FACTORY||{};
window.SMT_FACTORY.areas=function(C,hall,opts){
opts=opts||{};
const PI=Math.PI;
const P=(typeof SMT_PROPS!=='undefined')?SMT_PROPS:null;
const PH={palletRack:[4000,5000,1100],pallet:[1200,900,800],esdBench:[1500,1950,750],dryCabinet:[600,1800,700],
  reelTower:[900,2050,900],reelShelf:[1800,2000,400],feederCart:[650,1000,750],stencilRack:[1100,900,800],
  pasteFridge:[600,1400,620],lockers:[1800,1800,500],fireExtinguisher:[400,1750,200],firstAid:[460,1600,200],
  sign:[600,200,40],person:[500,1750,400],trolley:[900,950,500],amr:[890,700,580],forklift:[2000,2200,1000],
  palletJack:[700,1300,1600],testStation:[2000,2000,900],xray:[1400,1950,1300],selectiveSolder:[2100,1650,1600],
  compressor:[1500,1500,900],airReceiver:[1100,2600,1100],airDryer:[800,1100,700],n2Generator:[1800,1800,900],
  desk:[1600,740,800],officeChair:[600,1000,600],meetingTable:[2800,760,1400],whiteboard:[1800,1900,400],
  andonBoard:[1600,900,80],turnstile:[700,1200,700],wasteBins:[1400,600,500],reworkStation:[1500,2100,750]};
const groups={};
function zone(name){const g=new THREE.Group();g.name=name;hall.root.add(g);groups[name]=g;return g;}
function put(parent,name,x,z,ry,o){
  let g;
  if(P&&typeof P[name]==='function')g=P[name](C,o||{});
  else{g=new THREE.Group();const s=PH[name]||[1000,1000,1000];
    C.box(g,s[0],s[1],s[2],C.std(0x8b939c,.6,.1),0,s[1]/2,0);
    C.label(g,name,Math.min(900,s[0]-40),140,0,s[1]+30,0,{bg:'#1e6fd9',fg:'#fff',size:.4});}
  g.position.set(x,0,z);if(ry)g.rotation.y=ry;parent.add(g);return g;
}
function mslOven(){
  const g=new THREE.Group(),body=C.std(0xd9dde1,.5,.12),dk=C.std(0x2a3036,.5,.3);
  C.box(g,900,1500,900,body,0,750,0);C.box(g,760,520,30,dk,0,900,450);
  C.box(g,700,16,16,C.emissive(0xffb15a,.8),0,1180,455,{cast:false});
  C.plate(g,['MSL BAKE','125 °C'],520,180,0,640,470,{bg:'#111',fg:'#f2c400',border:'#f2c400'});
  C.label(g,'MSL BAKE',700,140,0,1560,460,{bg:'#1e6fd9',fg:'#fff',size:.46});
  return g;
}

const wh=zone('warehouse'),st=zone('store'),smt=zone('smt'),post=zone('postsmt'),pack=zone('packing');
const off=zone('offices'),util=zone('utility'),ent=zone('entrance'),safe=zone('safety');

/* warehouse — racks face the central aisle, docks stay clear on the west */
[[-30800,-10500,PI/2],[-30800,9000,PI/2],[-25800,-10500,-PI/2],[-25800,9000,-PI/2]].forEach(p=>
  put(wh,'palletRack',p[0],p[1],p[2],{bays:3,levels:3,loads:true}));
[[-34200,-4500],[-34200,0],[-34200,4500],[-34500,9000]].forEach(p=>put(wh,'pallet',p[0],p[1],0,{loaded:true,h:700}));
put(wh,'palletJack',-33600,-9000,PI/2);
put(wh,'trolley',-33600,12000,0);
put(wh,'wasteBins',-24000,-16000,0);

/* component store + kitting, inside the EPA */
[[-21400,-11000],[ -21400,-7800]].forEach(p=>put(st,'reelTower',p[0],p[1],PI/2));
put(st,'dryCabinet',-21400,-4500,PI/2);put(st,'dryCabinet',-21400,-2200,PI/2);
put(st,'pasteFridge',-21400,800,PI/2);
put(st,'stencilRack',-21400,3800,PI/2);
put(st,'reelShelf',-21400,7500,-PI/2);
[[-18200,-10000],[-18200,-6500]].forEach(p=>put(st,'reelShelf',p[0],p[1],PI/2));
[[-18200,-2800],[-18200,200],[-18200,2800]].forEach(p=>put(st,'feederCart',p[0],p[1],PI/2));
put(st,'esdBench',-18000,7000,-PI/2,{w:1600,monitor:true,solder:false});
const oven=mslOven();oven.position.set(-18000,0,10500);oven.rotation.y=-PI/2;st.add(oven);

/* post-SMT — north row and south row, clear of the office block (z < 14000) */
put(post,'esdBench',10800,2800,0,{microscope:true,solder:true});
put(post,'reworkStation',14200,2800,0);
put(post,'xray',17800,2600,0);
put(post,'selectiveSolder',20800,2400,PI);
put(post,'testStation',11500,-4200,PI);
put(post,'testStation',16000,-4200,PI);
put(post,'esdBench',19800,-4200,PI,{solder:true,monitor:true});
put(post,'wasteBins',20500,-8000,0);
put(post,'trolley',9800,-1000,PI/2);

/* packing */
put(pack,'esdBench',26500,2000,0,{solder:false,monitor:true});
put(pack,'esdBench',30500,2000,0,{solder:false,monitor:true});
[[27000,-5500],[29800,-5500],[32600,-5500]].forEach(p=>put(pack,'pallet',p[0],p[1],0,{loaded:true,h:800}));
put(pack,'palletRack',28500,9000,0,{bays:2,levels:3,loads:true});
put(pack,'wasteBins',33500,2000,PI/2);
put(pack,'palletJack',24500,-2000,-PI/2);

/* offices along the north wall — dark glass, desks, meeting room */
const glass=C.std(0x9ec4dc,.06,.2,{transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide});
function gwall(x,z,w,h,d){C.box(off,w,h,d,glass,x,h/2,z,{cast:false});}
gwall(12000,15200,8000,2800,80);gwall(23000,15200,14000,2800,80);   /* south glass, door at x=16000 */
gwall(8000,18000,80,2800,5600);gwall(30000,18000,80,2800,5600);
gwall(24000,19200,80,2800,2800);gwall(24000,16400,80,2800,1600);    /* meeting-room partition, door gap */
[[11000,19300],[14800,19300],[18800,19300],[21400,19300]].forEach(p=>{
  put(off,'desk',p[0],p[1],PI);put(off,'officeChair',p[0],p[1]-900,0);});
put(off,'meetingTable',27200,18000,0,{seats:8});
put(off,'whiteboard',27200,20550,PI);
put(off,'wasteBins',29500,16000,PI);

/* utility room */
const uw=C.std(0xc5ced6,.7,.05);
function uwall(x,z,w,h,d){C.box(util,w,h,d,uw,x,h/2,z,{cast:false});}
uwall(-10000,16080,4000,2800,120);uwall(-4000,16080,4000,2800,120);  /* south, 2 m door at x=-7000 */
uwall(-12000,18500,120,3000,4800);uwall(-2000,18500,120,3000,4800);
put(util,'compressor',-10500,18800,PI/2);
put(util,'airDryer',-8200,18600,PI/2);
put(util,'airReceiver',-6000,19000,0);
put(util,'n2Generator',-3800,18800,-PI/2);

/* ESD entrance */
put(ent,'lockers',-12500,-19200,0,{n:6});
put(ent,'turnstile',-9000,-19000,0);
put(ent,'turnstile',-7200,-19000,0);
put(ent,'esdBench',-5500,-18800,PI,{w:1200,solder:false,monitor:true,shelf:false});

/* extinguishers, first-aid, exit signs */
for(let i=1;i<=11;i+=2){
  const x=-36000+i*6000;
  put(safe,'fireExtinguisher',x,-20740,0);
  if(i%4===1)put(safe,'firstAid',x,20740,PI);
}
[[-10000,-20880,0,'ENTRANCE'],[24000,-20880,0,'EXIT'],[-28000,20880,PI,'EXIT'],[18000,20880,PI,'EXIT'],
 [35880,-12000,-PI/2,'EXIT'],[35880,6000,-PI/2,'EXIT']].forEach(s=>{
  const g=put(safe,'sign',s[0],s[1],s[2],{text:s[3],w:780,h:240,bg:s[3]==='EXIT'?'#1f9e55':'#1e6fd9'});
  g.position.y=2500;
});

/* zone names on the floor */
[['GOODS IN / OUT',-29500,-16000],['COMPONENT STORE',-19800,12500],['SMT LINES',-5500,11000],
 ['POST-SMT',15000,11000],['PACKING',29000,-14000],['OFFICES',18000,16800],['UTILITY',-7000,17200],
 ['ESD ENTRANCE',-10000,-17200]].forEach(l=>C.label(hall.root,l[0],3400,460,l[1],36,l[2],{rx:-PI/2,bg:'#16324f',fg:'#e8f1ff',pw:1024,size:.42}));

/* andon boards hanging under the cable tray (tray at y=3200) */
linesAndons();
function linesAndons(){
  hall.lines.forEach(ln=>{
    const mid=ln.x0+10000;
    const b=put(smt,'andonBoard',mid,ln.z,0,{w:1800,h:800,hang:200});
    b.position.y=2200;
    hall.andons.push({line:ln.id,board:b});
    paint(b,ln.id,true);
  });
}
function paint(board,title){
  const ud=board.userData;if(!ud||!ud.ctx)return;
  const ctx=ud.ctx,W=1024,H=576,t=C.T.sim;
  const out=Math.round(112+6*Math.sin(t/40)),oee=(91+1.2*Math.sin(t/70)).toFixed(1),fpy=(98.4+.3*Math.sin(t/55)).toFixed(1);
  ctx.fillStyle='#0b1016';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#12325e';ctx.fillRect(0,0,W,70);
  ctx.fillStyle='#e7f0ff';ctx.font='700 36px "Segoe UI",Arial';ctx.textAlign='left';ctx.fillText(title+'  ·  ANDON',28,48);
  const cell=(x,y,k,v,c)=>{ctx.fillStyle='#121922';ctx.fillRect(x,y,230,160);ctx.fillStyle=c;ctx.fillRect(x,y,230,8);
    ctx.fillStyle='#8ea8c6';ctx.font='500 22px "Segoe UI",Arial';ctx.fillText(k,x+16,y+48);
    ctx.fillStyle='#f2f6fb';ctx.font='700 48px "Segoe UI",Arial';ctx.fillText(v,x+16,y+118);};
  cell(24,100,'OUT / h',String(out),'#3dd68c');cell(270,100,'OEE',oee+'%','#3dd68c');
  cell(516,100,'FPY',fpy+'%','#3dd68c');cell(762,100,'NG','2','#ffb020');
  ctx.fillStyle='#102418';ctx.fillRect(24,290,976,250);
  ctx.fillStyle='#3dd68c';ctx.font='700 40px "Segoe UI",Arial';ctx.textAlign='center';ctx.fillText('RUNNING',512,400);
  ctx.font='500 24px "Segoe UI",Arial';ctx.fillStyle='#b7cbe0';ctx.fillText('placement is the bottleneck',512,460);
  if(ud.tex)ud.tex.needsUpdate=true;
}

/* people, two AMRs, one forklift — animated from sim time */
const moversG=new THREE.Group();moversG.name='movers';moversG.userData.dynamic=true;hall.root.add(moversG);
function loop(group,pts,speed,front,kind){
  const lens=[];let total=0;
  for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];const L=Math.hypot(b[0]-a[0],b[1]-a[1])||1;lens.push(L);total+=L;}
  return {kind,group,step(){
    const dist=((C.T.sim*speed)%total+total)%total;let left=dist,i=0;
    while(left>lens[i]&&i<lens.length-1){left-=lens[i];i++;}
    const a=pts[i],b=pts[(i+1)%pts.length],u=left/lens[i];
    group.position.set(a[0]+(b[0]-a[0])*u,0,a[1]+(b[1]-a[1])*u);
    const dx=b[0]-a[0],dz=b[1]-a[1];
    group.rotation.y=front==='x'?Math.atan2(-dz,dx):Math.atan2(dx,dz);
    const ud=group.userData,s=Math.sin(C.T.sim*7)*.55;
    if(ud.legs){ud.legs[0].rotation.x=s;ud.legs[1].rotation.x=-s;ud.arms[0].rotation.x=-s*.75;ud.arms[1].rotation.x=s*.75;}
    if(ud.forks)ud.forks.position.y=60+Math.sin(C.T.sim*.45)*140;
    if(ud.leds)ud.leds.emissiveIntensity=1.2+Math.sin(C.T.sim*5)*.8;
  }};
}
function stand(group,kind){
  return {kind,group,step(){const ud=group.userData;if(!ud.arms)return;const s=Math.sin(C.T.sim*1.4)*.1;
    ud.arms[0].rotation.x=.35+s;ud.arms[1].rotation.x=.15-s;}};
}
function personAt(x,z,ry){const g=put(moversG,'person',x,z,ry||0);return g;}
const aisle=(z,x0,x1,speed)=>[[x0,z],[x1,z]];
/* eight walking operators on aisle loops that stay out of the machine bands */
[
  [aisle(0,-24000,30000),1300],
  [aisle(8000,-22000,26000),1200],
  [aisle(-8000,-22000,24000),1100],
  [[[-28400,-12000],[-28400,12000],[-34000,0],[-28400,-12000]],1400],
  [aisle(6800,9000,21000),1000],
  [aisle(-6800,24000,33000),1000],
  [[[-20000,-12000],[-17000,-12000],[-17000,-900],[7000,-900],[7000,-12000],[-20000,-12000]],900],
  [[[-19000,11000],[-17000,11000],[-17000,-1400],[6500,-1400],[14000,-1400],[14000,9000],[-19000,9000]],900]
].forEach((spec,i)=>{
  const g=personAt(spec[0][0][0],spec[0][0][1],0);
  hall.movers.push(loop(g,spec[0],spec[1],'z','person'));
});
/* four standing */
[[-18000,6200,-PI/2],[-7000,6800,PI/2],[-4000,-6800,-PI/2],[15000,-6800,0],[27500,-6800,PI]].forEach(p=>{
  hall.movers.push(stand(personAt(p[0],p[1],p[2]),'person'));
});
/* two AMRs: store -> line start -> line end -> post-SMT */
const amr1=put(moversG,'amr',-20000,-12000,0,{top:'magazine'});
hall.movers.push(loop(amr1,[
  [-20000,-9000],[-17200,-9000],[-17200,1400],[6800,1400],[15000,1400],[15000,-9000]
],800,'z','amr'));
const amr2=put(moversG,'amr',-19000,10000,PI,{top:'cart'});
hall.movers.push(loop(amr2,[
  [-19000,10000],[-17200,10000],[-17200,-1400],[6400,-1400],[14500,-1400],[14500,10000]
],750,'z','amr'));
const fk=put(moversG,'forklift',-34500,0,0);
hall.movers.push(loop(fk,[
  [-34500,0],[-28400,0],[-28400,11000],[-28400,-11000],[-28400,0]
],1100,'x','forklift'));

C.onFrame(()=>hall.movers.forEach(m=>m.step()));
C.onSlow(()=>hall.andons.forEach(a=>paint(a.board,a.line)));

/* merge static props; movers stay dynamic */
Object.keys(groups).forEach(k=>{try{C.bake(groups[k]);}catch(e){/* a zone with nothing mergeable is fine */}});
return hall;
};
