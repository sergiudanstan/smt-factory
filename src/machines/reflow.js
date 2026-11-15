/* ===================================================================
   MACHINE MODULE — REFLOW: forced-convection lead-free reflow oven, dual lane (lanes 1+2), N2 capable.
   Units mm.  Local origin = machine centre on the floor; X = board flow, Y up, Z toward the operator.
   Body 5800 (X) x 1450 (Z) x 1550 (Y incl. stacks/tower).  Layout along X (local):
     entrance extension conveyor -3300..-2900 | entrance section (N2 curtain) -2900..-2340 |
     10 heating zones + 3 cooling zones, 360 mm each, -2340..+2340 (lift-up hood over all 13) |
     exit section (N2 curtain) +2340..+2900 | exit extension conveyor +2900..+3300.
   Dual edge pin-chain conveyor (inner rail fixed, outer rail adjustable, centre support chain per lane), belt 80 cm/min,
   NEVER stops (the drive keeps running even in the EXIT BLOCKED alarm; a blocked board is held by its stopper pin and the chain slides under it).
   Board temperature: lumped first-order model  dT/dt = (T_air(x) - T) / tau  (tau 30-35 s; cooling zones: blowers on low speed,
   tau x 1.4).  Liquidus 217 C: paste -> solder (b.setStage('reflowed')).
   Exit logic: the exit extension holds ONE board per lane (exit position, SMEMA ready); a second board is parked on the exit buffer
   position (second stopper pin); a third one reaches the end of the free chain -> alarm 'EXIT BLOCKED — boards backing up'
   (m.fault 30 s, oven DOWN, no lane accepts) which re-raises every 30 s until downstream takes the first board.
   =================================================================== */
'use strict';
SMT3D.register('reflow',function(C,opts){
const {THREE,PI,$,std,box,cyl,label,plate,canvasTex,run,FRAME,CONV_Y,BW,BD,BT,KIT,LANE_Z}=C;
opts=opts||{};
const X=opts.x||0,SA=!!opts.standalone,ID=opts.id||'reflow';
const NOSH=C.NOSH,M=C.M;
const HL=2900,HZ=725,JN=1000,ROOF=1250,NZ=13,NH=10,ZW=360,TX0=-2340,TX1=2340,XE=2876;
const zc=i=>TX0+ZW/2+ZW*i;
/* ---- process data ---- */
const V0=800/60;                                     /* 80 cm/min in mm/s */
const SPT=[140,155,165,175,180,190,210,235,250,256]; /* heating zone set-points (SAC305 ramp-soak-spike): mean of top/bottom; tuned for peak ~245 C, TAL ~64 s */
const TOPSET=SPT.map((t,i)=>t+(i>=7?2:0)),BOTSET=SPT.map((t,i)=>t-(i>=7?2:0)),COOL=[44,40,38];
const AMB=28,LIQ=217,XEX=3170,XBUF=XEX-BW-15,X0=-3180;
const sstep=t=>{t=t<0?0:t>1?1:t;return t*t*(3-2*t);};
/* ---- materials ---- */
const sm=(c,r=.55,mt=.1)=>{const x=std(c,r,mt);C.shellMats.push(x);return x;};
const Mt={anth:sm(0x2f3237,.62,.15),silver:sm(0xc2c5c9,.45,.25),core:sm(0x22252a,.7,.1),ins:std(0xcdc4ac,.95,0),steelD:std(0x4a5058,.45,.7),gasket:std(0x0e0f10,.9,0),
  motor:std(0x1f5aa8,.45,.5),copper:std(0xb87333,.35,.9),glass:new THREE.MeshStandardMaterial({color:0xbfd9ee,roughness:.05,metalness:.1,transparent:true,opacity:.28,depthWrite:false}),
  blue:std(0x1e6fd9,.45,.1),ball:std(0xd02a2a,.35,.1)};
const perf=canvasTex(64,64,(g,W,H)=>{g.fillStyle='#fff';g.fillRect(0,0,W,H);g.fillStyle='#14161a';[[16,16],[48,48],[48,-16],[16,80],[-16,48],[80,48]].forEach(p=>{g.beginPath();g.arc(p[0],p[1],9,0,7);g.fill();});},{repeat:true});
perf.repeat.set(14,28.3);
const mkPlate=()=>new THREE.MeshStandardMaterial({color:0x8c9299,map:perf,roughness:.5,metalness:.7,emissive:new THREE.Color(0xff5a14),emissiveMap:perf,emissiveIntensity:0});
const coolPlate=std(0x8c969f,.45,.75,{map:perf});
const pTop=[],pBot=[];for(let i=0;i<NZ;i++){pTop.push(i<NH?mkPlate():coolPlate);pBot.push(i<NH?mkPlate():coolPlate);}
const chainTex=canvasTex(64,16,g=>{g.fillStyle='#25282c';g.fillRect(0,0,64,16);g.fillStyle='#8d949b';g.fillRect(3,2,26,12);g.fillRect(35,2,26,12);g.fillStyle='#d9dee2';g.fillRect(3,2,26,2);g.fillRect(35,2,26,2);
  g.fillStyle='#40454b';[8,24,40,56].forEach(x=>{g.beginPath();g.arc(x,8,2.4,0,7);g.fill();});},{repeat:true});
const CX0=-3310,CX1=3310,CL=CX1-CX0;
const chainMat=[0,1].map(()=>{const t=chainTex.clone();t.needsUpdate=true;t.repeat.set(CL/25.4,1);return std(0xffffff,.6,.5,{map:t});});

const machine=new THREE.Group();machine.position.x=X;C.parentFor(opts).add(machine);
const B=(w,h,d,mt,x,y,z,o)=>box(machine,w,h,d,mt,x,y,z,o);
const Cy=(r1,r2,h,mt,x,y,z,o)=>cyl(machine,r1,r2,h,mt,x,y,z,o);

/* ================= lower body ================= */
B(5640,80,1380,M.dark,0,130,0,NOSH);                                       /* plinth */
for(let k=0;k<8;k++)[-1,1].forEach(s=>{const x=-2650+k*757,z=s*640;Cy(62,66,22,M.steel,x,11,z);Cy(18,18,70,M.steel,x,57,z,{seg:12});Cy(30,30,12,M.aluD,x,90,z,{seg:6});});  /* levelling feet */
B(2*XE,630,1426,Mt.core,0,485,0,NOSH);                                      /* below the tunnel */
[-1,1].forEach(s=>{B(2*XE,200,333,Mt.core,0,900,s*546.5,NOSH);                /* tunnel side blocks */
  B(4680,200,8,Mt.ins,0,900,s*376,NOSH);B(4680,6,26,Mt.gasket,0,1003,s*702,NOSH);B(4680,5,10,Mt.gasket,0,1002.5,s*394,NOSH);
  B(536,250,1426,Mt.anth,s*2608,1125,0,NOSH);                                 /* fixed end lids */
  B(536,200,8,Mt.ins,s*2608,900,-376,NOSH);B(536,200,8,Mt.ins,s*2608,900,376,NOSH);
  B(460,640,12,Mt.silver,s*2608,520,719,NOSH);B(460,640,12,Mt.silver,s*2608,520,-719,NOSH);
  B(536,30,12,Mt.silver,s*2608,985,719,NOSH);});
B(4680,30,12,Mt.silver,0,985,719,NOSH);B(4680,110,10,M.black,0,915,718,NOSH);B(4680,60,12,Mt.silver,0,830,719,NOSH);
B(4680,30,12,Mt.silver,0,985,-719,NOSH);
for(let i=0;i<NZ;i++){const x=zc(i);
  [-1,1].forEach(s=>{B(336,610,12,Mt.silver,x,500,s*719,NOSH);if(s>0){B(14,150,18,M.steel,x+138,500,733,NOSH);B(24,24,10,M.black,x+138,360,731,NOSH);}});
  for(let k=0;k<5;k++)B(200,5,3,M.black,x-30,230+k*14,725.5,NOSH);
  B(332,40,690,Mt.steelD,x,820,0);B(336,4,680,pBot[i],x,843,0,NOSH);}     /* bottom heater / cooling modules */
/* conveyor: rails + pin chains (through the whole machine and both extensions) */
LANE_Z.forEach((z,li)=>{[-1,1].forEach(s=>{const rz=z+s*109;
    B(CL,46,12,M.alu,0,CONV_Y-17,rz,NOSH);B(CL,6,5,M.aluD,0,CONV_Y+9,rz-s*3.5,NOSH);B(CL,3,12,chainMat[li],0,CONV_Y-1.5,z+s*97,NOSH);
    for(let k=0;k<=13;k++)B(14,77,22,M.aluD,TX0+ZW*k,838.5,rz,NOSH);});
  B(CL,2,8,chainMat[li],0,898,z,NOSH);                                      /* centre board-support chain */
  for(let k=0;k<=13;k++)B(14,12,218,M.aluD,TX0+ZW*k,872,z,NOSH);
  [2,7,11].forEach(k=>Cy(5,5,218,M.steel,TX0+ZW*k,858,z,{rx:PI/2,seg:10,cast:false}));   /* width-adjust lead screws */
  Cy(5,5,40,M.steel,-3250,862,z+109+22,{rx:PI/2,seg:10});B(90,50,40,M.black,-3250,862,z+109+50,NOSH);   /* adjust-rail gearmotor */
  [-1,1].forEach(s=>{B(60,34,16,M.black,s*3150,CONV_Y-17,z+109+21,NOSH);B(14,10,10,M.orange,s*3040,CONV_Y-22,z+BD/2+4,NOSH);});});
[-1,1].forEach(s=>[3030,3270].forEach(ax=>{const x=s*ax;[-279,-61,61,279].forEach(z=>{B(40,877,40,M.dark,x,438,z,NOSH);});
  [-279,279].forEach(z=>Cy(34,38,14,M.steel,x,7,z));B(30,30,600,M.dark,x,300,0,NOSH);}));
B(60,30,540,M.dark,-3030,300,0,NOSH);
const pins=LANE_Z.map(z=>{const p=C.stopper(machine,XEX+BW/2+8,z);C.dyn(p);return p;});
/* end plates with the transport openings */
[-1,1].forEach(s=>{const sh=new THREE.Shape();sh.moveTo(-HZ,170);sh.lineTo(HZ,170);sh.lineTo(HZ,ROOF);sh.lineTo(-HZ,ROOF);sh.closePath();
  LANE_Z.forEach(z=>{const h=new THREE.Path();h.moveTo(z-140,868);h.lineTo(z+140,868);h.lineTo(z+140,992);h.lineTo(z-140,992);h.closePath();sh.holes.push(h);});
  const e=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:24,bevelEnabled:false}),Mt.anth);e.rotation.y=-PI/2;e.position.x=s>0?HL:-HL+24;e.castShadow=e.receiveShadow=true;machine.add(e);
  LANE_Z.forEach(z=>{B(8,6,296,M.alu,s*(HL+4),862,z,NOSH);B(8,6,296,M.alu,s*(HL+4),998,z,NOSH);[-1,1].forEach(q=>B(8,130,6,M.alu,s*(HL+4),930,z+q*148,NOSH));});
  /* N2 curtain: baffles + nozzle pipe + feed hose */
  [0,1,2].forEach(k=>{const x=s*(2790-k*70);B(3,52,600,M.aluD,x,972,0,NOSH);B(3,34,600,M.aluD,x,851,0,NOSH);});
  Cy(9,9,640,M.brass,s*2630,978,0,{rx:PI/2,seg:12});Cy(9,9,640,M.brass,s*2630,850,0,{rx:PI/2,seg:12});
  Cy(9,9,260,M.hose,s*2630,1130,-300,{seg:10});Cy(9,9,40,M.hose,s*2630,1000,-300,{seg:10});B(60,50,60,M.black,s*2630,1262,-300,NOSH);});
/* zone label strip + status LEDs (single canvas) */
const stripC=document.createElement('canvas');stripC.width=4096;stripC.height=128;const stripG=stripC.getContext('2d');
const stripT=new THREE.CanvasTexture(stripC);stripT.encoding=THREE.sRGBEncoding;stripT.anisotropy=8;
{const p=new THREE.Mesh(new THREE.PlaneGeometry(4680,100),new THREE.MeshBasicMaterial({map:stripT,toneMapped:false}));p.position.set(0,915,723.5);machine.add(p);}

/* ================= hood (lift-up, hinged at the rear, gas struts) ================= */
const hoodPivot=new THREE.Group();hoodPivot.position.set(0,JN,-HZ);machine.add(hoodPivot);
const hi=new THREE.Group();hoodPivot.add(hi);
const H=(w,h,d,mt,x,y,z,o)=>box(hi,w,h,d,mt,x,y-JN,z+HZ,o);
const Hc=(r1,r2,h,mt,x,y,z,o)=>cyl(hi,r1,r2,h,mt,x,y-JN,z+HZ,o);
const Hl=(t,w,h,x,y,z,o)=>label(hi,t,w,h,x,y-JN,z+HZ,o);
H(4680,244,22,Mt.anth,0,1128,704,NOSH);H(4680,244,22,Mt.anth,0,1128,-714,NOSH);                 /* front / rear walls */
[-1,1].forEach(s=>H(22,244,1428,Mt.anth,s*2329,1128,-5,NOSH));H(4680,20,1450,Mt.anth,0,1240,0,NOSH);
H(4680,50,10,Mt.silver,0,1031,720,NOSH);H(4680,5,2,Mt.blue,0,1210,716,NOSH);
H(4640,10,1400,Mt.ins,0,1224,0,NOSH);H(4640,200,8,Mt.ins,0,1108,689,NOSH);H(4640,200,8,Mt.ins,0,1108,-693,NOSH);[-1,1].forEach(s=>H(8,200,1380,Mt.ins,s*2312,1108,0,NOSH));
[-1500,0,1500].forEach(x=>{H(14,14,36,M.steel,x,1060,736,NOSH);});H(3200,16,16,M.steel,0,1060,756,NOSH);
for(let i=0;i<NZ;i++){const x=zc(i);
  H(332,190,690,Mt.steelD,x,1057,0);H(336,4,680,pTop[i],x,960,0,NOSH);H(200,78,200,M.dark,x,1191,0,NOSH);   /* top module: plenum + nozzle plate */
  [-1,1].forEach(s=>{H(8,150,30,M.steel,x+s*60,1130,s*0+300,NOSH);});
  if(i<NH){ /* blower motor on the roof */
    H(190,12,190,M.steel,x,1256,0,NOSH);Hc(70,70,200,Mt.motor,x,1362,0,{seg:24});for(let k=0;k<5;k++)Hc(74,74,8,Mt.motor,x,1290+k*40,0,{seg:24,cast:false});
    Hc(60,60,22,M.aluD,x,1473,0,{seg:20});Hc(64,64,36,M.dark,x,1495,0,{seg:20});H(84,70,70,M.black,x+92,1380,0,NOSH);H(60,6,60,M.steel,x+92,1418,0,NOSH);
    Hc(6,6,50,M.steel,x+120,1275,300,{seg:8,cast:false});Hc(9,9,12,M.black,x+120,1306,300,{seg:8,cast:false});}}
const fans=[];
for(let i=NH;i<NZ;i++){const x=zc(i); /* cooling zone: axial fan with guard, water-cooled heat exchanger */
  Hc(150,150,70,M.dark,x,1285,0,{seg:32,open:true});Hc(152,152,8,M.aluD,x,1322,0,{seg:32,cast:false});Hc(46,46,60,Mt.motor,x,1292,0,{seg:20});
  for(let k=0;k<6;k++)H(300,3,5,M.steel,x,1325,0,{cast:false,ry:k*PI/6});[60,100,140].forEach(r=>{const t=new THREE.Mesh(new THREE.TorusGeometry(r,2.2,5,32),M.steel);t.rotation.x=PI/2;t.position.set(x,1325-JN,HZ);hi.add(t);});
  const fg=new THREE.Group();fg.position.set(x,1300-JN,HZ);hi.add(fg);for(let k=0;k<5;k++){const bl=box(fg,125,3,50,M.aluD,0,0,0,NOSH);bl.position.set(Math.cos(k*1.2566)*75,0,Math.sin(k*1.2566)*75);bl.rotation.y=-k*1.2566;bl.rotation.x=.3;}
  C.dyn(fg);fans.push(fg);
  H(300,170,210,Mt.steelD,x,1335,455);for(let k=0;k<9;k++)H(296,160,3,Mt.copper,x,1335,357+k*24,NOSH);H(300,8,214,M.aluD,x,1424,455,NOSH);}
H(560,250,360,Mt.silver,zc(11),1375,-420);H(560,6,364,M.steel,zc(11),1503,-420,NOSH);
for(let k=0;k<6;k++)H(14,6,300,M.black,zc(11)-200+k*80,1507,-420,NOSH);Hl('FLUX MANAGEMENT',420,60,zc(11),1380,-238.5,{fg:'#10151d',pw:700,size:.5,bg:'#e8eaec'});
Hc(14,14,1100,M.hose,zc(11),1300,430,{rz:PI/2,seg:12});Hc(14,14,1100,M.red,zc(11),1330,430,{rz:PI/2,seg:12});
[-1,1].forEach(s=>{Hc(14,14,100,M.hose,zc(11)+s*520,1300,430,{seg:12});Hc(14,14,100,M.red,zc(11)+s*520,1330,430,{seg:12});});
Hc(7,7,420,M.black,zc(11),1380,-60,{rx:PI/2,seg:10});Hc(7,7,260,M.black,zc(12),1350,-200,{rx:PI/2,seg:10});    /* flux extraction hoses */
Hl('HEATING ZONES 1 – 10',900,70,zc(4.5),1252,610,{rx:-PI/2,bg:'#2f3237',fg:'#dfe8f5',pw:1100,size:.5});
Hl('COOLING 1 – 3',560,70,zc(11),1252,640,{rx:-PI/2,bg:'#2f3237',fg:'#8fd3ff',pw:700,size:.5});
Hl('REFLOW',900,150,-1200,1128,717,{fg:'#e9eaec',pw:900,size:.74});
Hl('N2 READY  ·  SAC305  ·  13 ZONES',900,52,300,1128,717,{fg:'#9fb3cc',pw:1100,size:.5,weight:'600'});
/* struts: gas springs hidden in the hood cavity behind the modules: body clevis -> hood bracket (they extend as the hood lifts) */
const STRUT_K=[2,5,8,11],SA_=[1011,-650],SP_=[215,200];
STRUT_K.forEach(k=>{const x=TX0+ZW*k;H(30,40,16,M.aluD,x,1205,-525,NOSH);B(30,22,40,M.aluD,x,1011,-650,NOSH);});
/* rear hinges (static halves) + hood lock + warning stickers + front nameplate */
[-2000,0,2000].forEach(x=>{Cy(16,16,170,M.steel,x,1004,-730,{rz:PI/2,seg:16});B(170,8,70,M.aluD,x,1000,-700,NOSH);});
const Hp=(l,w,h,x,y,z,o)=>plate(hi,l,w,h,x,y-JN,z+HZ,o);
const HOT=['⚠ HOT SURFACE','Allow to cool before opening'];
Hp(HOT,230,90,-1800,1140,716.3,{bg:'#f2c400',border:'#111',pw:600});Hp(HOT,230,90,1500,1140,716.3,{bg:'#f2c400',border:'#111',pw:600});
Hp(['N2 · O2 < 1000 ppm','Hood: keep clear of gas curtain'],250,70,-300,1150,716.3,{bg:'#1e6fd9',fg:'#fff',pw:600});
plate(machine,['CONVECTION REFLOW OVEN','13 zones · 2 lanes · N2','Type RF-13/2 · 400 V 3N~ 50 Hz · 52 kW','Max 300 °C · SN 0471'],300,130,2480,760,725.6,{pw:700,align:'left'});
plate(machine,['HOT SURFACE'],180,70,-2560,700,725.6,{bg:'#f2c400',border:'#111',pw:400});plate(machine,['Hot gas exhaust'],180,60,2480,640,725.6,{bg:'#d02a2a',fg:'#fff',pw:400});
B(4660,60,40,M.dark,0,215,745,NOSH);for(let k=0;k<44;k++)B(8,50,2,M.black,-2300+k*106,215,765.5,NOSH);      /* front cable duct (slotted) */
B(4660,56,36,M.dark,0,700,-745,NOSH);for(let k=0;k<44;k++)B(8,46,2,M.black,-2300+k*106,700,-763.5,NOSH);
/* entrance lid (front): E-stop + start / reset / hood push-buttons; exit lid: rotameters, O2 analyser, E-stop */
const estop=x=>{B(78,78,10,M.yellow,x,1090,718,NOSH);Cy(30,30,12,M.black,x,1090,729,{rx:PI/2,seg:20});const b=Cy(23,25,22,M.red,x,1090,741,{rx:PI/2,seg:20});Cy(30,30,4,M.yellow,x,1090,724,{rx:PI/2,seg:20,cast:false});return b;};
estop(-2780);estop(2780);label(machine,'EMERGENCY STOP',90,16,-2780,1140,718.4,{bg:'#f2c400',fg:'#111',pw:300,size:.7});label(machine,'EMERGENCY STOP',90,16,2780,1140,718.4,{bg:'#f2c400',fg:'#111',pw:300,size:.7});
B(240,100,12,M.black,-2560,1120,719,NOSH);[[M.green,'START'],[M.yellow,'RESET'],[M.blue,'HOOD']].forEach((a,i)=>{const x=-2630+i*70;Cy(17,17,14,a[0],x,1130,728,{rx:PI/2,seg:16});label(machine,a[1],60,13,x,1096,725.6,{fg:'#dfe8f5',pw:240,size:.8});});
B(380,200,12,M.black,2580,1125,719,NOSH);
const rotG=[];['ENT. CURTAIN','PROCESS','EXIT CURTAIN'].forEach((t,i)=>{const x=2475+i*95;Cy(8,8,130,Mt.glass,x,1130,730,{seg:12,cast:false});Cy(10,10,8,M.steel,x,1066,730,{seg:12});Cy(10,10,8,M.steel,x,1194,730,{seg:12});
  const bl=cyl(machine,5,5,5,Mt.ball,x,1100,730,{seg:10,cast:false});C.dyn(bl);rotG.push(bl);B(24,2,2,M.white,x+14,1130,732,NOSH);label(machine,t,92,14,x,1064,725.6,{fg:'#dfe8f5',pw:300,size:.8});});
label(machine,'N2 FLOW  [m³/h]',200,14,2520,1208,725.6,{fg:'#9fb3cc',pw:500,size:.8});
const o2C=document.createElement('canvas');o2C.width=256;o2C.height=128;const o2G=o2C.getContext('2d'),o2T=new THREE.CanvasTexture(o2C);o2T.encoding=THREE.sRGBEncoding;
{const p=new THREE.Mesh(new THREE.PlaneGeometry(110,56),new THREE.MeshBasicMaterial({map:o2T,toneMapped:false}));p.position.set(2740,1160,725.7);machine.add(p);}
Cy(10,10,18,M.steel,2740,1210,730,{rx:PI/2,seg:10});
/* roof: exhaust stacks (2) with dampers, N2 curtain flow controllers, signal tower */
const dampers=[];[-1,1].forEach(s=>{const x=s*2470,z=-380;Cy(95,95,14,M.aluD,x,1257,z);Cy(80,80,300,M.alu,x,1400,z,{seg:32,open:true});Cy(90,90,10,M.aluD,x,1550,z,{seg:32});
  Cy(70,70,4,M.black,x,1548,z,{seg:24,cast:false});Cy(90,90,8,M.aluD,x,1330,z,{seg:32});Cy(90,90,8,M.aluD,x,1450,z,{seg:32});
  B(60,70,60,M.black,x+110,1390,z,NOSH);Cy(6,6,120,M.steel,x+60,1390,z,{rz:PI/2,seg:8,cast:false});const dl=new THREE.Group();dl.position.set(x+100,1450,z);machine.add(dl);box(dl,12,12,100,M.red,0,0,60,NOSH);C.dyn(dl);dampers.push(dl);
  label(machine,'EXHAUST',70,14,x,1400,z+82,{fg:'#10151d',bg:'#e8eaec',pw:300,size:.7});});
const tw={r:C.emissive(0xff2030,.05),y:C.emissive(0xffb020,.05),g:C.emissive(0x30e070,.05)};
{const x=-2480,z=560;Cy(8,8,150,M.steel,x,1325,z,{seg:10});Cy(30,30,10,M.dark,x,1255,z);[[tw.r,1290],[tw.y,1326],[tw.g,1362]].forEach(a=>Cy(25,25,32,a[0],x,a[1],z,{seg:20,cast:false}));Cy(26,26,6,M.dark,x,1382,z);Cy(15,15,30,M.black,x,1400,z,{seg:12});}
/* PC monitor on an arm + keyboard tray (operator terminal) */
const monC=document.createElement('canvas');monC.width=640;monC.height=400;const monG=monC.getContext('2d'),monT=new THREE.CanvasTexture(monC);monT.encoding=THREE.sRGBEncoding;monT.anisotropy=8;
{const x=-2700,z=840;Cy(55,60,16,M.dark,x,8,z);B(60,980,50,M.dark,x,500,z-20,NOSH);B(16,16,180,M.aluD,x,1250,z+60,NOSH);Cy(12,12,40,M.steel,x,1250,z+150,{rx:PI/2,seg:10});
  const mg=new THREE.Group();mg.position.set(x,1370,z+175);mg.rotation.x=-.12;machine.add(mg);box(mg,540,340,36,M.black,0,0,0);
  const sc=new THREE.Mesh(new THREE.PlaneGeometry(500,300),new THREE.MeshBasicMaterial({map:monT,toneMapped:false}));sc.position.z=18.3;mg.add(sc);
  B(300,10,160,M.dark,x,1010,z+90,NOSH);B(40,12,120,M.aluD,x,1000,z+10,NOSH);
  const kb=new THREE.Mesh(new THREE.PlaneGeometry(280,100),new THREE.MeshBasicMaterial({map:canvasTex(280,100,(g)=>{g.fillStyle='#202327';g.fillRect(0,0,280,100);g.fillStyle='#3a3f46';for(let r=0;r<5;r++)for(let c=0;c<17;c++)g.fillRect(6+c*16,6+r*17,13,14);g.fillStyle='#4d535b';g.fillRect(70,6+4*17,110,14);}),toneMapped:false}));kb.rotation.x=-PI/2;kb.position.set(x-10,1016.5,z+88);machine.add(kb);
  B(34,12,52,M.black,x+170,1016,z+90,NOSH);}
/* ---- pneumatic / N2 / cooling-water service connections on the rear of the exit lid ---- */
[0,1,2].forEach(k=>{Cy(14,14,60,M.brass,2700+k*40,660,-740,{rx:PI/2,seg:10});});Cy(18,18,70,M.hose,2640,700,-745,{rx:PI/2,seg:12});Cy(18,18,70,M.red,2600,700,-745,{rx:PI/2,seg:12});
C.bake(hi);C.dyn(hoodPivot);
/* gas strut visuals (barrel + rod, re-posed every frame) */
const hood={open:0,target:0},HOOD_MAX=1.22,_pv=new THREE.Vector3(),_av=new THREE.Vector3(),_up=new THREE.Vector3(0,1,0);
const strutG=STRUT_K.map(k=>{const g=new THREE.Group();g.userData.x=TX0+ZW*k;cyl(g,10,10,170,M.steel,0,85,0,{seg:10});const r=cyl(g,5,5,1,M.brass,0,100,0,{seg:8,cast:false});g.userData.rod=r;machine.add(g);C.dyn(g);return g;});
function poseStruts(){const th=hood.open*HOOD_MAX,c=Math.cos(th),s=Math.sin(th);
  strutG.forEach(g=>{_av.set(g.userData.x,SA_[0],SA_[1]);_pv.set(g.userData.x,1000+SP_[0]*c+SP_[1]*s,-725-SP_[0]*s+SP_[1]*c).sub(_av);
    const d=_pv.length();g.position.copy(_av);g.quaternion.setFromUnitVectors(_up,_pv.normalize());const r=g.userData.rod;r.scale.y=Math.max(1,d-150);r.position.y=150+(d-150)/2;});}

/* ================= machine / process model ================= */
const m=C.machine({id:ID,line:opts.line,name:'REFLOW OVEN',kind:'reflow',group:machine,x:X,length:5800,depth:1450,height:1550,lanes:[1,2],parallel:2,inReach:400,outReach:400,
  spec:{zones:'10 heating + 3 cooling',speed:'80 cm/min'}});
const ZTOP=new Float32Array(NZ),ZBOT=new Float32Array(NZ),ZAIR=new Float32Array(NZ);
function zoneUpdate(){const t=C.T.sim,op=hood.open;for(let i=0;i<NZ;i++){const a=i<NH?TOPSET[i]:COOL[i-NH],b=i<NH?BOTSET[i]:COOL[i-NH],w=i<NH?1:.4;
  ZTOP[i]=a+w*(.8*Math.sin(t/9+i*1.7)+.35*Math.sin(t/2.3+i*2.9))-(hood.target?op:0)*8*(i<NH);ZBOT[i]=b+w*(.7*Math.sin(t/11+i*2.1)+.3*Math.sin(t/3.1+i))-(hood.target?op:0)*3*(i<NH);ZAIR[i]=(ZTOP[i]+ZBOT[i])/2;}}
zoneUpdate();
/* air temperature seen by a board centred at machine-local x (smooth blends over 80 mm at the zone boundaries) */
function air(x){const z=(x-TX0)/ZW;
  if(z<0)return AMB+(.42*ZAIR[0]-AMB)*sstep((x+2900)/560);
  if(z>=NZ)return ZAIR[NZ-1]+(AMB-ZAIR[NZ-1])*sstep((x-TX1)/560);
  const i=Math.floor(z),f=z-i,w=40/ZW;let a=ZAIR[i];
  if(f<w&&i>0)a=ZAIR[i-1]+(ZAIR[i]-ZAIR[i-1])*sstep(.5+f/(2*w));else if(f>1-w&&i<NZ-1)a=ZAIR[i]+(ZAIR[i+1]-ZAIR[i])*sstep(.5+(f-1+w)/(2*w));return a;}
const LN=[1,2],Q={1:[],2:[]};let xr=false;C.onXray(f=>xr=f);let blockFlag=false,profWait=false,profDue=21600,thermalOn=false,o2=950,nProf=0;
m.profiles=[];m.lastProfile=null;
const _c=new THREE.Color(),ovGeo=new THREE.PlaneGeometry(BW,BD);ovGeo.rotateX(-PI/2);
const ovMats=[];
function mkOverlay(b){const mt=new THREE.MeshBasicMaterial({color:0x3050ff,transparent:true,opacity:.72,toneMapped:false,depthWrite:false,side:THREE.DoubleSide});mt.visible=thermalOn;ovMats.push(mt);
  const o=new THREE.Mesh(ovGeo,mt);o.renderOrder=3;o.userData.noBake=true;b.line.root.add(o);return o;}
function tcol(T){const k=Math.max(0,Math.min(1,(T-25)/230));return _c.setHSL(.68*(1-k),.95,.5);}
/* thermocouple profiler (SETUP event): aluminium box dragged behind the board + 6 wires to the measuring points */
function profKit(b){const g=new THREE.Group();b.g.add(g);b.rf.kit=g;box(g,44,15,82,M.alu,-180,8,0,NOSH);box(g,30,2,60,M.yellow,-180,16.3,0,NOSH);
  const col=[0xff3030,0x30d060,0x3080ff,0xffc020,0xe040e0,0x30d0d0],pts=[[-100,-70],[-60,60],[-20,-35],[20,70],[70,-60],[105,20]];
  pts.forEach((p,i)=>{const a=new THREE.Vector3(-158,8,(i-2.5)*12),q=new THREE.Vector3(p[0],BT+1,p[1]),d=q.clone().sub(a),mid=a.clone().add(q).multiplyScalar(.5);
    const w=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,d.length(),5),new THREE.MeshBasicMaterial({color:col[i]}));w.position.copy(mid);w.quaternion.setFromUnitVectors(_up,d.normalize());g.add(w);
    const t=new THREE.Mesh(new THREE.SphereGeometry(2,8,6),new THREE.MeshBasicMaterial({color:col[i]}));t.position.copy(q);g.add(t);});}
function applyDefect(b){const R=C.rnd,chips=[],ics=[];KIT.cands.forEach((c,k)=>{if(c.kind==='chip')chips.push(k);else if(c.kind==='ic')ics.push(k);});
  let k,ty;if(R()<.5&&chips.length){k=chips[(R()*chips.length)|0];ty='TOMBSTONE';}else{k=ics[(R()*ics.length)|0];ty=R()<.5?'BRIDGE':'LIFTED LEAD';}
  const d=b.addDefect(k,ty,'reflow');if(d){m.reflowDefects=(m.reflowDefects||0)+1;m.addLog('#'+b.sn+'  '+ty+' at '+d.name+' (reflow)','ng');}}
function step(b,r,h){ /* lumped board model  dT/dt = (T_air - T) / tau */
  const lx=r.ph==='in'?b.x-X:r.lx,a=(air(lx-90)+air(lx)+air(lx+90))/3,tau=r.tau*(lx>TX1-ZW*(NZ-NH)?1.5:1);
  r.T+=(a-r.T)/tau*h;r.t+=h;r.Ta=a;
  if(r.T>r.peak)r.peak=r.T;
  if(r.T>=LIQ){r.tal+=h;if(!r.liq){r.liq=true;b.setStage('reflowed');}}
  if(r.def&&!r.defDone&&r.liq&&lx>TX0+ZW*8){r.defDone=true;applyDefect(b);}
  if(r.t>=r.hist.length+1){const H_=r.hist,n=H_.push(r.T);if(n>3){const sl=(H_[n-1]-H_[n-4])/3;if(r.T<r.peak-.5){if(sl<r.cool)r.cool=sl;}else if(sl>r.ramp)r.ramp=sl;}}}
C.onTick(h=>{
  zoneUpdate._a=(zoneUpdate._a||0)+h;if(zoneUpdate._a>=.5){zoneUpdate._a=0;zoneUpdate();}
  let blk=false;
  for(const ln of LN){const q=Q[ln];
    for(let i=0;i<q.length;i++){const b=q[i],r=b.rf;
      if(r.ph!=='in'){let lim=XEX;for(let k=0;k<i;k++)lim-=BW+15+(q[k].rf.prof?130:0);let nx=r.lx+V0*h;
        if(nx>=lim){nx=lim;r.ph=i===0?'exit':i===1?'buf':'blk';if(i>1)blk=true;if(i===0&&!r.rdy){r.rdy=true;r.tRdy=C.T.sim;m.setReady(b,ln);}}else r.ph='run';
        r.lx=nx;b.setX(X+nx);}
      step(b,r,h);}}
  blockFlag=blk;
  if(C.T.sim>=profDue){profDue+=21600;profWait=true;}
});
m.canAccept=lane=>{if(m.down||blockFlag)return false;const q=Q[lane],l=q[q.length-1];if(!l)return true;if(l.rf.ph==='in')return false;return l.rf.lx-X0>=BW+80+(l.rf.prof?130:0);};
m.onAccept=(b,lane)=>{const R=C.rnd,tl=Q[lane];
  const r=b.rf={lane,ph:'in',lx:0,T:AMB-2+R()*4,t:0,tau:33*(.93+.14*R()),peak:0,tal:0,ramp:0,cool:0,hist:[],liq:false,prof:false,def:R()<.04,defDone:false,rdy:false,t0:C.T.sim,ov:mkOverlay(b)};
  if(profWait){profWait=false;r.prof=true;profKit(b);nProf++;m.addLog('SETUP  thermal profiling run — profiler on lane '+lane,'cl');}
  const gw=b.g.getWorldPosition;b.g.getWorldPosition=function(t){gw.call(this,t);if(r.simple)t.y+=30000;return t;};   /* oven boards switch to the single-box LOD at 2.4 m (line.js LOD sees them 'far') */
  tl.push(b);
  run((function*(){yield* C.conveyTo(b,X+X0,null);r.lx=b.x-X;r.ph='run';})());};
m.onRelease=(b,lane)=>{const r=b.rf,q=Q[lane],i=q.indexOf(b);if(i>=0)q.splice(i,1);r.ph='gone';delete b.g.getWorldPosition;b.g.visible=true;
  const p={sn:b.sn,lane,peak:r.peak,tal:r.tal,ramp:r.ramp,cool:r.cool,exitT:r.T,transit:C.T.sim-r.t0,hist:r.hist.slice(),prof:r.prof,t:C.T.sim};
  b.reflow=p;b.temp=r.T;m.lastProfile=p;m.profiles.push(p);if(m.profiles.length>40)m.profiles.shift();m.endCycle(b,r.t0);m.ct=p.transit;
  if(r.kit){r.kit.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&o.material!==M.alu&&o.material!==M.yellow)o.material.dispose();});r.kit.parent&&r.kit.parent.remove(r.kit);}
  if(r.ov){r.ov.parent&&r.ov.parent.remove(r.ov);const k=ovMats.indexOf(r.ov.material);if(k>=0)ovMats.splice(k,1);r.ov.material.dispose();}
  m.addLog('#'+b.sn+'  peak '+p.peak.toFixed(1)+' °C · TAL '+p.tal.toFixed(0)+' s · ramp '+p.ramp.toFixed(1)+' °C/s'+(r.prof?'  [PROFILE RUN]':''),p.peak>250||p.peak<235||p.tal<45||p.tal>100?'ng':'ok');};
function* main(){let hold=0;
  while(true){yield .25;
    if(blockFlag&&!m.down){const prev=[m.state,m.step,m.detail];m.down=true;m.faults=(m.faults||0)+1;m.lastFault='EXIT BLOCKED';m.setState('DOWN','ALARM','EXIT BLOCKED — boards backing up');m.addLog('ALARM  EXIT BLOCKED — boards backing up','ng');
      yield* C.waitUntil(()=>!blockFlag);m.down=false;m.addLog('Recovered  EXIT BLOCKED','ok');m.setState('RUN','PROCESS','');continue;}
    const inside=Q[1].length+Q[2].length,lead=[Q[1][0],Q[2][0]].filter(b=>b&&b.rf.ph==='exit'&&C.T.sim-b.rf.tRdy>3).length;
    const sp=[...Q[1],...Q[2]].some(b=>b.rf.prof);
    if(sp)m.setState('SETUP','PROFILING RUN','6-ch thermocouple profiler in oven');
    else if(lead)m.setState('BLOCKED','EXIT WAIT','waiting for downstream');
    else if(inside)m.setState('RUN','PROCESS',inside+' boards · '+(V0*6).toFixed(0)+' cm/min');
    else m.setState('STARVED','WAITING','no board in the oven');}}
run(main());
/* ---- operator displays ---- */
function drawStrip(){const g=stripG,W=4096,H=128;g.fillStyle='#0e1013';g.fillRect(0,0,W,H);
  for(let i=0;i<NZ;i++){const x=(zc(i)-TX0)/4680*W,tt=i<NH?TOPSET[i]:COOL[i-NH],ac=ZTOP[i],ok=Math.abs(ac-tt)<3.5;
    g.fillStyle=i<NH?'#dfe8f5':'#8fd3ff';g.font='700 46px Arial';g.textAlign='left';g.textBaseline='middle';g.fillText((i<NH?'Z':'C')+(i<NH?i+1:i-NH+1),x-W*ZW/4680/2+20,34);
    g.font='600 40px Arial';g.fillStyle='#c9d4e4';g.fillText(Math.round(ac)+'°',x-W*ZW/4680/2+20,92);
    g.fillStyle=ok?'#2ee070':'#ffb020';g.beginPath();g.arc(x+W*ZW/4680/2-34,64,17,0,7);g.fill();g.fillStyle='rgba(255,255,255,.12)';g.fillRect(x-W*ZW/4680/2,6,3,H-12);}
  stripT.needsUpdate=true;}
function drawO2(){const g=o2G;g.fillStyle='#071a10';g.fillRect(0,0,256,128);g.fillStyle='#3dff8a';g.font='700 18px Arial';g.textAlign='left';g.fillText('O₂ RESIDUAL',12,24);g.font='700 56px Consolas,monospace';g.textAlign='center';g.fillText(Math.round(o2),128,84);g.font='600 18px Arial';g.fillText('ppm',128,114);o2T.needsUpdate=true;}
function drawMon(){const g=monG,W=640,H=400;g.fillStyle='#14171c';g.fillRect(0,0,W,H);g.fillStyle='#22262d';g.fillRect(0,0,W,40);g.fillStyle='#1e6fd9';g.fillRect(0,40,W,4);
  g.fillStyle='#fff';g.font='700 19px Arial';g.textAlign='left';g.textBaseline='middle';g.fillText('REFLOW  ·  PROCESS CONTROL  ·  RECIPE SAC305-N2',12,21);
  g.textAlign='right';g.font='600 14px Arial';g.fillStyle=m.state==='DOWN'?'#ff4d5a':'#3ddc84';g.fillText(C.T.paused?'PAUSED':m.state==='DOWN'?'ALARM':'RUNNING',W-12,21);
  const bx=14,by=64,bw=612,bh=150,y0=by+bh;g.fillStyle='#0f141b';g.fillRect(bx,by,bw,bh);g.textAlign='center';g.font='600 11px Arial';
  for(let i=0;i<NZ;i++){const w=bw/NZ,x=bx+i*w+3,tt=i<NH?TOPSET[i]:COOL[i-NH],ac=ZTOP[i],hs=tt/300*(bh-26),ha=ac/300*(bh-26);
    g.fillStyle='#2a3a52';g.fillRect(x,y0-hs-14,w-6,hs);g.fillStyle=i<NH?'#e8742a':'#3aa6e0';g.fillRect(x+4,y0-ha-14,w-14,ha);g.fillStyle='#dfe8f5';g.fillText(Math.round(ac),x+(w-6)/2,y0-ha-22);g.fillStyle='#8fa3bd';g.fillText(i<NH?'Z'+(i+1):'C'+(i-NH+1),x+(w-6)/2,y0-6);}
  g.textAlign='left';g.font='500 13px Arial';g.fillStyle='#8fa3bd';[['SPEED','80 cm/min'],['O2 (N2)',Math.round(o2)+' ppm'],['BOARDS',String(Q[1].length+Q[2].length)],['LAST PEAK',m.lastProfile?m.lastProfile.peak.toFixed(1)+' °C':'—'],['LAST TAL',m.lastProfile?m.lastProfile.tal.toFixed(0)+' s':'—']].forEach((a,i)=>{g.fillStyle='#8fa3bd';g.font='500 12px Arial';g.fillText(a[0],16+i*122,240);g.fillStyle='#fff';g.font='700 18px Arial';g.fillText(a[1],16+i*122,266);});
  g.fillStyle='#8fa3bd';g.font='500 13px Arial';g.fillText(m.state==='DOWN'?m.detail:m.step+'  ·  '+m.detail,16,306);g.fillText('Hood: '+(hood.open>.5?'OPEN':'closed')+'   ·   exhaust dampers 60 %   ·   cooling water 18 °C',16,334);
  g.fillText('Liquidus '+LIQ+' °C  ·  TAL target 60–90 s  ·  ramp max 3 °C/s',16,362);monT.needsUpdate=true;}
C.onSlow(()=>{if(m.near){drawStrip();drawO2();drawMon();}});
drawStrip();drawO2();drawMon();
/* ---- per-frame visuals ---- */
const cmat=chainMat.map(x=>x.map),LNZ=LANE_Z;
m.update=(dt,rdt)=>{
  hood.open+=(hood.target-hood.open)*Math.min(1,(rdt||0)*3.2);hoodPivot.rotation.x=-hood.open*HOOD_MAX;poseStruts();
  cmat.forEach(t=>t.offset.x-=dt*V0/CL);
  const vis=Math.min(1,hood.open*1.6),spin=dt*(m.state==='DOWN'?3:26);fans.forEach(f=>f.rotation.y+=spin);
  for(let i=0;i<NH;i++){const k=Math.max(0,Math.min(1,(ZTOP[i]-110)/170)),kb=Math.max(0,Math.min(1,(ZBOT[i]-110)/170));pTop[i].emissiveIntensity=k*k*2.2*vis;pBot[i].emissiveIntensity=kb*kb*2.2*vis;}
  const tgt=900+120*Math.sin(C.T.sim/41)+50*Math.sin(C.T.sim/7.3)+(hood.target?hood.open:0)*14000;o2+=(tgt-o2)*Math.min(1,dt/(tgt>o2?8:30));
  const fl=[.42+.02*Math.sin(C.T.sim),.66+.03*Math.sin(C.T.sim*.7),.4+.02*Math.cos(C.T.sim*.9)];rotG.forEach((b,i)=>b.position.y=1072+fl[i]*112);
  dampers.forEach((d,i)=>d.rotation.x=-.5+.3*Math.sin(C.T.sim/20+i));
  pins.forEach((p,li)=>{const q=Q[LN[li]];p.userData.up=!!(q[0]&&q[0].rf.ph==='exit');});bpins.forEach((p,li)=>{const q=Q[LN[li]];p.userData.up=!!(q[1]&&q[1].rf.ph==='buf');});
  C.tower(m,tw,m.state==='SETUP'||m.state==='BLOCKED');
  {const cp=C.camera.position,rp=m.line.root.position,open=hood.open>.04||xr;
    for(const ln of LN)for(const b of Q[ln]){const r=b.rf,lx=r.ph==='in'?b.x-X:r.lx,dx=cp.x-rp.x-b.x,dy=cp.y-CONV_Y,dz=cp.z-rp.z-b.g.position.z;
      r.simple=dx*dx+dy*dy+dz*dz>(b.defects.length||r.prof?3.6e7:5.76e6);b.g.visible=open||lx<-2780||lx>2780;}}
  if(thermalOn)for(const ln of LN)for(const b of Q[ln]){const r=b.rf,o=r.ov;if(!o)continue;o.visible=b.g.visible;o.position.set(b.x,CONV_Y+BT+1.5,b.g.position.z);o.material.color.copy(tcol(r.T));}
};
const bpins=LANE_Z.map(z=>{const p=C.stopper(machine,XBUF+BW/2+8,z);C.dyn(p);return p;});
C.bake(machine);

/* ---------- hood / thermal view / clickable ---------- */
function setHood(o){hood.target=o?1:0;const b=$('bHood');if(SA&&b){b.textContent=o?'Close hood':'Open hood';b.classList.toggle('on',!!o);}}
function setThermal(o){thermalOn=o;if(o)setHood(true);const b=$('bTherm');if(SA&&b)b.classList.toggle('on',o);ovMats.forEach(mt=>mt.visible=o);}
C.clickable(hoodPivot,()=>setHood(!hood.target));
m.info=()=>[['Step',m.step],['Detail',m.detail],['Boards inside',Q[1].length+' + '+Q[2].length+' (L1 + L2)'],['Speed','80 cm/min'],['O2 residual',Math.round(o2)+' ppm'],
  ['Last peak',m.lastProfile?m.lastProfile.peak.toFixed(1)+' °C':'—'],['Last TAL',m.lastProfile?m.lastProfile.tal.toFixed(0)+' s':'—'],['Transit',m.lastProfile?(m.lastProfile.transit/60).toFixed(1)+' min':'—']];
m.views={over:{p:[-2400,3800,11800],t:[450,900,0]},hood:{p:[-5200,2500,1500],t:[-300,950,-60],hood:1},entrance:{p:[-3900,1900,2500],t:[-2850,950,0]},
  peak:{p:[900,2350,2100],t:[900,940,-20],hood:1},exit:{p:[3900,1900,2600],t:[2850,950,0]},top:{p:[0,10200,300],t:[0,900,0],hood:1}};
m.cameras=[];m.applyView=n=>{const v=m.views[n];if(v)setHood(!!v.hood);};m.setHood=setHood;m.setThermal=setThermal;m.Q=Q;m.air=air;m.zones=()=>({top:ZTOP,bot:ZBOT});m.profileNext=()=>{profWait=true;};m.o2=()=>o2;

/* ---------- stand-alone page wiring ---------- */
if(SA){
  const V=(p,t)=>{const O=m.origin();return [[p[0]+O.x,p[1],p[2]+O.z],[t[0]+O.x,t[1],t[2]+O.z]];},vmap={};
  Object.entries(m.views).forEach(([k,v])=>{vmap[k]=()=>{setHood(!!v.hood);const [p,t]=V(v.p,v.t);C.flyTo(p,t,1.5);};});C.addViews(vmap);
  C.tag('Lift-up hood — click to open',hoodPivot,0,1250-JN,725);C.tag('Heating zones 1–10 (top + bottom)',machine,-600,1250,560);C.tag('Cooling 1–3 + water heat exchanger',machine,zc(11),1430,455);
  C.tag('Flux management box',machine,zc(11),1520,-420);C.tag('Exhaust stacks + dampers',machine,2470,1700,-380);C.tag('N2 rotameters + O2 analyser',machine,2580,1230,725);
  C.tag('Entrance N2 curtain',machine,-2640,1040,0);C.tag('Exit N2 curtain',machine,2640,1040,0);C.tag('Operator PC',machine,-2700,1560,1015);C.tag('Signal tower',machine,-2480,1560,560);
  C.tag('Entrance extension conveyor',machine,-3100,920,300);C.tag('Exit extension + buffer stop',machine,3100,920,300);
  if($('bHood'))$('bHood').onclick=()=>setHood(!hood.target);if($('bTherm'))$('bTherm').onclick=()=>setThermal(!thermalOn);
  /* zone table */
  const zt=$('zt');if(zt){let h='';for(let i=0;i<NZ;i++)h+='<tr><td>'+(i<NH?'Z'+(i+1):'C'+(i-NH+1))+'</td><td id="zs'+i+'"></td><td id="zt'+i+'"></td><td id="zb'+i+'"></td><td class="s" id="zl'+i+'">●</td></tr>';zt.innerHTML=h;}
  /* thermal profile canvas */
  const pc=$('prof'),pg=pc&&pc.getContext('2d'),PW=520,PH=250,DPR=2,TMAX=480,YMAX=280;let lastDraw=0;
  if(pc){pc.width=PW*DPR;pc.height=PH*DPR;}
  const cv=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function drawProf(){if(!pg)return;const g=pg;g.setTransform(DPR,0,0,DPR,0,0);g.clearRect(0,0,PW,PH);
    const L0=38,R0=PW-10,T0=26,B0=PH-26,tx=t=>L0+t/TMAX*(R0-L0),ty=T=>B0-T/YMAX*(B0-T0),tx_=cv('--tx')||'#dfe8f5',mu=cv('--mut')||'#8fa3bd',ln=cv('--line')||'#334';
    g.font='11px Consolas,Menlo,monospace';g.textBaseline='middle';
    g.strokeStyle=ln;g.lineWidth=1;g.fillStyle=mu;g.textAlign='right';for(let T=0;T<=YMAX;T+=50){g.beginPath();g.moveTo(L0,ty(T));g.lineTo(R0,ty(T));g.stroke();g.fillText(T,L0-5,ty(T));}
    g.textAlign='center';for(let t=0;t<=TMAX;t+=60){g.fillText(t,tx(t),B0+9);g.beginPath();g.moveTo(tx(t),B0);g.lineTo(tx(t),B0+3);g.stroke();}
    g.textAlign='left';g.fillText('t [s]',R0-24,B0+19);g.fillText('°C',4,T0-10);
    g.fillStyle=tx_;g.font='700 11px Segoe UI,Arial';g.fillText('THERMAL PROFILE',L0,10);g.font='11px Segoe UI,Arial';g.fillStyle=mu;g.fillText('boards inside: '+(Q[1].length+Q[2].length)+'  ·  white = last finished',L0+112,10);
    g.save();g.beginPath();g.rect(L0,T0,R0-L0,B0-T0);g.clip();
    /* zone shading + set-point staircase (mean top / bottom) */
    for(let i=0;i<NZ;i++){const t0=(TX0+ZW*i-X0)/V0,t1=t0+ZW/V0;if(i%2===0){g.fillStyle='rgba(120,160,220,.12)';g.fillRect(tx(t0),T0,tx(t1)-tx(t0),B0-T0);}}
    g.strokeStyle=SMT.isDark&&!SMT.isDark()?'#0a7fb5':cv('--cy')||'#4fd1ff';g.lineWidth=1.6;g.setLineDash([5,3]);g.beginPath();
    for(let i=0;i<NZ;i++){const t0=(TX0+ZW*i-X0)/V0,t1=t0+ZW/V0,s=i<NH?SPT[i]:COOL[i-NH];if(i===0)g.moveTo(tx(t0),ty(s));else g.lineTo(tx(t0),ty(s));g.lineTo(tx(t1),ty(s));}g.stroke();g.setLineDash([]);
    g.strokeStyle='#ff4d5a';g.lineWidth=1;g.setLineDash([2,3]);g.beginPath();g.moveTo(L0,ty(LIQ));g.lineTo(R0,ty(LIQ));g.stroke();g.setLineDash([]);g.fillStyle='#ff4d5a';g.textAlign='right';g.fillText('217 °C liquidus',R0-2,ty(LIQ)-7);
    const poly=(h,col,w,a)=>{g.strokeStyle=col;g.globalAlpha=a;g.lineWidth=w;g.beginPath();g.moveTo(tx(0),ty(AMB));h.forEach((T,k)=>g.lineTo(tx(k+1),ty(T)));g.stroke();g.globalAlpha=1;};
    LN.forEach(ln=>Q[ln].forEach(b=>{const r=b.rf;poly(r.hist,ln===1?'#4fd1ff':'#e58bff',1.1,.55);if(r.hist.length){g.fillStyle=ln===1?'#4fd1ff':'#e58bff';g.beginPath();g.arc(tx(r.hist.length),ty(r.T),2.4,0,7);g.fill();}}));
    const lp=m.lastProfile;if(lp){const h=lp.hist;g.fillStyle='rgba(255,140,40,.22)';g.beginPath();let on=false;h.forEach((T,k)=>{if(T>=LIQ){if(!on){g.moveTo(tx(k+1),ty(LIQ));on=true;}g.lineTo(tx(k+1),ty(T));}else if(on){g.lineTo(tx(k+1),ty(LIQ));g.closePath();on=false;}});if(on){g.lineTo(tx(h.length),ty(LIQ));g.closePath();}g.fill();
      poly(h,tx_,2,1);const kk=h.indexOf(Math.max(...h));g.fillStyle=tx_;g.textAlign='center';g.fillText(lp.peak.toFixed(1)+' °C',tx(kk+1),ty(lp.peak)-9);}g.restore();}
  /* HUD */
  const set=(id,v)=>{const e=$(id);if(e&&e.textContent!==String(v))e.textContent=v;};
  C.onHud(()=>{
    const hs=$('hState');if(hs){hs.textContent=m.state==='DOWN'?'ALARM':m.step;hs.className='pill '+(m.state==='DOWN'?'ng':m.state==='SETUP'||m.state==='BLOCKED'?'cl':m.state==='RUN'?'ok':'idle');}
    set('phase',m.state==='DOWN'?m.detail:m.detail);set('spd','80 cm/min ('+V0.toFixed(2)+' mm/s)');set('o2',Math.round(o2)+' ppm');
    set('nIn',(Q[1].length+Q[2].length)+'  (L1 '+Q[1].length+' · L2 '+Q[2].length+')');set('nOut',m.counters.out);set('rate',Math.round(m.line.rate())+' /h');
    const lp=m.lastProfile;set('kTitle',lp?'LAST BOARD #'+lp.sn+' · lane '+lp.lane:'LAST BOARD');
    set('kPeak',lp?lp.peak.toFixed(1)+' °C':'—');set('kTal',lp?lp.tal.toFixed(0)+' s':'—');set('kRamp',lp?lp.ramp.toFixed(2)+' °C/s':'—');set('kCool',lp?lp.cool.toFixed(2)+' °C/s':'—');set('kTr',lp?(lp.transit/60).toFixed(1)+' min':'—');
    for(let i=0;i<NZ;i++){const tt=i<NH?TOPSET[i]:COOL[i-NH],bb=i<NH?BOTSET[i]:COOL[i-NH];set('zs'+i,tt+' / '+bb);set('zt'+i,ZTOP[i].toFixed(1));set('zb'+i,ZBOT[i].toFixed(1));const l=$('zl'+i);if(l)l.style.color=Math.abs(ZTOP[i]-tt)<3.5?'var(--ok)':'var(--warn)';}
    if(lp)SMT.cycle((lp.transit/60).toFixed(1)+' min','avg '+(m.avgCt()/60).toFixed(2)+' min · belt 80 cm/min · '+Math.round(m.line.rate())+' boards/h','OVEN TRANSIT · LAST BOARD');else SMT.cycle('—','first board in the oven','OVEN TRANSIT');
    const logEl=$('log');if(logEl){const key=m.log.length+':'+(m.log[0]&&m.log[0].t);if(logEl._n!==key){logEl._n=key;logEl.innerHTML='';m.log.slice(0,6).forEach(e=>{const d=document.createElement('div');d.textContent=e.text;if(e.cls)d.className=e.cls;logEl.appendChild(d);});}}
    const now=performance.now();if(now-lastDraw>300){lastDraw=now;drawProf();}
  });
  C.expose({reflow:m,scene:C.scene,hood,setHood,setThermal,summary:()=>({inside:[Q[1].length,Q[2].length],last:m.lastProfile&&{peak:+m.lastProfile.peak.toFixed(1),tal:+m.lastProfile.tal.toFixed(1),ramp:+m.lastProfile.ramp.toFixed(2),cool:+m.lastProfile.cool.toFixed(2),transit:+m.lastProfile.transit.toFixed(0),exitT:+m.lastProfile.exitT.toFixed(0)},o2:Math.round(o2),profiles:m.profiles.length,reflowDefects:m.reflowDefects||0})});
}
return m;
});
