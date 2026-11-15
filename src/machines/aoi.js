/* ===================================================================
   MACHINE MODULE — AOI: dual-lane 2D/3D automated optical inspection (one optical head, lanes 1 + 2).
   Units mm.  Local origin = machine centre on the floor; X = board flow, Y up, Z toward the operator.
   Footprint 1250 (X) x 1500 (Z) x 1600 (Y).  Conveyor (board bottom) at 900, lanes z = +170 / -170.
   Per lane: infeed (DataMatrix read, buffer x = -480) -> inspection position (x = 0, lift + edge clamp)
   -> wait for the head -> unclamp -> outfeed wait (x = +715) -> SMEMA hand-over.  The head serves the lanes alternately.
   Inspection result: detection model per defect type, false calls, escapes (sim truth), warp, KPIs.
   =================================================================== */
'use strict';
SMT3D.register('aoi',function(C,opts){
const {THREE,PI,$,std,box,cyl,label,plate,canvasTex,run,tween,FRAME,CONV_Y,BW,BD,BT,KIT,FIDS,FLAT,LANE_Z,NOSH,conveyTo}=C;
opts=opts||{};
const X=opts.x||0,SA=!!opts.standalone,ID=opts.id||'aoi',rnd=C.rnd;
const W=lx=>X+lx;                                    /* machine-local X -> line-local X */
const machine=new THREE.Group();machine.position.x=X;C.parentFor(opts).add(machine);
const sm=(c,r=.55,m=.05)=>{const x=std(c,r,m);C.shellMats.push(x);return x;};
const CM=C.M,lamp=(c,i)=>std(c,.4,.1,{emissive:c,emissiveIntensity:i});
const M={white:sm(0xe9ecef,.5,.05),white2:sm(0xdfe3e7,.55,.05),dark:sm(0x2b3038,.6,.2),blue:sm(0x1557b8,.45,.15),
  alu:CM.alu,aluD:CM.aluD,steel:CM.steel,black:CM.black,granite:CM.granite,rubber:CM.rubber,camBlue:CM.camBlue,glassLens:CM.glassLens,copper:CM.copper,red:CM.red,
  orange:CM.orange,yellow:CM.yellow,hose:CM.hose,brass:CM.brass,grey:std(0x8d949c,.5,.5),handle:std(0x30343a,.4,.3),chrome:std(0xc8ccd0,.4,.5),
  key:std(0xe6e8ea,.5),keyL:std(0xf2f3f4,.6),pad:std(0x4a4f58,.8,0),fin:std(0x9aa1a9,.35,.8),brown:std(0x8b6a2a,.5,.3)};

/* --- lower cabinet: centre double door, function-label panel above it --- */
const BODY_Y0=110,SILL=790,FZ=620,BX0=-300,BX1=240,AX0=-455,AX1=425;
box(machine,BX0+625,SILL-BODY_Y0,1500,M.white,(BX0-625)/2,(SILL+BODY_Y0)/2,0,NOSH);
box(machine,625-BX1,SILL-BODY_Y0,1500,M.white,(BX1+625)/2,(SILL+BODY_Y0)/2,0,NOSH);
box(machine,BX1-BX0,SILL-BODY_Y0,1200,M.white,(BX0+BX1)/2,(SILL+BODY_Y0)/2,-150,NOSH);
box(machine,BX1-BX0,SILL-648,300,M.white,(BX0+BX1)/2,(SILL+648)/2,600,NOSH);
box(machine,BX1-BX0,16,300,M.white,(BX0+BX1)/2,BODY_Y0+8,600,NOSH);
box(machine,1200,40,1450,M.dark,0,BODY_Y0-18,0,NOSH);
/* levelling feet (threaded stem, two hex nuts, rubber pad) + transport castors */
[[-560,-680],[0,-680],[560,-680],[-560,680],[0,680],[560,680]].forEach(p=>{cyl(machine,50,50,4,M.rubber,p[0],2,p[1]);cyl(machine,46,52,14,M.steel,p[0],11,p[1]);cyl(machine,13,13,100,M.steel,p[0],68,p[1]);
  cyl(machine,24,24,14,M.steel,p[0],88,p[1],{seg:6});cyl(machine,24,24,10,M.aluD,p[0],101,p[1],{seg:6});
  if(Math.abs(p[0])>0)cyl(machine,30,30,26,M.black,p[0]+(p[0]<0?90:-90),32,p[1],{rx:PI/2});});
box(machine,BX0+625,3,3,M.dark,(BX0-625)/2,700,751,NOSH);box(machine,625-BX1,3,3,M.dark,(BX1+625)/2,700,751,NOSH);
/* electrical bay behind the doors */
box(machine,BX1-BX0,522,4,M.black,(BX0+BX1)/2,387,453,NOSH);
box(machine,170,400,250,M.black,-195,326,600);cyl(machine,5,5,3,lamp(0x30ff70,2),-150,480,726,{rx:PI/2,cast:false});
box(machine,150,8,6,M.aluD,-195,440,727,NOSH);box(machine,150,8,6,M.aluD,-195,400,727,NOSH);
box(machine,200,180,240,M.grey,110,216,600);box(machine,230,10,40,M.aluD,95,560,470,NOSH);
[0x2d7be0,0x2d7be0,0xe8a020,0xdde2e6,0xdde2e6,0x30a050].forEach((c,i)=>box(machine,30,70,50,std(c,.5),5+i*34,560,490,NOSH));   /* breaker row */
cyl(machine,22,22,90,M.alu,150,400,560);cyl(machine,30,30,8,M.black,150,450,560);
for(let i=0;i<8;i++)box(machine,18,40,22,i%3?M.white:M.yellow,-250+i*24,505,480,NOSH);                                              /* terminal strip */
box(machine,260,36,30,M.dark,-80,610,490,NOSH);box(machine,260,3,30,M.black,-80,629,490,NOSH);                                        /* cable duct */
const doors=[];
[[BX0,1],[BX1,-1]].forEach(a=>{const g=new THREE.Group();g.position.set(a[0],0,750);machine.add(g);
  box(g,268,518,10,M.white2,a[1]*135,387,2,NOSH);box(g,30,104,7,M.black,a[1]*226,470,8,NOSH);box(g,16,80,5,M.handle,a[1]*226,470,11,NOSH);
  box(g,268,2,2,M.black,a[1]*135,128,7,NOSH);box(g,268,2,2,M.black,a[1]*135,646,7,NOSH);                                              /* door gasket lines */
  cyl(g,9,9,6,M.chrome,a[1]*226,420,9,{rx:PI/2,cast:false,seg:16});box(g,2,12,2,M.black,a[1]*226,420,12.5,NOSH);                        /* key lock */
  [200,330,450,560].forEach(y=>cyl(g,6,6,30,M.steel,a[1]*-4,y,2,{seg:10,cast:false}));                                               /* hinge barrels */
  doors.push({g,dir:a[1],open:0,target:0});C.bake(g);C.dyn(g);});
/* blue logo panel */
(function(){const t=canvasTex(1080,280,(g,W_,H)=>{g.fillStyle='#1b4db3';g.fillRect(0,0,W_,H);g.textAlign='center';g.textBaseline='middle';
  g.fillStyle='#fff';g.font='900 150px "Arial Black",Arial,sans-serif';g.fillText('AOI',W_/2,112);
  g.font='700 40px Arial';g.fillStyle='#cfe0ff';g.fillText('AUTOMATED OPTICAL INSPECTION',W_/2,222);});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(BX1-BX0,140),std(0xffffff,.45,.1,{map:t}));m.position.set((BX0+BX1)/2,719,750.6);machine.add(m);})();

/* --- exterior details (hidden when the camera is far away) --- */
const fineExt=new THREE.Group();machine.add(fineExt);
function louvre(s,y,z,w,h){                              /* louvred side panel: frame, dark backing, angled slats */
  const x=s*630.5;[[0,h/2+4,w+16,8],[0,-h/2-4,w+16,8]].forEach(a=>box(fineExt,4,a[3],a[2],M.dark,x,y+a[1],z,NOSH));
  [-1,1].forEach(q=>box(fineExt,4,h,8,M.dark,x,y,z+q*(w/2+4),NOSH));
  box(fineExt,2.4,h,w,M.black,s*629.2,y,z,NOSH);
  for(let i=0;i<Math.floor(h/14);i++)box(fineExt,6,3,w-6,M.white2,s*631.4,y-h/2+9+i*14,z,{cast:false,rz:s*.55});}
[-1,1].forEach(s=>{
  box(machine,5,430,900,M.white2,s*626,1270,-120,NOSH);box(machine,5,520,900,M.white2,s*626,440,-120,NOSH);
  [[1440,-480],[1440,240],[640,-480],[640,240]].forEach(q=>{box(machine,6,34,22,M.black,s*629,q[0],q[1],NOSH);box(machine,7,6,22,M.chrome,s*629.5,q[0],q[1],NOSH);});   /* quarter-turn fasteners */
  louvre(s,330,-60,150,150);louvre(s,330,-380,150,150);louvre(s,1150,-380,160,120);});
{const t=(lines,w,h,y,z,bg,fg,bd)=>{const p=plate(fineExt,lines,w,h,629.2,y,z,{bg,fg,border:bd,pw:512,ry:PI/2});return p;};
 t(['AOI-3D 330','S/N 26-0451 · 2026-11','400 V 3N~ 50 Hz · 3.2 kVA','0.5-0.7 MPa · 80 NL/min','CE · IP20 · class 1 LED'],190,86,640,225,'#f4f4f0','#111','#222');
 t(['WARNING','Moving parts / pinch point'],130,52,540,250,'#f2c400','#111','#111');
 t(['ELECTRICAL HAZARD','isolate before opening'],130,52,478,250,'#f2c400','#111','#111');
 t(['OPTICAL RADIATION','do not stare into projector'],130,52,540,-380,'#f2c400','#111','#111');}
/* cable glands + earth stud on the rear lower wall */
(function(){const z=-751;box(fineExt,320,70,5,M.dark,0,330,z-2,NOSH);
  for(let i=0;i<6;i++){const x=-120+i*48;cyl(fineExt,15,15,22,M.black,x,330,z-14,{rx:PI/2,seg:14,cast:false});cyl(fineExt,18,18,8,M.steel,x,330,z-4,{rx:PI/2,seg:6,cast:false});}
  cyl(fineExt,6,6,24,M.brass,170,330,z-14,{rx:PI/2,seg:10,cast:false});
  plate(fineExt,['PE','400 V IN','AIR IN'],120,36,0,372,z-5,{bg:'#f4f4f0',ry:PI,pw:256});})();

/* --- upper enclosure --- */
box(machine,1250,810,22,M.white,0,1195,-739,NOSH);                           // rear wall
box(machine,AX0+625,810,22,M.white,(AX0-625)/2,1195,FZ-11,NOSH);             // left front column
box(machine,625-AX1,810,22,M.white,(AX1+625)/2,1195,FZ-11,NOSH);             // right front column
box(machine,AX0+625,22,FZ+750,M.white,(AX0-625)/2,1589,(FZ-750)/2,NOSH);     // roof strips
box(machine,625-AX1,22,FZ+750,M.white,(AX1+625)/2,1589,(FZ-750)/2,NOSH);
box(machine,AX1-AX0,22,700,M.white,(AX0+AX1)/2,1589,-400,NOSH);
box(machine,AX1-AX0,74,20,M.dark,(AX0+AX1)/2,827,FZ-10,NOSH);                // sill behind the bay
(function(){
  const sh=new THREE.Shape();sh.moveTo(-750,SILL);sh.lineTo(FZ,SILL);sh.lineTo(FZ,1600);sh.lineTo(-750,1600);sh.closePath();
  const ho=new THREE.Path();ho.moveTo(-310,868);ho.lineTo(310,868);ho.lineTo(310,965);ho.lineTo(-310,965);ho.closePath();sh.holes.push(ho);
  const g=new THREE.ExtrudeGeometry(sh,{depth:22,bevelEnabled:false});
  [-603,625].forEach(x=>{const m=new THREE.Mesh(g,M.white);m.rotation.y=-PI/2;m.position.x=x;machine.add(m);});
  [-1,1].forEach(s=>{box(machine,30,8,640,M.dark,s*628,968,0,NOSH);box(machine,30,8,640,M.dark,s*628,864,0,NOSH);box(machine,30,110,8,M.dark,s*628,916,314,NOSH);box(machine,30,110,8,M.dark,s*628,916,-314,NOSH);
    box(machine,34,4,640,M.yellow,s*628,977,0,NOSH);});                                                  // SMEMA opening rim (yellow safety edge)
})();
/* operator controls on the right column (E-stop, lamp, start / reset, main power switch) */
(function(){const x=(AX1+625)/2,z=FZ;
  box(machine,120,290,5,M.white2,x,1330,z+2,NOSH);
  box(machine,96,96,4,M.yellow,x,1420,z+5,NOSH);cyl(machine,30,24,30,M.red,x,1420,z+22,{rx:PI/2,cast:false});
  cyl(machine,15,15,12,lamp(0x21b354,.8),x,1335,z+8,{rx:PI/2,cast:false});
  cyl(machine,12,12,10,lamp(0x2d7be0,.6),x-30,1295,z+8,{rx:PI/2,cast:false});cyl(machine,12,12,10,lamp(0x1f9e55,.6),x+30,1295,z+8,{rx:PI/2,cast:false});
  box(machine,74,84,6,std(0xf4f4f4,.5),x,1245,z+5,NOSH);cyl(machine,24,24,14,M.black,x,1245,z+12,{rx:PI/2,cast:false});box(machine,10,44,14,M.black,x,1245,z+20,NOSH);})();
/* roof: exhaust fans (grille, shroud, spinning blades) and door-interlock switch bodies */
const fans=[];
[-230,200].forEach(fx=>{const g=new THREE.Group();g.position.set(fx,1600,-400);fineExt.add(g);
  cyl(g,104,104,26,M.dark,0,13,0,{open:true,seg:32,cast:false});cyl(g,98,98,3,M.black,0,26,0,{seg:32,cast:false});
  for(let r=30;r<=90;r+=20)cyl(g,r,r,4,M.steel,0,28,0,{open:true,seg:28,cast:false});
  box(g,196,4,6,M.steel,0,28,0,NOSH);box(g,6,4,196,M.steel,0,28,0,NOSH);cyl(g,20,20,16,M.black,0,14,0,{seg:14});
  const bl=new THREE.Group();bl.position.y=18;g.add(bl);for(let k=0;k<7;k++){const a=k/7*PI*2,b=box(bl,70,2,22,M.pad,Math.cos(a)*50,0,Math.sin(a)*50,NOSH);b.rotation.y=-a;b.rotation.z=.35;}
  C.dyn(bl);fans.push(bl);});
const ilk=[];                                                      // interlock pairs: body on the roof strip, tongue on the hood
[[AX0-22,480,-1],[AX0-22,120,-1],[AX1+22,480,1],[AX1+22,120,1]].forEach(a=>{box(fineExt,32,26,40,M.yellow,a[0],1613,a[1],NOSH);box(fineExt,34,4,42,M.black,a[0],1627,a[1],NOSH);
  cyl(fineExt,4,4,6,lamp(0x30ff70,1.4),a[0],1630,a[1]-12,{seg:8,cast:false});box(fineExt,10,2,40,M.steel,a[0]-a[2]*18,1608,a[1],NOSH);});

/* --- hood: silver bay with dark window + roof panel, hinged at the back, lifts up --- */
const hoodPivot=new THREE.Group();hoodPivot.position.set(0,1600,-50);machine.add(hoodPivot);
const glassMat=new THREE.MeshStandardMaterial({color:0x0a1420,roughness:.06,metalness:.4,transparent:true,opacity:.74,depthWrite:false,side:THREE.DoubleSide});
(function(){
  const silver=new THREE.MeshStandardMaterial({color:0x5d636a,roughness:.5,metalness:.3,envMapIntensity:.5,side:THREE.DoubleSide});C.shellMats.push(silver);
  const off=new THREE.Group();off.position.set(0,-1600,50);hoodPivot.add(off);        // children use machine coordinates
  box(off,AX1-AX0,20,FZ+50,M.white,(AX0+AX1)/2,1590,(FZ-50)/2,NOSH);                  // roof panel
  const YC=885,v=[];
  const quad=(a,b,c,d)=>{v.push(...a,...b,...c,...a,...c,...d);};
  quad([AX0,YC,FZ],[BX0,YC,750],[BX0,1600,750],[AX0,1600,FZ]);                         // angled side faces
  quad([AX1,YC,FZ],[BX1,YC,750],[BX1,1600,750],[AX1,1600,FZ]);
  quad([AX0,YC,FZ],[BX0,YC,750],[BX0,SILL,750],[BX0,SILL,FZ]);                         // lower chamfers
  quad([AX1,YC,FZ],[BX1,YC,750],[BX1,SILL,750],[BX1,SILL,FZ]);
  quad([AX0,1600,FZ],[BX0,1600,750],[BX1,1600,750],[AX1,1600,FZ]);                     // top cap
  const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(v,3));bg.computeVertexNormals();
  off.add(new THREE.Mesh(bg,silver));
  const win=()=>{const p=new THREE.Path();p.moveTo(BX0+30,1000);p.lineTo(BX0+95,935);p.lineTo(BX1-95,935);p.lineTo(BX1-30,1000);p.lineTo(BX1-30,1572);p.lineTo(BX0+30,1572);p.closePath();return p;};
  const fs=new THREE.Shape();fs.moveTo(BX0,SILL);fs.lineTo(BX1,SILL);fs.lineTo(BX1,1600);fs.lineTo(BX0,1600);fs.closePath();fs.holes.push(win());
  const ff=new THREE.Mesh(new THREE.ExtrudeGeometry(fs,{depth:12,bevelEnabled:false}),silver);ff.position.z=738;off.add(ff);
  const ws=new THREE.Shape(win().getPoints());const gl=new THREE.Mesh(new THREE.ShapeGeometry(ws),glassMat);gl.position.z=744;gl.renderOrder=5;off.add(gl);
  box(off,300,14,14,M.steel,(BX0+BX1)/2,858,772,NOSH);box(off,14,14,24,M.steel,(BX0+BX1)/2-143,858,760,NOSH);box(off,14,14,24,M.steel,(BX0+BX1)/2+143,858,760,NOSH); // handle
  [[AX0-5,480],[AX0-5,120],[AX1+5,480],[AX1+5,120]].forEach(a=>{box(off,8,36,8,M.steel,a[0],1608,a[1]-1,NOSH);});                // interlock tongues (travel with the hood)
  plate(off,['CAUTION','Hood interlocked'],110,40,(BX0+BX1)/2,1530,751.5,{bg:'#f2c400',border:'#111',pw:256});
})();
C.onXray(on=>{glassMat.opacity=on?.12:.74;});
const hood={open:0,target:0};

/* --- signal tower (red / amber / green, top to bottom) --- */
const tower={};
(function(){
  const g=new THREE.Group();g.position.set(520,1600,-260);machine.add(g);
  cyl(g,9,9,190,M.steel,0,95,0);cyl(g,22,26,14,M.black,0,7,0);
  [['r',0xff2a2a,270],['y',0xffa800,230],['g',0x22e06a,190]].forEach(a=>{const mt=new THREE.MeshStandardMaterial({color:a[1],emissive:a[1],emissiveIntensity:.05,roughness:.3,transparent:true,opacity:.92});tower[a[0]]=mt;cyl(g,24,24,38,mt,0,a[2]+19,0);});
  cyl(g,25,25,8,M.dark,0,312,0);cyl(g,12,12,16,M.black,0,322,0);
})();

/* --- operator monitor + keyboard + mouse on the left-hand arm --- */
let monTex,monCtx;
(function(){
  const g=new THREE.Group();g.position.set(-540,0,FZ);machine.add(g);
  box(g,60,380,40,M.white2,0,1180,20);box(g,40,40,190,M.white2,0,1330,115);box(g,40,40,150,M.white2,0,1040,95);
  cyl(g,26,26,44,M.dark,0,1330,115,{seg:20});cyl(g,22,22,44,M.dark,0,1040,95,{seg:20});cyl(g,20,20,40,M.dark,0,1330,205,{seg:20});           // arm joints
  const m=new THREE.Group();m.position.set(-150,1340,215);m.rotation.y=.16;g.add(m);
  box(m,730,440,34,std(0xc8ccd0,.4,.5),0,0,0);box(m,120,120,40,M.dark,0,0,-30);
  const c=document.createElement('canvas');c.width=640;c.height=400;monCtx=c.getContext('2d');
  monTex=new THREE.CanvasTexture(c);monTex.encoding=THREE.sRGBEncoding;monTex.anisotropy=8;
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(690,400),new THREE.MeshBasicMaterial({map:monTex,toneMapped:false}));scr.position.set(0,0,18);m.add(scr);
  const k=new THREE.Group();k.position.set(-150,1030,250);k.rotation.y=.16;g.add(k);
  box(k,520,14,210,M.key);box(k,360,12,120,M.keyL,-50,13,-10);box(k,56,22,90,M.keyL,190,17,0);
  const kt=canvasTex(512,128,(c2,w,h)=>{c2.fillStyle='#d4d7db';c2.fillRect(0,0,w,h);c2.fillStyle='#2b2f35';for(let r=0;r<5;r++)for(let q=0;q<20;q++)c2.fillRect(8+q*25,8+r*23,20,17);});
  const keys=new THREE.Mesh(FLAT(340,100),std(0xffffff,.6,0,{map:kt}));keys.position.set(-50,19.2,-10);k.add(keys);
  const ms=new THREE.Group();ms.position.set(-40,1033,360);ms.rotation.y=.16;g.add(ms);                                                           // mouse pad + mouse
  box(ms,190,3,160,M.pad,0,0,0,NOSH);box(ms,40,16,64,M.black,20,11,0);box(ms,38,2,24,M.pad,20,19.5,-16,NOSH);cyl(ms,5,5,22,M.black,20,16,-8,{rx:PI/2,seg:10,cast:false});
})();

/* --- interior: bed, lighting --- */
const interior=new THREE.Group();machine.add(interior);
const fineInt=new THREE.Group();machine.add(fineInt);           /* small interior details (LOD) */
box(interior,1200,24,1340,M.granite,0,852,-65);box(interior,1200,50,1340,M.dark,0,815,-65,NOSH);
const inLight=new THREE.PointLight(0xdfeaff,.9,1900,1);inLight.position.set(0,1500,-150);interior.add(inLight);
box(interior,900,10,30,new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xcfe2ff,emissiveIntensity:.9}),0,1540,-720,NOSH);

/* --- helpers for the details --- */
const tickTex=(vert)=>canvasTex(vert?8:256,vert?256:8,(g,w,h)=>{g.fillStyle='#cfd5da';g.fillRect(0,0,w,h);g.fillStyle='#1c1f23';
  for(let i=0;i<(vert?h:w);i+=4){if(vert)g.fillRect(1,i,6,2);else g.fillRect(i,1,2,6);}},{repeat:true});
const encH=std(0xffffff,.3,.6,{map:(t=>{t.repeat.set(24,1);return t;})(tickTex(false))}),encV=std(0xffffff,.3,.6,{map:(t=>{t.repeat.set(1,24);return t;})(tickTex(true))});
function heatsink(p,x,y,z,w,h,nF,ax){            /* base plate + fins; ax = +1/-1 outward in Z */
  box(p,w,h,3,M.fin,x,y,z+ax*1.5,NOSH);for(let i=0;i<nF;i++)box(p,3,h-4,22,M.fin,x-w/2+4+i*(w-8)/(nF-1),y,z+ax*14,NOSH);}
const threadTex=canvasTex(16,16,(g,w,h)=>{g.fillStyle='#dfe3e6';g.fillRect(0,0,w,h);g.fillStyle='#8c9399';g.fillRect(0,0,w,6);g.fillStyle='#22262b';g.fillRect(0,0,3,h);},{repeat:true});
threadTex.repeat.set(1,22);
const threadMat=std(0xffffff,.3,.8,{map:threadTex});

/* --- conveyors (two lanes): rails, belt, stopper pins, sensors, lift table, pneumatic edge clamps, lead screws --- */
const XI=-480,XO=715,PINW=BW/2+7,PINI=XI+BW/2+7;
const sensLamp=()=>new THREE.MeshStandardMaterial({color:0x103018,emissive:0x30ff70,emissiveIntensity:0,roughness:.4});
const rdLed=[sensLamp(),sensLamp()];
const lanes=LANE_Z.map((z,i)=>{
  const L={i,lane:i+1,z,state:'EMPTY',inb:null,work:null,outb:null,lift:0,clamp:0,belt:C.belt(86),sens:[],rd:0,screw:0,screwV:0},os=i?-1:1;
  [-1,1].forEach(s=>{
    const rz=z+s*(BD/2+7);
    box(interior,1720,46,12,M.alu,0,CONV_Y-17,rz);                         // rail
    box(interior,1720,6,5,M.aluD,0,CONV_Y+9,rz-s*3.5,NOSH);                // top guide lip
    box(interior,1720,3,6,L.belt.mat,0,CONV_Y-1.5,z+s*(BD/2-2.5),NOSH);    // belt
    box(interior,420,2.5,6,M.aluD,0,904.4,z+s*97,NOSH);                   // edge ledge: the lifted board is pressed against it
    [-520,-260,0,260,520].forEach(x=>box(interior,30,30,14,M.aluD,x,865+7,rz)); // feet
    [-790,790].forEach(x=>cyl(interior,9,9,14,M.black,x,CONV_Y-9,rz-s*8,{rx:PI/2,cast:false}));
    box(interior,60,34,16,M.black,-845,CONV_Y-17,rz+s*14,NOSH);            // belt motor
    cyl(fineInt,5,5,16,M.steel,-845+36,CONV_Y-17,rz+s*14,{rz:PI/2,seg:10,cast:false});
  });
  label(interior,'LANE '+(i+1),90,22,-560,CONV_Y+13,z+BD/2+7+(i?-22:22),{rx:-PI/2,fg:'#4fd1ff',pw:300,size:.7});
  /* width-adjust lead screws (spin during calibration) with hand wheel */
  L.screws=[-420,420].map(x=>{const g=new THREE.Group();g.position.set(x,CONV_Y-30,z+os*20);interior.add(g);
    cyl(g,6,6,300,threadMat,0,0,0,{rx:PI/2,seg:12});cyl(g,12,12,8,M.steel,0,0,os*140,{rx:PI/2,seg:6});C.dyn(g);return g;});
  cyl(fineInt,20,20,10,M.black,-420,CONV_Y-30,z+os*172,{rx:PI/2,seg:16});cyl(fineInt,4,4,26,M.steel,-420,CONV_Y-30,z+os*188,{rx:PI/2,seg:8});
  /* board stoppers (pins) at the inspection position and at the infeed buffer */
  L.pinW=C.stopper(interior,PINW,z);L.pinI=C.stopper(interior,PINI,z);C.dyn(L.pinW,L.pinI);
  /* board-present sensors: infeed buffer, inspection position, outfeed wait */
  [XI,0,XO-60].forEach((sx,k)=>{const lm=sensLamp();L.sens.push({x:sx,lm});
    box(fineInt,24,16,14,M.orange,sx,884,z+os*120,NOSH);cyl(fineInt,3.5,3.5,5,lm,sx,894,z+os*120,{seg:10,cast:false});
    box(fineInt,10,4,16,M.black,sx,880,z+os*(113+3),NOSH);});
  /* support-pin lift table (dyn): plate with magnetic pin bases */
  L.table=new THREE.Group();L.table.position.z=z;interior.add(L.table);
  box(L.table,BW+20,6,BD-30,M.aluD,0,CONV_Y-27,0);
  for(let ix=-2;ix<=2;ix++)for(let iz=-1;iz<=1;iz++){cyl(L.table,3,3,24,M.steel,ix*50,CONV_Y-12,iz*60,{seg:8,cast:false});cyl(L.table,5,5,3,M.black,ix*50,CONV_Y-24,iz*60,{seg:8,cast:false});}
  [-150,150].forEach(x=>{cyl(L.table,5,5,18,M.steel,x,CONV_Y-26,0,{seg:10});cyl(fineInt,9,9,12,M.dark,x,870,z,{seg:12});});
  C.bake(L.table);C.dyn(L.table);
  /* pneumatic edge clamp: cylinder + pusher rod through the outer rail, tubing between the two cylinders */
  L.rods=[-100,100].map(px=>{const zb=z+os*142;
    box(fineInt,30,30,6,M.steel,px,897,z+os*116,NOSH);cyl(fineInt,11,11,46,M.blue,px,897,zb,{rx:PI/2,seg:16});cyl(fineInt,9,9,6,M.steel,px,897,zb+os*26,{rx:PI/2,seg:12});
    cyl(fineInt,2.5,2.5,28,M.hose,px+7,911,zb+os*8,{seg:8,cast:false});
    const g=new THREE.Group();g.position.set(px,900.8,z);interior.add(g);cyl(g,3.5,3.5,20,M.steel,0,0,os*109.2,{rx:PI/2,seg:10,cast:false});box(g,10,1.4,3,M.steel,0,0,os*99.8,NOSH);C.dyn(g);return g;});
  cyl(fineInt,2.5,2.5,200,M.hose,0,925,z+os*142,{rz:PI/2,seg:8,cast:false});
  [-100,100].forEach(px=>cyl(fineInt,2.5,2.5,20,M.hose,px,916,z+os*142,{seg:8,cast:false}));
  /* DataMatrix reader above the infeed buffer: post outside the rail, arm over the board label (board-local -68,-86) */
  {const rx=XI-68,lz=z-86,pz=z+os*130,y=975;box(fineInt,18,111,18,M.dark,rx,919.5,pz,NOSH);box(fineInt,16,12,Math.abs(pz-lz)+16,M.dark,rx,y,(pz+lz)/2,NOSH);
   box(fineInt,24,28,36,M.black,rx,956,lz,NOSH);cyl(fineInt,9,11,6,M.glassLens,rx,939,lz,{seg:14,cast:false});
   const rg=new THREE.Mesh(new THREE.TorusGeometry(12,2,6,16),rdLed[i]);rg.rotation.x=PI/2;rg.position.set(rx,937,lz);fineInt.add(rg);
   L.rdLine=new THREE.Mesh(new THREE.BoxGeometry(24,.3,.8),new THREE.MeshBasicMaterial({color:0xff2020,toneMapped:false}));L.rdLine.position.set(rx,902.2,lz);L.rdLine.layers.set(2);L.rdLine.visible=false;interior.add(L.rdLine);C.dyn(L.rdLine);}
  return L;
});
/* calibration target plate on a slide between the lanes (parked at the infeed side) */
const cal={x:-505,shown:0};
const calG=new THREE.Group();interior.add(calG);
{box(interior,640,8,24,M.aluD,-250,880,0,NOSH);box(interior,26,16,34,M.dark,-570,880,0,NOSH);
 box(calG,30,10,30,M.dark,0,884,0,NOSH);box(calG,120,2,14,M.aluD,-60,889,0,NOSH);
 const pt=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#f4f4ee';g.fillRect(0,0,w,h);g.fillStyle='#14171a';for(let a=0;a<9;a++)for(let b=0;b<9;b++){g.beginPath();g.arc(64+a*51.2,64+b*51.2,11,0,7);g.fill();}
   g.strokeStyle='#14171a';g.lineWidth=4;[[24,24],[488,24],[24,488],[488,488]].forEach(p=>{g.beginPath();g.moveTo(p[0]-14,p[1]);g.lineTo(p[0]+14,p[1]);g.moveTo(p[0],p[1]-14);g.lineTo(p[0],p[1]+14);g.stroke();});
   g.fillStyle='#14171a';g.font='700 18px Arial';g.fillText('CAL TARGET 100 mm · 10.00 mm pitch',100,502);});
 box(calG,104,3,104,M.white,0,CONV_Y-1.5+.0,0,NOSH);
 const tp=new THREE.Mesh(FLAT(100,100),std(0xffffff,.5,0,{map:pt}));tp.position.set(0,CONV_Y+.2,0);calG.add(tp);
 C.bake(calG);C.dyn(calG);}

/* --- XY linear-motor gantry --- */
const gantry={x:0,z:0};
const magT=canvasTex(256,16,(g)=>{for(let x=0;x<256;x+=16){g.fillStyle=(x/16)%2?'#8b6a2a':'#59431b';g.fillRect(x,0,16,16);}},{repeat:true});
(function(){
  [-1,1].forEach(s=>{
    [-640,350].forEach(z=>box(interior,70,330,70,M.aluD,s*540,864+165,z));
    box(interior,84,70,1100,M.alu,s*540,1229,-145);
    const mt=magT.clone();mt.needsUpdate=true;mt.rotation=PI/2;mt.repeat.set(20,1);
    box(interior,40,4,1060,std(0xffffff,.4,.6,{map:mt}),s*540,1266,-145,NOSH);
    box(interior,12,10,1060,M.steel,s*540-s*30,1268,-145,NOSH);
    box(interior,10,1.4,1060,encV,s*(540+32),1264.9,-145,NOSH);                      // linear encoder scale (Z axis)
    box(fineInt,56,16,8,M.black,s*540,1229,-145-562,NOSH);box(fineInt,56,16,8,M.black,s*540,1229,-145+562,NOSH);   // end stops
    [-640,350].forEach(z=>box(fineInt,90,6,90,M.steel,s*540,864+3,z,NOSH));
  });
})();
const beam=new THREE.Group();interior.add(beam);
let chain,chainTex;
(function(){
  box(beam,1160,110,96,M.alu,0,1325,0);
  box(beam,110,40,150,M.aluD,-540,1290,0);box(beam,110,40,150,M.aluD,540,1290,0);
  [-540,540].forEach(x=>{heatsink(beam,x,1290,75,100,32,12,1);heatsink(beam,x,1290,-75,100,32,12,-1);});   // Y-axis motor heat sinks
  const mt=magT.clone();mt.needsUpdate=true;mt.repeat.set(22,1);box(beam,1000,40,4,std(0xffffff,.4,.6,{map:mt}),0,1325,50,NOSH);
  box(beam,1000,10,8,M.steel,0,1368,50,NOSH);box(beam,1000,10,8,M.steel,0,1282,50,NOSH);
  box(beam,1000,8,1.5,encH,0,1353,48.9,NOSH);                                      // linear encoder scale (X axis)
  box(beam,60,60,30,M.dark,540,1394,-10,NOSH);                                     // chain fixing bracket
  chainTex=canvasTex(32,16,(g,w,h)=>{g.fillStyle='#202326';g.fillRect(0,0,w,h);g.fillStyle='#3b4047';g.fillRect(1,1,w-3,h-2);g.fillStyle='#14161a';g.fillRect(w-2,0,2,h);},{repeat:true});
  chain=new THREE.Mesh(new THREE.BoxGeometry(1,26,60),std(0xffffff,.6,.1,{map:chainTex}));chain.position.set(0,1394,-10);beam.add(chain);C.dyn(chain);
})();
C.bake(beam);C.dyn(beam);

/* --- optical head --- */
const head=new THREE.Group();interior.add(head);
const rings=[],projLens=[],projBeams=[];
let glowFade=1,flashSpot,glowSprite,fovGlow,fovStripe,stripeTex;
const FOV_W=58.56,FOV_D=58.56;
(function(){
  const h=head;
  box(h,200,150,34,M.aluD,0,1325,-68);                               // carriage on the beam
  heatsink(h,0,1325,-85,120,100,14,-1);                              // X-axis motor heat sink (rear of the carriage)
  box(h,180,330,18,M.alu,0,1215,-58);                                // Z plate
  box(h,70,12,60,M.alu,0,1290,-25);box(h,70,12,60,M.alu,0,1150,-25); // camera brackets
  box(h,66,84,66,M.camBlue,0,1280,0);
  for(let i=0;i<6;i++)box(h,16,70,3,M.fin,33+8,1280,-26+i*10.4,NOSH);  // camera cooling fins
  cyl(h,10,10,26,M.black,16,1335,-10,{seg:12});
  label(h,'15MP',44,16,0,1290,33.5,{fg:'#fff',pw:256});
  cyl(h,24,24,110,M.black,0,1185,0);cyl(h,27,27,14,M.aluD,0,1215,0);
  cyl(h,33,30,70,M.black,0,1095,0);cyl(h,34,34,8,M.aluD,0,1128,0);
  const dome=new THREE.Mesh(new THREE.CylinderGeometry(42,118,92,48,1,true),new THREE.MeshStandardMaterial({color:0x121316,roughness:.55,metalness:.2,envMapIntensity:.3,side:THREE.DoubleSide}));
  dome.position.y=978;dome.castShadow=true;h.add(dome);
  cyl(h,46,46,10,M.aluD,0,1028,0,{open:false});
  const ringDef=[[1014,50,0xffffff],[996,66,0xff3030],[972,86,0x30ff60],[948,104,0x3a70ff]];
  ringDef.forEach(r=>{const mt=new THREE.MeshStandardMaterial({color:0x222222,emissive:r[2],emissiveIntensity:.04,roughness:.4});const t=new THREE.Mesh(new THREE.TorusGeometry(r[1],4.5,8,48),mt);t.rotation.x=PI/2;t.position.y=r[0];h.add(t);rings.push(mt);});
  const cr=new THREE.Mesh(new THREE.TorusGeometry(150,7,8,48),M.aluD);cr.rotation.x=PI/2;cr.position.y=1100;cr.castShadow=true;h.add(cr);
  for(let k=0;k<4;k++){const a=k*PI/2+PI/4;box(h,110,10,16,M.aluD,Math.cos(a)*95,1100,Math.sin(a)*95,{ry:-a});}
  for(let k=0;k<4;k++){                                              // 4 side-view cameras
    const a=k*PI/2+PI/4,g=new THREE.Group();g.position.set(Math.cos(a)*150,1062,Math.sin(a)*150);h.add(g);g.lookAt(new THREE.Vector3(0,902,0));
    box(g,36,36,52,M.camBlue,0,0,-30);cyl(g,12,12,40,M.black,0,0,16,{rx:PI/2,seg:16});cyl(g,9,9,2,M.glassLens,0,0,37,{rx:PI/2,seg:16,cast:false});
  }
  for(let k=0;k<4;k++){                                              // 4 moire projectors (N/E/S/W)
    const a=k*PI/2,px=Math.cos(a)*158,pz=Math.sin(a)*158,g=new THREE.Group();g.position.set(px,1082,pz);h.add(g);g.lookAt(new THREE.Vector3(0,902,0));
    box(g,46,46,78,std(0x4a5058,.4,.7),0,0,-42);cyl(g,16,16,34,M.black,0,0,12,{rx:PI/2,seg:16});
    const lm=new THREE.MeshStandardMaterial({color:0x101828,emissive:0x9fd0ff,emissiveIntensity:0,roughness:.1});
    cyl(g,12,12,2,lm,0,0,30,{rx:PI/2,seg:16,cast:false});projLens.push(lm);
    box(g,14,14,10,M.copper,0,26,-60,NOSH);
    for(let q=0;q<7;q++)box(g,38,3,38,M.fin,0,25+q*0,-34,NOSH).position.set(-18+q*6,31,-34),0;   // projector heat sink fins
    const ap=new THREE.Vector3(px,1082,pz).lerp(new THREE.Vector3(0,902,0),.13),y=CONV_Y+BT+.4,hw=FOV_W/2,hd=FOV_D/2;
    const c=[[-hw,y,-hd],[hw,y,-hd],[hw,y,hd],[-hw,y,hd]],v=[];
    for(let i=0;i<4;i++){const p=c[i],q=c[(i+1)%4];v.push(ap.x,ap.y,ap.z,p[0],p[1],p[2],q[0],q[1],q[2]);}
    const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
    const bm=new THREE.Mesh(bg,new THREE.MeshBasicMaterial({color:0x9fd0ff,transparent:true,opacity:.16,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    bm.layers.set(1);bm.visible=false;bm.userData.beam=1;h.add(bm);projBeams.push(bm);
  }
  flashSpot=new THREE.SpotLight(0xffffff,0,700,.42,.55,1);flashSpot.position.set(0,1040,0);
  const tg=new THREE.Object3D();tg.position.set(0,900,0);h.add(tg);flashSpot.target=tg;h.add(flashSpot);
  const gt=canvasTex(128,128,(g)=>{const gr=g.createRadialGradient(64,64,4,64,64,64);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.35,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);});
  glowSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
  glowSprite.scale.set(420,420,1);glowSprite.position.set(0,930,0);glowSprite.layers.set(1);h.add(glowSprite);
  const pg=new THREE.PlaneGeometry(FOV_W,FOV_D);pg.rotateX(-PI/2);
  fovGlow=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
  fovGlow.position.y=CONV_Y+BT+.3;fovGlow.layers.set(1);h.add(fovGlow);
  stripeTex=canvasTex(64,8,(g)=>{for(let x=0;x<64;x++){const v=Math.round(127+127*Math.sin(x/64*2*PI));g.fillStyle='rgb('+v+','+v+','+v+')';g.fillRect(x,0,1,8);}},{repeat:true});
  stripeTex.encoding=THREE.LinearEncoding;stripeTex.center.set(.5,.5);stripeTex.repeat.set(7,1);
  fovStripe=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({map:stripeTex,color:0xbfe0ff,transparent:true,opacity:.42,blending:THREE.AdditiveBlending,depthWrite:false}));
  fovStripe.position.y=CONV_Y+BT+.35;fovStripe.layers.set(2);fovStripe.visible=false;h.add(fovStripe);
  const fr=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-1,-1],[1,-1],[1,1],[-1,1]].map(p=>new THREE.Vector3(p[0]*FOV_W/2,CONV_Y+BT+.5,p[1]*FOV_D/2))),new THREE.LineBasicMaterial({color:0x4fd1ff,transparent:true,opacity:.9}));
  fr.layers.set(1);h.add(fr);head.userData.frame=fr;
})();
C.bake(head);C.dyn(head);

/* ===================================================================
   RUNTIME — lanes, optical head sequence, defect model, KPIs, monitor, insets, views
   =================================================================== */
const LIFT=1.2,NC=5,NR=4,SXs=(BW-FOV_W)/(NC-1),SZs=(BD-FOV_D)/(NR-1),FOVS=[];
for(let r=0;r<NR;r++)for(let c=0;c<NC;c++){const cc=r%2?NC-1-c:c;FOVS.push({x:-BW/2+FOV_W/2+cc*SXs,z:-BD/2+FOV_D/2+r*SZs,c:cc,r});}
const PD={MISSING:.999,SHIFT:.98,TOMBSTONE:.995,ROTATED:.99,POLARITY:.97,'LIFTED LEAD':.95,BRIDGE:.99,INSUFFICIENT:.93,OPEN:.90};   /* probability of detection per defect type */
const FC_RATE=.03,WARP_RATE=.003,NCOMP=(KIT.places&&KIT.places.length)||289;
const amberMat=new THREE.MeshBasicMaterial({color:0xffb020,toneMapped:false});
const tileOk=new THREE.MeshBasicMaterial({color:0x30ff80,transparent:true,opacity:.13,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
const tileNg=new THREE.MeshBasicMaterial({color:0xff3040,transparent:true,opacity:.2,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
const tileGeo=FLAT(+(SXs-1).toFixed(2),+(SZs-1).toFixed(2));
const st={ins:0,pass:0,ng:0,fcBoards:0,fc:0,esc:0,real:0,det:0,warpNg:0,serial:'—',warp:null,head:'IDLE',fov:0,tiles:new Array(FOVS.length).fill(0),active:-1,lane:null,sn:0,result:'',defs:[],
  hist:[],lastNgAt:-99,nextCal:opts.calAfter||14400,calN:0,calMsg:'',calRms:0,recent:[]};
const fx={color:new THREE.Color(1,1,1),ring:-1,moire:-1,power:0,label:'—'};
lanes.forEach(L=>{L.state='—';});

/* ---------- defect review snapshot: a clone of the flagged board far below the floor, seen by an orthographic camera ---------- */
SMT3D._aoiN=(SMT3D._aoiN||0)+1;
const REV_Y=-3000-SMT3D._aoiN*100,rev={b:null,clone:null,has:false,cx:0,cz:0,hw:12,label:'NO FLAG YET',wx:0,wz:0};
function snapshotReview(b,d,L){
  if(rev.clone){C.scene.remove(rev.clone);}
  const c=b.g.clone(true);
  for(let i=c.children.length-1;i>=0;i--){const ch=c.children[i];if(ch.userData.isProxy)c.remove(ch);else if(ch.userData._lodHidden){ch.visible=true;ch.userData._lodHidden=false;}}
  for(let i=c.children.length-1;i>=0;i--)if(c.children[i].userData.tiles)c.remove(c.children[i]);
  c.traverse(o=>{o.castShadow=false;});
  c.position.set(0,REV_Y,0);c.rotation.set(0,0,0);C.scene.add(c);rev.clone=c;
  Object.assign(rev,{b,has:true,cx:d.x,cz:d.z,hw:Math.max(7,d.s*.8),label:d.name+' · '+d.type,wx:d.x,wz:L.z+d.z});
}
const mkGeo=new THREE.BoxGeometry(1,.25,1);
function flagMarker(b,d,real){
  const s=d.s,t=Math.max(.35,s*.06),y=BT+Math.min(d.h,3)+.6,g=new THREE.Group(),mt=real?C.redMat:amberMat;
  [[0,-s/2,s+t,t],[0,s/2,s+t,t],[-s/2,0,t,s],[s/2,0,t,s]].forEach(a=>{const mm=new THREE.Mesh(mkGeo,mt);mm.scale.set(a[2],1,a[3]);mm.position.set(a[0],0,a[1]);mm.layers.set(1);g.add(mm);});
  g.position.set(d.x,y,d.z);b.g.add(g);d.marker=g;
}

/* ---------- head motion + strobe sequence ---------- */
function* moveHead(x,z){const x0=gantry.x,z0=gantry.z,d=Math.hypot(x-x0,z-z0),T=Math.max(.1,d/1100+.07);let t=0;
  while(t<T){t+=yield FRAME;const k=C.ease(Math.min(1,t/T));gantry.x=x0+(x-x0)*k;gantry.z=z0+(z-z0)*k;}}
const PH2D=[['WHITE COAX',0xffffff,0],['RED RING',0xff4a4a,1],['GREEN RING',0x4aff7a,2],['BLUE RING',0x5a8aff,3],['SIDE CAMS ×4',0xfff0cc,9]];
function* capture(pfx){
  for(const p of PH2D){fx.label=(pfx||'2D')+' · '+p[0];fx.color.setHex(p[1]);fx.ring=p[2];fx.moire=-1;fx.power=1;yield .05;fx.power=0;yield .018;}
  for(let k=0;k<4;k++){fx.label='3D MOIRÉ · '+(k*90)+'°';fx.color.setHex(0xbfe0ff);fx.ring=-1;fx.moire=k;fx.power=.5;yield .1;}
  fx.moire=-1;fx.power=0;fx.label='ANALYSING';
}
function logRow(text,cls){m.addLog(text,cls);}

/* ---------- one board inspection (head side) ---------- */
function* inspect(L,b){
  const t0=C.T.sim;st.head='ALIGN';L.state='INSPECTING';m.setState('RUN','INSPECT','L'+L.lane+' · '+b.dm);
  const A=b.aoi={flags:[],escapes:0,falseCalls:0,warp:0,real:b.defects.length,detected:0,serial:b.dm,lane:L.lane};
  Object.assign(st,{lane:L,sn:b.sn,serial:b.dm,fov:0,active:-1,result:'',defs:[],warp:null});st.tiles.fill(0);
  const tiles=new THREE.Group();tiles.userData.tiles=1;b.g.add(tiles);b.aoiTiles=tiles;
  /* truth the sim knows and the AOI does not: a borderline good part and the real board warp */
  let fc=null;
  if(rnd()<FC_RATE){let k,n=0;do{k=Math.floor(rnd()*KIT.cands.length);}while(b.defects.some(d=>d.k===k)&&n++<20);
    const c=KIT.cands[k];fc={k,name:c.name,type:rnd()<.5?'SHIFT':'INSUFFICIENT',x:c.x,z:c.z,s:Math.max(c.w,c.d)+2.2,h:c.h,fc:true,seen:false};}
  const warp=rnd()<WARP_RATE?1.5+rnd()*1.1:.1+rnd()*.8;
  for(const f of FIDS.slice(0,2)){yield* moveHead(f.x,L.z+f.z);fx.label='FIDUCIAL MARK';fx.color.setHex(0xffffff);fx.ring=0;fx.power=1;yield .09;fx.power=0;yield .05;}
  st.head='SCAN';
  for(let i=0;i<FOVS.length;i++){
    const f=FOVS[i];st.active=i;
    if(i===9&&rnd()<.002){st.head='FAULT';yield* m.fault('PROJECTOR OVER-TEMPERATURE',40);st.head='SCAN';}
    yield* moveHead(f.x,L.z+f.z);yield .025;
    yield* capture();
    let ng=false,last=null;
    const inF=d=>Math.abs(d.x-f.x)<=FOV_W/2&&Math.abs(d.z-f.z)<=FOV_D/2;
    b.defects.forEach(d=>{if(d.seen||!inF(d))return;d.seen=true;
      if(rnd()<(PD[d.type]||.95)){d.found=true;ng=true;A.detected++;A.flags.push({name:d.name,type:d.type,real:true});flagMarker(b,d,true);last=d;
        st.defs.push(d.name+' '+d.type);logRow('L'+L.lane+' #'+b.sn+'  '+d.name+'  '+d.type,'ng');st.lastNgAt=C.T.sim;}
      else{A.escapes++;d.escaped=true;}});
    if(fc&&!fc.seen&&inF(fc)){fc.seen=true;ng=true;A.falseCalls++;A.flags.push({name:fc.name,type:fc.type,real:false});flagMarker(b,fc,false);last=fc;
      st.defs.push(fc.name+' '+fc.type);logRow('L'+L.lane+' #'+b.sn+'  '+fc.name+'  '+fc.type,'ng');st.lastNgAt=C.T.sim;}
    const tm=new THREE.Mesh(tileGeo,ng?tileNg:tileOk);tm.position.set(f.x,BT+.22,f.z);tm.layers.set(1);tiles.add(tm);
    st.tiles[i]=ng?2:1;st.fov=i+1;
    if(last)snapshotReview(b,last,L);
  }
  st.active=-1;fx.label='—';
  /* 3D height data -> board warp */
  A.warp=warp;st.warp=warp;
  if(warp>1.5){A.flags.push({name:'BOARD',type:'WARP',real:true});st.warpNg++;st.defs.push('BOARD WARP '+warp.toFixed(2)+' mm');logRow('L'+L.lane+' #'+b.sn+'  WARP '+warp.toFixed(2)+' mm','ng');st.lastNgAt=C.T.sim;}
  /* verdict + KPIs */
  const ngB=A.flags.length>0;b.result=ngB?'NG':'OK';
  st.ins++;ngB?st.ng++:st.pass++;if(ngB)m.counters.ng++;
  st.real+=A.real;st.det+=A.detected;st.esc+=A.escapes;st.fc+=A.falseCalls;if(A.falseCalls)st.fcBoards++;
  st.recent.push(ngB?0:1);if(st.recent.length>10)st.recent.shift();st.hist.push(st.recent.reduce((a,v)=>a+v,0)/st.recent.length*100);if(st.hist.length>48)st.hist.shift();
  st.result=b.result;m.endCycle(b,t0);
  if(!ngB)logRow('L'+L.lane+' #'+b.sn+'  PASS  '+m.ct.toFixed(1)+' s','ok');
  b.aoiDone=true;L.state=ngB?'UNLOAD · NG':'UNLOAD · OK';
}
/* ---------- daily camera calibration (SETUP state, 60 s) ---------- */
function* calibrate(){
  const t0=C.T.sim;st.head='CALIBRATION';st.calN++;m.setState('SETUP','DAILY CAMERA CALIBRATION','target plate · 60 s');logRow('Daily camera calibration started','cl');
  Object.assign(st,{lane:null,fov:0,active:-1,result:'',defs:[]});st.tiles.fill(0);cal.shown=1;st.calMsg='TARGET PLATE OUT';
  yield* tween(4,k=>cal.x=-505+k*470,true);
  const pts=[[0,0],[-34,-34],[34,-34],[34,34],[-34,34]];let n=0;
  for(let pass=0;pass<5;pass++)for(const p of pts){n++;st.calMsg='DOT GRID '+n+' / 25';yield* moveHead(cal.x+p[0],p[1]);yield .025;yield* capture('CAL');}
  fx.label='FITTING DISTORTION MAP';st.calMsg='FITTING DISTORTION MAP';yield* moveHead(cal.x,0);
  while(C.T.sim-t0<56)yield .25;
  st.calRms=2.1+rnd()*1.4;st.calMsg='RMS '+st.calRms.toFixed(1)+' µm  OK';
  yield* tween(4,k=>cal.x=-35-k*470,true);cal.shown=0;fx.label='—';
  st.nextCal=C.T.sim+14400;st.head='IDLE';logRow('Calibration done  RMS '+st.calRms.toFixed(1)+' µm','ok');
  yield* moveHead(0,0);
}
/* ---------- the head serves the lanes alternately ---------- */
function* headMain(){
  let turn=0;
  while(true){
    if(C.T.sim>=st.nextCal){yield* calibrate();continue;}
    let L=null;
    for(let i=0;i<2;i++){const c=lanes[(turn+i)%2];if(c.work&&c.work.aoiReady&&!c.work.aoiDone){L=c;turn=(turn+i+1)%2;break;}}
    if(!L){
      st.head='IDLE';
      if(lanes.some(c=>c.outb)&&!lanes.some(c=>c.work))m.setState('BLOCKED','WAIT OUTFEED','downstream not ready');
      else m.setState('STARVED','WAIT BOARD',m.boards.length?'board in transit':'no board in either lane');
      yield FRAME;continue;}
    yield* inspect(L,L.work);
  }
}
/* ---------- lane side: one process per board ---------- */
function* readDM(L,b){
  yield* C.waitUntil(()=>!m.down);L.state='READING DM';b.dm='SN26-'+String(b.sn).padStart(6,'0');L.rdLine.visible=true;rdLed[L.i].emissiveIntensity=2.2;
  yield* tween(.45,k=>{L.rdLine.position.z=L.z-86+Math.sin(k*PI*3)*7;},true);
  L.rdLine.visible=false;rdLed[L.i].emissiveIntensity=0;st.serial=b.dm;yield .08;
}
function* boardProc(L,b){
  b.setLane(L.lane,true);b.aoiReady=false;b.aoiDone=false;
  yield* C.waitUntil(()=>!m.down);
  yield* C.waitUntil(()=>!m.boards.some(o=>o!==b&&o.lane===L.lane&&o.x<W(-200)));
  L.pinI.userData.up=true;L.state='LOADING';
  yield* conveyTo(b,W(XI),L.belt);
  yield* readDM(L,b);
  L.state='WAIT LANE';
  yield* C.waitUntil(()=>!L.work);
  L.work=b;L.inb=null;
  yield* conveyTo(b,W(-200),L.belt);
  L.pinI.userData.up=false;yield* C.waitUntil(()=>!L.outb||L.outb.x>W(280));L.pinW.userData.up=true;L.state='LOADING';
  yield* conveyTo(b,W(0),L.belt);
  yield* C.waitUntil(()=>!m.down);L.state='CLAMPING';yield .12;
  yield* tween(.3,k=>L.lift=LIFT*k);yield* tween(.3,k=>L.clamp=k);
  b.aoiReady=true;L.state='WAITING HEAD';
  yield* C.waitUntil(()=>b.aoiDone);
  yield b.result==='NG'?1.6:.25;
  if(b.aoiTiles){b.g.remove(b.aoiTiles);b.aoiTiles=null;}
  yield* tween(.3,k=>L.clamp=1-k);yield* tween(.3,k=>L.lift=LIFT*(1-k));
  L.pinW.userData.up=false;
  L.state=b.result==='NG'?'UNLOAD · NG':'UNLOAD · OK';
  yield* C.waitUntil(()=>!L.outb);
  L.outb=b;L.work=null;
  yield* conveyTo(b,W(XO),L.belt);
  m.setReady(b,L.lane);L.state='OUTFEED WAIT';
}

/* ---------- machine base + SMEMA hooks ---------- */
const m=C.machine({id:ID,name:opts.name||'AOI',kind:'aoi',group:machine,x:X,length:1250,depth:1500,height:1600,lanes:[1,2],inReach:235,outReach:235,parallel:1,line:opts.line,
  spec:{'Top camera':'15 MP telecentric, FOV 58.56 mm','3D':'4-phase moiré','Drive':'Linear motor XY'}});
m.canAccept=lane=>{const L=lanes[lane-1];return !!L&&!m.down&&!L.inb;};
m.onAccept=(b,lane)=>{const L=lanes[lane-1];L.inb=b;run(boardProc(L,b));};
m.onRelease=(b,lane)=>{const L=lanes[lane-1];if(L.outb===b)L.outb=null;L.belt.moving++;run((function*(){yield (BW+90)/C.BELT_V;L.belt.moving--;})());};
run(headMain());

/* ---------- hood, doors ---------- */
function setHood(o){hood.target=o?1:0;const b=$('bHood');if(SA&&b){b.textContent=o?'Close hood':'Open hood';b.classList.toggle('on',!!o);}}
C.clickable(hoodPivot,()=>setHood(!hood.target));
doors.forEach(d=>C.clickable(d.g,()=>{d.target=d.target?0:1;}));

/* ---------- per-frame poses ---------- */
const O3=new THREE.Color();
m.update=(dt,rdt)=>{
  rdt=rdt||0;const k=Math.min(1,Math.max(dt,rdt)*3.2);
  head.position.set(gantry.x,0,gantry.z);beam.position.z=gantry.z-133;
  {const x0=gantry.x+100,len=540-x0;chain.scale.x=len;chain.position.set((x0+540)/2,1394,18);chainTex.repeat.x=len/32;}
  calG.position.x=cal.x;
  const p=fx.power,lf=st.lane?st.lane.lift:0,yb=CONV_Y+BT+lf;
  fovGlow.position.y=yb+.3;fovStripe.position.y=yb+.35;head.userData.frame.position.y=lf;projBeams.forEach(q=>q.position.y=lf);
  {const O=m.origin(),cp=C.camera.position,dd=Math.hypot(cp.x-O.x-gantry.x,cp.y-930,cp.z-O.z-gantry.z);glowFade=Math.min(1,Math.max(0,(dd-300)/500));}
  flashSpot.intensity=fx.moire>=0?0:p*2.4;flashSpot.color.copy(fx.color);
  glowSprite.material.opacity=p*.5*glowFade;glowSprite.material.color.copy(fx.color);
  fovGlow.material.opacity=fx.moire<0?p*.1:0;fovGlow.material.color.copy(fx.color);
  rings.forEach((mt,i)=>mt.emissiveIntensity=(p>0&&(fx.ring===i||fx.ring===9))?2.4:.04);
  for(let i=0;i<4;i++){projLens[i].emissiveIntensity=fx.moire===i?2.5:0;projBeams[i].visible=fx.moire===i;}
  fovStripe.visible=fx.moire>=0;if(fx.moire>=0){stripeTex.offset.x+=dt*7;stripeTex.rotation=fx.moire*PI/2;}
  head.userData.frame.material.opacity=st.head==='IDLE'?.25:.9;
  const calOn=st.head==='CALIBRATION';
  if(calOn&&dt>0)threadTex.offset.y+=dt*1.4;
  lanes.forEach(L=>{
    L.table.position.y=L.lift;if(L.work)L.work.g.position.y=CONV_Y+L.lift;
    L.rods.forEach(r=>{r.position.z=L.z+(L.i?-1:1)*11.2*(1-L.clamp);});
    L.sens.forEach(s=>{let on=false;for(const b of m.boards)if(b.lane===L.lane&&Math.abs(b.x-W(s.x))<BW/2-10){on=true;break;}s.lm.emissiveIntensity=on?2:0;});
  });
  hood.open+=(hood.target-hood.open)*k;hoodPivot.rotation.x=-hood.open*1.05;doors.forEach(d=>{d.open+=(d.target-d.open)*k;d.g.rotation.y=-d.dir*d.open*1.8;});
  fans.forEach(f=>{f.rotation.y+=rdt*16;});
  C.tower(m,tower,C.T.sim-st.lastNgAt<3||st.head==='CALIBRATION');
};
C.dyn(hoodPivot);

/* ---------- inset cameras ---------- */
const insetCam=new THREE.OrthographicCamera(-FOV_W/2*255/253,FOV_W/2*255/253,FOV_D/2,-FOV_D/2,.5,70);insetCam.up.set(0,0,-1);insetCam.layers.enable(2);
const insetCamH=insetCam.clone();insetCamH.layers.set(0);
const insetCamD=new THREE.OrthographicCamera(-12,12,12,-12,.5,70);insetCamD.up.set(0,0,-1);insetCamD.layers.enable(1);
const heightMat=new THREE.ShaderMaterial({
  uniforms:{base:{value:CONV_Y+BT},range:{value:6}},
  vertexShader:'varying float vh;varying vec3 vn;void main(){vec4 w=modelMatrix*vec4(position,1.);vh=w.y;vn=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform float base;uniform float range;varying float vh;varying vec3 vn;\nvec3 jet(float t){return clamp(vec3(1.5-abs(4.*t-3.),1.5-abs(4.*t-2.),1.5-abs(4.*t-1.)),0.,1.);}\nvoid main(){float t=clamp((vh-base)/range,0.,1.);t=pow(t,.55);vec3 c=mix(vec3(.02,.05,.35),jet(t),step(.001,t));float s=.7+.3*abs(normalize(vn).y);gl_FragColor=vec4(c*s,1.);}'
});
const prepCam=c=>{const O=m.origin();c.position.set(O.x+gantry.x,927,O.z+gantry.z);c.lookAt(O.x+gantry.x,0,O.z+gantry.z);};
const prepCamH=c=>{prepCam(c);const L=lanes.find(l=>l.work&&Math.abs(l.z-gantry.z)<150);heightMat.uniforms.base.value=CONV_Y+BT+(L?L.lift:0);};
const prepCamD=c=>{const h=rev.hw;if(c.right!==h){c.left=-h;c.right=h;c.top=h;c.bottom=-h;c.updateProjectionMatrix();}
  const O=rev.has?{x:rev.cx,z:rev.cz}:{x:0,z:0};c.position.set(O.x,REV_Y+27,O.z);c.lookAt(O.x,REV_Y,O.z);};
m.cameras=[{name:'Top camera · 2D',cam:insetCam,prepare:prepCam},{name:'Defect review',cam:insetCamD,prepare:prepCamD}];

/* ---------- operator monitor (canvas) ---------- */
function drawMon(){
  const g=monCtx,W_=640,H=400;g.fillStyle='#0b1220';g.fillRect(0,0,W_,H);
  g.fillStyle='#1557b8';g.fillRect(0,0,W_,40);g.fillStyle='#fff';g.font='700 20px Arial';g.textAlign='left';g.textBaseline='middle';g.fillText('AOI  ·  DUAL LANE  ·  3D INSPECTION',14,21);
  g.font='500 14px Arial';g.textAlign='right';g.fillText(C.T.paused?'PAUSED':(m.state==='DOWN'?'ALARM':(m.state==='SETUP'?'CALIBRATION':'AUTO RUN')),W_-14,21);g.textAlign='left';
  const mx=14,my=50,mw=300,mh=240;g.fillStyle='#0f5a31';g.fillRect(mx,my,mw,mh);
  FOVS.forEach((f,i)=>{const x=mx+f.c*mw/NC,y=my+f.r*mh/NR,s=st.tiles[i];
    if(s){g.fillStyle=s==2?'rgba(255,60,70,.55)':'rgba(60,230,130,.35)';g.fillRect(x+2,y+2,mw/NC-4,mh/NR-4);}
    g.strokeStyle=i==st.active?'#fff':'rgba(255,255,255,.25)';g.lineWidth=i==st.active?3:1;g.strokeRect(x+2,y+2,mw/NC-4,mh/NR-4);});
  g.fillStyle='#8fa3bd';g.font='500 12px Arial';g.fillText('LANE',330,62);g.fillText('BOARD S/N',400,62);g.fillText('WARP',540,62);
  g.fillStyle='#fff';g.font='700 17px Arial';g.fillText(st.lane?String(st.lane.lane):'—',330,82);g.font='700 15px Consolas,monospace';g.fillText(st.serial,400,82);g.font='700 17px Arial';g.fillText(st.warp!=null?st.warp.toFixed(2)+' mm':'—',540,82);
  g.fillStyle='#8fa3bd';g.font='500 12px Arial';g.fillText('FOV '+st.fov+' / '+FOVS.length,330,106);
  if(st.result){g.fillStyle=st.result=='OK'?'#3ddc84':'#ff4d5a';g.font='900 44px Arial';g.fillText(st.result,330,138);}
  else if(st.head==='CALIBRATION'){g.fillStyle='#e8a020';g.font='700 14px Arial';g.fillText('CALIBRATION',330,126);g.font='500 12px Arial';g.fillText(st.calMsg,330,146);}
  g.fillStyle='#8fa3bd';g.font='500 12px Arial';g.fillText('DEFECT LIST (operator view: real / false not known)',330,168);
  g.font='500 12.5px Consolas,monospace';g.fillStyle='#ff9aa2';st.defs.slice(0,6).forEach((d,i)=>g.fillText(d,330,186+i*16));
  if(!st.defs.length){g.fillStyle='#5d7089';g.fillText(st.lane&&st.result===''?'scanning…':'—',330,186);}
  /* FPY trend + counters */
  g.fillStyle='#8fa3bd';g.font='500 12px Arial';g.fillText('FPY TREND (last 10 boards, rolling)',14,306);
  g.fillStyle='#111b2c';g.fillRect(14,312,300,40);g.strokeStyle='#26354d';g.lineWidth=1;g.strokeRect(14,312,300,40);
  if(st.hist.length>1){g.strokeStyle='#4fd1ff';g.lineWidth=2;g.beginPath();st.hist.forEach((v,i)=>{const x=14+i*300/47,y=352-(Math.max(40,v)-40)/60*38;i?g.lineTo(x,y):g.moveTo(x,y);});g.stroke();}
  const fpy=st.ins?(st.pass/st.ins*100).toFixed(0)+' %':'—';
  g.fillStyle='#fff';g.font='700 14px Arial';g.fillText('INSPECTED '+st.ins+'   PASS '+st.pass+'   NG '+st.ng+'   FPY '+fpy,330,306);
  g.font='500 13px Arial';g.fillStyle='#8fa3bd';
  g.fillText('FALSE CALL '+(st.ins?(st.fcBoards/st.ins*100).toFixed(1):'0.0')+' % / bd  ·  '+(st.ins?Math.round(st.fc/(st.ins*NCOMP)*1e6):0)+' ppm',330,328);
  g.fillText('ESCAPES (sim truth) '+st.esc,330,348);
  g.fillStyle='#8fa3bd';g.font='500 12px Arial';g.fillText('CT '+(m.ct?m.ct.toFixed(1)+' s':'—')+'   CAL '+st.calN+'   NEXT CAL '+Math.max(0,Math.round((st.nextCal-C.T.sim)/60))+' min   '+fx.label,14,378);
  monTex.needsUpdate=true;
}
C.onSlow(()=>{if(m.near)drawMon();});

/* ---------- info + views ---------- */
const kpi=()=>({ins:st.ins,pass:st.pass,ng:st.ng,fpy:st.ins?st.pass/st.ins:0,fcBoardRate:st.ins?st.fcBoards/st.ins:0,fcPpm:st.ins?st.fc/(st.ins*NCOMP)*1e6:0,escapes:st.esc,realDefects:st.real,detected:st.det,
  detectRate:st.real?st.det/st.real:1,warpNg:st.warpNg,calN:st.calN});
m.info=()=>[['Head',st.head+(st.lane?' · L'+st.lane.lane:'')],['FOV',st.fov+' / '+FOVS.length],['Last serial',st.serial],['Inspected',st.ins],['Pass / NG',st.pass+' / '+st.ng],
  ['First-pass yield',st.ins?(st.pass/st.ins*100).toFixed(1)+' %':'—'],['False calls',st.fc+' ('+(st.ins?(st.fcBoards/st.ins*100).toFixed(1):'0.0')+' % bd)'],['Escapes (sim truth)',st.esc],
  ['Warp (last)',st.warp!=null?st.warp.toFixed(2)+' mm':'—'],['Last cycle',m.ct?m.ct.toFixed(1)+' s':'—'],['Calibrations',st.calN]];
const LZ0=LANE_Z[0];
m.views={
  over:{p:[2450,1950,3300],t:[0,880,0]},
  inside:{p:[260,1900,1850],t:[0,930,40],hood:1},
  board:{p:[-120,1060,LZ0+430],t:[0,902,LZ0]},
  top:{p:[0,3900,5],t:[0,900,0],hood:1},
  review:{p:[60,1000,LZ0+150],t:[0,902,LZ0],hood:1}
};
m.setHood=setHood;m.st=st;m.kpi=kpi;m.calibrateNow=()=>{st.nextCal=0;};

/* ---------- stand-alone page wiring ---------- */
if(SA){
  const V=(p,t)=>{const O=m.origin();return [[p[0]+O.x,p[1],p[2]+O.z],[t[0]+O.x,t[1],t[2]+O.z]];};
  const vmap={};
  ['over','inside','board','top'].forEach(k=>{const v=m.views[k];vmap[k]=()=>{if(v.hood)setHood(1);const [p,t]=V(v.p,v.t);C.flyTo(p,t);};});
  vmap.follow=()=>{setHood(1);const O=m.origin(),t=[O.x+gantry.x,935,O.z+gantry.z];C.flyTo([t[0]+330,t[1]+330,t[2]+560],t,.9);let lx=null,lz=null;
    return()=>{if(lx===null){lx=gantry.x;lz=gantry.z;return;}const dx=gantry.x-lx,dz=gantry.z-lz;lx=gantry.x;lz=gantry.z;C.camera.position.x+=dx;C.camera.position.z+=dz;C.controls.target.x+=dx;C.controls.target.z+=dz;};};
  vmap.review=()=>{setHood(1);const O=m.origin(),live=rev.has&&lanes.some(l=>l.work===rev.b);if(!live){const v=m.views.inside,[p,t]=V(v.p,v.t);C.flyTo(p,t);return;}const x=O.x+rev.wx,z=O.z+rev.wz;C.flyTo([x+60,1030,z+160],[x,902,z]);};
  C.addViews(vmap);
  C.inset('inset',insetCam,prepCam);
  C.inset('insetR',insetCamH,prepCamH,heightMat);
  C.inset('insetD',insetCamD,prepCamD);
  const tg=(t,o,x,y,z)=>C.tag(t,o,x,y,z);
  tg('15 MP top camera + telecentric lens',head,0,1322,0);tg('Moiré 3D projector (×4)',head,158,1140,0);tg('Side-view camera (×4)',head,-106,1110,106);
  tg('Multi-colour LED light dome',head,0,960,118);tg('Linear-motor X beam',beam,-380,1380,0);
  tg('Lane 1 — front',interior,-640,925,170);tg('Lane 2 — rear',interior,-720,925,-170);
  tg('DataMatrix reader',interior,XI-68,1000,LANE_Z[0]-86);tg('Calibration target plate',calG,-250,960,0);
  tg('Pneumatic edge clamp + support pins',interior,0,925,LANE_Z[0]+140);tg('Lift-up hood — click to open',machine,-30,1500,760);tg('Electrical bay — click doors',machine,-30,620,760);
  tg('Operator monitor',machine,-700,1590,840);tg('Signal tower',machine,520,1930,-260);tg('Exhaust fan',machine,-230,1680,-400);
  if($('bHood'))$('bHood').onclick=()=>setHood(!hood.target);
  const pill=(el,t)=>{if(!el)return;el.textContent=t;el.className='pill '+(/NG|ALARM/.test(t)?'ng':/OK/.test(t)?'ok':/CALIB|SETUP/.test(t)?'cl':/—|IDLE|WAIT|EMPTY/.test(t)?'idle':'');};
  const laneTxt=L=>m.boards.some(b=>b.lane===L.lane)?L.state:'EMPTY';
  C.onHud(()=>{
    pill($('hState'),m.state==='DOWN'?'ALARM':st.head);$('phase').textContent=m.state==='DOWN'?m.detail:(st.head==='CALIBRATION'?st.calMsg:fx.label);
    $('fov').textContent=st.fov+' / '+FOVS.length+(st.lane?'  · L'+st.lane.lane:'');$('fovBar').style.width=(st.fov/FOVS.length*100)+'%';
    pill($('l1'),laneTxt(lanes[0]));pill($('l2'),laneTxt(lanes[1]));
    $('serial').textContent=st.serial;$('warp').textContent=st.warp!=null?st.warp.toFixed(2)+' mm':'—';
    $('nIns').textContent=st.ins;$('nOk').textContent=st.pass;$('nNg').textContent=st.ng;
    $('yld').textContent=st.ins?(st.pass/st.ins*100).toFixed(1)+' %':'—';
    $('nFc').textContent=st.ins?(st.fcBoards/st.ins*100).toFixed(1)+' % bd · '+Math.round(st.fc/(st.ins*NCOMP)*1e6)+' ppm':'—';
    $('nEsc').textContent=st.esc+(st.real?'  ('+(st.det/st.real*100).toFixed(1)+' % det.)':'');
    $('ct').textContent=m.ct?m.ct.toFixed(1)+' s':'—';
    $('insL').textContent=fx.power>0||fx.moire>=0?fx.label:'LIVE';$('insR').textContent=fx.moire>=0?'ACQUIRING':'Z 0 – 6 mm';$('rec').style.opacity=fx.power>0?1:.25;
    if($('insDL'))$('insDL').textContent=rev.label;
    const c=m.cts.slice(-10);if(!c.length)SMT.cycle('—','waiting for the first board');else{const avg=c.reduce((a,b)=>a+b,0)/c.length;SMT.cycle(m.ct.toFixed(1)+' s','avg '+avg.toFixed(1)+' s · '+Math.round(3600/avg)+' boards/h · both lanes','CYCLE TIME · LAST BOARD');}
    const logEl=$('log');if(logEl&&logEl._n!==m.log.length+':'+(m.log[0]&&m.log[0].t)){logEl._n=m.log.length+':'+(m.log[0]&&m.log[0].t);logEl.innerHTML='';m.log.slice(0,7).forEach(e=>{const d=document.createElement('div');d.textContent=e.text;if(e.cls)d.className=e.cls;logEl.appendChild(d);});}
  });
}
if(SA)C.expose({aoi:m,aoiSt:st,gantry,aoiLanes:lanes,setHood,summary:kpi});
C.bake(machine);
return m;
});
