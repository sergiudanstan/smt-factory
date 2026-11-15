/* ===================================================================
   MACHINE MODULE — PRINTER: solder paste stencil printer (single lane, lane 1).
   Units mm.  Local origin = machine centre on the floor; X = board flow, Y up, Z toward the operator.
   Footprint 1180 (X) x 1840 (Z) x 1606 (Y).  Conveyor (board bottom) at 900, lane 1 at z = +170.
   SMEMA: board enters at the left opening, waits at the infeed buffer (x = -565), prints in the
   nest (x = 0) and waits at the outfeed (x = +610) until the downstream machine takes it.
   v2: magnetic support plate + pins, snugger cylinders, top clamp foils, X/Y/θ table with 3 servos,
   29" stencil with mesh band, pneumatic frame clamps, closed-loop squeegees with load cells, rolling bead
   (consumption from pad apertures), paste dispenser, 3-pass under-stencil cleaner (paper rolls), dual
   vision camera + 2 insets, 4-region 2D inspection, SPI closed loop (applyOffset / requestClean), full exterior.
   =================================================================== */
'use strict';
SMT3D.register('printer',function(C,opts){
const {THREE,PI,$,std,box,cyl,label,canvasTex,run,tween,FRAME,ease,CONV_Y,BW,BD,BT,KIT,FIDS,FLAT,conveyTo,BGU}=C;
opts=opts||{};
const X=opts.x||0,SA=!!opts.standalone,ID=opts.id||'printer';
const LZ=170,STEN_Y=962,LIFT=STEN_Y-CONV_Y-BT-.05;
const W=lx=>X+lx;                              /* local -> world X */
const HX=590,HZ=920,TOP=1606,BODY_TOP=860,SPLIT=920,WX0=-380,WX1=460;
/* ---- process parameters (published values for the machine class) ---- */
const PRINT_V=60,STROKE=240,PRESS_KG=6.5,PRESS_N=64,BLADE_L=300,SEP_MM=2,SEP_V=2,ALIGN_UM=12.5,FOIL_T=.13;
const CLEAN_EVERY=opts.cleanEvery||5,PASTE_X=opts.pasteDemo||16,PAPER_LEN=opts.paperLen||2400,PAPER_STEP=30,CART_G=600;
const RHO=4.2e-3,BEAD_L=270,R_FULL=7.5,R_LOW=5.2;       /* g/mm3 alloy, bead length, bead radius full / refill threshold */
const PAD_A=KIT.pads.reduce((s,p)=>s+p[2]*p[3],0);      /* aperture area mm2 */
const G_PRINT=PAD_A*FOIL_T/1000*7.4*.85;                /* g of paste actually transferred per print */
const bmass=r=>PI*r*r*BEAD_L*RHO,brad=g=>Math.sqrt(g/(PI*BEAD_L*RHO));
const machine=new THREE.Group();machine.position.x=X;C.parentFor(opts).add(machine);
const shellMats=C.shellMats;
const sm=(c,r=.55,m=.05)=>{const x=std(c,r,m);shellMats.push(x);return x;};
const M={anth:sm(0x2f3237,.62,.15),silver:sm(0xc2c5c9,.45,.25),magenta:sm(0x1e6fd9,.45,.1),dark:std(0x24272b,.6,.2),
  alu:std(0xb9c0c8,.35,.85),aluD:std(0x7d858f,.45,.8),steel:std(0xd5dadf,.22,.95),black:std(0x15171a,.55,.2),bed:std(0x1d2024,.6,.1),
  red:std(0xc8202a,.5,.1),white:std(0xf1f2f3,.7,0),blue:std(0x1e78d6,.4,.1),camBlue:std(0x1b4fb0,.35,.6),glassLens:std(0x0b1020,.05,.9),
  hose:std(0x2b6fd6,.55,0),yel:std(0xf2c400,.5,0),seam:std(0x141618,.7,.2),magnet:std(0x3a3f45,.5,.6),rubber:std(0x1b1d20,.9,0)};
const NOSH={cast:false};
const gauss=()=>{let u=0,v=0;while(!u)u=Math.random();v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*PI*v);};
const tube=(p,pts,r,mat,seg)=>{const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(a=>new THREE.Vector3(...a))),seg||28,r,8);const t=new THREE.Mesh(g,mat);t.castShadow=true;p.add(t);return t;};
const merged=(p,geos,mat,cast)=>{const g=BGU.mergeBufferGeometries(geos,false);geos.forEach(x=>x.dispose());const t=new THREE.Mesh(g,mat);t.castShadow=!!cast;t.receiveShadow=true;p.add(t);return t;};
const plane=(p,tex,w,h,x,y,z,o={})=>{const t=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,roughness:.6,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));t.position.set(x,y,z);if(o.ry)t.rotation.y=o.ry;if(o.rx)t.rotation.x=o.rx;p.add(t);return t;};

/* --- cabinet --- */
box(machine,2*HX,BODY_TOP-130,2*HZ,M.anth,0,(BODY_TOP+130)/2,0,NOSH);
box(machine,2*HX-70,40,2*HZ-70,M.dark,0,112,0,NOSH);
[[-500,-800],[500,-800],[-500,800],[500,800]].forEach(p=>{cyl(machine,58,64,20,M.steel,p[0],10,p[1]);cyl(machine,16,16,110,M.steel,p[0],70,p[1]);cyl(machine,30,30,8,M.black,p[0],128,p[1],{cast:false});});   // levelling feet (screw + foot plate)
[[-300,-640],[300,-640],[-300,640],[300,640]].forEach(p=>{box(machine,76,6,58,M.aluD,p[0],90,p[1],NOSH);box(machine,6,38,40,M.aluD,p[0]-30,66,p[1],NOSH);box(machine,6,38,40,M.aluD,p[0]+30,66,p[1],NOSH);cyl(machine,30,30,22,M.rubber,p[0],40,p[1],{rx:PI/2,seg:20});cyl(machine,9,9,70,M.steel,p[0],40,p[1],{rx:PI/2,seg:10});});  // retracted casters
box(machine,WX1-WX0,SPLIT-146,10,M.silver,(WX0+WX1)/2,(SPLIT+134)/2,HZ+3,NOSH);          // lower front panel
box(machine,45,TOP-130,12,M.magenta,WX0-22.5,(TOP+130)/2,HZ+3,NOSH);                    // accent stripe
box(machine,HX+WX0-45,TOP-BODY_TOP,20,M.anth,(-HX+WX0-45)/2,(TOP+BODY_TOP)/2,HZ-10,NOSH); // left front column
box(machine,HX-WX1,TOP-BODY_TOP,20,M.anth,(HX+WX1)/2,(TOP+BODY_TOP)/2,HZ-10,NOSH);       // right front column
box(machine,2*HX,TOP-BODY_TOP,20,M.anth,0,(TOP+BODY_TOP)/2,-HZ+10,NOSH);                 // rear wall
box(machine,2*HX,20,300+HZ,M.anth,0,TOP-10,(300-HZ)/2,NOSH);                             // roof (rear part)
box(machine,HX+WX0,20,HZ-300,M.anth,(-HX+WX0)/2,TOP-10,(HZ+300)/2,NOSH);
box(machine,HX-WX1,20,HZ-300,M.anth,(HX+WX1)/2,TOP-10,(HZ+300)/2,NOSH);
cyl(machine,9,9,5,M.black,WX0+50,560,HZ+9,{rx:PI/2,cast:false});
(function(){ // side walls with transport openings
  const sh=new THREE.Shape();sh.moveTo(-HZ,BODY_TOP);sh.lineTo(HZ,BODY_TOP);sh.lineTo(HZ,TOP);sh.lineTo(-HZ,TOP);sh.closePath();
  const ho=new THREE.Path();ho.moveTo(LZ-150,872);ho.lineTo(LZ+150,872);ho.lineTo(LZ+150,968);ho.lineTo(LZ-150,968);ho.closePath();sh.holes.push(ho);
  const g=new THREE.ExtrudeGeometry(sh,{depth:20,bevelEnabled:false});
  [-HX+20,HX].forEach(x=>{const m=new THREE.Mesh(g,M.anth);m.rotation.y=-PI/2;m.position.x=x;machine.add(m);});
  [-1,1].forEach(s=>{box(machine,26,8,316,M.silver,s*(HX+3),971,LZ,NOSH);box(machine,26,8,316,M.silver,s*(HX+3),869,LZ,NOSH);box(machine,26,106,8,M.silver,s*(HX+3),920,LZ+154,NOSH);box(machine,26,106,8,M.silver,s*(HX+3),920,LZ-154,NOSH);
    box(machine,3,3,2*HZ-40,M.dark,s*(HX+.5),SPLIT,0,NOSH);box(machine,4,560,900,M.anth,s*(HX+1),520,-350,NOSH);
    /* louvred side panel: dark recess + tilted slats */
    box(machine,1.5,470,740,M.seam,s*(HX+3.2),520,-350,NOSH);
    for(let i=0;i<14;i++)box(machine,5,16,720,M.anth,s*(HX+6),310+i*33.5,-350,{cast:false,rz:s*.62});
    /* SMEMA round connector (receptacle with plug seat) + label */
    cyl(machine,22,22,10,M.steel,s*(HX+9),1010,LZ+190,{rz:PI/2,seg:24,cast:false});cyl(machine,17,17,14,M.black,s*(HX+14),1010,LZ+190,{rz:PI/2,seg:24,cast:false});
    for(let k=0;k<8;k++){const a=k/8*2*PI;cyl(machine,1.6,1.6,4,M.yel,s*(HX+21.5),1010+Math.sin(a)*10,LZ+190+Math.cos(a)*10,{rz:PI/2,seg:6,cast:false});}
    C.plate(machine,['SMEMA '+(s<0?'IN':'OUT')],70,18,s*(HX+.9),1042,LZ+190,{bg:'#f4f4f0',pw:256,ry:s*PI/2});
    /* cable gland + cable (right side only) */
  });
  const wt=canvasTex(128,128,(g2)=>{g2.clearRect(0,0,128,128);g2.fillStyle='#f2c400';g2.beginPath();g2.moveTo(64,10);g2.lineTo(120,112);g2.lineTo(8,112);g2.closePath();g2.fill();g2.strokeStyle='#111';g2.lineWidth=7;g2.stroke();g2.fillStyle='#111';g2.fillRect(59,44,10,36);g2.fillRect(59,88,10,10);});
  const w=new THREE.Mesh(new THREE.PlaneGeometry(70,70),new THREE.MeshBasicMaterial({map:wt,transparent:true}));w.position.set(-HX-.8,1010,LZ-230);w.rotation.y=-PI/2;machine.add(w);
  C.plate(machine,['PINCH POINT'],120,36,HX+.9,1010,LZ-230,{bg:'#f2c400',border:'#111',pw:512,ry:PI/2});
})();
// lettering + logo + door seams / hinges / handles (front)
(function(){
  const t=label(machine,'PRINTER',330,50,(-HX+WX0-45)/2,1335,HZ+.8,{fg:'#e9eaec',pw:660,weight:'700',size:.74});t.rotation.z=PI/2;
  const lt=canvasTex(900,300,(g,W,H)=>{g.clearRect(0,0,W,H);g.fillStyle='#17181a';g.font='900 170px "Arial Black",Arial,sans-serif';g.textBaseline='middle';g.textAlign='center';g.fillText('PRINTER',W/2,125);g.fillStyle='#1e6fd9';g.fillRect(W/2-300,212,600,8);g.fillStyle='#55585c';g.font='600 40px Arial';g.fillText('SOLDER PASTE STENCIL PRINTING',W/2,262);});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(330,110),new THREE.MeshStandardMaterial({map:lt,transparent:true,roughness:.5}));m.position.set(250,815,HZ+9.6);machine.add(m);
  const x=(HX+WX1)/2;
  cyl(machine,34,34,6,M.yel,x,1520,HZ+3,{rx:PI/2,cast:false});cyl(machine,24,19,28,M.red,x,1520,HZ+18,{rx:PI/2,cast:false});
  cyl(machine,13,13,10,M.red,(-HX+WX0-45)/2,1120,HZ+4,{rx:PI/2,cast:false});
  const ol=(x0,x1,y0,y1,z)=>{box(machine,x1-x0,1.6,1.4,M.seam,(x0+x1)/2,y0,z,NOSH);box(machine,x1-x0,1.6,1.4,M.seam,(x0+x1)/2,y1,z,NOSH);box(machine,1.6,y1-y0,1.4,M.seam,x0,(y0+y1)/2,z,NOSH);box(machine,1.6,y1-y0,1.4,M.seam,x1,(y0+y1)/2,z,NOSH);};
  ol(WX0+6,38,150,905,HZ+8.7);ol(42,WX1-6,150,905,HZ+8.7);
  [WX0+4,WX1-4].forEach(hx=>[260,520,780].forEach(y=>{cyl(machine,5,5,70,M.steel,hx,y,HZ+10,{seg:10});box(machine,10,70,3,M.steel,hx+(hx<0?3:-3),y,HZ+9,NOSH);}));
  [18,62].forEach(hx=>{box(machine,12,170,12,M.steel,hx,520,HZ+17,NOSH);box(machine,10,10,12,M.steel,hx,450,HZ+11,NOSH);box(machine,10,10,12,M.steel,hx,590,HZ+11,NOSH);});
  C.plate(machine,['STENCIL PRINTER','Model SP-1180','400 V 3~ 50 Hz · 6 bar','S/N 2026-0417'],240,96,-250,230,HZ+9.2,{bg:'#e7e8ea',border:'#444',align:'left',pw:640});
  C.plate(machine,['CAUTION','Moving parts','inside'],140,70,-130,840,HZ+9.2,{bg:'#f2c400',border:'#111',pw:384});
  // rear: doors, hinges, handle, rotary main switch, E-stop, high-voltage sticker
  ol(-540,-20,150,840,-HZ-.7);ol(20,540,150,840,-HZ-.7);
  [-540,540].forEach(hx=>[260,500,740].forEach(y=>cyl(machine,5,5,70,M.steel,hx,y,-HZ-2,{seg:10})));
  box(machine,12,170,12,M.steel,-48,500,-HZ-9,NOSH);box(machine,10,10,10,M.steel,-48,430,-HZ-4,NOSH);box(machine,10,10,10,M.steel,-48,570,-HZ-4,NOSH);
  C.plate(machine,['SERVICE'],130,34,-290,790,-HZ-1,{bg:'#e7e8ea',pw:256,ry:PI});
  box(machine,96,96,4,M.yel,330,520,-HZ-2,NOSH);cyl(machine,30,30,16,M.dark,330,520,-HZ-10,{rx:PI/2,seg:24,cast:false});box(machine,84,24,16,M.red,330,520,-HZ-22,NOSH);
  C.plate(machine,['MAIN SWITCH','0 - OFF   I - ON'],120,40,330,448,-HZ-1,{bg:'#f4f4f0',pw:384,ry:PI});
  C.plate(machine,['WARNING','HIGH VOLTAGE','400 V AC'],190,110,330,700,-HZ-1,{bg:'#f2c400',border:'#111',pw:512,ry:PI});
  cyl(machine,34,34,6,M.yel,-480,1050,-HZ-3,{rx:PI/2,cast:false});cyl(machine,24,19,28,M.red,-480,1050,-HZ-18,{rx:PI/2,cast:false});
  C.plate(machine,['E-STOP'],70,20,-480,1100,-HZ-1,{bg:'#f4f4f0',pw:256,ry:PI});
  // cable glands + cables on the right wall, FRL air-service unit with blue hose
  [-520,-470,-420].forEach((z,i)=>{cyl(machine,12,12,18,M.black,HX+9,1180-i*0,z,{rz:PI/2,seg:12,cast:false});cyl(machine,15,15,6,M.steel,HX+3,1180,z,{rz:PI/2,seg:6,cast:false});});
  [-520,-470,-420].forEach((z,i)=>tube(machine,[[HX+16,1180,z],[HX+70,1180,z],[HX+95,1000,z+i*14],[HX+110,500,z+i*20],[HX+120,60,z+i*30+30],[HX+150,6,z+i*30+160]],5.5,M.black,24));
  const f=new THREE.Group();f.position.set(HX,1300,-230);machine.add(f);
  box(f,10,150,230,M.aluD,5,0,0);                                                     // bracket
  box(f,48,66,70,M.alu,34,0,-70,NOSH);box(f,48,66,70,M.alu,34,0,10,NOSH);box(f,48,66,70,M.alu,34,0,90,NOSH);
  cyl(f,28,28,74,std(0xc9d3dc,.2,0,{transparent:true,opacity:.45}),34,-70,-70,{cast:false});cyl(f,5,5,12,M.steel,34,-112,-70,{cast:false});   // filter bowl + drain
  cyl(f,22,22,40,M.black,34,52,10);cyl(f,15,15,24,M.black,34,84,10,{seg:10});                // regulator bonnet + knob
  const gt=canvasTex(128,128,(g)=>{g.fillStyle='#f6f6f4';g.beginPath();g.arc(64,64,62,0,7);g.fill();g.strokeStyle='#222';g.lineWidth=3;for(let a=-2.3;a<=2.3;a+=.38){g.beginPath();g.moveTo(64+Math.sin(a)*46,64-Math.cos(a)*46);g.lineTo(64+Math.sin(a)*56,64-Math.cos(a)*56);g.stroke();}g.strokeStyle='#c22';g.lineWidth=4;g.beginPath();g.moveTo(64,64);g.lineTo(88,36);g.stroke();g.fillStyle='#1e78d6';g.font='700 17px Arial';g.textAlign='center';g.fillText('bar',64,100);g.fillText('6',64,34);});
  cyl(f,26,26,10,M.dark,34,0,90,{rz:PI/2,cast:false});plane(f,gt,44,44,40.5,0,90,{ry:PI/2});    // gauge
  C.plate(f,['FILTER · REGULATOR','6 bar'],120,28,59,-40,10,{bg:'#e7e8ea',pw:384,ry:PI/2});
  tube(f,[[34,0,125],[34,0,170],[70,-30,230],[100,-300,300],[110,-900,380],[110,-1290,420],[110,-1294,600]],8,M.hose,40);   // air hose to the facility
  cyl(f,10,10,20,M.steel,34,0,118,{rx:PI/2,seg:10});
})();

/* --- hood (front window + top cover), hinged at the top, lifts up --- */
const hoodPivot=new THREE.Group();hoodPivot.position.set(0,TOP,300);machine.add(hoodPivot);
const glassMat=new THREE.MeshStandardMaterial({color:0x9db4c8,roughness:.05,metalness:.2,transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide});
(function(){
  const off=new THREE.Group();off.position.set(0,-TOP,-300);hoodPivot.add(off);
  const cx=(WX0+WX1)/2,w=WX1-WX0;
  box(off,w,18,HZ-300,M.silver,cx,TOP-9,(HZ+300)/2,NOSH);
  const fs=new THREE.Shape();fs.moveTo(WX0,SPLIT);fs.lineTo(WX1,SPLIT);fs.lineTo(WX1,TOP);fs.lineTo(WX0,TOP);fs.closePath();
  const ho=new THREE.Path();ho.moveTo(WX0+38,SPLIT+50);ho.lineTo(WX1-38,SPLIT+50);ho.lineTo(WX1-38,TOP-48);ho.lineTo(WX0+38,TOP-48);ho.closePath();fs.holes.push(ho);
  const ff=new THREE.Mesh(new THREE.ExtrudeGeometry(fs,{depth:14,bevelEnabled:false}),M.silver);ff.position.z=HZ-14;off.add(ff);
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(w-76,TOP-SPLIT-98),glassMat);gl.position.set(cx,(TOP+SPLIT)/2+1,HZ-7);gl.renderOrder=5;off.add(gl);
  box(off,420,14,14,M.steel,cx,SPLIT+24,HZ+16,NOSH);box(off,14,14,22,M.steel,cx-200,SPLIT+24,HZ+6,NOSH);box(off,14,14,22,M.steel,cx+200,SPLIT+24,HZ+6,NOSH);
  [WX0+60,WX1-60].forEach(x=>{cyl(off,7,7,60,M.steel,x,TOP-4,300,{rz:PI/2,seg:10});});          // hinge barrels
})();
const hood={open:0,target:0};

/* --- signal tower --- */
const tower={};
(function(){
  const g=new THREE.Group();g.position.set(WX0-22,TOP,HZ-50);machine.add(g);
  cyl(g,7,7,230,M.steel,0,115,0);
  [['r',0xff2a2a,292],['y',0xffa800,261],['g',0x22e06a,230]].forEach(a=>{const mt=new THREE.MeshStandardMaterial({color:a[1],emissive:a[1],emissiveIntensity:.05,roughness:.3,transparent:true,opacity:.92});tower[a[0]]=mt;cyl(g,16,16,29,mt,0,a[2]+15,0);});
  cyl(g,17,17,6,M.dark,0,326,0);
})();

/* --- operator touch screen on the right-hand arm, keyboard tray + mouse below --- */
let monTex,monCtx,monGrp;
(function(){
  const g=new THREE.Group();g.position.set((HX+WX1)/2,0,HZ);machine.add(g);
  box(g,50,50,200,M.dark,30,1340,90);box(g,300,36,36,M.dark,180,1340,180);
  box(g,36,300,36,M.dark,320,1190,180);box(g,36,14,160,M.dark,320,1052,255,NOSH);          // post + tray arm
  box(g,470,14,230,M.black,355,1040,330);
  const kt=canvasTex(512,200,(c,Wd,Hd)=>{c.fillStyle='#17181b';c.fillRect(0,0,Wd,Hd);for(let r=0;r<5;r++)for(let k=0;k<(r==4?9:15);k++){c.fillStyle='#2b2e33';const kw=r==4&&k==4?250:30;if(r==4&&k>4)continue;c.fillRect(8+k*33+(r==4&&k>4?220:0),10+r*36,kw,29);}c.fillStyle='#2b2e33';c.fillRect(8+5*33+220-33+8,10+4*36,0,0);});
  box(g,360,10,140,M.black,330,1052,320);plane(g,kt,350,132,330,1057.5,320,{rx:-PI/2});
  box(g,44,20,70,M.dark,560,1054,330);box(g,2,2,60,M.black,560,1066,330,NOSH);cyl(g,2,2,200,M.black,560,1060,430,{rx:PI/2,seg:6,cast:false});   // mouse + wire
  const m=new THREE.Group();m.position.set(360,1350,230);m.rotation.y=-.3;g.add(m);monGrp=m;
  box(m,560,350,30,M.black,0,0,0);
  const c=document.createElement('canvas');c.width=800;c.height=484;monCtx=c.getContext('2d');
  monTex=new THREE.CanvasTexture(c);monTex.encoding=THREE.sRGBEncoding;monTex.anisotropy=8;
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(525,318),new THREE.MeshBasicMaterial({map:monTex,toneMapped:false}));scr.position.set(0,0,16);m.add(scr);
})();

/* --- interior --- */
const interior=new THREE.Group();machine.add(interior);
box(interior,2*HX-44,12,2*HZ-44,M.bed,0,856,0);
const inLight=new THREE.PointLight(0xe6eeff,.9,2000,1);inLight.position.set(0,1480,-300);interior.add(inLight);
const ledMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xd8e6ff,emissiveIntensity:.9});
box(interior,900,10,30,ledMat,0,1560,-880,NOSH);                                       // interior LED strips (rear + both sides)
[-1,1].forEach(s=>box(interior,14,10,1500,ledMat,s*(HX-45),1578,0,NOSH));
box(interior,900,10,30,ledMat,0,1578,420,NOSH);

/* transport: infeed, lifting print nest, outfeed */
const beltTex=canvasTex(64,16,(g)=>{g.fillStyle='#1c1e21';g.fillRect(0,0,64,16);g.fillStyle='#2c3035';for(let x=0;x<64;x+=16)g.fillRect(x,0,6,16);},{repeat:true});
beltTex.repeat.set(40,1);
const beltMat=std(0xffffff,.9,0,{map:beltTex});
function railSeg(parent,x0,x1){const len=x1-x0,cx=(x0+x1)/2;[-1,1].forEach(s=>{const rz=LZ+s*(BD/2+7);
  box(parent,len,46,12,M.alu,cx,CONV_Y-17,rz);box(parent,len,6,5,M.aluD,cx,CONV_Y+9,rz-s*3.5,NOSH);box(parent,len,3,6,beltMat,cx,CONV_Y-1.5,LZ+s*(BD/2-2.5),NOSH);});}
railSeg(interior,-840,-180);railSeg(interior,180,840);
[-520,-300,300,520].forEach(x=>cyl(interior,6,6,BD+30,M.steel,x,CONV_Y-30,LZ,{rx:PI/2,seg:10}));
[-1,1].forEach(s=>box(interior,60,34,16,M.black,s*800,CONV_Y-17,LZ+BD/2+21,NOSH));
/* conveyor width adjustment: lead screws under the front rail (nut block), handwheel at the front end, servo at the rear end */
(function(){
  const tx=canvasTex(64,16,(g)=>{g.fillStyle='#8d949b';g.fillRect(0,0,64,16);g.fillStyle='#4a4f55';for(let i=0;i<64;i+=8)g.fillRect(i,0,3,16);},{repeat:true});tx.repeat.set(30,1);
  const tm=std(0xffffff,.4,.8,{map:tx});
  [-700,700].forEach(x=>{
    const ls=cyl(interior,6,6,330,tm,x,868,LZ+30,{rx:PI/2,seg:12,cast:false});
    box(interior,34,26,30,M.aluD,x,876,LZ+BD/2+7);                                         // nut block on the front rail
    box(interior,22,18,34,M.dark,x,868,LZ-142);box(interior,22,18,34,M.dark,x,868,LZ+200);   // bearing blocks
    cyl(interior,38,38,6,M.black,x,868,LZ+222,{rx:PI/2,seg:24});cyl(interior,32,32,6,M.dark,x,868,LZ+222,{rx:PI/2,seg:24});     // handwheel
    for(let k=0;k<4;k++){const a=k*PI/2;box(interior,70,5,5,M.dark,x,868,LZ+225,{rz:0,ry:0,rx:0}).rotation.z=a;}
    cyl(interior,6,6,22,M.steel,x+30,868,LZ+232,{rx:PI/2,seg:8});                              // handle
    cyl(interior,22,22,64,M.black,x,868,LZ-182,{rx:PI/2,seg:16});cyl(interior,8,8,8,M.steel,x,868,LZ-150,{rx:PI/2,seg:10});    // servo motor + coupling
  });
  label(interior,'WIDTH',50,12,-700,890,LZ+190,{fg:'#222',bg:'#e7e8ea',pw:200});
})();
const nest=new THREE.Group();interior.add(nest);
const snugRods=[],foils=[],motors=[];
(function(){
  railSeg(nest,-172,172);
  /* magnetic support plate with a grid of support pins (rise with the table) */
  box(nest,270,13,130,M.aluD,0,878.5,LZ);
  const pg=[],dg=[];
  for(let ix=-4;ix<=4;ix++)for(let iz=-2;iz<=2;iz++){const p=new THREE.CylinderGeometry(2.6,2.6,14,8);p.translate(ix*26,892,LZ+iz*24);pg.push(p);const q=new THREE.CylinderGeometry(6.5,6.5,3,12);q.translate(ix*26,886.5,LZ+iz*24);dg.push(q);const h=new THREE.CylinderGeometry(3.4,3.4,1.2,10);h.translate(ix*26,898.8,LZ+iz*24);pg.push(h);}
  merged(nest,pg,M.steel,false);merged(nest,dg,M.magnet,false);
  /* X / Y / theta stage + Z lift column */
  box(nest,190,12,150,M.dark,0,866,LZ);box(nest,212,10,160,M.alu,0,855,LZ);box(nest,232,10,170,M.aluD,0,845,LZ);box(nest,170,28,110,M.alu,0,826,LZ);box(nest,110,60,70,M.dark,0,794,LZ);
  [-1,1].forEach(s=>{box(nest,10,8,150,M.steel,s*111,855,LZ,NOSH);box(nest,10,8,160,M.steel,s*121,845,LZ,NOSH);});     // linear guides
  /* three servo motors: 2 x Y (front, side by side), 1 x X (left); shaft marker discs rotate during the correction */
  [[-70,0,'Y1'],[70,0,'Y2'],[-155,1,'X']].forEach(([mx,ax,nm])=>{
    const g=new THREE.Group();nest.add(g);
    if(!ax){g.position.set(mx,836,LZ+86);cyl(g,20,20,66,M.black,0,0,30,{rx:PI/2,seg:20});cyl(g,22,22,8,M.blue,0,0,62,{rx:PI/2,seg:20,cast:false});cyl(g,17,17,22,M.dark,0,0,-12,{rx:PI/2,seg:16});}
    else{g.position.set(mx,846,LZ);cyl(g,18,18,60,M.black,-30,0,0,{rz:PI/2,seg:20});cyl(g,20,20,8,M.blue,-60,0,0,{rz:PI/2,seg:20,cast:false});cyl(g,15,15,20,M.dark,12,0,0,{rz:PI/2,seg:16});}
    const sh=new THREE.Group();sh.position.set(ax?-68:0,0,ax?0:70);g.add(sh);
    cyl(sh,12,12,3,M.steel,0,0,0,{rx:ax?0:PI/2,rz:ax?PI/2:0,seg:20,cast:false});
    const mk=box(sh,3,2.4,2.4,M.red,0,0,0,NOSH);if(ax)mk.position.set(-1.8,0,10);else{mk.scale.set(.8,1,1.3);mk.position.set(0,10,1.8);}
    motors.push({sh,ax});
  });
  /* snugger cylinders (side clamp) on the outer faces of both rails + rods */
  [-1,1].forEach(s=>[-95,95].forEach(x=>{
    cyl(nest,10,10,44,M.alu,x,CONV_Y-17,LZ+s*(BD/2+7+6+22),{rx:PI/2,seg:14});cyl(nest,12,12,6,M.dark,x,CONV_Y-17,LZ+s*(BD/2+7+6+44),{rx:PI/2,seg:14,cast:false});
    const r=cyl(nest,3,3,20,M.steel,x,CONV_Y-17,0,{rx:PI/2,seg:8});r.userData={s,x};snugRods.push(r);}));
  /* over-the-top clamp foils (3 mm overhang over the board edge) + their holders, retract before the stroke */
  [-1,1].forEach(s=>{const f=new THREE.Group();f.userData.s=s;nest.add(f);box(f,344,.5,10,M.steel,0,CONV_Y+BT+.3,0,NOSH);box(f,344,5,6,M.aluD,0,CONV_Y+BT+4,s*8,NOSH);foils.push(f);});
  [[-150,-70],[150,-70],[-150,70],[150,70]].forEach(p=>{cyl(interior,9,9,60,M.steel,p[0],892,LZ+p[1],{seg:14});box(nest,30,14,30,M.aluD,p[0],871,LZ+p[1]);});
})();
const stopPin=cyl(interior,5,5,16,M.steel,BW/2+7,CONV_Y-12,LZ,{seg:12});

/* stencil holder + frame (foil is built after the board artwork exists) */
const stencil=new THREE.Group();stencil.position.set(0,STEN_Y,LZ);interior.add(stencil);
(function(){
  [-1,1].forEach(s=>{
    box(interior,30,40,900,M.alu,s*397,STEN_Y+10,LZ);box(interior,26,6,900,M.aluD,s*378,STEN_Y-3,LZ,NOSH);
    [-310,650].forEach(z=>box(interior,34,STEN_Y-10-862,34,M.aluD,s*397,(STEN_Y-10+862)/2,z));
    /* pneumatic stencil-frame clamps: block on the rail, air cylinder, jaw pressing on the frame top, blue air line */
    [-140,170,480].forEach(z=>{box(interior,40,20,44,M.black,s*397,STEN_Y+40,z,NOSH);cyl(interior,11,11,46,M.blue,s*397,STEN_Y+73,z,{seg:14});cyl(interior,13,13,6,M.alu,s*397,STEN_Y+98,z,{seg:14,cast:false});
      box(interior,52,7,22,M.steel,s*373,STEN_Y+34.5,z,NOSH);box(interior,60,14,20,M.aluD,s*424,STEN_Y-22,z,NOSH);});
    box(interior,3,3,640,M.hose,s*397,STEN_Y+104,LZ+170,NOSH);
    box(interior,24,20,900,M.steel,s*450,934,LZ);                     // shared linear rails (camera gantry + cleaner)
  });
  /* 29" (736 mm) cast aluminium frame, corner castings, stencil ID label with barcode */
  const F=736,P=38;
  box(stencil,F,30,P,M.alu,0,15,F/2-P/2);box(stencil,F,30,P,M.alu,0,15,-F/2+P/2);
  box(stencil,P,30,F-2*P,M.alu,F/2-P/2,15,0);box(stencil,P,30,F-2*P,M.alu,-F/2+P/2,15,0);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(a=>box(stencil,P+6,34,P+6,M.aluD,a[0]*(F/2-P/2),15,a[1]*(F/2-P/2)));
  [F/2-P/2,-F/2+P/2].forEach(z=>box(stencil,F-2*P-80,1,5,M.dark,0,30.2,z,NOSH));
  const bt=canvasTex(512,128,(g,Wd,Hd)=>{g.fillStyle='#f4f4f0';g.fillRect(0,0,Wd,Hd);g.fillStyle='#111';let s=11;const r=()=>(s=s*16807%2147483647)/2147483647;let x=14;while(x<Wd*.58){const w=2+Math.floor(r()*4);g.fillRect(x,12,w,Hd*.7);x+=w+2+Math.floor(r()*4);}
    g.font='700 30px Consolas,monospace';g.textAlign='left';g.fillText('ST-0472-A',Wd*.62,44);g.font='500 17px Arial';g.fillText('SMT DEMO REV C',Wd*.62,70);g.fillText('0.130 mm  29"',Wd*.62,94);g.font='500 18px Consolas,monospace';g.fillText('*ST0472A*',16,Hd-10);});
  plane(stencil,bt,150,34,-190,15,F/2+.4);plane(stencil,bt,130,32,200,30.3,F/2-P/2,{rx:-PI/2});
})();

/* squeegee gantry + closed-loop print head */
const sq={z:245,fy:1,ry:1};
const sqBeam=new THREE.Group();interior.add(sqBeam);
const blades=[];let pasteRoll,pasteMesh,beadTex,beadGeo;
(function(){
  [-1,1].forEach(s=>{box(interior,50,50,1150,M.alu,s*505,1167,LZ);box(interior,14,8,1110,M.steel,s*505,1196,LZ,NOSH);
    [-380,720].forEach(z=>box(interior,50,1142-862,50,M.aluD,s*505,(1142+862)/2,z));});
  box(sqBeam,1060,80,110,M.alu,0,1232,0);box(sqBeam,80,30,150,M.aluD,-505,1205,0);box(sqBeam,80,30,150,M.aluD,505,1205,0);
  box(sqBeam,900,24,50,M.black,0,1284,-20,NOSH);
  box(sqBeam,390,100,200,std(0x9aa1a9,.4,.7),0,STEN_Y+180,0);
  label(sqBeam,'CLOSED LOOP',170,26,0,STEN_Y+180,100.8,{fg:'#1a1c1f',pw:420,size:.6});label(sqBeam,'CLOSED LOOP',170,26,0,STEN_Y+180,-100.8,{fg:'#1a1c1f',pw:420,size:.6,ry:PI});
  box(sqBeam,60,60,60,M.black,150,STEN_Y+260,0);cyl(sqBeam,20,20,70,M.black,150,STEN_Y+262,-60,{rx:PI/2});
  [1,-1].forEach(s=>{ // s=+1 front blade (prints toward the rear), s=-1 rear blade
    /* print-head Z motor housing (ribbed) on the outer side of the head */
    box(sqBeam,150,76,48,M.dark,-90,STEN_Y+185,s*124);box(sqBeam,60,60,22,M.camBlue,-90,STEN_Y+185,s*(124+35),NOSH);
    for(let i=0;i<7;i++)box(sqBeam,150,3,54,M.aluD,-90,STEN_Y+155+i*10,s*124,NOSH);
    label(sqBeam,'Z MOTOR',56,14,-90,STEN_Y+185,s*(124+46.5),{fg:'#fff',pw:200,ry:s<0?PI:0});
    tube(sqBeam,[[-90,STEN_Y+222,s*124],[-60,STEN_Y+270,s*124],[-10,STEN_Y+285,s*60],[40,STEN_Y+285,0]],4,M.cable||M.black,16);
    const g=new THREE.Group();g.position.z=s*45;sqBeam.add(g);
    box(g,360,16,30,M.aluD,0,STEN_Y+150,0);
    const mv=new THREE.Group();g.add(mv);
    cyl(mv,8,8,120,M.steel,-100,STEN_Y+95,0,{seg:12});cyl(mv,8,8,120,M.steel,100,STEN_Y+95,0,{seg:12});
    box(mv,310,24,22,M.aluD,0,STEN_Y+46,-s*19);
    /* load cells (closed loop) between rods and holder */
    [-1,1].forEach(k=>{const lc=box(mv,64,20,22,M.steel,k*50,STEN_Y+68,-s*19);box(mv,26,3,16,M.yel,k*50,STEN_Y+78.5,-s*19,NOSH);});
    label(mv,'LOAD CELL',60,11,0,STEN_Y+79,-s*19,{fg:'#1a1c1f',bg:'#e7e8ea',pw:256,rx:-PI/2});
    /* quick-release knobs at the holder ends */
    [-1,1].forEach(k=>{cyl(mv,12,12,20,M.black,k*172,STEN_Y+46,-s*19,{rz:PI/2,seg:12});cyl(mv,5,5,26,M.steel,k*160,STEN_Y+46,-s*19,{rz:PI/2,seg:8});});
    const r=new THREE.Group();r.position.y=STEN_Y+.3;r.rotation.x=-s*.52;mv.add(r);
    box(r,300,42,1.4,M.steel,0,21,0);box(r,306,14,5,M.aluD,0,38,-s*3.2);
    blades.push({mv,s});
  });
  /* paste bead: rolling cylinder with a streaked texture (rotates, radius follows the real paste mass) */
  beadTex=canvasTex(256,64,(g,Wd,Hd)=>{g.fillStyle='#8d9095';g.fillRect(0,0,Wd,Hd);for(let i=0;i<260;i++){const v=Math.random();g.fillStyle='rgba('+(v<.5?'255,255,255':'40,44,50')+','+(.04+Math.random()*.16)+')';g.fillRect(Math.random()*Wd,0,1+Math.random()*7,Hd);}g.fillStyle='rgba(30,34,40,.55)';[20,95,171,222].forEach(x=>g.fillRect(x,0,9,Hd));},{repeat:true});
  beadGeo=new THREE.CylinderGeometry(1,1,BEAD_L,28);beadGeo.rotateZ(PI/2);
  pasteMesh=new THREE.Mesh(beadGeo,std(0xffffff,.8,.25,{map:beadTex}));pasteMesh.castShadow=true;
  pasteRoll=new THREE.Group();pasteRoll.add(pasteMesh);interior.add(pasteRoll);
})();

/* paste dispenser: own Z-travel beam on two rails, carriage with a 600 g cartridge (level visible), nozzle Z axis */
const disp={z:600,x:-420,low:0,on:0,line:0},dispBeam=new THREE.Group(),dispCar=new THREE.Group(),dispCart=new THREE.Group();let cartLevel,dispLine,cartMat;
(function(){
  interior.add(dispBeam);dispBeam.add(dispCar);dispCar.add(dispCart);
  [-1,1].forEach(s=>{box(interior,24,24,1000,M.aluD,s*455,1100,220);[-310,740].forEach(z=>box(interior,26,1100-862,26,M.aluD,s*455,(1100+862)/2,z));box(dispBeam,50,40,70,M.alu,s*455,1130,-35);});
  box(dispBeam,910,30,40,M.alu,0,1130,-70);box(dispBeam,860,10,6,M.steel,0,1150,-70,NOSH);
  box(dispCar,90,60,40,M.dark,0,1130,-70);box(dispCar,60,50,70,M.aluD,0,1130,-35);
  cyl(dispCar,29,29,34,M.alu,0,1130,0,{seg:20});
  cartMat=std(0xdfe8f0,.15,0,{transparent:true,opacity:.28,depthWrite:false});
  const body=new THREE.Mesh(new THREE.CylinderGeometry(25,25,180,24),cartMat);body.position.y=1093;body.renderOrder=3;dispCart.add(body);
  cartLevel=new THREE.Mesh(new THREE.CylinderGeometry(22.5,22.5,180,24),std(0x8d9095,.7,.35));dispCart.add(cartLevel);
  cyl(dispCart,22,22,20,M.dark,0,1193,0,{seg:20});cyl(dispCart,25,25,6,M.alu,0,1004,0,{seg:20});cyl(dispCart,7,1.2,28,M.steel,0,989,0,{seg:12});
  label(dispCart,'SOLDER PASTE 600 g',120,20,0,1093,25.2,{fg:'#1a1c1f',bg:'#eeeeea',pw:600,ph:100,rz:PI/2,size:.55});
  tube(dispCart,[[0,1203,0],[0,1240,-20],[0,1250,-60],[30,1250,-70]],3.5,M.hose,16);
  dispLine=new THREE.Mesh(beadGeo,std(0xffffff,.8,.25,{map:beadTex}));dispLine.visible=false;interior.add(dispLine);
})();

/* vision alignment camera gantry (travels between stencil and board): dual up/down optics with ring lights */
const cam={x:-300,zb:-110};
const camBeam=new THREE.Group(),camHead=new THREE.Group();interior.add(camBeam);camBeam.add(camHead);
const camLeds=[];let camLight;
(function(){
  box(camBeam,880,24,46,M.alu,0,934,0);box(camBeam,40,26,70,M.aluD,-450,934,0);box(camBeam,40,26,70,M.aluD,450,934,0);
  box(camBeam,820,18,14,M.black,0,934,-30,NOSH);box(camBeam,820,5,12,M.aluD,0,945,-30,NOSH);                     // cable chain + guide
  box(camHead,74,32,64,M.camBlue,0,934,54);label(camHead,'VISION',40,14,0,934,86.6,{fg:'#fff',pw:200});box(camHead,90,22,20,M.aluD,0,934,20);
  [-1,1].forEach(k=>{for(let i=0;i<5;i++)box(camHead,3,22,40,M.alu,k*38,934,54+(i-2)*0,NOSH).position.set(k*(38+(i%2)*3),934,54+(i-2)*0);});
  [1,-1].forEach(s=>{cyl(camHead,11,11,3,M.glassLens,0,934+s*17,54,{seg:16,cast:false});cyl(camHead,13,13,6,M.black,0,934+s*13,54,{seg:16,cast:false});
    const mt=new THREE.MeshStandardMaterial({color:0x331010,emissive:0xff3020,emissiveIntensity:0,roughness:.4});
    const t=new THREE.Mesh(new THREE.TorusGeometry(17,2.5,6,24),mt);t.rotation.x=PI/2;t.position.set(0,934+s*16.5,54);camHead.add(t);camLeds.push(mt);});
  camLight=new THREE.PointLight(0xff4030,0,160,1.2);camLight.position.set(0,934,54);camHead.add(camLight);
})();

/* stencil underside cleaner: 3 passes (wet -> dry -> vacuum), paper supply/take-up rolls with live radii */
const cleaner=new THREE.Group();interior.add(cleaner);
const USC={RC:12,T:.2};USC.full=Math.sqrt(USC.RC*USC.RC+PAPER_LEN*USC.T/PI);
let rollS,rollT,padG,paperStrips=[],mist,vacLamp,wetLamp;
(function(){
  box(cleaner,600,14,130,M.alu,0,906,0);box(cleaner,150,16,44,M.aluD,-375,934,0);box(cleaner,150,16,44,M.aluD,375,934,0);box(cleaner,30,26,130,M.aluD,-290,918,0);box(cleaner,30,26,130,M.aluD,290,918,0);
  /* roll cores (cardboard) + flanges + drive */
  const core=std(0xb08a5a,.8,0);
  [-45,45].forEach(z=>{cyl(cleaner,USC.RC,USC.RC,556,core,0,934,z,{rz:PI/2,seg:16,cast:false});[-1,1].forEach(k=>cyl(cleaner,22,22,3,M.aluD,k*272,934,z,{rz:PI/2,seg:20,cast:false}));cyl(cleaner,6,6,40,M.steel,-300,934,z,{rz:PI/2,seg:8});});
  box(cleaner,40,40,40,M.black,-322,934,45);label(cleaner,'TAKE-UP',40,10,-322,956,45,{fg:'#fff',pw:200,rx:-PI/2});
  const pm=std(0xf4f4f1,.92,0),rg=new THREE.CylinderGeometry(1,1,520,28);rg.rotateZ(PI/2);
  const rtex=canvasTex(128,32,(g,Wd,Hd)=>{g.fillStyle='#f4f4f1';g.fillRect(0,0,Wd,Hd);g.strokeStyle='rgba(120,120,110,.5)';for(let i=0;i<Wd;i+=5){g.beginPath();g.moveTo(i,0);g.lineTo(i,Hd);g.stroke();}g.fillStyle='rgba(60,60,60,.6)';g.fillRect(0,0,6,Hd);},{repeat:true});
  const rm=std(0xffffff,.92,0,{map:rtex});
  rollS=new THREE.Mesh(rg,rm);rollS.position.set(0,934,-45);rollS.castShadow=true;cleaner.add(rollS);
  rollT=new THREE.Mesh(rg,rm);rollT.position.set(0,934,45);rollT.castShadow=true;cleaner.add(rollT);
  padG=new THREE.Group();cleaner.add(padG);
  box(padG,540,13,30,M.rubber,0,944,0);box(padG,520,2,8,M.dark,0,951.5,0,NOSH);
  [0,1].forEach(i=>{const s=new THREE.Mesh(new THREE.BoxGeometry(520,.4,1),pm);s.castShadow=false;cleaner.add(s);paperStrips.push(s);});
  const top=new THREE.Mesh(new THREE.BoxGeometry(520,.4,30),pm);top.position.set(0,951.4,0);padG.add(top);
  /* solvent spray bar (leading side, z-) with nozzles, mist cones */
  box(cleaner,520,10,14,M.steel,0,944,-74);for(let i=0;i<9;i++)cyl(cleaner,2.4,2.4,8,M.black,-240+i*60,951,-74,{seg:6,cast:false});
  const mg=new THREE.ConeGeometry(11,56,10,1,true);mg.rotateX(PI);mg.translate(0,28,0);mist=new THREE.Group();cleaner.add(mist);
  const mm=new THREE.MeshBasicMaterial({color:0xcfe9ff,transparent:true,opacity:.28,depthWrite:false});
  for(let i=0;i<9;i++){const c=new THREE.Mesh(mg,mm);c.position.set(-240+i*60,952,-74);mist.add(c);}mist.visible=false;
  cyl(cleaner,7,7,70,M.blue,300,920,-74,{rz:PI/2,seg:10});label(cleaner,'SOLVENT',50,10,300,934,-74,{fg:'#1e4f9a',bg:'#e7e8ea',pw:200,rx:-PI/2});
  /* vacuum slot (trailing side, z+) + collector + lamps */
  box(cleaner,520,12,16,M.dark,0,945,70);box(cleaner,500,2,6,M.black,0,951.2,70,NOSH);box(cleaner,90,44,64,M.black,-250,926,100);tube(cleaner,[[-205,926,100],[-120,920,95],[-40,930,76],[0,942,72]],7,M.black,16);
  const lm=c=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.05});vacLamp=lm(0x2fe08a);wetLamp=lm(0x3a9bff);
  cyl(cleaner,7,7,6,vacLamp,-250,950,100,{seg:10});cyl(cleaner,7,7,6,wetLamp,300,950,-74,{seg:10,cast:false});
})();

/* pneumatics on the rear wall (regulators with gauges, valve terminal, cable duct) */
(function(){
  const z=-HZ+22,gt=canvasTex(128,128,(g)=>{g.fillStyle='#f6f6f4';g.beginPath();g.arc(64,64,62,0,7);g.fill();g.strokeStyle='#222';g.lineWidth=3;for(let a=-2.3;a<=2.3;a+=.38){g.beginPath();g.moveTo(64+Math.sin(a)*46,64-Math.cos(a)*46);g.lineTo(64+Math.sin(a)*56,64-Math.cos(a)*56);g.stroke();}
    g.strokeStyle='#c22';g.lineWidth=4;g.beginPath();g.moveTo(64,64);g.lineTo(94,34);g.stroke();g.fillStyle='#1e78d6';g.font='700 15px Arial';g.textAlign='center';g.fillText('bar',64,98);});
  const gm=std(0xffffff,.4,0,{map:gt});
  for(let i=0;i<6;i++){const x=-60+i*78;box(interior,46,70,46,M.black,x,1290,z+23);cyl(interior,17,17,44,M.blue,x,1347,z+23);
    cyl(interior,24,24,14,M.black,x,1275,z+52,{rx:PI/2,cast:false});const f=new THREE.Mesh(new THREE.CircleGeometry(21,24),gm);f.position.set(x,1275,z+59.5);interior.add(f);}
  box(interior,300,70,50,M.white,-330,1300,z+25);for(let i=0;i<14;i++)box(interior,12,56,6,std(0xd6d8da,.6),-462+i*20,1300,z+53,NOSH);
  box(interior,1000,60,60,M.white,0,1180,z+30);
})();

/* ===================================================================
   RUNTIME — stencil, print cycle, SMEMA handoff, UI
   =================================================================== */
const foilMats=[];
(function(){ // stainless foil (laser-cut apertures from the board's pad layout) inside a polyester mesh band, half-etched fiducials
  const S=10,tex=canvasTex(BW*S,BD*S,(g,W,H)=>{
    g.fillStyle='#b3b8bd';g.fillRect(0,0,W,H);
    for(let i=0;i<2600;i++){g.fillStyle='rgba('+(Math.random()<.5?'255,255,255':'60,66,72')+','+(Math.random()*.07)+')';g.fillRect(0,Math.random()*H,W,1);}
    g.fillStyle='#0b0c0e';KIT.pads.forEach(p=>g.fillRect((p[0]-p[2]/2+BW/2)*S,(p[1]-p[3]/2+BD/2)*S,p[2]*S,p[3]*S));
    FIDS.forEach(f=>{const x=(f.x+BW/2)*S,y=(f.z+BD/2)*S;g.fillStyle='#8a9097';g.beginPath();g.arc(x,y,17,0,7);g.fill();g.fillStyle='#0d0e10';g.beginPath();g.arc(x,y,10,0,7);g.fill();});   // half-etched, black-filled
    g.fillStyle='#868c92';g.font='600 22px Arial';g.fillText('SMT DEMO BOARD REV C  ·  T = 0.13 mm  ·  TOP SIDE',(-100+BW/2)*S,(97+BD/2)*S);
    g.strokeStyle='rgba(60,66,72,.35)';g.lineWidth=2;g.strokeRect(1,1,W-2,H-2);});
  const m1=new THREE.MeshStandardMaterial({map:tex,roughness:.38,metalness:.75,side:THREE.DoubleSide,envMapIntensity:.9});
  const bt=canvasTex(256,256,(g)=>{g.fillStyle='#b3b8bd';g.fillRect(0,0,256,256);for(let i=0;i<700;i++){g.fillStyle='rgba('+(Math.random()<.5?'255,255,255':'60,66,72')+','+(Math.random()*.07)+')';g.fillRect(0,Math.random()*256,256,1);}},{repeat:true});bt.repeat.set(.004,.004);
  const m2=new THREE.MeshStandardMaterial({map:bt,roughness:.38,metalness:.75,side:THREE.DoubleSide,envMapIntensity:.9});
  m1.emissive=new THREE.Color(0x4a4f56);m2.emissive=new THREE.Color(0x4a4f56);foilMats.push(m1,m2);
  const c=new THREE.Mesh(FLAT(BW,BD),m1);c.position.y=.1;c.receiveShadow=true;stencil.add(c);
  const ring=(a,b)=>{const sh=new THREE.Shape();sh.moveTo(-a,-a);sh.lineTo(a,-a);sh.lineTo(a,a);sh.lineTo(-a,a);sh.closePath();const ho=new THREE.Path();if(b===BW/2){ho.moveTo(-BW/2,-BD/2);ho.lineTo(BW/2,-BD/2);ho.lineTo(BW/2,BD/2);ho.lineTo(-BW/2,BD/2);}else{ho.moveTo(-b,-b);ho.lineTo(b,-b);ho.lineTo(b,b);ho.lineTo(-b,b);}ho.closePath();sh.holes.push(ho);const g=new THREE.ShapeGeometry(sh);g.rotateX(-PI/2);return g;};
  const o=new THREE.Mesh(ring(300,BW/2),m2);o.position.y=.1;o.receiveShadow=true;stencil.add(o);
  /* polyester mesh band, opaque light amber, tucked under the frame */
  const wt=canvasTex(128,128,(g)=>{g.fillStyle='#e6c98a';g.fillRect(0,0,128,128);g.strokeStyle='rgba(150,110,40,.55)';g.lineWidth=1.2;for(let i=0;i<128;i+=4){g.beginPath();g.moveTo(i,0);g.lineTo(i,128);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(128,i);g.stroke();}g.fillStyle='rgba(255,240,200,.18)';for(let i=0;i<128;i+=8)g.fillRect(i,0,2,128);},{repeat:true});wt.repeat.set(26,26);
  const mm=new THREE.MeshStandardMaterial({map:wt,roughness:.85,metalness:0,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(ring(336,298),mm);mesh.position.y=.06;mesh.receiveShadow=true;stencil.add(mesh);
  const ed=new THREE.Mesh(new THREE.BoxGeometry(1,.3,1),M.dark);   // glue line foil/mesh
  [[0,-298,600,2.4],[0,298,600,2.4],[-298,0,2.4,596],[298,0,2.4,596]].forEach(a=>{const e=new THREE.Mesh(new THREE.BoxGeometry(a[2],.4,a[3]),std(0x7a5c20,.7,.1));e.position.set(a[0],.26,a[1]);stencil.add(e);});
})();

/* ---------- machine object (line protocol) ---------- */
const m=C.machine({id:ID,line:opts.line,name:opts.name||'PRINTER',kind:'printer',group:machine,x:X,length:2*HX,depth:2*HZ,height:TOP,lanes:[1],inReach:250,outReach:250,
  inX:-HX,outX:HX,spec:{footprint:'1180 × 1840 × 1606 mm',lanes:'1',format:'80×50 – 510×510 mm',align:'± 12.5 µm @ 6σ',speed:'60 mm/s',pressure:'6.5 kg (64 N) / 300 mm'}});
const beltIn=C.belt(40),beltOut=C.belt(40);

/* ---------- state ---------- */
const STEPS=['LOAD','CLAMP','ALIGN','LIFT','PRINT','SEPARATE','INSPECT 2D','UNLOAD'];
const REG=[['BGA',-65,-40],['QFP-100',-65,40],['QFP-64',0,15],['PASSIVES',65,55]];
const st={step:-1,name:'IDLE',sub:'—',printed:0,sinceClean:0,cleans:0,off:null,res:null,bias:[0,0],force:0,speed:0,lift:0,snug:0,foil:0,dir:-1,down:[0,0],clz:640,clup:0,spray:false,vac:false,
  cur:null,q:[],out:null,stopUp:true,rollZ:278,cov:0,regs:null,flagged:0,cleanReq:false,motW:0,motA:[0,0,0],sep:0,
  mass:bmass(R_FULL),cart:CART_G,paper:PAPER_LEN,dispenses:0,paperFaults:0,cartFaults:0,flags:0,warn:false,pasteUsed:0,page:0};
st.r=()=>brad(st.mass);
const camFx={c:new THREE.Color(1,1,1),p:0};
function setStep(i,sub){st.step=i;st.name=STEPS[i];st.sub=sub||'—';m.step=st.name;m.detail=st.sub;}
function sub(t){st.sub=t;m.detail=t;}
function addLog(t,cls){m.addLog(t,cls);}
function* camTo(x,z){const x0=cam.x,z0=cam.zb,zb=z-54,d=Math.hypot(x-x0,zb-z0);yield* tween(Math.max(.15,d/900+.08),k=>{cam.x=x0+(x-x0)*k;cam.zb=z0+(zb-z0)*k;});}
function* flash(col,dur){camFx.c.setHex(col);camFx.p=1;yield dur;camFx.p=0;yield .04;}
function* paperAdv(ds){const p0=st.paper;yield* tween(.25,k=>{st.paper=p0-ds*k;},true);}
function* clean(){
  st.cleanReq=false;st.step=-1;st.name='CLEAN';st.warn=true;sub('CLEANER TO STENCIL');m.step='CLEAN';
  yield* tween(.8,k=>st.clz=640+(300-640)*k);
  for(const [name,za,zb,mode] of [['WET PASS · SOLVENT SPRAY',300,10,'spray'],['DRY PASS',10,300,''],['VACUUM PASS',300,10,'vac']]){
    if(st.paper<PAPER_STEP){st.paperFaults++;yield* m.fault('USC PAPER END — replace roll',120);st.paper=PAPER_LEN;addLog('Paper roll replaced','ok');m.setState('RUN');}
    sub(name);yield* paperAdv(PAPER_STEP);yield* tween(.15,k=>st.clup=k);st.spray=mode==='spray';st.vac=mode==='vac';
    yield* tween(Math.abs(zb-za)/150,k=>st.clz=za+(zb-za)*k,true);st.spray=false;st.vac=false;yield* tween(.12,k=>st.clup=1-k);}
  sub('CLEANER PARK');yield* tween(.9,k=>st.clz=10+(640-10)*k);
  st.sinceClean=0;st.cleans++;st.warn=false;addLog('Stencil underside cleaned (#'+st.cleans+') · wet/dry/vac · paper '+(st.paper/PAPER_LEN*100).toFixed(0)+' %','cl');
}
/* automatic paste top-up: dispenser beam moves over the stencil, nozzle down, bead line along X (~4 s) */
function* dispense(){
  st.step=-1;st.name='DISPENSE';st.warn=true;const r0=st.r(),need=bmass(R_FULL)-st.mass;
  if(st.cart<need+4){st.cartFaults++;yield* m.fault('PASTE CARTRIDGE EMPTY — replace',90);st.cart=CART_G;addLog('Paste cartridge replaced (600 g)','ok');m.setState('RUN');}
  sub('SQUEEGEE HEAD TO PARK');const sz=sq.z;yield* tween(Math.max(.3,Math.abs(sz+250)/1000+.15),k=>sq.z=sz+(-250-sz)*k);
  sub('DISPENSER OVER STENCIL');const z1=st.rollZ,d0=disp.z;yield* tween(Math.max(.4,Math.abs(d0-z1)/900+.15),k=>{disp.z=d0+(z1-d0)*k;disp.x=-420+(135+420)*k;});
  sub('DISPENSING BEAD LINE');yield* tween(.3,k=>disp.low=k);disp.on=1;
  const m0=st.mass,c0=st.cart;yield* tween(2.4,k=>{disp.x=135-270*k;disp.line=k;st.cart=c0-need*k;},true);
  disp.on=0;yield* tween(.3,k=>disp.low=1-k);st.mass=m0+need;disp.line=0;st.dispenses++;
  sub('DISPENSER PARK');const z2=disp.z,x2=disp.x;yield* tween(.55,k=>{disp.z=z2+(600-z2)*k;disp.x=x2+(-420-x2)*k;});
  addLog('Paste bead topped up: Ø '+(2*r0).toFixed(1)+' → '+(2*R_FULL).toFixed(1)+' mm · +'+need.toFixed(0)+' g · cartridge '+(st.cart/CART_G*100).toFixed(0)+' %','cl');
  st.warn=false;
}
/* SMEMA: accept one board into the infeed buffer */
m.canAccept=lane=>lane===1&&!m.down&&st.q.length===0;
m.onAccept=b=>{b.mv=run(conveyTo(b,W(-565),beltIn));st.q.push(b);};
m.onRelease=b=>{st.out=null;beltOut.moving++;run((function*(){yield 1.2;beltOut.moving--;})());};
function* exitMove(b){yield* conveyTo(b,W(610),beltOut);m.setReady(b,1);}
/* SPI closed loop */
m.applyOffset=(dx,dy)=>{const cl=v=>Math.max(-100,Math.min(100,v));st.bias[0]=cl(st.bias[0]+dx);st.bias[1]=cl(st.bias[1]+dy);addLog('SPI offset applied  ΔX '+(dx>=0?'+':'')+dx.toFixed(0)+' / ΔY '+(dy>=0?'+':'')+dy.toFixed(0)+' µm → table bias '+st.bias[0].toFixed(0)+' / '+st.bias[1].toFixed(0),'cl');};
m.requestClean=()=>{st.cleanReq=true;addLog('Clean requested by SPI (after current board)','cl');};
function* main(){
  while(true){
    if(!st.q.length){st.step=-1;st.name='IDLE';st.sub='WAITING FOR BOARD';m.setState('STARVED','WAIT BOARD','no board from upstream');}
    while(!st.q.length)yield FRAME;
    const b=st.q[0];while(!b.mv.done)yield FRAME;st.q.shift();
    const t0=C.T.sim;m.setState('RUN');
    setStep(0,'BOARD TO PRINT NEST');st.stopUp=true;yield* conveyTo(b,W(0),beltIn);
    setStep(1,'SNUGGERS + TOP CLAMP FOIL');st.cur=b;yield* tween(.3,k=>st.snug=k);yield* tween(.2,k=>st.foil=k);
    setStep(2,'VISION CAMERA');
    for(const f of [FIDS[1],FIDS[2]]){yield* camTo(f.x,LZ+f.z);sub('STENCIL FIDUCIAL ▲');yield* flash(0xff3020,.13);sub('BOARD FIDUCIAL ▼');yield* flash(0xffffff,.13);}
    st.off=[gauss()*28,gauss()*28,gauss()*12];sub('TABLE X / Y / θ CORRECTION');st.motW=14;yield* tween(.55,k=>st.motW=14*(1-k*.8),true);st.motW=0;   // 3 servos
    yield* flash(0xffffff,.12);st.res=[st.bias[0]+gauss()*ALIGN_UM/6,st.bias[1]+gauss()*ALIGN_UM/6,gauss()*3];sub('VERIFY  Δ '+st.res[0].toFixed(1)+' / '+st.res[1].toFixed(1)+' µm');
    yield* camTo(-300,-56);yield .1;
    setStep(3,'TABLE UP · CONTACT (gap 0)');yield* tween(1.0,k=>st.lift=k*LIFT);yield* tween(.2,k=>st.foil=1-k);
    const dir=st.dir,bi=dir<0?0:1,z0=dir<0?245:95,z1=dir<0?5:335,zs=sq.z;
    setStep(4,dir<0?'SQUEEGEE FRONT → REAR':'SQUEEGEE REAR → FRONT');
    yield* tween(Math.max(.3,Math.abs(z0-zs)/1100+.15),k=>sq.z=zs+(z0-zs)*k);
    yield* tween(.25,k=>st.down[bi]=k);st.speed=PRINT_V;const ms=st.mass,used=G_PRINT*PASTE_X;
    yield* tween(Math.abs(z1-z0)/PRINT_V,k=>{sq.z=z0+(z1-z0)*k;st.force=PRESS_N+gauss()*1.2;st.mass=ms-used*k;},true);
    st.pasteUsed+=G_PRINT;st.speed=0;yield* tween(.2,k=>st.down[bi]=1-k);st.force=0;st.dir=-dir;
    setStep(5,'SNAP-OFF 2 mm @ 2 mm/s');b.setStage('printed');
    yield* tween(SEP_MM/SEP_V,k=>{st.lift=LIFT-SEP_MM*k;st.sep=SEP_MM*k;},true);sub('SEPARATION · FAST');yield* tween(.45,k=>{st.lift=(LIFT-SEP_MM)*(1-k);st.sep=SEP_MM+(LIFT-SEP_MM)*k;});st.sep=0;
    setStep(6,'2D PASTE INSPECTION');
    const flag=Math.random()<.015,fi=Math.floor(Math.random()*4);st.regs=[];
    for(let i=0;i<4;i++){yield* camTo(REG[i][1],LZ+REG[i][2]);yield* flash(0xffffff,.14);const bad=flag&&i===fi,cv=bad?78+Math.random()*9:97.2+Math.random()*2.6;st.regs.push({n:REG[i][0],cv,ok:!bad});sub(REG[i][0]+'  '+cv.toFixed(1)+' %'+(bad?'  LOW':'  OK'));}
    st.cov=st.regs.reduce((a,r)=>a+r.cv,0)/4;
    if(flag){st.flags++;b.spi=Object.assign(b.spi||{},{printerFlag:'INSUFFICIENT PASTE',region:REG[fi][0]});}
    b.printer={cov:st.regs.map(r=>+r.cv.toFixed(1)),res:st.res.slice(),bead:+(2*st.r()).toFixed(1)};
    yield* camTo(-300,-56);
    setStep(7,'RELEASE + TRANSFER');yield* tween(.25,k=>st.snug=1-k);st.cur=null;st.stopUp=false;
    if(st.out){m.setState('BLOCKED','WAIT OUTFEED','downstream not ready');while(st.out)yield FRAME;m.setState('RUN');}
    st.out=b;run(exitMove(b));
    st.printed++;st.sinceClean++;m.endCycle(b,t0);
    addLog('#'+b.sn+'  printed  '+m.ct.toFixed(1)+' s  ·  2D '+st.cov.toFixed(1)+' %'+(flag?'  ·  INSUFFICIENT PASTE ('+REG[fi][0]+')':''),flag?'ng':'ok');
    if(st.sinceClean>=CLEAN_EVERY||st.cleanReq){while(b.x<W(200))yield FRAME;yield* clean();}
    if(st.r()<R_LOW){while(b.x<W(200))yield FRAME;yield* dispense();}
  }
}
run(main());

/* ---------- per-frame poses ---------- */
const _tc=new THREE.Color();let lastPaper=PAPER_LEN;
m.update=(dt,rdt)=>{
  {const ty=st.stopUp?CONV_Y+3:CONV_Y-12;stopPin.position.y+=(ty-stopPin.position.y)*Math.min(1,Math.max(dt,rdt||0)*14);}
  if(dt>0&&(beltIn.moving>0||beltOut.moving>0))beltTex.offset.x-=dt*C.BELT_V/20;
  nest.position.y=st.lift;if(st.cur)st.cur.g.position.y=CONV_Y+st.lift;
  snugRods.forEach(r=>{const e=2+13*st.snug,s=r.userData.s;r.scale.y=e/20;r.position.z=LZ+s*(BD/2+7+6+2-e/2);});
  foils.forEach(f=>f.position.z=LZ+f.userData.s*(BD/2-3+5+(1-st.foil)*13));
  motors.forEach((mo,i)=>{st.motA[i]+=st.motW*(dt||0)*(i===2?-1:1);mo.sh.rotation[mo.ax?'x':'z']=st.motA[i];});
  sqBeam.position.z=sq.z;blades.forEach((b,i)=>b.mv.position.y=38*(1-st.down[i]));
  /* bead: radius from paste mass, tangent to stencil and blade (60 deg wedge), rolls without slip */
  const r=st.r();
  if(st.down[0]>.9||st.down[1]>.9){const tz=st.down[0]>.9?sq.z+45-1.732*r:sq.z-45+1.732*r,stp=Math.max(dt,rdt||0)*500+.01;st.rollZ+=Math.max(-stp,Math.min(stp,tz-st.rollZ));}
  pasteRoll.position.set(0,STEN_Y+.1+r,st.rollZ);pasteMesh.scale.set(1,r,r);pasteMesh.rotation.x=st.rollZ/r;
  /* dispenser */
  dispBeam.position.z=disp.z;dispCar.position.x=disp.x;dispCart.position.y=(1-disp.low)*35;
  const lv=Math.max(.001,st.cart/CART_G);cartLevel.scale.y=lv;cartLevel.position.y=1003+90*lv+(1-disp.low)*0;
  dispLine.visible=disp.line>0;if(dispLine.visible){const len=Math.max(.5,270*disp.line);dispLine.scale.set(len/BEAD_L,R_FULL,R_FULL);dispLine.position.set(135-len/2,STEN_Y+.1+R_FULL,st.rollZ);dispLine.rotation.x=0;}
  camBeam.position.z=cam.zb;camHead.position.x=cam.x;
  camLeds.forEach(mt=>{mt.emissive.copy(camFx.c);mt.emissiveIntensity=camFx.p*3;});camLight.color.copy(camFx.c);camLight.intensity=camFx.p*2.2;
  /* cleaner: pose, paper rolls (radii from remaining paper), strips */
  cleaner.position.set(0,0,st.clz);padG.position.y=st.clup*10.4;
  const Rs=Math.sqrt(USC.RC*USC.RC+st.paper*USC.T/PI),Rt=Math.sqrt(USC.RC*USC.RC+(PAPER_LEN-st.paper)*USC.T/PI);
  rollS.scale.set(1,Rs,Rs);rollT.scale.set(1,Rt,Rt);const ds=lastPaper-st.paper;if(ds>0&&dt>0){rollS.rotation.x+=ds/Rs;rollT.rotation.x+=ds/Rt;}lastPaper=st.paper;
  const py=951.4+st.clup*10.4;
  [[-1,Rs],[1,Rt]].forEach(([s,R],i)=>{const ya=934+R,dz=29,dy=s<0?py-ya:ya-py,len=Math.hypot(dz,dy),sg=paperStrips[i];sg.scale.z=len;sg.position.set(0,(ya+py)/2,s*30.5);sg.rotation.x=Math.atan2(-dy,dz);});
  mist.visible=st.spray;if(st.spray)mist.children.forEach((c,i)=>c.scale.y=.75+.35*Math.sin(C.T.sim*60+i*2));
  vacLamp.emissiveIntensity=st.vac?2:.05;wetLamp.emissiveIntensity=st.spray?2:.05;
  hood.open+=(hood.target-hood.open)*Math.min(1,(rdt||0)*3.2);hoodPivot.rotation.x=-hood.open*1.15;
  C.tower(m,tower,st.warn||(st.name==='CLEAN')||(st.name==='DISPENSE'));
};
C.dyn(hoodPivot,nest,sqBeam,camBeam,cleaner,pasteRoll,stopPin,dispBeam,dispLine);foils.forEach(c=>C.dyn(c));
C.bake(machine);

/* ---------- hood / see-through / clickable ---------- */
function setHood(o){hood.target=o?1:0;const b=$('bHood');if(SA&&b){b.textContent=o?'Close hood':'Open hood';b.classList.toggle('on',!!o);}}
let seeThru=false;
function setSten(o){seeThru=o;const b=$('bSten');if(SA&&b)b.classList.toggle('on',o);foilMats.forEach(mt=>{mt.transparent=o;mt.opacity=o?.22:1;mt.depthWrite=!o;mt.needsUpdate=true;});}
C.clickable(hoodPivot,()=>setHood(!hood.target));
C.clickable(monGrp,()=>{st.page=(st.page+1)%3;st.pageT=C.T.sim;});

/* ---------- operator touch screen (HMI pages: process · consumables · last 2D) ---------- */
const PAGES=['PROCESS','CONSUMABLES','LAST 2D'];
function bar(g,x,y,w,h,f,col,txt){g.fillStyle='#262b33';g.fillRect(x,y,w,h);g.fillStyle=col;g.fillRect(x,y,Math.max(0,Math.min(1,f))*w,h);g.strokeStyle='#4a5260';g.lineWidth=1;g.strokeRect(x+.5,y+.5,w-1,h-1);if(txt){g.fillStyle='#fff';g.font='700 14px Arial';g.textAlign='center';g.fillText(txt,x+w/2,y+h/2+1);g.textAlign='left';}}
function drawMon(){
  const g=monCtx,W_=800,H=484,pg=Math.floor(C.T.sim/12)%3;const P=st.pageT&&C.T.sim-st.pageT<20?st.page:pg;
  g.fillStyle='#14171c';g.fillRect(0,0,W_,H);
  g.fillStyle='#22262d';g.fillRect(0,0,W_,44);g.fillStyle='#1e6fd9';g.fillRect(0,44,W_,4);
  g.fillStyle='#fff';g.font='700 21px Arial';g.textAlign='left';g.textBaseline='middle';g.fillText('PRINTER  ·  '+PAGES[P],14,23);
  g.font='500 15px Arial';g.textAlign='right';g.fillText((C.T.paused?'PAUSED':(m.state==='DOWN'?'ALARM':'AUTOMATIC'))+'   '+m.state,W_-14,23);g.textAlign='left';
  const y0=56;
  if(P===0){
    STEPS.forEach((s,i)=>{const y=y0+i*31,on=i==st.step;g.fillStyle=on?'#1e6fd9':(i<st.step?'#2a4a38':'#22262d');g.fillRect(14,y,168,26);g.fillStyle=on||i<st.step?'#fff':'#8fa3bd';g.font=(on?'700 ':'500 ')+'14px Arial';g.fillText((i+1)+'  '+s,24,y+14);});
    if(st.name=='CLEAN'||st.name=='DISPENSE'){g.fillStyle='#e8a020';g.fillRect(14,y0+8*31,168,26);g.fillStyle='#111';g.font='700 14px Arial';g.fillText(st.name=='CLEAN'?'STENCIL CLEAN':'PASTE TOP-UP',24,y0+8*31+14);}
    const bx=198,by=y0,bw=250,bh=200;g.fillStyle='#0f5a31';g.fillRect(bx,by,bw,bh);g.strokeStyle='#d9b85c';g.lineWidth=2;g.strokeRect(bx,by,bw,bh);
    g.fillStyle='#e5e8ec';KIT.pads.forEach((p,i)=>{if(i%3)return;g.fillRect(bx+(p[0]+BW/2)/BW*bw-.7,by+(p[1]+BD/2)/BD*bh-.7,1.6,1.6);});
    g.strokeStyle='#fff';g.lineWidth=2;[FIDS[1],FIDS[2]].forEach(f=>{const x=bx+(f.x+BW/2)/BW*bw,y=by+(f.z+BD/2)/BD*bh;g.beginPath();g.moveTo(x-9,y);g.lineTo(x+9,y);g.moveTo(x,y-9);g.lineTo(x,y+9);g.stroke();});
    if(st.step==4){const z=sq.z+(st.dir<0?45:-45)-LZ,y=by+(z+BD/2)/BD*bh;if(y>by&&y<by+bh){g.fillStyle='rgba(220,225,230,.9)';g.fillRect(bx+6,y-3,bw-12,6);}}
    g.font='500 13px Arial';const rows=[['Print speed',PRINT_V+' mm/s'],['Squeegee pressure',PRESS_KG.toFixed(1)+' kg ('+PRESS_N+' N) / '+BLADE_L+' mm'],['Stroke',STROKE+' mm  ·  blade 60°'],['Print gap','0.00 mm (contact)'],['Separation',SEP_MM+' mm @ '+SEP_V+' mm/s, then fast'],['Alignment','± '+ALIGN_UM+' µm @ 6σ'],['Stencil','29" · '+FOIL_T.toFixed(3)+' mm foil'],['Load cell',st.force?st.force.toFixed(1)+' N  ('+(st.force/9.81).toFixed(2)+' kg)':'—'],['Measured X/Y/θ',st.off?st.off[0].toFixed(0)+' / '+st.off[1].toFixed(0)+' µm / '+st.off[2].toFixed(0)+' m°':'—'],['Residual X/Y',st.res?st.res[0].toFixed(1)+' / '+st.res[1].toFixed(1)+' µm':'—'],['SPI bias X/Y',st.bias[0].toFixed(0)+' / '+st.bias[1].toFixed(0)+' µm']];
    rows.forEach((r,i)=>{const y=y0+i*20+(i>7?0:0);g.fillStyle='#8fa3bd';g.fillText(r[0],462,y+8);g.fillStyle='#fff';g.font='600 13px Arial';g.fillText(r[1],612,y+8);g.font='500 13px Arial';});
    g.fillStyle='#8fa3bd';g.font='500 14px Arial';g.fillText(st.sub,198,y0+216);
    g.fillText('BOARDS '+st.printed+'    CYCLE '+(m.ct?m.ct.toFixed(1)+' s':'—')+'    PRINTS SINCE CLEAN '+st.sinceClean+' / '+CLEAN_EVERY+'    CLEANS '+st.cleans,198,y0+250);
    g.fillText('LAST 2D  '+(st.regs?st.cov.toFixed(1)+' %  ('+(st.regs.every(r=>r.ok)?'OK':'INSUFFICIENT PASTE')+')':'—'),198,y0+280);
  }else if(P===1){
    const r=st.r(),dia=2*r;g.font='600 16px Arial';
    g.fillStyle='#fff';g.fillText('Paste bead',16,y0+12);bar(g,200,y0,380,26,(r-3)/(R_FULL-3),r<R_LOW?'#d9892a':'#2c9a5e','Ø '+dia.toFixed(1)+' mm · '+st.mass.toFixed(0)+' g');g.fillStyle='#8fa3bd';g.font='500 12px Arial';g.fillText('refill < Ø '+(2*R_LOW).toFixed(1)+' mm',592,y0+12);
    g.fillStyle='#fff';g.font='600 16px Arial';g.fillText('Cartridge',16,y0+62);bar(g,200,y0+50,380,26,st.cart/CART_G,st.cart<80?'#c8322a':'#2c7ac8',(st.cart/CART_G*100).toFixed(0)+' %  ('+st.cart.toFixed(0)+' / '+CART_G+' g)');
    g.fillStyle='#fff';g.fillText('USC paper',16,y0+112);bar(g,200,y0+100,380,26,st.paper/PAPER_LEN,st.paper<300?'#c8322a':'#8fa3bd',(st.paper/PAPER_LEN*100).toFixed(0)+' %  ('+(st.paper/1000).toFixed(2)+' m)');
    g.font='500 14px Arial';const rows=[['Paste per print (pads)',G_PRINT.toFixed(3)+' g  (A '+PAD_A.toFixed(0)+' mm² · 0.13 mm · 7.4 · 0.85)'],['Consumption model','×'+PASTE_X+' demo acceleration → '+(G_PRINT*PASTE_X).toFixed(1)+' g / print'],['Boards printed',st.printed],['Paste top-ups',st.dispenses],['Stencil cleans',st.cleans+'  (every '+CLEAN_EVERY+' prints)'],['Paper advance',PAPER_STEP+' mm per wipe · 3 wipes / clean'],['2D flags (INSUFFICIENT PASTE)',st.flags]];
    rows.forEach((q,i)=>{g.fillStyle='#8fa3bd';g.fillText(q[0],16,y0+160+i*24);g.fillStyle='#fff';g.fillText(String(q[1]),270,y0+160+i*24);});
  }else{
    g.fillStyle='#fff';g.font='600 16px Arial';g.fillText('Post-print 2D inspection',16,y0+10);
    if(!st.regs){g.fillStyle='#8fa3bd';g.font='500 15px Arial';g.fillText('no board inspected yet',16,y0+50);}
    else{st.regs.forEach((q,i)=>{const x=16+(i%2)*390,y=y0+34+Math.floor(i/2)*128;g.fillStyle='#1c2128';g.fillRect(x,y,372,116);g.strokeStyle=q.ok?'#2c9a5e':'#c8322a';g.lineWidth=2;g.strokeRect(x,y,372,116);
      g.fillStyle='#fff';g.font='700 18px Arial';g.fillText(q.n,x+12,y+20);g.font='700 34px Arial';g.fillStyle=q.ok?'#46d283':'#ff5a4e';g.fillText(q.cv.toFixed(1)+' %',x+12,y+62);g.font='600 14px Arial';g.fillText(q.ok?'OK':'INSUFFICIENT PASTE',x+12,y+94);
      for(let k=0;k<22;k++){const a=Math.sin(k*12.9+i*3.1)*.5+.5,pw=q.ok?.8+a*.2:.35+a*.55;g.fillStyle=q.ok?'#9aa0a6':'#bd7f7f';g.fillRect(x+200+(k%11)*15,y+20+Math.floor(k/11)*30,11,26*pw);}});
      g.fillStyle='#8fa3bd';g.font='500 14px Arial';g.fillText('Average coverage '+st.cov.toFixed(1)+' %   ·   board result '+(st.regs.every(r=>r.ok)?'PASS':'FLAGGED'),16,y0+296);}
  }
  if(m.state==='DOWN'){const on=Math.floor(C.T.sim*2)%2===0;g.fillStyle=on?'#c8202a':'#7a1218';g.fillRect(0,H-92,W_,40);g.fillStyle='#fff';g.font='700 19px Arial';g.fillText('ALARM  '+m.detail,16,H-72);}
  PAGES.forEach((t,i)=>{g.fillStyle=i===P?'#1e6fd9':'#22262d';g.fillRect(i*(W_/3)+3,H-46,W_/3-6,40);g.fillStyle=i===P?'#fff':'#8fa3bd';g.font='600 16px Arial';g.textAlign='center';g.fillText(t,i*(W_/3)+W_/6,H-26);g.textAlign='left';});
  monTex.needsUpdate=true;
}
C.onSlow(()=>{if(m.near)drawMon();});

/* ---------- vision cameras: down-looking (board) and up-looking (stencil underside), same head ---------- */
const insetCam=new THREE.OrthographicCamera(-15*255/253,15*255/253,15,-15,.5,70);insetCam.up.set(0,0,-1);
const prepCam=c=>{const O=m.origin();c.position.set(O.x+cam.x,917,O.z+cam.zb+54);c.lookAt(O.x+cam.x,0,O.z+cam.zb+54);};
const insetCamS=new THREE.OrthographicCamera(-15*255/253,15*255/253,15,-15,.5,40);insetCamS.up.set(0,0,1);
const prepCamS=c=>{const O=m.origin();c.position.set(O.x+cam.x,951,O.z+cam.zb+54);c.lookAt(O.x+cam.x,1100,O.z+cam.zb+54);};
m.cameras=[{name:'Vision camera · board',cam:insetCam,prepare:prepCam},{name:'Vision camera · stencil',cam:insetCamS,prepare:prepCamS}];

/* ---------- generic info rows (factory side panel) ---------- */
m.info=()=>[['Step',st.name],['Detail',st.sub],['Boards printed',st.printed],['Last cycle',m.ct?m.ct.toFixed(1)+' s':'—'],
  ['Squeegee',PRINT_V+' mm/s · '+PRESS_KG+' kg ('+PRESS_N+' N)'],['Paste bead','Ø '+(2*st.r()).toFixed(1)+' mm · '+st.mass.toFixed(0)+' g'],['Cartridge',(st.cart/CART_G*100).toFixed(0)+' %'],['USC paper',(st.paper/PAPER_LEN*100).toFixed(0)+' %'],
  ['2D coverage',st.regs?st.cov.toFixed(1)+' %':'—'],['Prints since clean',st.sinceClean+' / '+CLEAN_EVERY],['Stencil cleans / top-ups',st.cleans+' / '+st.dispenses],['SPI table bias X/Y',st.bias[0].toFixed(0)+' / '+st.bias[1].toFixed(0)+' µm'],['Clean pending',st.cleanReq?'yes (after current board)':'no']];

/* ---------- camera presets, relative to the machine ---------- */
const V=(p,t)=>{const O=m.origin();return [[p[0]+O.x,p[1],p[2]+O.z],[t[0]+O.x,t[1],t[2]+O.z]];};
m.views={
  over:{p:[-2450,1950,3600],t:[0,880,120]},
  inside:{p:[-330,2050,2250],t:[0,960,250],hood:1},
  head:{p:[-420,1850,1250],t:[0,1100,180],hood:1},
  nest:{p:[-330,1130,720],t:[0,925,250],hood:1,sten:1},
  out:{p:[760,1040,520],t:[610,902,255]},
  top:{p:[0,4300,LZ+5],t:[0,900,LZ],hood:1},
  clean:{p:[-380,1230,1040],t:[0,945,300],hood:1,sten:1,follow:1},

  dispense:{p:[-250,1750,1500],t:[-200,1150,480],hood:1}
};
m.setHood=setHood;m.setSten=setSten;m.st=st;

/* ---------- stand-alone page wiring ---------- */
if(SA){
  const vmap={};
  Object.entries(m.views).forEach(([k,v])=>{vmap[k]=()=>{if(v.hood)setHood(1);setSten(!!v.sten);C.setXray(k==='top');const [p,t]=V(v.p,v.t);C.flyTo(p,t);
    if(v.follow)return rdt=>{const dz=(m.origin().z+st.clz-C.controls.target.z)*Math.min(1,rdt*2.5);C.controls.target.z+=dz;C.camera.position.z+=dz;};};});
  C.addViews(vmap);
  C.inset('inset',insetCam,prepCam);C.inset('insetS',insetCamS,prepCamS);
  const tg=(t,o,x,y,z)=>C.tag(t,o,x,y,z);
  tg('Closed-loop squeegee head',sqBeam,0,STEN_Y+235,100);
  tg('Load cells (closed loop)',sqBeam,0,STEN_Y+90,45);
  tg('Z-motor housing',sqBeam,-90,STEN_Y+230,124);
  tg('Stencil in 29" frame · mesh band',stencil,-250,34,300);
  tg('Stencil ID barcode',stencil,-190,30,368);
  tg('Rolling paste bead',pasteRoll,0,18,0);
  tg('Paste dispenser · 600 g cartridge',dispBeam,0,1240,0);
  tg('Vision camera (up / down)',camHead,0,970,54);
  tg('Under-stencil cleaner · paper rolls',cleaner,-200,975,0);
  tg('Solvent spray bar',cleaner,0,965,-74);
  tg('Vacuum slot',cleaner,0,962,70);
  tg('Lifting print nest · magnetic pin plate',nest,0,915,LZ+120);
  tg('X/Y/θ servo motors',nest,-70,860,LZ+120);
  tg('Pneumatic stencil clamp',interior,397,STEN_Y+110,170);
  tg('Width-adjust lead screw + handwheel',interior,-700,890,LZ+225);
  tg('FRL air service unit',machine,HX+40,1380,-230);
  tg('Rotary main switch',machine,330,610,-HZ-40);
  tg('Hood — click to open',machine,40,1480,HZ+20);
  tg('Touch screen (click = next page)',machine,(HX+WX1)/2+360,1560,HZ+230);
  tg('Keyboard + mouse',machine,(HX+WX1)/2+330,1075,HZ+320);
  if($('bHood'))$('bHood').onclick=()=>setHood(!hood.target);
  if($('bSten'))$('bSten').onclick=()=>setSten(!seeThru);
  const set=(id,t)=>{const e=$(id);if(e)e.textContent=t;};
  C.onHud(()=>{
    const hs=$('hState');hs.textContent=m.state==='DOWN'?'ALARM':st.name;hs.className='pill '+(m.state==='DOWN'?'ng':(st.name=='CLEAN'||st.name=='DISPENSE')?'cl':st.name=='IDLE'?'idle':'');
    $('phase').textContent=m.state==='DOWN'?m.detail:st.sub;
    $('stepN').textContent=st.step>=0?(st.step+1)+' / '+STEPS.length:'—';$('stepBar').style.width=(st.step>=0?(st.step+1)/STEPS.length*100:0)+'%';
    set('force',st.force?st.force.toFixed(0)+' N · '+(st.force/9.81).toFixed(1)+' kg':'target '+PRESS_N+' N · '+PRESS_KG+' kg');set('spd',st.speed?st.speed+' mm/s':PRINT_V+' mm/s set');
    set('sepv',SEP_MM+' mm @ '+SEP_V+' mm/s'+(st.sep>0?'  ('+st.sep.toFixed(1)+')':''));
    set('offs',st.off?(st.off[0]>=0?'+':'')+st.off[0].toFixed(0)+' / '+(st.off[1]>=0?'+':'')+st.off[1].toFixed(0)+' µm / '+st.off[2].toFixed(0)+' m°':'—');
    set('resv',st.res?(st.res[0]>=0?'+':'')+st.res[0].toFixed(1)+' / '+(st.res[1]>=0?'+':'')+st.res[1].toFixed(1)+' µm  (±'+ALIGN_UM+' @6σ)':'—');
    set('bead','Ø '+(2*st.r()).toFixed(1)+' mm · '+st.mass.toFixed(0)+' g');set('cart',(st.cart/CART_G*100).toFixed(0)+' %  · '+st.cart.toFixed(0)+' g');set('paperP',(st.paper/PAPER_LEN*100).toFixed(0)+' %  · '+(st.paper/1000).toFixed(2)+' m');
    set('biasv',st.bias[0].toFixed(0)+' / '+st.bias[1].toFixed(0)+' µm');set('cov2d',st.regs?st.cov.toFixed(1)+' %'+(st.regs.every(r=>r.ok)?'  OK':'  LOW'):'—');
    set('nPr',st.printed);set('ct',m.ct?m.ct.toFixed(1)+' s':'—');set('sc',st.sinceClean+' / '+CLEAN_EVERY);set('ncl',st.cleans+' · top-ups '+st.dispenses);
    const pk=Math.abs(cam.x+300)<5,lv=camFx.p>0?'CAPTURE':pk?'PARKED':'LIVE';$('insL').textContent=lv;$('rec').style.opacity=camFx.p>0?1:.25;if($('insLS'))$('insLS').textContent=lv;
    const c=m.cts.slice(-10);if(!c.length)SMT.cycle('—','first board in progress');else{const avg=c.reduce((a,b)=>a+b,0)/c.length;SMT.cycle(m.ct.toFixed(1)+' s','avg '+avg.toFixed(1)+' s · '+Math.round(3600/avg)+' boards/h · clean every '+CLEAN_EVERY,'CYCLE TIME · LAST BOARD');}
    const logEl=$('log');if(logEl&&logEl._n!==m.log.length+':'+(m.log[0]&&m.log[0].t)){logEl._n=m.log.length+':'+(m.log[0]&&m.log[0].t);logEl.innerHTML='';m.log.slice(0,6).forEach(e=>{const d=document.createElement('div');d.textContent=e.text;if(e.cls)d.className=e.cls;logEl.appendChild(d);});}
  });
  C.expose({printer:m,st,sq,cam,disp,setHood,setSten,hmiPage:n=>{st.page=n;st.pageT=C.T.sim+1e-6;drawMon();},
    summary:()=>({printed:st.printed,cleans:st.cleans,dispenses:st.dispenses,beadDia:+(2*st.r()).toFixed(2),mass:+st.mass.toFixed(1),cart:+st.cart.toFixed(1),paper:+st.paper.toFixed(0),gPrint:+G_PRINT.toFixed(4),padA:+PAD_A.toFixed(1),flags:st.flags,faults:m.faults||0,ct:+m.ct.toFixed(2),paperFaults:st.paperFaults,cartFaults:st.cartFaults,bias:st.bias.slice()})});
}
return m;
});
