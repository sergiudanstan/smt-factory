/* ===================================================================
   SMT FACTORY SUITE — plant hall.
   Datum: hall centre on the floor, y = 0. Interior 72 m (X) x 42 m (Z),
   eaves 8000, ridge 9500. Roof, walls and overhead services do not cast
   shadows (the core sun would black out the floor). Floor-standing steel does.
   SMT_FACTORY.building(C, opts) -> hall.
   =================================================================== */
'use strict';
window.SMT_FACTORY=window.SMT_FACTORY||{};
window.SMT_FACTORY.building=function(C,opts){
opts=opts||{};
const PI=Math.PI,NO={cast:false};
const X0=-36000,X1=36000,Z0=-21000,Z1=21000,Y_E=8000,Y_R=9500;
const BAY=6000,FRAMES=13;                 /* 12 bays, frames on both gables */
const LINE_X0=-15500;
const root=new THREE.Group();root.name='hall';C.scene.add(root);
const steel=C.std(0x8e969e,.38,.72),steelD=C.std(0x5c656e,.45,.6);
const purlinM=C.std(0xb7c0c8,.4,.55);
/* translucent so the plant overview still reads the floor; not a shadow caster */
const roofM=C.std(0xd5dde6,.45,.12,{transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide});
const skyM=C.emissive(0xd7e4ff,1.1);
const glassM=C.std(0x1c3348,.08,.55);
const doorM=C.std(0x3e4650,.55,.25);
const dockM=C.std(0x6a727b,.6,.2);
const conc=C.std(0x8b9096,.86,.02);
const epoxy=C.std(0x9aa1a6,.78,.04);
const esd=C.std(0x7d8d86,.8,.03);
const yel=C.std(0xf0c423,.55,.02);
const yelBlk=(()=>{const t=C.canvasTex(128,32,(g,W,H)=>{for(let x=0;x<W;x+=32){g.fillStyle=(x/32)%2?'#161616':'#f2c400';g.fillRect(x,0,32,H);}},{repeat:true});
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(24,1);return C.std(0xffffff,.6,0,{map:t});})();
const zebra=(()=>{const t=C.canvasTex(128,64,(g,W,H)=>{g.fillStyle='#e6e8ea';g.fillRect(0,0,W,H);g.fillStyle='#222';for(let x=0;x<W;x+=32)g.fillRect(x,0,16,H);},{repeat:true});
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(8,2);return C.std(0xffffff,.7,0,{map:t});})();
const seam=C.canvasTex(128,256,(g,W,H)=>{g.fillStyle='#d7dee6';g.fillRect(0,0,W,H);g.fillStyle='#eef2f6';
  for(let y=0;y<H;y+=32)g.fillRect(0,y,W,27);g.strokeStyle='#8b949e';g.lineWidth=3;
  for(let y=0;y<=H;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
  g.strokeStyle='rgba(255,255,255,.4)';for(let x=32;x<W;x+=64){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}},{repeat:true});
function wallMat(len,h){const map=seam.clone();map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(Math.max(1,len/1400),Math.max(1,h/420));map.needsUpdate=true;
  return C.std(0xffffff,.7,.04,{map});}
function inst(parent,geo,mat,items,cast){
  if(!items.length)return null;
  const im=new THREE.InstancedMesh(geo,mat,items.length),d=new THREE.Object3D();
  for(let i=0;i<items.length;i++){const it=items[i];
    d.position.set(it[0],it[1],it[2]);d.rotation.set(it[3]||0,it[4]||0,it[5]||0);d.scale.set(it[6]||1,it[7]||1,it[8]||1);d.updateMatrix();im.setMatrixAt(i,d.matrix);}
  im.castShadow=!!cast;im.receiveShadow=true;im.frustumCulled=false;parent.add(im);return im;
}
function band(parent,axis,fixed,t0,t1,y0,y1,thick,gaps){
  const h=y1-y0,yc=(y0+y1)/2;if(h<20)return;
  const gs=(gaps||[]).slice().sort((a,b)=>a.at-b.at);let c=t0;const segs=[];
  gs.forEach(g=>{const a=g.at-g.w/2,b=g.at+g.w/2;if(a>c+80)segs.push([c,a]);c=Math.max(c,b);});
  if(t1>c+80)segs.push([c,t1]);
  segs.forEach(([a,b])=>{const len=b-a,mid=(a+b)/2,m=wallMat(len,h);
    if(axis==='x')C.box(parent,len,h,thick,m,mid,yc,fixed,NO);
    else C.box(parent,thick,h,len,m,fixed,yc,mid,NO);});
}

/* ---------- floor : yard, epoxy, ESD, walkways ---------- */
(function floor(){
  const yard=new THREE.Mesh(new THREE.PlaneGeometry(86000,56000),conc);yard.rotation.x=-PI/2;yard.position.y=4;yard.receiveShadow=true;yard.castShadow=false;root.add(yard);
  const ep=new THREE.Mesh(new THREE.PlaneGeometry(71800,41800),epoxy);ep.rotation.x=-PI/2;ep.position.y=8;ep.receiveShadow=true;ep.castShadow=false;root.add(ep);
  const epa=new THREE.Mesh(new THREE.PlaneGeometry(31000,28000),esd);epa.rotation.x=-PI/2;epa.position.set(-7500,12,0);epa.receiveShadow=true;epa.castShadow=false;root.add(epa);
  /* EPA is x -23000..8000 (31 m) centred at -7500, z -14000..14000 */
  const tape=(x,z,w,d)=>{C.box(root,w,16,d,yelBlk,x,22,z,NO);};
  tape(-7500,14000,31000,160);tape(-7500,-14000,31000,160);tape(-23000,0,160,28160);tape(8000,0,160,28160);
  [[-7500,0,0],[-16000,-11000,0],[2000,11000,0]].forEach((p,i)=>C.label(root,'ESD PROTECTED AREA',2800,420,p[0],28,p[1],{rx:-PI/2,bg:'#f2c400',fg:'#1a1a1a',pw:1024,size:.42}));
  /* 100 mm walkway lines — main aisle and the two cross aisles */
  const line=(x,z,w,d)=>C.box(root,w,8,d,yel,x,26,z,NO);
  line(0,1100,68000,100);line(0,-1100,68000,100);
  line(0,6200,68000,100);line(0,-6200,68000,100);
  line(-16500,0,100,12400);line(7500,0,100,12400);line(21500,0,100,12400);
  /* zebra at the three west docks and the south entrance */
  [[-34800,-9000],[ -34800,0],[-34800,9000],[-10000,-19200]].forEach(p=>{
    const m=new THREE.Mesh(new THREE.PlaneGeometry(p[0]<-20000?2800:2200,p[0]<-20000?1400:1800),zebra);
    m.rotation.x=-PI/2;m.position.set(p[0],28,p[1]);m.receiveShadow=true;m.castShadow=false;root.add(m);});
})();

/* ---------- portal frames, purlins, roof ---------- */
const ang=Math.atan2(Y_R-Y_E,21000);
const cols=[],bases=[],rafters=[],haunch=[],purlins=[];
for(let i=0;i<FRAMES;i++){
  const x=X0+i*BAY;
  [[Z0+220,1],[Z1-220,-1]].forEach(p=>{
    cols.push([x,Y_E/2,p[0]]);bases.push([x,12,p[0]]);
    haunch.push([x,Y_E-180,p[0]-p[1]*1400,-ang*p[1],0,0]);
  });
  /* south slope (rx negative lifts the ridge end) and north slope */
  rafters.push([x,8720,-10500,-ang,0,0]);
  rafters.push([x,8720,10500,ang,0,0]);
}
inst(root,new THREE.BoxGeometry(400,Y_E,300),steel,cols,true);
inst(root,new THREE.BoxGeometry(640,28,520),steelD,bases,true);
inst(root,new THREE.BoxGeometry(220,420,20800),steel,rafters,true);
inst(root,new THREE.BoxGeometry(260,700,2800),steelD,haunch,true);
for(let i=0;i<FRAMES-1;i++){
  const x=X0+BAY/2+i*BAY;
  for(let s=0;s<8;s++){
    const t=(s+.5)/8,zS=-21000+t*21000,yS=Y_E+t*(Y_R-Y_E);
    purlins.push([x,yS-180,zS,-ang,0,0]);
    purlins.push([x,yS-180,-zS,ang,0,0]);
  }
}
inst(root,new THREE.BoxGeometry(BAY-80,100,160),purlinM,purlins,false);
/* roof cladding, two slopes, no cast */
function slope(zSign){
  const L=Math.hypot(21600,Y_R-Y_E+80);
  const m=C.box(root,74400,70,L,roofM,0,8760,zSign*-10800,Object.assign({rx:zSign>0?ang:-ang},NO));
  m.receiveShadow=true;return m;
}
slope(-1);slope(1);
/* two skylight strips on the slopes */
[[-1,-6200],[1,6200]].forEach(p=>{
  const t=Math.abs(p[1])/21000,y=Y_E+t*(Y_R-Y_E)+80;
  C.box(root,62000,30,2000,skyM,0,y,p[1],Object.assign({rx:p[0]>0?ang:-ang},NO));
});
/* ridge cap */
C.box(root,74400,80,700,steel,0,Y_R+40,0,NO);

/* gable triangles above the east and west walls */
(function gables(){
  const mat=C.std(0xd5dbe3,.7,.04);mat.side=THREE.DoubleSide;
  [X0-90,X1+90].forEach(x=>{
    const y0=Y_E-40,y1=Y_R+40,z0=-21400,z1=21400,d=80;
    const v=new Float32Array([
      -d,y0,z0, -d,y1,0, -d,y0,z1,
       d,y0,z0,  d,y0,z1,  d,y1,0
    ]);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(v,3));g.computeVertexNormals();
    const mesh=new THREE.Mesh(g,mat);mesh.position.x=x;mesh.castShadow=false;mesh.receiveShadow=true;root.add(mesh);
  });
})();

/* ---------- walls, window band, doors ---------- */
const southDoors=[{at:-10000,w:2000},{at:24000,w:1400}];
const northDoors=[{at:-28000,w:1400},{at:18000,w:1400}];
const westDocks=[{at:-9000,w:4400},{at:0,w:4400},{at:9000,w:4400}];
const eastDoors=[{at:-12000,w:1400},{at:6000,w:1400}];
/* lower band stops at the window; docks are taller than the window sill */
band(root,'x',Z0,X0,X1,0,3500,200,southDoors);
band(root,'x',Z1,X0,X1,0,3500,200,northDoors);
band(root,'z',X0,Z0,Z1,0,3500,200,westDocks);
band(root,'z',X1,Z0,Z1,0,3500,200,eastDoors);
/* window band is glass only (a solid panel here would hide it from inside) */
function glassRun(axis,fixed,t0,t1,gaps){
  const gs=(gaps||[]).slice().sort((a,b)=>a.at-b.at);let c=t0;const segs=[];
  gs.forEach(g=>{const a=g.at-g.w/2-200,b=g.at+g.w/2+200;if(a>c+100)segs.push([c,a]);c=Math.max(c,b);});
  if(t1>c+100)segs.push([c,t1]);
  segs.forEach(([a,b])=>{const len=b-a,mid=(a+b)/2;
    if(axis==='x')C.box(root,len,1320,30,glassM,mid,4250,fixed,NO);
    else C.box(root,30,1320,len,glassM,fixed,4250,mid,NO);});
}
glassRun('x',Z0-130,X0+400,X1-400,[]);
glassRun('x',Z1+130,X0+400,X1-400,[]);
glassRun('z',X0-130,Z0+400,Z1-400,westDocks);
glassRun('z',X1+130,Z0+400,Z1-400,[]);
/* upper wall, eaves */
band(root,'x',Z0,X0,X1,5000,Y_E,200,[]);
band(root,'x',Z1,X0,X1,5000,Y_E,200,[]);
band(root,'z',X0,Z0,Z1,5000,Y_E,200,[]);
band(root,'z',X1,Z0,Z1,5000,Y_E,200,[]);

/* dock doors + levelers on the west wall, personnel / emergency leaves */
const roll=(()=>{const t=C.canvasTex(64,128,(g,W,H)=>{g.fillStyle='#5c656e';g.fillRect(0,0,W,H);g.strokeStyle='#3a4148';g.lineWidth=4;
  for(let y=8;y<H;y+=16){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}g.fillStyle='#8a929a';g.fillRect(0,0,W,10);},{repeat:true});
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,6);return C.std(0xffffff,.55,.3,{map:t});})();
westDocks.forEach(d=>{
  C.box(root,80,4400,d.w-200,roll,X0+40,2200,d.at,NO);
  C.box(root,260,180,d.w+600,steelD,X0-40,4520,d.at,NO);          /* header */
  C.box(root,2400,160,d.w-600,steel,X0-1600,80,d.at,Object.assign({},NO)); /* leveler */
  C.box(root,400,40,d.w-900,steelD,X0-2800,40,d.at,NO);            /* lip */
  C.label(root,'DOCK',900,220,X0+20,3900,d.at,{ry:PI/2,bg:'#1e6fd9',fg:'#fff',pw:512,size:.5});
});
function leaf(x,z,ry,w,h,emergency){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;root.add(g);
  C.box(g,w,h,70,doorM,0,h/2,0,NO);
  C.box(g,w-160,Math.min(700,h-900),30,glassM,0,h-560,40,NO);
  C.box(g,30,140,40,steel,w/2-80,1000,50,NO);
  if(emergency)C.box(g,w*.7,80,16,C.M.green,0,h-120,50,NO);
}
/* south entrance and emergency, north emergency, east emergency — leaves sit in the opening */
leaf(-10000,Z0+20,0,1800,2300,false);
leaf(24000,Z0+20,0,1200,2200,true);
leaf(-28000,Z1-20,PI,1200,2200,true);
leaf(18000,Z1-20,PI,1200,2200,false);
leaf(X1-20,-12000,-PI/2,1200,2200,true);
leaf(X1-20,6000,-PI/2,1200,2200,true);

/* ---------- high-bay LEDs (emissive discs + 4 real lights) ---------- */
const lamps=[];
for(let i=0;i<FRAMES-1;i++)for(let k=-3;k<=3;k++){
  const x=X0+BAY/2+i*BAY,z=k*5500;
  if(Math.abs(z)>19000)continue;
  lamps.push([x,6900,z]);
}
inst(root,new THREE.CylinderGeometry(280,300,50,12),C.emissive(0xfff6e4,.85),lamps.map(p=>[p[0],6200,p[2]]),false);
inst(root,new THREE.CylinderGeometry(22,22,320,6),steelD,lamps.map(p=>[p[0],6380,p[2]]),false);
[[-18000,8000],[-18000,-8000],[16000,8000],[16000,-8000]].forEach(p=>{
  const L=new THREE.PointLight(0xfff3dd,.55,32000,2);L.position.set(p[0],6600,p[1]);L.castShadow=false;root.add(L);
});

/* ---------- overhead services : trays, air, N2, exhaust, sprinklers, HVAC ---------- */
const slots=(opts.slots||[
  ['loader',800,1000],['printer',2600,1840],['spi',4000,1300],['shuttle',5200,1200],
  ['placementA',6700,2332],['placementB',8300,2332],['conveyor',9500,900],['reflow',13000,1450],
  ['conveyor2',16300,900],['aoi',17400,1500],['merge',18700,1200],['unloader',20200,1000]
]).map(s=>Array.isArray(s)?{id:s[0],x:s[1],depth:s[2]||1200}:s);
const lines=[{id:'LINE 1',x0:LINE_X0,z:3600},{id:'LINE 2',x0:LINE_X0,z:-3600}];
const slotW=[];
lines.forEach(ln=>slots.forEach(s=>slotW.push({id:s.id,line:ln.id,x:ln.x0+s.x,z:ln.z,depth:s.depth||1200})));

const trayM=C.std(0xe0b000,.5,.15),airM=C.M.hose,n2M=C.std(0x7ec8c8,.4,.3),exM=C.std(0x9aa1a8,.5,.35),redM=C.std(0xc0392b,.5,.15);
/* cable trays above each line, y = 3200, with a drop at every slot */
lines.forEach(ln=>{
  C.box(root,21000,80,300,trayM,ln.x0+10500,3200,ln.z,NO);
});
const drops=[];
slotW.forEach(s=>drops.push([s.x,2700,s.z]));
inst(root,new THREE.BoxGeometry(80,1100,80),trayM,drops,false);
/* compressed-air ring around both lines at 4.2 m, drops to every slot */
const ring=[[-17000,8000,8000,-8000],[8000,-8000,-17000,8000]];
/* segments: x0,z0 -> x1,z1 */
function pipe(x0,z0,x1,z1,y,dia,mat){
  const dx=x1-x0,dz=z1-z0,alongX=Math.abs(dx)>=Math.abs(dz),len=(alongX?Math.abs(dx):Math.abs(dz))||1;
  C.cyl(root,dia/2,dia/2,len,mat,(x0+x1)/2,y,(z0+z1)/2,alongX?{rz:-PI/2,seg:10,cast:false}:{rx:PI/2,seg:10,cast:false});
}
pipe(-17000,-8000,9000,-8000,4200,63,airM);
pipe(9000,-8000,9000,8000,4200,63,airM);
pipe(9000,8000,-17000,8000,4200,63,airM);
pipe(-17000,8000,-17000,-8000,4200,63,airM);
const airDrops=[];
slotW.forEach(s=>airDrops.push([s.x,3350,s.z]));
inst(root,new THREE.CylinderGeometry(22,22,1700,8),airM,airDrops,false);
/* nitrogen from the utility room to the two reflow ovens (local x 13000) */
const refX=LINE_X0+13000;
pipe(-7000,18500,-7000,8000,4500,50,n2M);
pipe(-7000,8000,refX,8000,4500,50,n2M);
pipe(refX,8000,refX,-8000,4500,50,n2M);
[3600,-3600].forEach(z=>{pipe(refX,z>0?8000:-8000,refX,z,4500,40,n2M);airDrops.push([refX,3000,z]);});
inst(root,new THREE.CylinderGeometry(18,18,2800,8),n2M,[[refX,3000,3600],[refX,3000,-3600]],false);
/* reflow exhaust: two dia-150 stacks per oven -> dia 400 main -> roof */
[3600,-3600].forEach(z=>{
  [-900,900].forEach(dx=>C.cyl(root,75,75,3600,exM,refX+dx,5200,z,{seg:10,cast:false}));
});
C.cyl(root,200,200,5200,exM,refX,6900,7000,{rx:PI/2,seg:12,cast:false}); /* main along Z between the ovens */
C.cyl(root,200,200,2200,exM,refX,8200,0,{seg:12,cast:false});             /* up through the ridge */
/* sprinkler mains under the roof + heads */
[-15000,-5000,5000,15000].forEach(z=>C.box(root,70000,50,50,redM,0,7600,z,NO));
const heads=[];
for(let x=-32000;x<=32000;x+=4000)for(const z of[-15000,-5000,5000,15000])heads.push([x,7480,z]);
inst(root,new THREE.CylinderGeometry(40,16,80,6),redM,heads,false);
/* two spiral HVAC ducts with diffusers */
[12500,-12500].forEach(z=>{
  C.cyl(root,360,360,60000,C.std(0xd5dbe3,.45,.25),0,7450,z,{rz:-PI/2,seg:16,cast:false});
});
const rings=[],diffs=[];
for(let x=-28000;x<=28000;x+=2500){rings.push([x,7450,12500,0,PI/2,0]);rings.push([x,7450,-12500,0,PI/2,0]);}
for(let x=-28000;x<=28000;x+=5000){diffs.push([x,6900,12500]);diffs.push([x,6900,-12500]);}
inst(root,new THREE.TorusGeometry(390,28,6,14),steel,rings,false);
inst(root,new THREE.BoxGeometry(500,70,500),C.std(0xc5ccd3,.5,.2),diffs,false);

/* ---------- zones, views ---------- */
const zones={
  warehouse:{x0:-36000,x1:-23000,z0:-21000,z1:21000},
  store:{x0:-23000,x1:-16500,z0:-14000,z1:14000},
  smt:{x0:-16000,x1:8000,z0:-21000,z1:21000},
  postsmt:{x0:8000,x1:22000,z0:-14000,z1:14000},
  packing:{x0:22000,x1:36000,z0:-21000,z1:14000},
  offices:{x0:8000,x1:30000,z0:15000,z1:21000},
  utility:{x0:-12000,x1:-2000,z0:16000,z1:21000},
  entrance:{x0:-14000,x1:-6000,z0:-21000,z1:-16500}
};
function cam(p,t){return {p:p,t:t};}
const views={
  plant:cam([-52000,30000,52000],[0,0,0]),
  warehouse:cam([-28000,5200,14000],[-29000,1400,0]),
  store:cam([-19200,3000,8500],[-20200,1000,-4500]),
  lines:cam([-14000,7000,16000],[-4000,1000,2000]),
  postsmt:cam([14500,5200,10500],[15000,1000,-500]),
  offices:cam([15000,2400,17800],[24000,1300,18500]),
  utility:cam([-1500,5200,14800],[-7500,1000,18800]),
  entrance:cam([-7800,2600,-14000],[-10500,900,-19600]),
  walk:function(){
    const y=1650,z=1000,x0=-28000,x1=30000,span=x1-x0;
    const place=s=>{const x=x0+((s%span)+span)%span;C.camera.position.set(x,y,z);C.controls.target.set(Math.min(x+4500,x1),1100,2600);};
    place(C.T.sim*900);
    return function(){place(C.T.sim*900);};
  }
};
const hall={size:{x0:X0,x1:X1,z0:Z0,z1:Z1,eaves:Y_E,ridge:Y_R,x:X1-X0,z:Z1-Z0},
  zones,lines,slots:slotW,andons:[],movers:[],views,root};
C.bake(root);
return hall;
};
