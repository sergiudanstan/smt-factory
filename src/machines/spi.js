/* ===================================================================
   MACHINE MODULE — SPI: in-line 3D solder paste inspection (single lane, lane 1).
   Units mm.  Local origin = machine centre on the floor; X = board flow, Y up, Z toward the operator.
   Footprint 1000 (X) x 1300 (Z) x 1550 (Y).  Conveyor (board bottom) at 900, lane 1 at z = +170.
   Board waits at the infeed buffer (x = -375), is inspected in the nest (x = 0), leaves to the exit (x = +375).
   XY linear-motor gantry carries the 3D head: 12 MP telecentric camera + two opposed moire fringe projectors
   (shadow-free dual projection) + white / RGB ring light.  7 x 5 = 35 FOV of 40 x 40 mm, serpentine.
   =================================================================== */
'use strict';
SMT3D.register('spi',function(C,opts){
const {THREE,PI,$,std,box,cyl,label,plate,canvasTex,run,tween,FRAME,CONV_Y,BW,BD,BT,KIT,FIDS,conveyTo}=C;
opts=opts||{};
const X=opts.x||0,SA=!!opts.standalone,ID=opts.id||'spi';
const LZ=170,HX=500,HZ=650,TOP=1550,BODY_TOP=860,SPLIT=900,BAND=1400,WX0=-405,WX1=405,BY=CONV_Y+BT;
const W=lx=>X+lx;
const machine=new THREE.Group();machine.position.x=X;C.parentFor(opts).add(machine);
const sm=(c,r=.5,mt=.1)=>{const x=std(c,r,mt);C.shellMats.push(x);return x;};
const M={body:sm(0xe6e9ec,.5,.08),body2:sm(0xd3d8dc,.55,.1),band:sm(0x2a2e34,.5,.2),dark:std(0x24272b,.6,.2),
  alu:std(0xb9c0c8,.35,.85),aluD:std(0x7d858f,.45,.8),steel:std(0xd5dadf,.22,.95),black:std(0x15171a,.55,.2),bed:std(0x20242a,.6,.1),
  red:std(0xc8202a,.5,.1),blue:std(0x1e6fd9,.45,.1),camBlue:std(0x3b4a5e,.35,.6),glassLens:std(0x0b1020,.05,.9),yellow:std(0xf2c400,.5,0),
  chain:std(0x2c3138,.5,.4),orange:std(0xff8a00,.5,0),cable:std(0x202326,.8,0),pcb:std(0x23563a,.5,.2)};
const NOSH={cast:false};
const em=(c,i)=>new THREE.MeshStandardMaterial({color:0x222222,emissive:c,emissiveIntensity:i,roughness:.4});

/* ---------- small helpers ---------- */
const louvreTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#cfd4d9';g.fillRect(0,0,w,h);for(let y=10;y<h;y+=16){g.fillStyle='#3a3f46';g.fillRect(14,y,w-28,6);g.fillStyle='#fff';g.fillRect(14,y+6,w-28,1.5);}});
const louvM={};
function louvre(x,y,z,w,h,ry){const k=w+'x'+h;if(!louvM[k]){const t=louvreTex.clone();t.needsUpdate=true;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(w/260,h/260);louvM[k]=std(0xffffff,.6,.1,{map:t});}
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),louvM[k]);m.position.set(x,y,z);m.rotation.y=ry||0;machine.add(m);return m;}
function foot(x,z){cyl(machine,46,50,14,M.steel,x,7,z,{seg:20});cyl(machine,13,13,36,M.steel,x,30,z,{seg:12});cyl(machine,22,22,12,M.black,x,45,z,{seg:6});cyl(machine,22,22,10,M.black,x,92,z,{seg:6});}
function estop(parent,x,y,z,ry){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry||0;parent.add(g);
  cyl(g,34,34,6,M.yellow,0,0,0,{rx:PI/2,cast:false});cyl(g,24,19,28,M.red,0,0,16,{rx:PI/2,cast:false});cyl(g,13,13,10,M.black,0,0,32,{rx:PI/2,cast:false});return g;}
function warn(parent,x,y,z,ry,txt,sz){plate(parent,txt,sz||70,sz?sz*.8:56,x,y,z,{bg:'#f2c400',fg:'#111',border:'#111',ry:ry||0,pw:256});}

/* ===================================================================
   CABINET — white / light-grey body, dark upper band, front window, louvred side panels
   =================================================================== */
box(machine,2*HX,BODY_TOP-120,2*HZ,M.body,0,(BODY_TOP+120)/2,0,NOSH);
box(machine,2*HX-70,110,2*HZ-70,M.dark,0,60,0,NOSH);
[[-430,-590],[-430,0],[-430,590],[430,-590],[430,0],[430,590]].forEach(p=>foot(p[0],p[1]));
box(machine,2*HX+4,10,2*HZ+4,M.band,0,121,0,NOSH);                                  // base trim
// lower front: two doors with seams, hinges, handles, vent strips
[-1,1].forEach(s=>{const cx=s*246;
  box(machine,484,676,14,M.body2,cx,490,HZ+7,NOSH);
  [200,760].forEach(y=>box(machine,16,60,10,M.steel,s*488,y,HZ+14,NOSH));            // hinges
  box(machine,16,150,16,M.steel,s*34,500,HZ+22,NOSH);box(machine,10,10,30,M.steel,s*34,440,HZ+14,NOSH);box(machine,10,10,30,M.steel,s*34,560,HZ+14,NOSH);
  louvre(cx,215,HZ+14.4,380,70);
  box(machine,420,2,2,M.black,cx,262,HZ+14.6,NOSH);box(machine,420,2,2,M.black,cx,168,HZ+14.6,NOSH);
});
box(machine,5,676,16,M.black,0,490,HZ+8,NOSH);
cyl(machine,12,12,8,M.black,-70,640,HZ+18,{rx:PI/2,cast:false});box(machine,3,18,9,M.steel,-70,640,HZ+23,NOSH);   // key lock
cyl(machine,20,20,12,M.yellow,70,700,HZ+20,{rx:PI/2,cast:false});cyl(machine,12,12,22,M.red,70,700,HZ+30,{rx:PI/2,cast:false});box(machine,6,26,8,M.black,70,700,HZ+42,NOSH); // main switch
plate(machine,['SPI-3D  INLINE','230 V AC · 50/60 Hz · 1.2 kVA','air 0.5 MPa · 6 mm','SN 26-0451 · 2026'],200,84,360,330,HZ+14.6,{bg:'#e9ecef',pw:640,border:'#9aa2ab'});
plate(machine,['ESD PROTECTED AREA'],110,40,-340,330,HZ+14.6,{bg:'#1e6fd9',fg:'#fff',pw:300});
// upper front columns (white) with dark top section
[[-1,-452.5],[1,452.5]].forEach(a=>{box(machine,95,BAND-BODY_TOP,20,M.body,a[1],(BAND+BODY_TOP)/2,HZ-10,NOSH);box(machine,95,TOP-BAND,20,M.band,a[1],(TOP+BAND)/2,HZ-10,NOSH);});
box(machine,2*HX,TOP-BODY_TOP,20,M.body,0,(TOP+BODY_TOP)/2,-HZ+10,NOSH);              // rear wall
box(machine,2*HX,20,300+HZ,M.body,0,TOP-10,(300-HZ)/2,NOSH);                            // roof (rear part)
box(machine,HX+WX0,20,HZ-300,M.body,(-HX+WX0)/2,TOP-10,(HZ+300)/2,NOSH);
box(machine,HX-WX1,20,HZ-300,M.body,(HX+WX1)/2,TOP-10,(HZ+300)/2,NOSH);
// side walls with transport openings (extruded), dark upper band, louvred lower panels
(function(){
  const sh=new THREE.Shape();sh.moveTo(-HZ,BODY_TOP);sh.lineTo(HZ,BODY_TOP);sh.lineTo(HZ,TOP);sh.lineTo(-HZ,TOP);sh.closePath();
  const ho=new THREE.Path();ho.moveTo(LZ-150,872);ho.lineTo(LZ+150,872);ho.lineTo(LZ+150,968);ho.lineTo(LZ-150,968);ho.closePath();sh.holes.push(ho);
  const g=new THREE.ExtrudeGeometry(sh,{depth:20,bevelEnabled:false});
  [-HX+20,HX].forEach(x=>{const m=new THREE.Mesh(g,M.body);m.rotation.y=-PI/2;m.position.x=x;machine.add(m);});
  [-1,1].forEach(s=>{
    box(machine,26,8,316,M.steel,s*(HX+3),971,LZ,NOSH);box(machine,26,8,316,M.steel,s*(HX+3),869,LZ,NOSH);
    box(machine,26,106,8,M.steel,s*(HX+3),920,LZ+154,NOSH);box(machine,26,106,8,M.steel,s*(HX+3),920,LZ-154,NOSH);
    box(machine,4,TOP-BAND,2*HZ,M.band,s*(HX+2),(TOP+BAND)/2,0,NOSH);                    // dark upper band
    box(machine,3,3,2*HZ-40,M.dark,s*(HX+.5),BODY_TOP+2,0,NOSH);
    louvre(s*(HX+.6),480,-300,560,640,s*PI/2);                                              // louvred service panel
    box(machine,2,640,3,M.black,s*(HX+.7),480,-20,NOSH);box(machine,2,640,3,M.black,s*(HX+.7),480,-580,NOSH);
    box(machine,2,3,560,M.black,s*(HX+.7),162,-300,NOSH);box(machine,2,3,560,M.black,s*(HX+.7),800,-300,NOSH);
    box(machine,10,150,20,M.steel,s*(HX+6),520,60,NOSH);                                    // panel handle
    plate(machine,['LED RADIATION','Do not stare into beam','Class 1M (IEC 62471)'],100,56,0,0,0,{bg:'#f2c400',border:'#111',pw:320}).position.set(s*(HX+.9),1100,-HZ+120);
    machine.children[machine.children.length-1].rotation.y=s*PI/2;
    // SMEMA / signal connector next to the transport opening
    box(machine,16,40,60,M.black,s*(HX+9),915,LZ+205,NOSH);cyl(machine,5,5,70,M.cable,s*(HX+9),925,LZ+245,{rx:PI/2,cast:false});
  });
  warn(machine,-HX-.9,1000,LZ-230,-PI/2,['HAND','PINCH'],70);
  const wt=canvasTex(128,128,(g2)=>{g2.clearRect(0,0,128,128);g2.fillStyle='#f2c400';g2.beginPath();g2.moveTo(64,10);g2.lineTo(120,112);g2.lineTo(8,112);g2.closePath();g2.fill();g2.strokeStyle='#111';g2.lineWidth=7;g2.stroke();g2.fillStyle='#111';g2.fillRect(59,44,10,36);g2.fillRect(59,88,10,10);});
  const w=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshBasicMaterial({map:wt,transparent:true}));w.position.set(HX+.9,1020,LZ-230);w.rotation.y=PI/2;machine.add(w);
})();
// lettering
(function(){
  const t=label(machine,'3D SPI',330,50,-452.5,1230,HZ+.8,{fg:'#222',pw:660,weight:'700',size:.74});t.rotation.z=PI/2;
  label(machine,'SPI',150,70,452.5,1475,HZ+.8,{fg:'#e9eaec',pw:300,weight:'800',size:.7});
  box(machine,6,TOP-BAND-40,3,M.blue,-452.5,1475,HZ+.6,NOSH);
  estop(machine,452.5,1190,HZ,0);estop(machine,-HX,1190,420,-PI/2);
  // status LEDs + USB + reset on the right column
  [[0x22e06a,1],[0xffa800,0],[0xff2a2a,0]].forEach((a,i)=>cyl(machine,6,6,4,em(a[0],a[1]?1.4:.15),425+i*20,1050,HZ+1,{rx:PI/2,cast:false}));
  box(machine,70,34,6,M.black,452.5,1010,HZ+2,NOSH);cyl(machine,8,8,6,M.blue,430,1010,HZ+6,{rx:PI/2,cast:false});box(machine,14,8,6,M.steel,466,1010,HZ+6,NOSH);box(machine,14,8,6,M.steel,484,1010,HZ+6,NOSH);
})();
// rear: service door, connector panel, air + power inlet
(function(){
  const z=-HZ-1;
  box(machine,620,620,4,M.body2,-120,1160,z,NOSH);box(machine,14,160,16,M.steel,160,1160,z-8,NOSH);
  box(machine,300,90,40,M.dark,330,1250,z-20,NOSH);
  [0,1,2,3].forEach(i=>{cyl(machine,12,12,22,M.black,230+i*40,1250,z-48,{rx:PI/2,cast:false});cyl(machine,8,8,24,M.steel,230+i*40,1250,z-46,{rx:PI/2,cast:false});});
  box(machine,70,50,18,M.black,330,1130,z-9,NOSH);cyl(machine,18,18,22,M.blue,420,1130,z-11,{rx:PI/2,cast:false});
  plate(machine,['AIR IN 0.5 MPa','Ø 8 mm'],80,40,420,1090,z-3,{bg:'#e9ecef',pw:256,ry:PI});
  plate(machine,['MAINS 230 V','PE'],80,40,330,1090,z-3,{bg:'#e9ecef',pw:256,ry:PI});
  louvre(-120,900,z,620,60,PI);
})();
// roof details: fan grille, cable duct, lifting lugs
(function(){
  const gt=canvasTex(128,128,(g)=>{g.fillStyle='#2b2f35';g.fillRect(0,0,128,128);g.strokeStyle='#8f969e';g.lineWidth=3;for(let r=10;r<64;r+=11){g.beginPath();g.arc(64,64,r,0,7);g.stroke();}g.beginPath();g.moveTo(64,0);g.lineTo(64,128);g.moveTo(0,64);g.lineTo(128,64);g.stroke();});
  const f=new THREE.Mesh(new THREE.CircleGeometry(80,32),std(0xffffff,.6,.2,{map:gt}));f.rotation.x=-PI/2;f.position.set(260,TOP+.5,-330);machine.add(f);
  cyl(machine,86,86,10,M.dark,260,TOP+5,-330,{seg:32});f.position.y=TOP+10.5;
  box(machine,600,40,90,M.aluD,-120,TOP+20,-480,NOSH);for(let i=0;i<30;i++)box(machine,4,42,92,M.dark,-400+i*20,TOP+20,-480,NOSH);
  [[-400,-500],[400,-500],[-400,300],[400,300]].forEach(p=>{cyl(machine,22,22,10,M.steel,p[0],TOP+5,p[1],{seg:16});cyl(machine,6,6,30,M.steel,p[0],TOP+22,p[1],{seg:10,rz:PI/2});});
})();

/* ---- hood (front window + dark band + roof front), hinged at the top ---- */
const hoodPivot=new THREE.Group();hoodPivot.position.set(0,TOP,300);machine.add(hoodPivot);
const glassMat=new THREE.MeshStandardMaterial({color:0x9db4c8,roughness:.05,metalness:.2,transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide});
(function(){
  const off=new THREE.Group();off.position.set(0,-TOP,-300);hoodPivot.add(off);
  const cx=(WX0+WX1)/2,w=WX1-WX0;
  box(off,w,18,HZ-300,M.body,cx,TOP-9,(HZ+300)/2,NOSH);
  box(off,w,TOP-BAND,18,M.band,cx,(TOP+BAND)/2,HZ-9,NOSH);box(off,w,TOP-BAND,4,M.band,cx,(TOP+BAND)/2,HZ+2,NOSH);
  label(off,'3D SOLDER PASTE INSPECTION',420,34,cx-40,(TOP+BAND)/2,HZ+4.5,{fg:'#dfe5ec',pw:900,size:.62,weight:'600'});
  box(off,120,4,2,M.blue,cx+300,(TOP+BAND)/2-24,HZ+4.6,NOSH);
  const fs=new THREE.Shape();fs.moveTo(WX0,SPLIT);fs.lineTo(WX1,SPLIT);fs.lineTo(WX1,BAND);fs.lineTo(WX0,BAND);fs.closePath();
  const ho=new THREE.Path();ho.moveTo(WX0+36,SPLIT+44);ho.lineTo(WX1-36,SPLIT+44);ho.lineTo(WX1-36,BAND-36);ho.lineTo(WX0+36,BAND-36);ho.closePath();fs.holes.push(ho);
  const ff=new THREE.Mesh(new THREE.ExtrudeGeometry(fs,{depth:14,bevelEnabled:false}),M.body);ff.position.z=HZ-14;off.add(ff);
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(w-72,BAND-SPLIT-80),glassMat);gl.position.set(cx,(BAND+SPLIT)/2+4,HZ-7);gl.renderOrder=5;off.add(gl);
  box(off,360,14,14,M.steel,cx,SPLIT+24,HZ+16,NOSH);box(off,14,14,22,M.steel,cx-170,SPLIT+24,HZ+6,NOSH);box(off,14,14,22,M.steel,cx+170,SPLIT+24,HZ+6,NOSH);
  box(off,30,60,20,M.black,WX1-20,SPLIT+90,HZ+8,NOSH);box(off,10,10,12,M.yellow,WX1-20,SPLIT+90,HZ+19,NOSH);       // door interlock switch
  [-1,1].forEach(s=>{cyl(off,7,7,260,M.steel,s*(w/2+3),TOP-170,300,{rx:PI/2-.2,cast:false});});                       // gas springs
  warn(off,cx-300,SPLIT+90,HZ+2.5,0,['LED','1M'],84);
})();
const hood={open:0,target:0};

/* ---- signal tower on the roof ---- */
const tower={};
(function(){
  const g=new THREE.Group();g.position.set(-452,TOP,HZ-60);machine.add(g);
  cyl(g,7,7,230,M.steel,0,115,0);cyl(g,26,26,10,M.dark,0,5,0);
  [['r',0xff2a2a,292],['y',0xffa800,261],['g',0x22e06a,230]].forEach(a=>{const mt=new THREE.MeshStandardMaterial({color:a[1],emissive:a[1],emissiveIntensity:.05,roughness:.3,transparent:true,opacity:.92});tower[a[0]]=mt;cyl(g,16,16,29,mt,0,a[2]+15,0);});
  cyl(g,17,17,6,M.dark,0,326,0);cyl(g,10,10,22,M.black,0,340,0);
})();

/* ---- operator station: monitor on an arm, keyboard drawer ---- */
let monTex,monCtx;
(function(){
  const g=new THREE.Group();g.position.set(470,0,HZ);machine.add(g);
  cyl(g,20,20,520,M.steel,20,1220,46);cyl(g,34,34,12,M.dark,20,970,46);cyl(g,34,34,12,M.dark,20,1480,46);box(g,44,300,18,M.aluD,0,1225,26,NOSH);
  box(g,260,34,34,M.body2,150,1472,46);cyl(g,22,22,40,M.dark,280,1472,46);
  box(g,50,34,230,M.body2,300,1472,160);cyl(g,22,22,40,M.dark,300,1472,278);
  const m=new THREE.Group();m.position.set(310,1385,330);m.rotation.y=-.42;g.add(m);
  box(m,560,350,34,M.black,0,0,0);box(m,150,150,30,M.dark,0,0,-30);box(m,110,40,14,M.steel,0,170,0,NOSH);
  const c=document.createElement('canvas');c.width=640;c.height=400;monCtx=c.getContext('2d');
  monTex=new THREE.CanvasTexture(c);monTex.encoding=THREE.sRGBEncoding;monTex.anisotropy=8;
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(525,318),new THREE.MeshBasicMaterial({map:monTex,toneMapped:false}));scr.position.set(0,0,17.5);m.add(scr);
  // keyboard drawer under the window
  [-1,1].forEach(s=>box(machine,10,6,230,M.steel,300+s*210,858,HZ+130,NOSH));
  box(machine,440,14,270,M.body2,300,866,HZ+135);
  const kt=canvasTex(512,160,(g2,w,h)=>{g2.fillStyle='#17191c';g2.fillRect(0,0,w,h);for(let r=0;r<5;r++)for(let k=0;k<(r==4?9:15);k++){g2.fillStyle='#3a3f46';if(r==4)g2.fillRect(8+k*(k==3?0:54)+(k>3?-0:0),8+r*30,k==3?250:48,24);else g2.fillRect(8+k*33.5,8+r*30,29,24);}});
  const kb=new THREE.Mesh(new THREE.BoxGeometry(380,16,120),M.black);kb.position.set(300,883,HZ+170);machine.add(kb);
  const kk=new THREE.Mesh(new THREE.PlaneGeometry(366,110),new THREE.MeshStandardMaterial({map:kt,roughness:.6}));kk.rotation.x=-PI/2;kk.position.set(300,891.2,HZ+170);machine.add(kk);
  cyl(machine,22,22,20,M.dark,440,880,HZ+190,{seg:20});cyl(machine,17,17,10,M.red,440,893,HZ+190,{seg:20});box(machine,40,10,60,M.dark,400,876,HZ+160,NOSH);
  box(machine,30,6,60,M.black,130,876,HZ+110,NOSH);
})();

/* ===================================================================
   INTERIOR — transport, clamp + support table, XY gantry with the 3D head
   =================================================================== */
const interior=new THREE.Group();machine.add(interior);
box(interior,2*HX-44,12,2*HZ-44,M.bed,0,856,0);
box(interior,2*HX-44,2,3,M.band,0,863,HZ-24,NOSH);
const inLight=new THREE.PointLight(0xe6eeff,.9,2400,1);inLight.position.set(0,1480,260);interior.add(inLight);
const ledMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xd8e6ff,emissiveIntensity:.9});
box(interior,880,8,26,ledMat,0,1536,-300,NOSH);box(interior,880,8,26,ledMat,0,1536,420,NOSH);

/* transport rails: infeed, nest, outfeed (one shared belt texture) */
const belt=C.belt(70);
C.railSeg(interior,-760,-190,LZ,{belt});C.railSeg(interior,190,760,LZ,{belt});C.railSeg(interior,-185,185,LZ,{belt});
[-640,-420,-250,250,420,640].forEach(x=>cyl(interior,6,6,BD+30,M.steel,x,CONV_Y-30,LZ,{rx:PI/2,seg:10}));
[-1,1].forEach(s=>{box(interior,70,36,18,M.black,s*690,CONV_Y-17,LZ+BD/2+22,NOSH);cyl(interior,14,14,24,M.aluD,s*735,CONV_Y-17,LZ+BD/2+15,{rx:PI/2,seg:16});});
[-440,440].forEach(x=>{box(interior,16,10,10,M.orange,x,CONV_Y-22,LZ+BD/2-6,NOSH);box(interior,16,10,10,M.orange,x,CONV_Y-22,LZ-BD/2+6,NOSH);});   // board-present sensors
cyl(interior,4,4,BD+30,M.steel,-300,CONV_Y-60,LZ,{rx:PI/2,seg:8});box(interior,30,30,40,M.black,-300,CONV_Y-60,LZ-BD/2-40,NOSH);           // width adjust spindle + stepper
const pinNest=C.stopper(interior,BW/2+7,LZ),pinExit=C.stopper(interior,375+BW/2+7,LZ);pinNest.userData.up=true;pinExit.userData.up=true;
const clamps=[];
[-1,1].forEach(s=>{const c=box(interior,344,1.2,7,M.steel,0,BY+.9,LZ+s*(BD/2+4),NOSH);c.userData.s=s;clamps.push(c);
  box(interior,40,10,20,M.aluD,-120,BY-4,LZ+s*(BD/2+14),NOSH);box(interior,40,10,20,M.aluD,120,BY-4,LZ+s*(BD/2+14),NOSH);});
/* support table with pins: rises under the board while clamped */
const sup=new THREE.Group();interior.add(sup);
(function(){
  box(sup,200,10,150,M.aluD,0,887,LZ);cyl(sup,18,18,22,M.alu,0,874,LZ,{seg:16});cyl(sup,5,5,40,M.steel,0,850,LZ,{seg:10});
  for(let ix=-3;ix<=3;ix++)for(let iz=-1;iz<=1;iz++)cyl(sup,2.4,2.4,8,M.steel,ix*28,896,LZ+iz*46,{seg:8,cast:false});
  [-1,1].forEach(s=>box(sup,170,8,8,M.alu,0,887,LZ+s*79,NOSH));
})();
/* fixed pneumatic lift cylinder body (under the plate) */
cyl(interior,24,24,56,M.blue,0,834,LZ,{seg:20});cyl(interior,30,30,6,M.steel,0,862,LZ,{seg:20});

/* gantry frame: posts, Z carrier profiles with linear-motor stators, guide rails */
const ZR0=-380,ZR1=620,ZL=ZR1-ZR0,ZC=(ZR0+ZR1)/2;
const statTex=canvasTex(64,16,(g)=>{g.fillStyle='#14161a';g.fillRect(0,0,64,16);g.fillStyle='#b3402c';g.fillRect(0,2,32,12);g.fillStyle='#2f5fa8';g.fillRect(32,2,32,12);},{repeat:true});
const statM={};
function stator(parent,len,x,y,z,axis){if(!statM[len]){const t=statTex.clone();t.needsUpdate=true;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(len/64,1);statM[len]=std(0xffffff,.5,.3,{map:t});}
  const mt=statM[len];return axis==='z'?box(parent,10,34,len,mt,x,y,z,NOSH):box(parent,len,34,10,mt,x,y,z,NOSH);}
[-1,1].forEach(s=>{const x=s*445;
  [-340,-100,380,580].forEach(z=>{box(interior,50,1048-862,50,M.aluD,x,(1048+862)/2,z);box(interior,70,10,70,M.alu,x,866,z,NOSH);});
  box(interior,56,64,ZL,M.alu,x,1080,ZC);box(interior,16,10,ZL,M.steel,x,1117,ZC,NOSH);box(interior,8,4,ZL,M.steel,x+s*30,1100,ZC,NOSH);
  stator(interior,ZL-140,x-s*33,1080,ZC,'z');
  [ZR0+10,ZR1-10].forEach(z=>box(interior,50,40,16,M.black,x,1128,z,NOSH));
  box(interior,40,8,ZL-60,M.aluD,x,1043,ZC,NOSH);
});
[-340,-100,380,580].forEach(z=>box(interior,2*445,30,30,M.aluD,0,880,z,NOSH));
box(interior,36,TOP-1130-30,40,M.aluD,-480,1380,-HZ+40);box(interior,36,TOP-1130-30,40,M.aluD,480,1380,-HZ+40);
/* Z axis cable chain (left) — InstancedMesh, poses computed per frame */
const NCH=44;
function chainMesh(w,len,thk,plane){const g=plane==='z'?new THREE.BoxGeometry(w,thk,len):new THREE.BoxGeometry(len,thk,w);
  const im=new THREE.InstancedMesh(g,M.chain,NCH);im.castShadow=true;interior.add(im);return im;}
const chZ=chainMesh(34,17,13,'z'),chX=chainMesh(30,17,13,'x'),_o=new THREE.Object3D();
function chainPose(im,plane,uc,uf,K,r,y0,fixed){ // fixed = other coordinate (x for z-chain, z for x-chain)
  const ub=(uc+uf-K)/2,m=uc-ub,total=m+(uf-ub)+PI*r,y1=y0+2*r;
  for(let i=0;i<NCH;i++){const s=(i+.5)/NCH*total;let u,v,a;
    if(s<m){u=uc-s;v=y1;a=PI;}else if(s<m+PI*r){const t=(s-m)/r;u=ub-r*Math.sin(t);v=y0+r+r*Math.cos(t);a=Math.atan2(-r*Math.sin(t),-r*Math.cos(t));}else{u=ub+(s-m-PI*r);v=y0;a=0;}
    _o.rotation.set(0,0,0);
    if(plane==='z'){_o.position.set(fixed,v,u);_o.rotation.x=-Math.atan2(Math.sin(a),-Math.cos(a)*-1)*0;
      const dz=Math.cos(a)*-1,dy=Math.sin(a);_o.rotation.x=-Math.atan2(dy,-dz*-1);}
    else{_o.position.set(u,v,fixed);_o.rotation.z=a+PI;}
    _o.updateMatrix();im.setMatrixAt(i,_o.matrix);}
  im.instanceMatrix.needsUpdate=true;}
// fixed-end brackets of the chains
box(interior,60,20,40,M.aluD,-395,1043,ZR1-40,NOSH);box(interior,50,8,ZL-300,M.aluD,-395,1046,ZC-100,NOSH);

/* ---------- moving gantry: Z beam (carries X guide + motor) ---------- */
const head={x:-360,z:0};
const zbeam=new THREE.Group();interior.add(zbeam);
const BOFF=129;                                                        // beam centre -> optical axis (z)
(function(){
  [-1,1].forEach(s=>{box(zbeam,66,56,150,M.aluD,s*445,1135,0);box(zbeam,60,18,130,M.black,s*445,1103,0,NOSH);box(zbeam,40,60,40,M.alu,s*445,1195,0);});
  box(zbeam,890,110,90,M.alu,0,1215,0);
  box(zbeam,890,6,6,M.steel,0,1243,48,NOSH);box(zbeam,890,6,6,M.steel,0,1187,48,NOSH);                  // X guide rails
  stator(zbeam,780,0,1215,48.5,'x');
  box(zbeam,890,24,60,M.aluD,0,1282,-6,NOSH);                                                           // chain tray
  box(zbeam,40,36,60,M.black,-420,1215,-6,NOSH);box(zbeam,40,36,60,M.black,420,1215,-6,NOSH);          // end stops
  [0xff3b3b,0x22e06a].forEach((c,i)=>cyl(zbeam,6,6,6,em(c,.5),-400+i*800,1215,-50,{rx:PI/2,cast:false}));
  box(zbeam,60,24,60,M.cable,-395,1130,0,NOSH);                                                         // Z chain moving-end bracket
  label(zbeam,'X-AXIS · LINEAR MOTOR',280,18,-250,1244,-45.6,{fg:'#ddd',bg:'#22262c',pw:512,size:.56,ry:PI});
})();
const xcar=new THREE.Group();zbeam.add(xcar);
/* the 3D head: telecentric 12 MP camera, two opposed fringe projectors, ring light */
const headG=new THREE.Group();headG.position.z=BOFF;xcar.add(headG);
const ringW=em(0xffffff,0),ringC=em(0xffffff,0),lensLed=[];
const projLens=[],beams=[],fringeTex=canvasTex(64,4,(g,w,h)=>{for(let x=0;x<w;x++){const v=Math.round(255*(.5+.5*Math.sin(x/w*PI*2)));g.fillStyle='rgb('+v+','+v+','+v+')';g.fillRect(x,0,1,h);}},{repeat:true});
fringeTex.repeat.set(16,1);
(function(){
  // carriage + mounting plate on the X guide
  box(xcar,170,120,22,M.aluD,0,1215,60);box(xcar,200,470,20,M.alu,0,1225,BOFF-57);
  [-1,1].forEach(sx=>[-1,1].forEach(sy=>box(xcar,40,24,18,M.black,sx*60,1215+sy*28,48,NOSH)));      // guide blocks
  box(xcar,36,100,40,M.aluD,40,1315,BOFF-10-48);                                                        // chain moving-end bracket
  // telecentric lens
  cyl(headG,33,33,330,std(0x1a1d22,.35,.5),0,1175,0,{seg:36});
  [1100,1180,1260,1320].forEach(y=>cyl(headG,36,36,7,M.steel,0,y,0,{seg:36}));
  cyl(headG,39,39,26,M.black,0,1070,0,{seg:36});for(let i=0;i<24;i++){const a=i/24*PI*2;box(headG,2,24,3,M.aluD,Math.cos(a)*39.5,1070,Math.sin(a)*39.5,{cast:false,ry:-a});}
  cyl(headG,29,29,2,M.glassLens,0,1009.4,0,{seg:36,cast:false});cyl(headG,34,33,8,M.black,0,1014,0,{seg:36});
  label(headG,'TELECENTRIC  0.26×  13 µm/px',130,14,0,1235,34.2,{fg:'#ddd',bg:'#15171a',pw:512,size:.62});
  // camera body
  cyl(headG,31,31,22,M.alu,0,1348,0,{seg:30});box(headG,78,84,104,M.camBlue,0,1405,0);box(headG,70,6,96,M.dark,0,1449,0,NOSH);
  label(headG,'12 MP · CoaXPress',72,14,0,1412,52.2,{fg:'#fff',pw:300,size:.6});
  cyl(headG,8,8,16,M.black,0,1450,-30,{seg:12});cyl(headG,5,5,150,M.cable,0,1500,-40,{seg:8,cast:false});
  lensLed.push(cyl(headG,3,3,3,em(0x22e06a,1),30,1430,52,{rx:PI/2,cast:false}));
  // ring light: white + RGB LED rings in a dark housing below the lens
  const hr=new THREE.Mesh(new THREE.TorusGeometry(46,9,10,40),M.black);hr.rotation.x=PI/2;hr.position.y=1022;headG.add(hr);
  const rw=new THREE.Mesh(new THREE.TorusGeometry(46,4,8,40),ringW);rw.rotation.x=PI/2;rw.position.y=1014;headG.add(rw);
  const rc=new THREE.Mesh(new THREE.TorusGeometry(38,3.4,8,40),ringC);rc.rotation.x=PI/2;rc.position.y=1015;headG.add(rc);
  [-1,1].forEach(s=>box(headG,8,30,14,M.black,s*52,1040,0));
  // two moire fringe projectors on opposite sides
  const ang=Math.atan2(88,1040-BY-.2);
  [-1,1].forEach((s,i)=>{
    const p=new THREE.Group();p.position.set(s*88,1040,0);p.rotation.z=-s*ang;headG.add(p);
    cyl(p,22,24,34,M.black,0,-17,0,{seg:20});const lens=cyl(p,19,19,2,em(0xbfd8ff,0),0,-34.5,0,{seg:20,cast:false});projLens.push(lens.material=em(0xbfd8ff,0));
    box(p,62,130,70,M.camBlue,0,82,0);box(p,66,10,74,M.dark,0,148,0,NOSH);
    for(let k=0;k<7;k++)box(p,2,70,66,M.aluD,s*32,95,-28+k*9.5,NOSH);                                  // heat-sink fins
    cyl(p,22,22,5,M.dark,-s*0,90,36,{rx:PI/2,seg:20,cast:false});for(let k=0;k<3;k++)box(p,38,2,2,M.steel,0,80+k*10,38.5,NOSH);
    label(p,'PROJECTOR '+(i?'B':'A'),84,14,0,108,35.4,{fg:'#fff',pw:360,size:.6});
    box(headG,70,16,40,M.aluD,s*(88+105*Math.tan(ang)+4),1150,-38);                                    // mount bracket to plate
    // light pyramid projector -> FOV (layer 1: visible in the 3D view only)
    const gc=new THREE.BufferGeometry(),a=[s*88,1006,0],tl=[-20,BY+.4,-20],tr=[20,BY+.4,-20],br=[20,BY+.4,20],bl=[-20,BY+.4,20];
    const q=[[-9,9,0],[9,9,0],[9,-9,0],[-9,-9,0]].map(v=>[a[0]+v[2]*0,a[1]+0,a[2]+v[0]]);
    const T=[tl,tr,br,bl];const pos=[];[[0,1],[1,2],[2,3],[3,0]].forEach(e=>{const A=q[e[0]],B=q[e[1]],C1=T[e[0]],D=T[e[1]];pos.push(...A,...C1,...B,...B,...C1,...D);});
    gc.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    const bm=new THREE.Mesh(gc,new THREE.MeshBasicMaterial({color:0xa8cfff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false}));
    bm.layers.set(1);headG.add(bm);beams.push(bm);
  });
  // fringe pattern on the board + FOV frame (layer 2: shown in 3D view and in the 2D camera)
  const fg=new THREE.PlaneGeometry(40,40);fg.rotateX(-PI/2);
  const fr=new THREE.Mesh(fg,new THREE.MeshBasicMaterial({map:fringeTex,color:0xcfe3ff,transparent:true,opacity:.0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  fr.position.y=BY+.3;fr.layers.set(2);fr.renderOrder=3;headG.add(fr);headG.userData.fringe=fr;
  const fl=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(40,.1,40)),new THREE.LineBasicMaterial({color:0x4fd1ff,transparent:true,opacity:.0}));
  fl.position.y=BY+.4;fl.layers.set(2);headG.add(fl);headG.userData.frame=fl;
})();
C.bake(headG);C.dyn(headG);C.bake(xcar);C.dyn(xcar);C.bake(zbeam);C.dyn(zbeam);

/* cable-chain bends for the Z axis (static end) + X axis chain below */
const ZCH={y0:1060,r:20,xf:-395},XCH={y0:1290,r:20,zf:30};

/* calibration target: stepped reference plate, front right (reachable by the head) */
const CAL={x:310,z:400};
(function(){
  box(interior,110,34,110,M.aluD,CAL.x,877,CAL.z);box(interior,100,6,100,M.steel,CAL.x,BY-4,CAL.z);
  [[-.55,-.55],[.55,-.55],[-.55,.55],[.55,.55]].forEach((q,i)=>box(interior,30,1.2+i*.7,30,M.alu,CAL.x+q[0]*40,BY-1+(1.2+i*.7)/2,CAL.z+q[1]*40,NOSH));
  label(interior,'HEIGHT REF  50/100/150/200 µm',100,12,CAL.x,BY-.9,CAL.z+48,{rx:-PI/2,fg:'#111',bg:'#e9ecef',pw:512,size:.6});
})();

/* pneumatics + valve terminal on the rear wall (interior side) */
(function(){
  const z=-HZ+22,gt=canvasTex(128,128,(g)=>{g.fillStyle='#f6f6f4';g.beginPath();g.arc(64,64,62,0,7);g.fill();g.strokeStyle='#222';g.lineWidth=3;for(let a=-2.3;a<=2.3;a+=.38){g.beginPath();g.moveTo(64+Math.sin(a)*46,64-Math.cos(a)*46);g.lineTo(64+Math.sin(a)*56,64-Math.cos(a)*56);g.stroke();}
    g.strokeStyle='#c22';g.lineWidth=4;g.beginPath();g.moveTo(64,64);g.lineTo(90,38);g.stroke();g.fillStyle='#1e78d6';g.font='700 15px Arial';g.textAlign='center';g.fillText('bar',64,98);});
  const gm=std(0xffffff,.4,0,{map:gt});
  for(let i=0;i<3;i++){const x=-320+i*80;box(interior,46,70,46,M.black,x,1060,z+23);cyl(interior,17,17,44,M.blue,x,1117,z+23);
    cyl(interior,24,24,14,M.black,x,1045,z+52,{rx:PI/2,cast:false});const f=new THREE.Mesh(new THREE.CircleGeometry(21,24),gm);f.position.set(x,1045,z+59.5);interior.add(f);}
  box(interior,300,70,50,M.white||M.body,40,1050,z+25);for(let i=0;i<14;i++)box(interior,12,56,6,std(0xd6d8da,.6),-92+i*20,1050,z+53,NOSH);
  box(interior,900,50,40,M.body2,0,960,z+20);for(let i=0;i<8;i++)cyl(interior,3,3,60,M.hose||M.blue,-300+i*80,1000,z+45,{rz:PI/2,seg:8,cast:false});
})();
const interiorStatic=interior;

/* ===================================================================
   RUNTIME — measurement model, SPC, scan sequence, SMEMA handoff, UI
   =================================================================== */
const PADS=KIT.pads,NP=PADS.length,FX=7,FZ=5,NF=FX*FZ,FP=[35,40],FT=.17/9;
const LIM={vol:[50,150],h:[60,200],off:150,area:[60,150]},NOM=130;
const order=[];for(let j=0;j<FZ;j++)for(let k=0;k<FX;k++)order.push([j%2?FX-1-k:k,j]);
const ordIdx={};order.forEach((o,n)=>ordIdx[o[0]+','+o[1]]=n);
const fovPos=n=>[order[n][0]*FP[0]-105,order[n][1]*FP[1]-80];                 // FOV centre in board coordinates
const padFov=new Int16Array(NP),padEff=new Float32Array(NP),padsBy=Array.from({length:NF},()=>[]);
PADS.forEach((p,i)=>{const fi=Math.max(0,Math.min(FX-1,Math.round((p[0]+105)/FP[0]))),fj=Math.max(0,Math.min(FZ-1,Math.round((p[1]+80)/FP[1]))),n=ordIdx[fi+','+fj];
  padFov[i]=n;padsBy[n].push(i);const ar=p[2]*p[3]/(2*(p[2]+p[3])*.13);padEff[i]=Math.max(.74,Math.min(1.02,.80+.34*(ar-.45)));});
const gauss=()=>{let u=0,v=0;while(!u)u=Math.random();v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*PI*v);};
const regionOf=p=>p[4].split('.')[0];
const ALIAS={'QFP-100':'U2','QFP-64':'U4','QFP-44':'U5'};
const D={vol:new Float32Array(NP),h:new Float32Array(NP),area:new Float32Array(NP),ox:new Float32Array(NP),oy:new Float32Array(NP),fl:new Uint8Array(NP)};
const FLAGN=['VOLUME','HEIGHT','OFFSET','AREA','BRIDGE'];
const st={step:-1,name:'IDLE',sub:'—',fov:0,q:[],out:null,cur:null,clamp:0,sup:0,insp:0,ok:0,ng:0,lowStreak:0,fb:0,cleans:0,cals:0,lastCal:0,calReq:false,
  offBad:[],revPos:null,drift:{x:(Math.random()-.5)*70,y:(Math.random()-.5)*50},img:null,ring:0,forceFlag:0,last:null,hist:[],fidOff:[0,0],tScan:0,imgIdx:-1,calGain:1};
const CAL_EVERY=3*3600,CAL_DUR=45,ACC=12,VMAX=1.5;
const STEPS=['INFEED','CLAMP','FIDUCIALS','3D SCAN','COMPUTE','UNCLAMP','OUTFEED'];

const m=C.machine({id:ID,line:opts.line,name:opts.name||'SPI',kind:'spi',group:machine,x:X,length:2*HX,depth:2*HZ,height:TOP,lanes:[1],inReach:250,outReach:250,inX:-HX,outX:HX,
  spec:{footprint:'1000 × 1300 × 1550 mm',lanes:'1',fov:'40 × 40 mm',camera:'12 MP telecentric, 0.26×, 13 µm/px, CoaXPress 4-lane',projectors:'2 × moiré, dual',repeat:'< 1 µm height, Gage R&R < 10 %'}});

function setStep(i,sub){st.step=i;st.name=STEPS[i];st.sub=sub||'—';m.step=st.name;m.detail=st.sub;}
function* moveHead(x,z){const x0=head.x,z0=head.z,d=Math.hypot(x-x0,z-z0)/1000,T=Math.max(.05,2*Math.sqrt(d/ACC),d/VMAX+VMAX/ACC);
  yield* tween(T,k=>{const e=C.smooth(k);head.x=x0+(x-x0)*e;head.z=z0+(z-z0)*e;},true);}
function* shoot(n,kind){st.img={t0:C.T.sim,n,kind};yield n*FT;st.img=null;}

/* ----- measurement generation for one board (honest numbers from KIT.pads) ----- */
function measure(b){
  const sp=b.spi||(b.spi={}),flagged=!!sp.printerFlag||st.forceFlag>0;
  if(st.forceFlag>0&&!sp.printerFlag){sp.printerFlag='INSUFFICIENT PASTE';sp.region='U2';}
  if(st.forceFlag>0)st.forceFlag--;
  /* print offset = bounded process drift (mean-reverting around a systematic stencil/board offset) + the printer's SPI-fed table bias */
  if(!st.drift0)st.drift0={x:st.drift.x,y:st.drift.y};
  st.drift.x+=(st.drift0.x-st.drift.x)*.04+gauss()*5;st.drift.y+=(st.drift0.y-st.drift.y)*.04+gauss()*4;
  const prn=m.line.machines.find(x=>x.kind==='printer'),pb=prn&&prn.st&&prn.st.bias?prn.st.bias:[0,0];
  const off={x:st.drift.x+pb[0]+gauss()*4,y:st.drift.y+pb[1]+gauss()*4},bg=1+gauss()*.012;
  const aff=new Set();
  if(flagged){let reg=ALIAS[sp.region]||sp.region||'';PADS.forEach((p,i)=>{if(regionOf(p)===reg)aff.add(i);});
    if(!aff.size){reg=regionOf(PADS[Math.floor(Math.random()*NP)]);PADS.forEach((p,i)=>{if(regionOf(p)===reg)aff.add(i);});sp.region=reg;}}
  for(let i=0;i<NP;i++){const e=padEff[i],sg=.062+(1-e)*.2;
    let h=NOM*e*bg*(1+gauss()*sg),ar=97+gauss()*3.6;
    if(aff.has(i)){const f=.55+.25*Math.random(),vt=.18+.27*Math.random();h*=f;ar=Math.min(ar,97)*vt/f;}
    ar=Math.max(5,Math.min(220,ar));D.h[i]=h;D.area[i]=ar;D.vol[i]=h/NOM*ar;D.ox[i]=off.x+gauss()*9;D.oy[i]=off.y+gauss()*9;D.fl[i]=0;}
  if(!flagged&&Math.random()<.01){                                              // ~1 % random NG: bridge or excess
    const i=Math.floor(Math.random()*NP);
    if(Math.random()<.5){let q=-1,bd=1e9;for(let k=0;k<NP;k++){if(k===i)continue;const d=Math.hypot(PADS[k][0]-PADS[i][0],PADS[k][1]-PADS[i][1]);if(d<bd){bd=d;q=k;}}
      [i,q].forEach(k=>{D.area[k]=160+Math.random()*30;D.vol[k]=D.h[k]/NOM*D.area[k]*1.05;D.fl[k]|=16;});sp.defect='BRIDGE';}
    else{D.h[i]*=1.62;D.area[i]=118+Math.random()*10;D.vol[i]=D.h[i]/NOM*D.area[i];sp.defect='EXCESS';}}
  let sv=0,sv2=0,sh=0,sx=0,sy=0,nng=0,nlow=0,w={pad:'',vol:100},wd=-1;const reasons={};
  for(let i=0;i<NP;i++){let f=D.fl[i];
    if(D.vol[i]<LIM.vol[0]||D.vol[i]>LIM.vol[1])f|=1;if(D.h[i]<LIM.h[0]||D.h[i]>LIM.h[1])f|=2;
    if(Math.max(Math.abs(D.ox[i]),Math.abs(D.oy[i]))>LIM.off)f|=4;if(D.area[i]<LIM.area[0]||D.area[i]>LIM.area[1])f|=8;
    D.fl[i]=f;if(f){nng++;for(let k=0;k<5;k++)if(f>>k&1)reasons[FLAGN[k]]=(reasons[FLAGN[k]]||0)+1;}if(D.vol[i]<LIM.vol[0])nlow++;
    sv+=D.vol[i];sv2+=D.vol[i]*D.vol[i];sh+=D.h[i];sx+=D.ox[i];sy+=D.oy[i];
    const dv=Math.abs(D.vol[i]-100);if(dv>wd){wd=dv;w={pad:PADS[i][4],vol:+D.vol[i].toFixed(0)};}}
  const mu=sv/NP,sd=Math.sqrt(Math.max(1e-6,sv2/NP-mu*mu)),cpk=Math.min(LIM.vol[1]-mu,mu-LIM.vol[0])/(3*sd);
  const ix=[];for(let i=0;i<NP;i++)ix.push(i);ix.sort((a,b)=>(D.fl[b]?1e3:0)+Math.abs(D.vol[b]-100)-(D.fl[a]?1e3:0)-Math.abs(D.vol[a]-100));
  sp.top=ix.slice(0,5).map(i=>({pad:PADS[i][4],vol:D.vol[i],h:D.h[i],ng:!!D.fl[i]}));
  Object.assign(sp,{ng:nng>0,volMean:mu,hMean:sh/NP,offX:sx/NP,offY:sy/NP,worst:w,cpk,nNg:nng,nLow:nlow,reasons,volSd:sd,pads:NP,areaMean:0});
  return sp;
}

/* ----- height map (3D inset) + heat map (monitor) buffers ----- */
const heat=document.createElement('canvas');heat.width=500;heat.height=400;const hg=heat.getContext('2d');
function heatClear(){hg.fillStyle='#0c2a20';hg.fillRect(0,0,500,400);hg.strokeStyle='rgba(255,255,255,.07)';hg.lineWidth=1;
  for(let i=0;i<=FX;i++){const x=(i*FP[0]-105-20+125)*2;hg.beginPath();hg.moveTo(x,0);hg.lineTo(x,400);hg.stroke();}
  for(let j=0;j<=FZ;j++){const y=(j*FP[1]-80-20+100)*2;hg.beginPath();hg.moveTo(0,y);hg.lineTo(500,y);hg.stroke();}}
heatClear();
const volCol=v=>{const h=v<=50?225:v<=100?225-(v-50)/50*95:v<=150?130-(v-100)/50*130:0;return 'hsl('+h.toFixed(0)+',85%,52%)';};
const hGeo=(function(){const pos=new Float32Array(NP*12),ah=new Float32Array(NP*4),af=new Float32Array(NP*4),idx=new Uint32Array(NP*6);
  PADS.forEach((p,i)=>{const w=Math.max(p[2],.12)/2,d=Math.max(p[3],.12)/2,c=[[-w,-d],[w,-d],[w,d],[-w,d]];
    c.forEach((q,k)=>{pos.set([p[0]+q[0],0,p[1]+q[1]],i*12+k*3);});idx.set([0,2,1,0,3,2].map(a=>a+i*4),i*6);});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aH',new THREE.BufferAttribute(ah,1));g.setAttribute('aF',new THREE.BufferAttribute(af,1));
  g.setIndex(new THREE.BufferAttribute(idx,1));return g;})();
const hMat=new THREE.ShaderMaterial({uniforms:{rng:{value:300},tm:{value:0}},side:THREE.DoubleSide,
  vertexShader:'attribute float aH;attribute float aF;varying float vH;varying float vF;varying vec2 vP;void main(){vH=aH;vF=aF;vP=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float rng;uniform float tm;varying float vH;varying float vF;varying vec2 vP;\nvec3 jet(float t){return clamp(vec3(1.5-abs(4.*t-3.),1.5-abs(4.*t-2.),1.5-abs(4.*t-1.)),0.,1.);}\nvoid main(){if(vH<=0.)discard;float h=vH*(1.+.035*sin(vP.x*41.)*cos(vP.y*37.));float t=clamp(h/rng,0.,1.);vec3 c=jet(t);if(vF>.5)c=mix(c,vec3(1.,.1,.7),.55+.35*sin(tm*9.));gl_FragColor=vec4(c,1.);}'});
const hMesh=new THREE.Mesh(hGeo,hMat);hMesh.position.set(0,BY+.5,LZ);hMesh.layers.set(3);hMesh.frustumCulled=false;machine.add(hMesh);
const hBase=new THREE.Mesh(C.FLAT(BW,BD),new THREE.MeshBasicMaterial({color:0x0a1550}));hBase.position.set(0,BY+.2,LZ);hBase.layers.set(3);machine.add(hBase);
function revealFov(n){const fp=fovPos(n);st.revPos=[fp[0],fp[1]];const aH=hGeo.attributes.aH.array,aF=hGeo.attributes.aF.array;
  padsBy[n].forEach(i=>{const hh=D.h[i],f=D.fl[i]?1:0;for(let k=0;k<4;k++){aH[i*4+k]=hh;aF[i*4+k]=f;}
    const p=PADS[i],x=(p[0]+125)*2,y=(p[1]+100)*2,w=Math.max(p[2]*2,3),d=Math.max(p[3]*2,3);hg.fillStyle=volCol(D.vol[i]);hg.fillRect(x-w/2,y-d/2,w,d);
    if(D.fl[i]){hg.strokeStyle='#fff';hg.lineWidth=1.5;hg.strokeRect(x-w/2-2,y-d/2-2,w+4,d+4);}});
  hGeo.attributes.aH.needsUpdate=true;hGeo.attributes.aF.needsUpdate=true;}
function resetMaps(){st.revPos=null;hGeo.attributes.aH.array.fill(0);hGeo.attributes.aF.array.fill(0);hGeo.attributes.aH.needsUpdate=true;hGeo.attributes.aF.needsUpdate=true;heatClear();}

/* ----- SPC ----- */
function limits(){const v=st.hist.map(h=>h.v),n=v.length;if(n<6)return{cl:91,u:97,l:85,n};const cl=v.reduce((a,b)=>a+b,0)/n,s=Math.sqrt(v.reduce((a,b)=>a+(b-cl)*(b-cl),0)/(n-1));return{cl,u:cl+3*s,l:cl-3*s,n};}
function drawSpc(g,x,y,w,h,col){
  const L=limits(),v=st.hist.map(a=>a.v);let lo=Math.min(L.l,...v)-1.5,hi=Math.max(L.u,...v)+1.5;
  g.save();g.fillStyle=col.bg;g.fillRect(x,y,w,h);g.font='500 10px Consolas,monospace';g.textBaseline='middle';
  const Y=val=>y+8+(1-(val-lo)/(hi-lo))*(h-20),X0=x+34,X1=x+w-6,dx=(X1-X0)/29;
  g.strokeStyle=col.line;g.lineWidth=1;g.strokeRect(X0,y+4,X1-X0,h-12);
  [[L.u,'UCL',col.ng],[L.cl,'CL',col.mut],[L.l,'LCL',col.ng]].forEach(a=>{g.strokeStyle=a[2];g.setLineDash(a[1]=='CL'?[]:[4,3]);g.beginPath();g.moveTo(X0,Y(a[0]));g.lineTo(X1,Y(a[0]));g.stroke();g.setLineDash([]);
    g.fillStyle=a[2];g.textAlign='right';g.fillText(a[0].toFixed(1),X0-3,Y(a[0]));});
  g.strokeStyle=col.acc;g.lineWidth=1.4;g.beginPath();v.forEach((a,i)=>{const px=X0+i*dx;i?g.lineTo(px,Y(a)):g.moveTo(px,Y(a));});g.stroke();
  st.hist.forEach((a,i)=>{const bad=a.v>L.u||a.v<L.l||a.ng;g.fillStyle=bad?col.ng:col.acc;g.beginPath();g.arc(X0+i*dx,Y(a.v),bad?3.2:2.2,0,7);g.fill();});
  g.fillStyle=col.tx;g.textAlign='left';g.fillText('X̄ VOLUME %  ·  last '+v.length+' boards',X0+4,y+h-4);g.restore();
}

/* ----- closed loop + board result ----- */
function* finishBoard(b,sp){
  const t=C.T.sim;st.insp++;
  if(sp.ng){st.ng++;m.counters.ng++;b.result='NG';b.ngBy='SPI';}else st.ok++;
  st.hist.push({v:sp.volMean,ng:sp.ng,cpk:sp.cpk,t});if(st.hist.length>30)st.hist.shift();st.last=sp;
  const rs=Object.keys(sp.reasons).map(k=>k+' ×'+sp.reasons[k]).join(' · ');
  m.addLog('#'+b.sn+'  '+(sp.ng?'NG  '+(sp.defect?sp.defect+' · ':'')+rs+'  worst '+sp.worst.pad+' '+sp.worst.vol+' %':'PASS  vol '+sp.volMean.toFixed(0)+' %  h '+sp.hMean.toFixed(0)+' µm  Cpk '+sp.cpk.toFixed(2)),sp.ng?'ng':'ok');
  const printer=m.line.machines.find(x=>x.kind==='printer');
  st.offBad.push(Math.abs(sp.offX)>25||Math.abs(sp.offY)>25?1:0);if(st.offBad.length>5)st.offBad.shift();
  if(st.offBad.filter(a=>a).length>=3){st.offBad.length=0;const dx=-sp.offX,dy=-sp.offY;if(printer?.applyOffset)printer.applyOffset(dx,dy);else{st.drift.x+=dx;st.drift.y+=dy;}st.fb++;
    m.addLog('Closed loop → printer  ΔX '+(dx>=0?'+':'')+dx.toFixed(0)+' / ΔY '+(dy>=0?'+':'')+dy.toFixed(0)+' µm'+(printer?'':'  (no printer in this line: simulated)'),'cl');}
  const low=!!sp.printerFlag||sp.nLow>=5;st.lowStreak=low?st.lowStreak+1:0;
  if(st.lowStreak>=2){printer?.requestClean?.();st.cleans++;st.lowStreak=0;m.addLog('2 low-volume boards → stencil clean requested'+(printer?'':'  (simulated)'),'cl');}
  yield 0;
}

/* ----- calibration (SETUP) ----- */
function* calibrate(){
  const t0=C.T.sim;st.calReq=false;st.step=-1;st.fov=0;st.name='SETUP';m.setState('SETUP','SETUP','HEIGHT CALIBRATION');st.sub='MOVE TO REFERENCE TARGET';m.addLog('Height calibration started (reference target)','cl');
  yield* moveHead(CAL.x,CAL.z);
  const steps=[['ZERO PLANE',0],['STEP 1 · 50 µm',50],['STEP 2 · 100 µm',100],['STEP 3 · 150 µm',150],['STEP 4 · 200 µm',200]];
  for(let i=0;i<steps.length;i++){const q=steps[i];st.sub=q[0];m.detail=st.sub;
    yield* moveHead(CAL.x+((i%2)?-1:1)*(i?22:0),CAL.z+(i>2?22:i?-22:0));
    const tend=C.T.sim+5.4;while(C.T.sim<tend){yield* shoot(9);}}
  st.sub='FIT GAIN / OFFSET';m.detail=st.sub;st.img=null;yield 3.5;
  st.calGain=1+gauss()*.002;st.drift.x*=.8;
  yield* moveHead(-360,0);
  const rem=CAL_DUR-(C.T.sim-t0);if(rem>0)yield rem;
  st.cals++;st.lastCal=C.T.sim;m.addLog('Calibration done · gain '+st.calGain.toFixed(4)+' · offset '+(gauss()*.3).toFixed(1)+' µm','ok');
}

/* ----- SMEMA ----- */
m.canAccept=lane=>lane===1&&!m.down&&st.q.length===0;
m.onAccept=b=>{b.mv=run(conveyTo(b,W(-375),belt));st.q.push(b);};
m.onRelease=b=>{st.out=null;pinExit.userData.up=false;belt.moving++;run((function*(){yield 1.5;belt.moving--;pinExit.userData.up=true;})());};
function* exitMove(b){yield* conveyTo(b,W(375),belt);m.setReady(b,1);}

function* main(){
  while(true){
    if(C.T.sim-st.lastCal>CAL_EVERY||st.calReq)yield* calibrate();
    if(!st.q.length){st.step=-1;st.name='IDLE';st.sub='WAITING FOR BOARD';m.setState('STARVED','WAIT BOARD','no board from upstream');}
    while(!st.q.length){if(C.T.sim-st.lastCal>CAL_EVERY||st.calReq){yield* calibrate();if(!st.q.length){st.name='IDLE';st.sub='WAITING FOR BOARD';m.setState('STARVED','WAIT BOARD','no board from upstream');}}yield FRAME;}
    const b=st.q[0];while(!b.mv.done)yield FRAME;st.q.shift();
    const t0=C.T.sim;m.setState('RUN');
    setStep(0,'BOARD TO NEST');st.fov=0;resetMaps();pinNest.userData.up=true;
    yield* conveyTo(b,W(0),belt);st.cur=b;
    setStep(1,'CLAMP + SUPPORT PINS');yield* tween(.4,k=>{st.clamp=k;st.sup=k;});
    setStep(2,'FIDUCIAL 1 / 2');
    const sp=measure(b);                                                         // acquired during the scan; revealed FOV by FOV
    for(const f of [FIDS[1],FIDS[2]]){yield* moveHead(f.x,LZ+f.z);yield .03;st.ring=1;yield* shoot(2,'fid');st.ring=0;}
    st.fidOff=[(Math.random()-.5)*60,(Math.random()-.5)*60];st.sub='ΔX '+st.fidOff[0].toFixed(0)+' / ΔY '+st.fidOff[1].toFixed(0)+' µm · SKEW OK';
    setStep(3,'35 FOV · SERPENTINE');const ts=C.T.sim;
    for(let n=0;n<NF;n++){const p=fovPos(n);st.sub='FOV '+(n+1)+' / '+NF+'  ·  4+4 FRINGE + 2D';
      yield* moveHead(p[0],LZ+p[1]);yield .02;yield* shoot(9,'fov');revealFov(n);st.fov=n+1;}
    st.tScan=C.T.sim-ts;
    setStep(4,'3D RECONSTRUCTION + SPC');run(moveHead(-360,0));yield .8;
    yield* finishBoard(b,sp);
    if(st.out){m.setState('BLOCKED','WAIT OUTFEED','downstream not ready');while(st.out)yield FRAME;m.setState('RUN');}
    setStep(5,sp.ng?'RELEASE  ·  NG FLAG':'RELEASE');yield* tween(.3,k=>{st.clamp=1-k;st.sup=1-k;});st.cur=null;pinNest.userData.up=false;
    if(Math.random()<.0015)yield* m.fault('CAMERA TRIGGER TIMEOUT',40);
    setStep(6,'BOARD TO EXIT');st.out=b;run(exitMove(b));
    run((function*(){while(b.x<W(265))yield FRAME;pinNest.userData.up=true;})());
    m.endCycle(b,t0);
  }
}
run(main());

/* ---------- per-frame poses ---------- */
const fringe=headG.userData.fringe,frame=headG.userData.frame;
m.update=(dt,rdt)=>{
  zbeam.position.z=head.z-BOFF;xcar.position.x=head.x;
  if(m.near||dt>0){
    chainPose(chZ,'z',head.z-BOFF,ZR1-60,ZR1-60-(ZR0+150),ZCH.r,ZCH.y0,ZCH.xf);
    chainPose(chX,'x',head.x,420,420-(-380),XCH.r,XCH.y0,XCH.zf);}
  sup.position.y=-12*(1-st.sup);
  clamps.forEach(c=>c.position.z=LZ+c.userData.s*(BD/2+4-5.5*st.clamp));
  if(st.cur)st.cur.g.position.y=CONV_Y;
  // imaging: 4 phase-shifted fringe images per projector, then the 2D shot (white + RGB ring)
  let idx=-1;if(st.img){idx=Math.min(st.img.n-1,Math.floor((C.T.sim-st.img.t0)/FT));}
  const fin=st.img&&st.img.kind==='fov'||(st.img&&st.img.n>=9);
  let pA=0,pB=0,ringI=st.ring*2.2,rgb=0;
  if(fin&&idx>=0){const k=idx%9;if(k<4)pA=1;else if(k<8)pB=1;else{ringI=3;rgb=1;}fringe.material.opacity=k<8?.55:0;fringeTex.offset.x=(k%4)/4*(pB?-1:1);}
  else fringe.material.opacity=0;
  frame.material.opacity=st.img?.7:0;
  projLens[0].emissiveIntensity=pA*3;projLens[1].emissiveIntensity=pB*3;beams[0].material.opacity=pA*.16;beams[1].material.opacity=pB*.16;
  ringW.emissiveIntensity=ringI;ringC.emissiveIntensity=rgb*2.6;
  if(rgb){const c=Math.floor(C.T.sim/FT)%3;ringC.emissive.setHex([0xff2020,0x20ff40,0x2040ff][c]);}
  hMat.uniforms.tm.value=C.T.sim;
  hood.open+=(hood.target-hood.open)*Math.min(1,(rdt||0)*3.2);hoodPivot.rotation.x=-hood.open*1.15;
  C.tower(m,tower,m.state==='SETUP'||(st.last&&st.last.ng&&m.state==='RUN'&&st.step>=4));
};
C.dyn(hoodPivot,sup,pinNest,pinExit,chZ,chX,hMesh);clamps.forEach(c=>C.dyn(c));
C.bake(machine);

function setHood(o){hood.target=o?1:0;const b=$('bHood');if(SA&&b){b.textContent=o?'Close hood':'Open hood';b.classList.toggle('on',!!o);}}
C.clickable(hoodPivot,()=>setHood(!hood.target));

/* ---------- operator monitor ---------- */
function drawMon(){
  const g=monCtx,Wd=640,H=400,S=st.last;
  g.fillStyle='#14171c';g.fillRect(0,0,Wd,H);g.fillStyle='#22262d';g.fillRect(0,0,Wd,42);g.fillStyle='#1e6fd9';g.fillRect(0,42,Wd,4);
  g.fillStyle='#fff';g.font='700 20px Arial';g.textAlign='left';g.textBaseline='middle';g.fillText('3D SPI  ·  OPERATOR PANEL',14,22);
  g.font='500 14px Arial';g.textAlign='right';g.fillStyle=S&&S.ng?'#ff5a64':'#3ddc84';g.fillText(C.T.paused?'PAUSED':(m.state==='SETUP'?'CALIBRATION':(S?(S.ng?'LAST: NG':'LAST: PASS'):'AUTOMATIC')),Wd-14,22);g.textAlign='left';
  g.drawImage(heat,12,56,300,240);g.strokeStyle='#d9b85c';g.lineWidth=1.5;g.strokeRect(12,56,300,240);
  if(st.step===3&&st.fov<NF){const p=fovPos(st.fov),x=12+(p[0]-20+125)*1.2,y=56+(p[1]-20+100)*1.2;g.strokeStyle='#4fd1ff';g.lineWidth=2;g.strokeRect(x,y,48,48);}
  const gr=g.createLinearGradient(12,0,312,0);gr.addColorStop(0,volCol(50));gr.addColorStop(.5,volCol(100));gr.addColorStop(1,volCol(150));g.fillStyle=gr;g.fillRect(12,300,300,7);
  g.fillStyle='#8fa3bd';g.font='500 10px Arial';g.fillText('50 %',12,317);g.textAlign='center';g.fillText('VOLUME  100 %',162,317);g.textAlign='right';g.fillText('150 %',312,317);g.textAlign='left';
  g.fillStyle='#8fa3bd';g.font='600 11px Arial';g.fillText('WORST PADS',12,334);g.font='500 12px Consolas,monospace';
  (S&&S.top||[]).forEach((a,i)=>{g.fillStyle=a.ng?'#ff5a64':'#cfd8e6';g.fillText(a.pad.padEnd(11)+(a.vol.toFixed(0)+' %').padStart(6)+'  h '+a.h.toFixed(0)+' µm',12,350+i*14);});
  g.fillStyle='#8fa3bd';g.font='600 11px Arial';g.fillText('BOARDS',330,64);g.fillText('OK / NG',420,64);g.fillText('YIELD',510,64);g.fillText('CYCLE',590,64);
  g.fillStyle='#fff';g.font='700 20px Arial';g.fillText(String(st.insp),330,86);g.fillText(st.ok+' / '+st.ng,420,86);g.fillText(st.insp?(st.ok/st.insp*100).toFixed(0)+'%':'—',510,86);
  g.font='700 15px Arial';g.fillText(m.ct?m.ct.toFixed(1)+' s':'—',590,86);
  g.fillStyle='#8fa3bd';g.font='500 12px Arial';
  const rows=[['Volume mean',S?S.volMean.toFixed(1)+' %':'—'],['Height mean',S?S.hMean.toFixed(0)+' µm':'—'],['Offset X / Y',S?S.offX.toFixed(0)+' / '+S.offY.toFixed(0)+' µm':'—'],['Cpk (volume)',S?S.cpk.toFixed(2):'—']];
  rows.forEach((r,i)=>{g.fillStyle='#8fa3bd';g.fillText(r[0],330,112+i*17);g.fillStyle='#fff';g.fillText(r[1],440,112+i*17);});
  drawSpc(g,326,184,306,118,{bg:'#0f1217',tx:'#8fa3bd',mut:'#8fa3bd',line:'#2a323e',ng:'#ff5a64',acc:'#4fd1ff'});
  g.fillStyle='#8fa3bd';g.font='500 12px Arial';g.textAlign='left';g.fillText(st.step>=0?(st.step+1)+'/'+STEPS.length+'  '+st.name+'  ·  '+st.sub:(st.name+'  '+st.sub),330,322);
  g.fillStyle='#22262d';g.fillRect(330,332,300,6);g.fillStyle='#1e6fd9';g.fillRect(330,332,300*st.fov/NF,6);
  g.fillStyle='#8fa3bd';g.fillText('FOV '+st.fov+' / '+NF+'    feedback sent '+st.fb+'    cal. '+st.cals,330,352);
  g.fillText('last cal. '+(C.T.sim-st.lastCal<60?'just now':((C.T.sim-st.lastCal)/3600).toFixed(1)+' h ago')+' · next in '+Math.max(0,(CAL_EVERY-(C.T.sim-st.lastCal))/3600).toFixed(1)+' h',330,370);
  monTex.needsUpdate=true;
}
C.onSlow(()=>{if(m.near)drawMon();});

/* ---------- cameras (2D = orthographic, 3D = height map) ---------- */
const FOVH=20*255/253;
const cam2D=new THREE.OrthographicCamera(-FOVH,FOVH,20,-20,.5,160);cam2D.up.set(0,0,-1);cam2D.layers.enable(2);
const cam3D=new THREE.OrthographicCamera(-FOVH,FOVH,20,-20,.5,160);cam3D.up.set(0,0,-1);cam3D.layers.set(3);
const prep3=c=>{const O=m.origin(),r=st.revPos;if(!r)return prep(c);c.position.set(O.x+r[0],1004,O.z+LZ+r[1]);c.lookAt(O.x+r[0],0,O.z+LZ+r[1]);};
const prep=c=>{const O=m.origin();c.position.set(O.x+head.x,1004,O.z+head.z);c.lookAt(O.x+head.x,0,O.z+head.z);};
m.cameras=[{name:'2D camera · FOV',cam:cam2D,prepare:prep},{name:'3D height map',cam:cam3D,prepare:prep3}];

/* ---------- top worst pads (computed after the scan) ---------- */
m.info=()=>{const S=st.last;return [['Step',st.name],['Detail',st.sub],['FOV',st.fov+' / '+NF],['Boards inspected',st.insp],['OK / NG',st.ok+' / '+st.ng],
  ['Volume mean',S?S.volMean.toFixed(1)+' %':'—'],['Cpk',S?S.cpk.toFixed(2):'—'],['Last cycle',m.ct?m.ct.toFixed(1)+' s':'—'],['Feedback to printer',st.fb]];};

const V=(p,t)=>{const O=m.origin();return [[p[0]+O.x,p[1],p[2]+O.z],[t[0]+O.x,t[1],t[2]+O.z]];};
m.views={
  over:{p:[-1900,1900,3000],t:[0,880,100]},
  inside:{p:[-300,2150,1900],t:[0,1000,200],hood:1},
  head:{follow:1,hood:1,p:[-330,1330,560+LZ-170],t:[0,1050,LZ]},
  board:{p:[-110,1060,LZ+330],t:[0,904,LZ-5],hood:1},
  top:{p:[0,3800,LZ+5],t:[0,900,LZ],hood:1,xray:1}
};
m.setHood=setHood;m.st=st;m.head=head;

if(SA){
  let xr=false;
  const vmap={};
  Object.entries(m.views).forEach(([k,v])=>{
    const go=()=>{if(v.hood)setHood(1);if(xr&&!v.xray){C.setXray(false);xr=false;}if(v.xray){C.setXray(true);xr=true;}};
    if(v.follow){const last=new THREE.Vector3();
      vmap[k]={before:go,get p(){const O=m.origin();return [O.x+head.x-330,1330,O.z+head.z+560];},get t(){const O=m.origin();return [O.x+head.x,1050,O.z+head.z];},dur:.9,
        follow(rdt){const O=m.origin();last.set(O.x+head.x,1050,O.z+head.z).sub(C.controls.target).multiplyScalar(Math.min(1,rdt*7));C.camera.position.add(last);C.controls.target.add(last);}};}
    else vmap[k]={before:go,get p(){return V(v.p,v.t)[0];},get t(){return V(v.p,v.t)[1];}};});
  C.addViews(vmap);
  C.inset('inset',cam2D,prep);C.inset('insetR',cam3D,prep3);
  const itags=[],tg=(t,o,x,y,z,inn)=>{const g=C.tag(t,o,x,y,z);if(inn)itags.push([g,y]);return g;};
  tg('XY gantry · linear motors',zbeam,-300,1290,0);tg('3D head (follows gantry)',headG,0,1470,0);tg('12 MP telecentric camera',headG,0,1455,0);
  tg('Moiré projector A',headG,150,1170,0);tg('Moiré projector B',headG,-150,1170,0,1);tg('White + RGB ring light',headG,0,1030,50);
  tg('Z-axis cable chain',interior,-395,1100,60,1);tg('Support table + pins',sup,0,900,LZ+100,1);tg('Board clamp rails',interior,0,930,LZ-120,1);
  tg('Height reference target',interior,CAL.x,905,CAL.z,1);tg('Louvred service panel',machine,HX,480,-300,1);tg('Hood — click to open',machine,0,1500,HZ+20);
  tg('Operator monitor',machine,780,1590,HZ+330);tg('Keyboard drawer',machine,300,900,HZ+180);tg('Signal tower',machine,-452,1750,HZ-60);tg('E-stop',machine,452,1250,HZ);
  if($('bHood'))$('bHood').onclick=()=>setHood(!hood.target);
  if($('bCal'))$('bCal').onclick=()=>{st.calReq=true;};
  const hist=$('spc'),hc=hist&&hist.getContext('2d');let spcKey='';
  const cssv=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  C.onHud(()=>{
    itags.forEach(a=>{a[0].v.y=hood.open>.5?a[1]:NaN;});
    const ng=st.last&&st.last.ng,hs=$('hState');hs.textContent=m.state==='SETUP'?'CALIBRATION':m.state==='DOWN'?'ALARM':m.state==='STARVED'||m.state==='BLOCKED'?m.state:st.name;hs.className='pill '+(m.state==='DOWN'?'ng':m.state==='SETUP'?'cl':m.state==='BLOCKED'?'ng':m.state==='STARVED'||st.name=='IDLE'?'idle':'');
    $('phase').textContent=st.sub;$('stepN').textContent=st.step>=0?(st.step+1)+' / '+STEPS.length:'—';$('stepBar').style.width=(st.step>=0?(st.step+1)/STEPS.length*100:0)+'%';
    $('fovN').textContent=st.fov+' / '+NF;$('fovBar').style.width=(st.fov/NF*100)+'%';
    const S=st.last,rp=$('lastR');rp.textContent=S?(S.ng?'NG':'PASS'):'—';rp.className='pill '+(S?(S.ng?'ng':'ok'):'idle');
    $('vol').textContent=S?S.volMean.toFixed(1)+' %':'—';$('hgt').textContent=S?S.hMean.toFixed(0)+' µm':'—';
    $('offs').textContent=S?(S.offX>=0?'+':'')+S.offX.toFixed(0)+' / '+(S.offY>=0?'+':'')+S.offY.toFixed(0)+' µm':'—';
    $('cpk').textContent=S?S.cpk.toFixed(2):'—';$('worst').textContent=S?S.worst.pad+' · '+S.worst.vol+' %':'—';
    $('nIns').textContent=st.insp;$('nOk').textContent=st.ok;$('nNg').textContent=st.ng;$('yld').textContent=st.insp?(st.ok/st.insp*100).toFixed(0)+' %':'—';
    $('nFb').textContent=st.fb;$('ct').textContent=m.ct?m.ct.toFixed(1)+' s':'—';
    $('insL').textContent=st.img?(st.img.kind==='fid'?'FIDUCIAL':'FRINGE / 2D'):'LIVE';$('insR').textContent=m.state==='SETUP'||!st.fov?'—':'FOV '+st.fov;$('rec').style.opacity=st.img?1:.25;
    const key=st.hist.length+'|'+(st.last?st.last.volMean:0)+'|'+SMT.theme;
    if(hc&&key!==spcKey){spcKey=key;const r=hist.getBoundingClientRect(),d=2,w=262,h=116;hist.width=w*d;hist.height=h*d;hc.setTransform(d,0,0,d,0,0);
      drawSpc(hc,0,0,w,h,{bg:'transparent',tx:cssv('--mut'),mut:cssv('--mut'),line:cssv('--line'),ng:cssv('--ng'),acc:cssv('--cy')});}
    const c=m.cts.slice(-10);if(!c.length)SMT.cycle('—','first board in progress','CYCLE TIME · LAST BOARD');else{const avg=c.reduce((a,b)=>a+b,0)/c.length;SMT.cycle(m.ct.toFixed(1)+' s','avg '+avg.toFixed(1)+' s · '+Math.round(3600/avg)+' boards/h · 35 FOV','CYCLE TIME · LAST BOARD');}
    const logEl=$('log');if(logEl&&logEl._n!==m.log.length+':'+(m.log[0]&&m.log[0].t)){logEl._n=m.log.length+':'+(m.log[0]&&m.log[0].t);logEl.innerHTML='';m.log.slice(0,7).forEach(e=>{const dd=document.createElement('div');dd.textContent=e.text;if(e.cls)dd.className=e.cls;logEl.appendChild(dd);});}
  });
  C.expose({spi:m,st,head,limits,forceLowPaste:n=>{st.forceFlag=n||2;},calibrateNow:()=>{st.calReq=true;},summary:()=>({insp:st.insp,ok:st.ok,ng:st.ng,fb:st.fb,cals:st.cals,cleans:st.cleans,tScan:+st.tScan.toFixed(2),ct:+m.ct.toFixed(2),pads:NP,last:st.last&&{vol:+st.last.volMean.toFixed(1),h:+st.last.hMean.toFixed(0),offX:+st.last.offX.toFixed(1),cpk:+st.last.cpk.toFixed(2),nNg:st.last.nNg}})});
}
return m;
});
