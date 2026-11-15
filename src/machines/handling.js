/* ===================================================================
   MACHINE MODULES — BOARD HANDLING: loader, unloader, shuttle, merge, conveyor.
   Units mm. Origin = machine centre on the floor; X = board flow, Y up, +Z toward the operator.
   Conveyor (board bottom) 900, lane 1 z=+170, lane 2 z=-170.  Generic machines, no brands.
   =================================================================== */
'use strict';
(function(){
const PI=Math.PI,SLOT=10,MX=320,MZ=355,Y0=25,UP=385,LOWY=140,LZ=170,RZ=-195,EXIT=137;
function kit(C){
 if(C._hk)return C._hk;
 const {THREE,std,box,cyl,canvasTex,M,NOSH,FRAME}=C;
 const sh=(c,r=.55,m=.1)=>{const x=std(c,r,m);C.shellMats.push(x);return x;};
 const K=C._hk={W:sh(0xe9ebee,.5,.08),G:sh(0x3a3f46,.55,.2),G2:std(0x565c66,.5,.35),GL:sh(0x2b3a4a,.15,.6),GS:new THREE.MeshStandardMaterial({color:0x8fb0cc,roughness:.08,metalness:.1,transparent:true,opacity:.2,depthWrite:false}),ledgeGeo:new THREE.BoxGeometry(300,2.4,8),ledgeMat:M.alu,FR:std(0xc4cad1,.4,.75),BL:std(0x1e6fd9,.4,.1),
  magM:std(0x24282e,.7,.1),boardMat:std(0x1b6a3b,.55,.2),boardGeo:new THREE.BoxGeometry(250,1.6,200),combs:{},NOSH};
 K.mv=function*(o,p,d){const a=o.position.clone();yield* C.tween(d,k=>{if(p.x!==undefined)o.position.x=a.x+(p.x-a.x)*k;if(p.y!==undefined)o.position.y=a.y+(p.y-a.y)*k;if(p.z!==undefined)o.position.z=a.z+(p.z-a.z)*k;});};
 K.par=function*(...gs){let n=gs.length;gs.forEach(g=>C.run((function*(){yield* g;n--;})()));while(n>0)yield FRAME;};
 K.comb=n=>K.combs[n]||(K.combs[n]=(()=>{const t=canvasTex(8,40,(g,W,H)=>{g.fillStyle='#1a1d22';g.fillRect(0,0,W,H);g.fillStyle='#8593a6';g.fillRect(0,H-6,W,6);},{repeat:true});t.repeat.set(1,n);
   return {geo:new THREE.PlaneGeometry(MX-8,n*SLOT),mat:new THREE.MeshStandardMaterial({map:t,roughness:.8})};})());
 K.labelMat=new THREE.MeshStandardMaterial({map:canvasTex(256,96,(g,W,H)=>{g.fillStyle='#1e3a6b';g.fillRect(0,0,W,H);g.fillStyle='#fff';g.font='700 34px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText('ESD MAGAZINE',W/2,H*.36);g.font='500 24px Arial';g.fillText('PITCH 10 mm',W/2,H*.7);}),roughness:.6});
 K.labelGeo=new THREE.PlaneGeometry(120,45);
 /* magazine: origin = centre X/Z, base Y.  slot i (0 = bottom) at y = Y0+10 i.  boards shown with one InstancedMesh */
 K.mag=(parent,o={})=>{
  const n=o.slots||50,mz=o.mz||MZ,mh=n*SLOT+63,bx=o.bx||0,hw=mz/2,g=new THREE.Group();parent.add(g);
  box(g,MX,mh,3,K.magM,0,mh/2,hw-1.5,NOSH);box(g,MX,mh,3,K.magM,0,mh/2,-hw+1.5,NOSH);box(g,MX,3,mz,K.magM,0,1.5,0,NOSH);box(g,MX,3,mz,K.magM,0,mh-1.5,0,NOSH);
  const ct=K.comb(n);
  [-1,1].forEach(sd=>{const p=new THREE.Mesh(ct.geo,ct.mat);p.position.set(0,Y0-2+n*SLOT/2,sd*106);if(sd>0)p.rotation.y=PI;g.add(p);
   const l=new THREE.Mesh(K.labelGeo,K.labelMat);l.position.set(70,mh-60,sd*(hw+.3));if(sd<0)l.rotation.y=PI;g.add(l);});
  const led=new THREE.InstancedMesh(K.ledgeGeo,K.ledgeMat,2*n),dl=new THREE.Object3D();for(let i=0;i<n;i++)[-1,1].forEach((sd,k)=>{dl.position.set(0,Y0+SLOT*i-1.2,sd*98);dl.updateMatrix();led.setMatrixAt(2*i+k,dl.matrix);});led.frustumCulled=false;g.add(led);   /* ledge rails: the board edges rest on them */
  box(g,140,10,16,K.magM,0,mh+5,0,NOSH);[-60,60].forEach(x=>box(g,10,10,16,K.magM,x,mh+1,0,NOSH));
  const inst=new THREE.InstancedMesh(K.boardGeo,K.boardMat,n);inst.frustumCulled=false;g.add(inst);
  const mag={g,inst,n:0,slots:n,onLift:false},d=new THREE.Object3D();
  mag.set=c=>{mag.n=c;for(let i=0;i<n;i++){d.position.set(bx,Y0+SLOT*i+.8,0);d.scale.setScalar(i<c?1:0);d.updateMatrix();inst.setMatrixAt(i,d.matrix);}inst.instanceMatrix.needsUpdate=true;};
  mag.set(o.fill||0);mag.kill=()=>{g.parent&&g.parent.remove(g);inst.dispose();};
  return mag;};
 K.tower=(g,x,y,z)=>{const t={},gr=new THREE.Group();gr.position.set(x,y,z);g.add(gr);cyl(gr,7,7,230,M.steel,0,115,0);
  [['r',0xff2a2a,262],['y',0xffa800,231],['g',0x22e06a,200]].forEach(a=>{const mt=new THREE.MeshStandardMaterial({color:a[1],emissive:a[1],emissiveIntensity:.05,roughness:.3,transparent:true,opacity:.92});t[a[0]]=mt;cyl(gr,16,16,29,mt,0,a[2]+15,0);});
  cyl(gr,17,17,6,M.dark,0,296,0);return t;};
 K.estop=(g,x,y,z,ry)=>{const q=new THREE.Group();q.position.set(x,y,z);q.rotation.y=ry||0;g.add(q);cyl(q,34,34,6,std(0xf2c400,.5),0,0,3,{rx:PI/2,cast:false});cyl(q,24,19,28,M.red,0,0,18,{rx:PI/2,cast:false});};
 K.hmi=(g,x,y,z,ry,draw)=>{const q=new THREE.Group();q.position.set(x,y,z);q.rotation.y=ry||0;g.add(q);
  box(q,24,300,24,M.dark,-170,-120,-30);box(q,200,24,24,M.dark,-80,40,-30);box(q,330,262,26,M.black,0,0,0);
  const c=document.createElement('canvas');c.width=640;c.height=480;const ctx=c.getContext('2d'),tex=new THREE.CanvasTexture(c);tex.encoding=THREE.sRGBEncoding;tex.anisotropy=4;
  const s=new THREE.Mesh(new THREE.PlaneGeometry(300,225),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));s.position.z=14;q.add(s);
  return {redraw(){ctx.setTransform(2,0,0,2,0,0);draw(ctx,320,240);tex.needsUpdate=true;}};};
 K.smema=(g,x,y,z,ry)=>{const q=new THREE.Group();q.position.set(x,y,z);q.rotation.y=ry||0;g.add(q);box(q,70,50,30,M.white,0,0,0);
  const a=C.emissive(0x30ff70,.05),b=C.emissive(0xffb020,.05);cyl(q,6,6,6,a,-14,10,16,{rx:PI/2,cast:false});cyl(q,6,6,6,b,14,10,16,{rx:PI/2,cast:false});
  cyl(q,8,8,22,M.black,0,-36,0,{seg:10});C.label(q,'SMEMA',60,12,0,-14,15.6,{fg:'#222',bg:'#f1f2f3',pw:200});return {a,b};};
 K.ventMat=new THREE.MeshStandardMaterial({map:canvasTex(128,128,(g,W,H)=>{g.fillStyle='#2a2e34';g.fillRect(0,0,W,H);g.fillStyle='#0b0c0e';for(let y=8;y<H;y+=12)g.fillRect(8,y,W-16,5);}),roughness:.7});
 K.vent=(g,x,y,z,ry,w=160,h=120)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),K.ventMat);m.position.set(x,y,z);m.rotation.y=ry||0;g.add(m);};
 K.feet=(g,pts)=>pts.forEach(p=>{cyl(g,50,56,16,M.steel,p[0],8,p[1],{seg:20});cyl(g,14,14,70,M.steel,p[0],50,p[1],{seg:10});});
 /* operator figure (shown only while servicing) */
 K.op=parent=>{const g=new THREE.Group();g.visible=false;g.userData.dynamic=true;parent.add(g);const co=std(0x2f5fa8,.8),sk=std(0xd9a984,.8),pt=std(0x262a33,.8),wh=std(0xe8edf2,.8);
  [-16,16].forEach(x=>box(g,24,840,26,pt,x,420,0,NOSH));box(g,80,500,40,co,0,1100,0,NOSH);
  const head=new THREE.Mesh(new THREE.SphereGeometry(100,14,10),sk);head.position.y=1490;g.add(head);box(g,120,40,100,wh,0,1580,0,NOSH);
  const arms=[-1,1].map(s=>{const a=new THREE.Group();a.position.set(s*52,1330,0);g.add(a);box(a,22,480,22,co,0,-240,0,NOSH);return a;});
  const carry=box(g,300,300,300,K.magM,0,1080,330,NOSH);carry.visible=false;return {g,arms,carry,working:false};};
 K.opUpd=op=>{if(!op.g.visible)return;const t=C.T.sim;op.arms[0].rotation.x=-1.1+(op.working?.25*Math.sin(t*5):0);op.arms[1].rotation.x=-1.0+(op.working?.25*Math.sin(t*5+2):0);};
 K.serve=function*(op,x,z,ry,dur,mode){const dx=Math.sin(ry)*600,dz=Math.cos(ry)*600;op.g.position.set(x+dx,0,z+dz);op.g.rotation.y=ry+PI;op.g.visible=true;op.carry.visible=mode==='in';
  yield* K.mv(op.g,{x,z},1.4);op.carry.visible=false;op.working=true;yield dur;op.working=false;op.carry.visible=mode==='out';yield* K.mv(op.g,{x:x+dx,z:z+dz},1.4);op.carry.visible=false;op.g.visible=false;};
 K.hood=(pivot)=>{const h={pivot,open:0,target:0,max:1.15};h.upd=rdt=>{h.open+=(h.target-h.open)*Math.min(1,(rdt||0)*3.2);pivot.rotation.x=-h.open*h.max;};
  C.clickable(pivot,()=>{h.target=h.target?0:1;});return h;};
 K.wall=(g,q,holes,y0,y1,zh)=>{const sh2=new THREE.Shape();sh2.moveTo(-zh,y0);sh2.lineTo(zh,y0);sh2.lineTo(zh,y1);sh2.lineTo(-zh,y1);sh2.closePath();
  holes.forEach(h=>{const p=new THREE.Path();p.moveTo(h[0],h[1]);p.lineTo(h[2],h[1]);p.lineTo(h[2],h[3]);p.lineTo(h[0],h[3]);p.closePath();sh2.holes.push(p);});
  const m=new THREE.Mesh(new THREE.ExtrudeGeometry(sh2,{depth:20,bevelEnabled:false}),K.W);m.rotation.y=-PI/2;m.position.x=q;g.add(m);return m;};
 return K;
}
function hdrDraw(g,W,H,title,m,C){g.fillStyle='#14171c';g.fillRect(0,0,W,H);g.fillStyle='#22262d';g.fillRect(0,0,W,30);g.fillStyle='#1e6fd9';g.fillRect(0,30,W,3);
 g.fillStyle='#fff';g.font='700 15px Arial';g.textAlign='left';g.textBaseline='middle';g.fillText(title,10,16);
 const col={RUN:'#3ddc84',IDLE:'#8fa3bd',STARVED:'#f0b040',BLOCKED:'#f0b040',DOWN:'#ff4d5a',SETUP:'#4fd1ff'}[m.state]||'#8fa3bd';
 g.textAlign='right';g.fillStyle=col;g.fillText(C.T.paused?'PAUSED':m.state,W-10,16);g.textAlign='left';}

function foot(g,m){const a=m.log.find(e=>e.text.indexOf('ALARM')===0);g.font='500 11px Arial';g.fillStyle=m.down?'#ff4d5a':'#8fa3bd';g.fillText('ALARM  '+(a?a.text.replace('ALARM  ',''):'none'),10,216);g.fillStyle='#8fa3bd';g.fillText((m.down&&/AIR/.test(m.lastFault||'')?'4.2':'6.0')+' bar · board 200 mm · recipe SMT-200 · SMEMA 0x'+((m.outQ&&m.outQ[1]?1:0)|(m.state==='RUN'?2:0)).toString(16),10,232);}
/* ===================== LOADER / UNLOADER (mirror images) ===================== */
function handler(C,opts,kind){
 const K=kit(C),{THREE,box,cyl,label,plate,std,M,NOSH,FRAME,CONV_Y}=C;
 opts=opts||{};
 const LD=kind==='loader',s=LD?1:-1,X0=opts.x||0,ID=opts.id||kind,auto=opts.auto!==false,repAfter=opts.replenishAfter!==undefined?opts.replenishAfter:60,CAP=opts.slots||50,REL=opts.releaseInterval||6;
 const HB=1250,HT=1490,L=s*40,P=x=>s*x,{W,G,G2,GL,FR,BL}=K;
 const ALM=()=>['MAGAZINE JAM','BOARD NOT AT STOPPER (T>5 s)','LIFT OVERTRAVEL','AIR PRESSURE LOW (<4.5 bar)'][C.rnd()*4|0],bpos=i=>L-s*340*i,opos=j=>L-s*340*(j+1),levelFor=n=>LD?900-(Y0+SLOT*(n-1)):900-(Y0+SLOT*n);
 const g=new THREE.Group();g.position.x=X0;C.parentFor(opts).add(g);
 const redE=C.emissive(0xff3030,.8);
 /* ---- frame ---- */
 box(g,1560,50,960,G,0,95,0,NOSH);K.feet(g,[[-740,-440],[740,-440],[-740,440],[740,440],[0,-440],[0,440]]);
 [[-785,-485],[785,-485],[-785,485],[785,485]].forEach(p=>box(g,60,1130,60,G2,p[0],685,p[1]));
 [-485,485].forEach(z=>box(g,1630,40,40,G2,0,1230,z));[-785,785].forEach(x=>box(g,40,40,1010,G2,x,1230,0));
 box(g,1560,1100,16,W,0,680,-492,NOSH);[-390,0,390].forEach(x=>box(g,3,1100,2,G,x,680,-483.5,NOSH));[-200,200].forEach(x=>{box(g,14,160,10,M.steel,x+60,700,-500);});
 K.vent(g,-600,360,-483.8,PI,200,150);K.vent(g,600,360,-483.8,PI,200,150);
 box(g,1560,190,14,W,0,225,494,NOSH);box(g,1560,16,18,BL,0,333,497,NOSH);
 label(g,LD?'LOADER':'UNLOADER',420,60,P(-480),230,501.5,{fg:'#1c2128',pw:700,size:.74});
 plate(g,[LD?'MAGAZINE LOADER':'MAGAZINE UNLOADER','ESD magazine 320 x 355 x 563 · 50 slots · H 1550','24 V DC · 6 bar · SMEMA'],360,90,P(380),230,501.8,{pw:640,bg:'#dfe3e8'});
 plate(g,['! WARNING','Moving lift & pusher'],110,80,P(700),400,501.8,{bg:'#f2c400',border:'#111',pw:300});
 K.wall(g,-s,[[-382,380,-8,960],[-12,134,355,725]],130,HB,500);   /* magazine side: upper & lower conveyor openings */
 g.children[g.children.length-1].position.x=-s>0?800:-780;
 K.wall(g,s,[[LZ-150,872,LZ+150,968]],130,HB,500);g.children[g.children.length-1].position.x=s>0?800:-780;
 /* ---- hoods ---- */
 const hoods=[];
 function hoodRoof(x0,x1){const w=Math.abs(x1-x0),xc=(x0+x1)/2,pv=new THREE.Group();pv.position.set(xc,HB,-480);g.add(pv);
  box(pv,w-30,8,950,GL,0,2,480);[-1,1].forEach(q=>box(pv,10,14,950,FR,q*(w/2-14),4,480));box(pv,w-20,14,12,FR,0,4,955);box(pv,w-20,16,16,G,0,0,0);box(pv,120,12,14,M.steel,0,12,975);
  [-1,1].forEach(q=>box(pv,16,10,40,M.steel,q*(w/2-60),4,-5));const h=K.hood(pv);h.max=1.1;hoods.push(h);box(g,w,20,20,G,xc,HB-10,-480);box(g,w,20,20,G,xc,HB-10,480);}
 hoodRoof(-s*790,L-s*215);hoodRoof(L+s*215,s*790);
 const hA=new THREE.Group();hA.position.set(L,HT,-30);g.add(hA);
 box(hA,430,8,470,GL,0,0,235);box(hA,430,530,8,GL,0,-265,470);[-1,1].forEach(q=>box(hA,8,530,470,GL,q*215,-265,235));
 [-1,1].forEach(q=>{box(hA,10,12,470,FR,q*215,4,235);box(hA,10,540,12,FR,q*215,-265,470);});box(hA,430,14,14,FR,0,4,470);box(hA,160,14,16,M.steel,0,-420,484);
 const hoodA=K.hood(hA);hoodA.max=1.25;hoods.push(hoodA);
 /* perforated tunnel guards at the magazine-side openings + reset button beside the light curtain */
 [[-385,-5,378,975],[-15,358,132,728]].forEach(h=>{const zc2=(h[0]+h[1])/2,zd=h[1]-h[0],yc=(h[2]+h[3])/2,yh=h[3]-h[2];box(g,400,3,zd,K.ventMat,-s*1000,h[3],zc2,NOSH);[h[0],h[1]].forEach(z=>box(g,400,yh,3,K.ventMat,-s*1000,yc,z,NOSH));[h[0],h[1]].forEach(z=>[h[2],h[3]].forEach(y=>box(g,400,8,8,FR,-s*1000,y,z,NOSH)));});
 box(g,60,90,14,W,P(-725),1000,503,NOSH);cyl(g,17,17,12,BL,P(-725),1010,513,{rx:PI/2,cast:false});label(g,'RESET',50,14,P(-725),968,510.5,{fg:'#222',bg:'#f1f2f3',pw:200});

 [-1,1].forEach(q=>[-30,470].forEach(z=>box(g,40,1360,40,G2,L+q*215,810,z)));
 box(g,430,530,10,W,L,1225,-35,NOSH);box(g,430,20,460,W,L,1240,-260,NOSH);
 [P(-770),L-s*215].forEach(x=>{box(g,16,900,16,G,x,700,495);box(g,5,820,5,redE,x+s*10,700,497,NOSH);});   /* light curtain posts */
 /* ---- lift ---- */
 const lift=new THREE.Group();lift.position.set(L,UP,0);g.add(lift);
 [-1,1].forEach(q=>{box(lift,300,10,40,G2,0,-5,LZ+q*55);box(lift,24,16,40,M.steel,q*158,6,LZ+q*55);});box(lift,300,10,70,G2,0,-5,LZ-130);
 box(lift,300,120,8,G2,0,60,365);box(lift,60,60,50,G,0,60,386);[-1,1].forEach(q=>box(lift,58,80,40,G,q*120,60,392));
 [-1,1].forEach(q=>box(lift,12,50,12,M.steel,q*150,26,LZ+120));
 [-1,1].forEach(q=>box(g,40,1370,40,G2,L+q*120,805,400));cyl(g,12,12,1360,M.steel,L,800,410,{seg:10});
 box(g,90,90,120,G,L+90,185,430);cyl(g,26,26,60,M.black,L+90,185,500,{rx:PI/2});box(g,90,6,30,M.black,L+45,175,410);box(g,60,60,60,G2,L,125,410);
 [UP,UP+490].forEach(y=>box(g,22,14,14,M.orange,L-140,y+0,400,NOSH));
 /* ---- upper (rear row) and lower (front row) magazine conveyors ---- */
 const ub=C.belt(30),lb=C.belt(30),ux0=Math.min(L,bpos(2))-170,ux1=Math.max(L,bpos(2))+170,lx0=Math.min(L,opos(1))-170,lx1=Math.max(L,opos(1))+170;
 [[ux0,ux1,RZ,UP,ub],[lx0,lx1,LZ,LOWY,lb]].forEach(a=>{const len=a[1]-a[0],xc=(a[0]+a[1])/2;
  [-1,1].forEach(q=>{box(g,len,4,24,a[4].mat,xc,a[3]-2,a[2]+q*110,NOSH);box(g,len,36,6,FR,xc,a[3]+16,a[2]+q*186,NOSH);box(g,len,30,18,G2,xc,a[3]-16,a[2]+q*110);});
  [a[0]+30,a[1]-30].forEach(x=>[-1,1].forEach(q=>{if(a[3]>200)box(g,30,a[3]-120,30,G2,x,(a[3]+120)/2,a[2]+q*186);}));});
 box(g,60,40,70,G,ux0+30,UP-40,RZ+135,NOSH);box(g,60,40,70,G,lx0+30,LOWY-40,LZ+135,NOSH);
 /* ---- transfer pusher (rear row -> lift) ---- */
 const xfer=new THREE.Group();xfer.position.set(L,0,-378);g.add(xfer);box(xfer,220,160,8,G2,0,UP+200,0);box(xfer,40,40,12,M.steel,0,UP+200,6);
 const rod=cyl(xfer,10,10,100,M.steel,0,UP+200,-50,{rx:PI/2,seg:10});cyl(g,30,30,70,G2,L,UP+200,-445,{rx:PI/2});
 /* ---- board pusher bar (loader: moving; unloader: fixed back-stop) ---- */
 const tubeX=L-s*475,pusher=new THREE.Group();g.add(pusher);
 cyl(g,22,22,450,M.aluD,tubeX,855,LZ,{rz:PI/2});box(g,450,6,12,M.black,tubeX,877,LZ,NOSH);
 [-1,1].forEach(q=>{box(g,30,16,100,G2,tubeX+q*230,858,LZ+50);box(g,30,400,30,G2,tubeX+q*230,1050,LZ+100);cyl(g,5,5,60,M.hose,tubeX+q*230,838,LZ-30,{rz:PI/2,seg:8});});
 box(g,40,30,50,G,tubeX,870,LZ-60,NOSH);
 box(pusher,3,5,120,M.steel,0,902.5,LZ);box(pusher,470,5,28,M.alu,-s*236,902.5,LZ);box(pusher,70,40,60,G,-s*470,870,LZ);box(pusher,30,34,24,G2,-s*470,895,LZ);
 pusher.position.x=LD?L-s*190:L-s*155;   /* unloader: fixed back-stop, its tip is where the board edge ends */
 /* ---- board conveyor (outfeed for loader, infeed for unloader) ---- */
 const cb=C.belt(60),cx0=L+s*165,cx1=s*920;C.railSeg(g,Math.min(cx0,cx1),Math.max(cx0,cx1),LZ,{belt:cb});
 [s*520,s*880].forEach(x=>[-1,1].forEach(q=>{box(g,40,CONV_Y-60-120,40,G2,x,(CONV_Y-60+120)/2,LZ+q*135);}));
 [s*520,s*880].forEach(x=>box(g,30,30,270,G2,x,330,LZ));box(g,60,34,16,M.black,s*700,CONV_Y-17,LZ+BD2(C)/2+21,NOSH);
 const exitX=s*(800-EXIT),pin=LD?C.stopper(g,s*795,LZ):null;if(pin)pin.userData.up=true;
 box(g,14,10,10,M.orange,exitX+s*30,CONV_Y-22,LZ+100,NOSH);box(g,14,10,10,M.orange,L+s*200,CONV_Y-22,LZ+100,NOSH);
 const tw=K.tower(g,P(735),HB,-440);K.estop(g,P(785),1080,509,0);K.estop(g,P(-785),1080,509,0);
 const sm=K.smema(g,P(806),800,LZ+150,s>0?PI/2:-PI/2);
 const op=K.op(g);
 const m=C.machine({id:ID,name:LD?'LOADER':'UNLOADER',kind,group:g,x:X0,length:1600,depth:1000,height:HT,lanes:[1],lanesIn:LD?[]:[1],lanesOut:LD?[1]:[],inReach:LD?0:120,outReach:LD?120:0,parallel:1,line:opts.line});
 const st={forceF:false,buf:[],mag:null,out:[null,null],outBusy:false,nextRel:0,ready:false,pending:null,stored:0,made:0,mags:0,rep:0,removed:0,empt:0,fullM:0,prevT0:null,cap:CAP};
 m.st=st;
 /* ---- HMI ---- */
 const hmi=K.hmi(g,P(470),1115,545,-.28*s,(c,W_,H)=>{hdrDraw(c,W_,H,LD?'LOADER':'UNLOADER',m,C);c.fillStyle='#8fa3bd';c.font='500 12px Arial';
  c.fillText(m.step+(m.detail?' · '+m.detail:''),10,48);
  const bar=(y,lab,v,mx,col)=>{c.fillStyle='#8fa3bd';c.fillText(lab,10,y);c.fillStyle='#22262d';c.fillRect(110,y-8,190,14);c.fillStyle=col;c.fillRect(110,y-8,190*Math.min(1,v/mx),14);c.fillStyle='#fff';c.textAlign='right';c.fillText(v+' / '+mx,300,y);c.textAlign='left';};
  bar(72,'LIFT MAGAZINE',st.mag?st.mag.n:0,CAP,'#1e6fd9');bar(94,LD?'FULL BUFFER':'EMPTY BUFFER',st.buf.length,3,'#3ddc84');bar(116,LD?'EMPTIES OUT':'FULL OUT',st.out.filter(Boolean).length,2,'#f0b040');
  c.fillStyle='#fff';c.font='700 16px Arial';c.fillText(LD?'BOARDS OUT  '+m.counters.out:'BOARDS STORED  '+st.stored,10,150);c.font='500 12px Arial';c.fillStyle='#8fa3bd';
  c.fillText('Cycle '+(m.avgCt()?m.avgCt().toFixed(1)+' s':'—')+'   Magazines '+st.mags+'   Alarms '+(m.faults||0),10,176);c.fillText('SMEMA '+(LD?(m.outQ[1]?'BOARD AVAILABLE':'—'):(st.ready?'MACHINE READY':'—')),10,196);foot(c,m);});
 /* ---- magazines ---- */
 const mkMag=()=>K.mag(g,{slots:CAP,fill:LD?CAP:0,bx:LD?0:-s*29});
 m.replenish=(k=3)=>{let a=0;while(st.buf.length<3&&a<k){const mg=mkMag(),i=st.buf.length;mg.g.position.set(-s*1000,UP,RZ);st.buf.push(mg);const d=a;a++;
   C.run((function*(){yield d*1.1;ub.moving++;yield* K.mv(mg.g,{x:bpos(i)},2.0);ub.moving--;})());}return a;};
 m.emptyFull=()=>{const ms=st.out.filter(Boolean);st.out=[null,null];ms.forEach(q=>C.run((function*(){lb.moving++;yield* K.mv(q.g,{x:-s*1100},1.8);lb.moving--;q.kill();})()));st.removed+=ms.length;if(ms.length)m.addLog((LD?'Empty':'Full')+' magazines removed ('+ms.length+')','ok');return ms.length;};
 m.forceFault=()=>{st.forceF=true;};m.testFill=n=>{st.buf.forEach(q=>q.set(LD?n:0));if(st.mag&&LD)st.mag.set(n);};
 /* ---- processes ---- */
 function* loadFromBuffer(){
  const mg=st.buf[0];m.setState('RUN','LOAD MAGAZINE','buffer -> lift');
  yield* K.mv(lift,{y:UP},.4+Math.abs(lift.position.y-UP)/450);
  yield* C.tween(1.8,k=>{xfer.position.z=-378+365*k;mg.g.position.z=RZ+365*k;});
  st.buf.shift();st.mag=mg;mg.onLift=true;mg.g.position.set(L,UP,LZ);st.mags++;ub.moving++;
  yield* K.par(K.mv(xfer,{z:-378},1.0),K.mv(lift,{y:levelFor(mg.n)},.5+Math.abs(UP-levelFor(mg.n))/450),...st.buf.map((q,i)=>K.mv(q.g,{x:bpos(i)},1.3)));
  ub.moving--;}
 function* ejectMag(){
  const mg=st.mag;while(st.out[0]&&st.out[1]){m.setState('BLOCKED','RETURN CONVEYOR FULL','operator / AMR');yield FRAME;}
  m.setState('RUN',LD?'EJECT EMPTY MAGAZINE':'EJECT FULL MAGAZINE','');
  yield* K.mv(lift,{y:LOWY},.5+Math.abs(lift.position.y-LOWY)/450);
  const j=st.out[1]?0:1;mg.onLift=false;mg.g.position.y=LOWY;st.mag=null;st.out[j]=mg;mg.tOut=C.T.sim;lb.moving++;
  yield* K.mv(mg.g,{x:opos(j)},1.5);lb.moving--;if(LD)st.empt++;else st.fullM++;
  m.addLog((LD?'Empty magazine returned':'Full magazine out')+' (#'+(LD?st.empt:st.fullM)+')','cl');}
 function* getMagazine(){
  let t0=C.T.sim;
  while(!st.buf.length){m.setState(LD?'STARVED':'BLOCKED',LD?'NO FULL MAGAZINE':'NO EMPTY MAGAZINE','waiting for '+(LD?'full':'empty')+' magazines');
   if(auto&&C.T.sim-t0>=repAfter){yield* K.serve(op,-s*1350,RZ,-s*PI/2,3,'in');m.replenish(3);st.rep++;m.addLog('Magazines replenished (3)','ok');}else yield FRAME;}
  yield* loadFromBuffer();}
 function* loaderMain(){
  for(;;){
   if(!st.mag)yield* getMagazine();
   const mg=st.mag;
   while(st.outBusy||C.T.sim<st.nextRel){if(st.outBusy)m.setState('BLOCKED','OUTFEED OCCUPIED','waiting for downstream');else m.setState('IDLE','RELEASE INTERVAL','max 1 board / '+REL+' s');yield FRAME;}
   const t0=C.T.sim;st.nextRel=t0+REL;m.endCycle(null,st.prevT0===null?t0-REL:st.prevT0);st.prevT0=t0;
   m.setState('RUN','PUSH BOARD','slot '+mg.n+' / '+CAP);
   if(st.forceF||C.rnd()<.0015){st.forceF=false;yield* m.fault(ALM(),30+C.rnd()*60);}
   yield* K.mv(pusher,{x:L-127},.4);
   const b=new C.Board(1,m.world(L),m.line);if(opts.prepare)opts.prepare(b);mg.set(mg.n-1);st.outBusy=true;st.made++;m.counters.in++;m.boards.push(b);
   yield* C.tween(1.15,k=>{pusher.position.x=L-127+290*k;b.setX(m.world(pusher.position.x+126.5));});
   C.run((function*(){yield* C.conveyTo(b,m.world(exitX),cb);m.setReady(b,1);})());
   yield* K.par(K.mv(pusher,{x:L-190},.85),(function*(){while(s*(pusher.position.x-L)>-165)yield FRAME;if(mg.n>0)yield* K.mv(lift,{y:levelFor(mg.n)},.5);})());   /* lift moves only after the bar has left the magazine */
   if(mg.n===0)yield* ejectMag();
  }}
 function* unloaderMain(){
  for(;;){
   if(!st.mag){st.ready=false;yield* getMagazine();}
   const mg=st.mag;
   if(mg.n>=mg.slots){st.ready=false;yield* ejectMag();continue;}
   st.ready=true;while(!st.pending){m.setState('STARVED','WAITING FOR BOARD','slot '+(mg.n+1)+' / '+CAP);yield FRAME;}
   const b=st.pending;st.ready=false;const t0=C.T.sim;m.setState('RUN','INSERT BOARD','slot '+(mg.n+1)+' / '+CAP);
   if(st.forceF||C.rnd()<.0015){st.forceF=false;yield* m.fault(ALM(),30+C.rnd()*60);}
   yield* C.conveyTo(b,m.world(L-s*29),cb);
   mg.set(mg.n+1);m.release(b,1);m.line.finished(b);b.dispose();st.pending=null;st.stored++;m.endCycle(null,t0);
   if(mg.n<mg.slots)yield* K.mv(lift,{y:levelFor(mg.n)},.45);
  }}
 m.canAccept=LD?(()=>false):(()=>!m.down&&st.ready&&!st.pending);
 m.onAccept=b=>{st.pending=b;};
 m.onRelease=LD?(()=>{st.outBusy=false;pin.userData.up=false;cb.moving++;C.run((function*(){yield 1.6;cb.moving--;pin.userData.up=true;})());}):(()=>{});
 if(auto)C.run((function*(){for(;;){yield 15;const old=st.out.some(q=>q&&C.T.sim-q.tOut>70);
   if(old){C.run(K.serve(op,-s*1350,LZ,-s*PI/2,4,'out'));yield 1.5;m.emptyFull();}}})());
 /* ---- per-frame ---- */
 m.update=(dt,rdt)=>{
  C.tower(m,tw,st.buf.length<=(LD?1:0)||(st.out[0]&&st.out[1]));
  hoods.forEach(h=>h.upd(rdt));if(st.mag&&st.mag.onLift)st.mag.g.position.y=lift.position.y;
  const len=xfer.position.z+410;rod.scale.y=Math.max(.01,len/100);rod.position.z=-len/2;
  sm.a.emissiveIntensity=(LD?m.outQ[1]:st.ready&&!st.pending)?1.8:.05;sm.b.emissiveIntensity=(m.state==='BLOCKED'||m.state==='STARVED')?1.4:.05;K.opUpd(op);};
 C.onSlow(()=>{if(m.near)hmi.redraw();});
 m.info=()=>[['State',m.state+' · '+m.step],['Detail',m.detail||'—'],[LD?'Boards released':'Boards stored',LD?m.counters.out:st.stored],['Lift magazine',(st.mag?st.mag.n:0)+' / '+CAP],
  [LD?'Full buffer':'Empty buffer',st.buf.length+' / 3'],[LD?'Empties on return':'Full on out conveyor',st.out.filter(Boolean).length+' / 2'],['Magazines handled',st.mags],['Cycle',m.avgCt()?m.avgCt().toFixed(1)+' s':'—'],['Alarms',m.faults||0]];
 const sv=(p,t,h)=>({p:[p[0]*s,p[1],p[2]],t:[t[0]*s,t[1],t[2]],hood:h});
 m.views={over:sv([-1900,1900,3300],[0,750,0]),lift:sv([700,1100,2900],[40,850,170],1),buffer:sv([-1100,1250,1500],[-380,600,-120],1),pusher:sv([-700,1250,1000],[-100,900,170],1),
  [LD?'out':'in']:sv([1100,1200,1000],[560,900,170]),low:sv([-500,520,1500],[-300,350,170]),top:sv([0,3800,260],[0,900,0],1)};
 m.setHood=o=>hoods.forEach(h=>h.target=o?1:0);
 C.tag(LD?'Magazine loader':'Magazine unloader',g,P(0),1520,0);C.tag('Lift (elevator)',lift,0,500,170);C.tag('Transfer pusher',xfer,0,UP+260,0);C.tag(LD?'Board pusher':'Board back-stop',pusher,0,950,LZ);
 C.tag('Upper magazine conveyor',g,bpos(1),UP+60,RZ);C.tag('Lower magazine conveyor',g,opos(0),LOWY+60,LZ);C.tag('Signal tower',g,P(735),HB+330,-440);C.tag('Operator panel',g,P(470),1300,545);
 C.dyn(lift,xfer,pusher,hA,...hoods.map(h=>h.pivot));if(pin)C.dyn(pin);
 C.bake(g);
 /* magazines are created after baking (they move) */
 for(let i=0;i<3;i++){const mg=mkMag();mg.g.position.set(bpos(i),UP,RZ);st.buf.push(mg);}
 C.run(LD?loaderMain():unloaderMain());
 return m;
}
function BD2(C){return C.BD;}

/* ===================== SHUTTLE (lane splitter + NG reject) / MERGE (lane merger + NG buffer) ===================== */
function splitter(C,opts,kind){
 const K=kit(C),{THREE,box,cyl,label,plate,std,M,NOSH,FRAME,CONV_Y,canvasTex}=C;
 opts=opts||{};
 const SH=kind==='shuttle',zs=SH?1:-1,X0=opts.x||0,ID=opts.id||kind,auto=opts.auto!==false;
 const HH=1200,Z1=170,Z2=-170,ZN=zs*430,RX=380,RS=SH?10:20,PERIOD=SH?600:480,EX=550-EXIT;
 const lo=Math.min(Z2,ZN)-130,hi=Math.max(Z1,ZN)+130,zc=(lo+hi)/2,DX=-150;   /* DX: verification desk x (merge) */
 const {W,G,G2,GL,FR,BL}=K;
 const g=new THREE.Group();g.position.x=X0;C.parentFor(opts).add(g);
 const bt=C.belt(40);
 /* ---- frame & covers ---- */
 box(g,1060,50,1260,G,0,95,0,NOSH);K.feet(g,[[-480,-580],[480,-580],[-480,580],[480,580],[0,-580],[0,580]]);
 [[-535,-635],[535,-635],[-535,635],[535,635]].forEach(p=>box(g,60,1110,60,G2,p[0],645,p[1]));
 [-635,635].forEach(z=>box(g,1130,40,40,G2,0,1180,z));[-535,535].forEach(x=>box(g,40,40,1310,G2,x,1180,0));
 [-1,1].forEach(q=>{box(g,1060,300,14,W,0,280,q*644,NOSH);box(g,1060,16,18,BL,0,438,q*647,NOSH);K.vent(g,-300,280,q*651.2,q>0?0:PI,220,150);K.vent(g,300,280,q*651.2,q>0?0:PI,220,150);
  [-390,0,390].forEach(x=>box(g,3,300,2,G,x,280,q*651.4,NOSH));});
 const lanesL=[[Z1-150,872,Z1+150,968]],lanesB=[[Z1-150,872,Z1+150,968],[Z2-150,872,Z2+150,968]];
 K.wall(g,-550,SH?lanesL:lanesB,130,HH,650);K.wall(g,570,SH?lanesB:lanesL,130,HH,650);
 label(g,SH?'SHUTTLE':'MERGE',360,56,-330,230,659,{fg:'#1c2128',pw:640,size:.74});
 plate(g,[SH?'LANE SHUTTLE · SPLITTER':'LANE MERGE · NG BUFFER',SH?'1 lane in · 2 lanes out · NG reject rack':'2 lanes in · 1 lane out · NG buffer','24 V DC · 6 bar · SMEMA'],380,86,170,230,659,{pw:660,bg:'#dfe3e8'});
 plate(g,['! WARNING','Moving conveyor'],110,80,430,200,659,{bg:'#f2c400',border:'#111',pw:300});
 /* polycarbonate side guards (front/rear) + hinged rack service door with interlock */
 [-1,1].forEach(q=>{const rk=q===zs,x0=rk?-135:0,w=rk?750:1020;box(g,w,730,4,K.GS,x0,800,q*644,NOSH);[430,1170].forEach(y=>box(g,w,8,8,FR,x0,y,q*644,NOSH));if(rk)box(g,8,730,8,FR,240,800,q*644,NOSH);});
 const door=new THREE.Group();door.position.set(240,800,zs*648);g.add(door);box(door,270,720,4,K.GS,135,0,0,NOSH);[-360,360].forEach(y=>box(door,270,8,8,FR,135,y,0,NOSH));box(door,8,720,8,FR,270,0,0,NOSH);box(door,14,90,20,M.steel,250,0,zs*10,NOSH);box(g,30,60,24,M.yellow,525,800,zs*656,NOSH);door.open=0;door.target=0;
 const hp=new THREE.Group();hp.position.set(0,HH,-625);g.add(hp);box(hp,1040,8,1250,GL,0,2,625);[-1,1].forEach(q=>box(hp,10,14,1250,FR,q*520,4,625));box(hp,1040,14,12,FR,0,4,1250);box(hp,1040,16,16,G,0,0,0);box(hp,140,12,14,M.steel,0,12,1270);
 const hood=K.hood(hp);hood.max=1.1;
 /* ---- linear guides, drive belt, servo ---- */
 [-1,1].forEach(q=>{box(g,22,16,hi-lo,FR,q*200,800,zc);box(g,22,6,hi-lo,M.black,q*200,809,zc,NOSH);for(let k=0;k<4;k++){const z=lo+30+k*(hi-lo-60)/3;box(g,60,60,36,G2,q*200,770,z);box(g,34,640,34,G2,q*200,450,z);}});
 box(g,500,30,30,G2,0,300,zc);box(g,500,30,30,G2,0,300,lo+40);box(g,500,30,30,G2,0,300,hi-40);
 const mz=-zs*440,iz=zs*620;cyl(g,14,14,30,M.aluD,0,816,mz+60,{rz:PI/2});cyl(g,14,14,30,M.aluD,0,816,iz,{rz:PI/2});
 box(g,24,3,Math.abs(iz-mz-60),M.black,0,830,(iz+mz+60)/2,NOSH);box(g,24,3,Math.abs(iz-mz-60),M.black,0,802,(iz+mz+60)/2,NOSH);
 box(g,100,100,140,G,0,790,mz-20);cyl(g,36,36,80,M.black,0,790,mz-120,{rx:PI/2});box(g,60,60,60,G2,0,816,mz+30);
 plate(g,['SERVO','TRAVEL 600 mm · 1.0 m/s'],110,36,0,860,mz-20+72,{pw:300,bg:'#dfe3e8'});
 /* ---- segment (translates in Z) ---- */
 const seg=new THREE.Group();seg.position.set(0,0,Z1);g.add(seg);
 C.railSeg(seg,-230,230,0,{belt:bt});box(seg,470,16,300,G2,0,840,0);
 [-1,1].forEach(q=>{[-80,80].forEach(zz=>box(seg,50,28,90,G,q*200,822,zz));[-107,107].forEach(zz=>box(seg,30,12,30,G2,q*200,854,zz));});
 box(seg,60,14,40,BL,0,826,0);box(seg,60,20,100,G2,255,838,0);box(seg,40,50,40,G,300,805,0);box(seg,60,34,16,M.black,-150,CONV_Y-17,128,NOSH);box(seg,14,10,10,M.orange,60,CONV_Y-22,100,NOSH);
 /* ---- cable chain ---- */
 const chTex=()=>{const t=canvasTex(32,32,(c,Wd,H)=>{c.fillStyle='#2a2d33';c.fillRect(0,0,Wd,H);c.fillStyle='#14161a';c.fillRect(0,0,Wd,4);c.fillStyle='#3b3f47';c.fillRect(4,6,Wd-8,H-12);},{repeat:true});return new THREE.MeshStandardMaterial({map:t,roughness:.7});};
 const chA=new THREE.Mesh(new THREE.BoxGeometry(44,10,1),chTex()),chB=new THREE.Mesh(new THREE.BoxGeometry(44,10,1),chTex()),chF=cyl(g,14,14,44,G,300,790,0,{rz:PI/2,seg:16});
 g.add(chA,chB);const zA=-zs*170,LC=700;box(g,60,8,hi-lo,G2,300,768,zc);box(g,50,40,50,G2,300,776,zA);
 /* ---- fixed conveyors ---- */
 const inL=SH?[1]:[1,2],outL=SH?[1,2]:[1],pins={},pinsOut={};
 inL.forEach(l=>{const z=l===1?Z1:Z2;C.railSeg(g,-670,-238,z,{belt:bt});box(g,60,34,16,M.black,-600,CONV_Y-17,z+BD(C)/2+21,NOSH);box(g,14,10,10,M.orange,-300,CONV_Y-22,z+100,NOSH);if(!SH){pins[l]=C.stopper(g,EX*-1+125+7,z);pins[l].userData.up=true;}});
 outL.forEach(l=>{const z=l===1?Z1:Z2;C.railSeg(g,238,670,z,{belt:bt});box(g,60,34,16,M.black,600,CONV_Y-17,z+BD(C)/2+21,NOSH);pinsOut[l]=C.stopper(g,EX+125+7,z);pinsOut[l].userData.up=true;box(g,14,10,10,M.orange,EX+160,CONV_Y-22,z+100,NOSH);});
 [-1,1].forEach(q=>[-400,400].forEach(x=>[-270,-35,35,270].forEach(z=>box(g,34,740,34,G2,x*q,490,z))));
 [-420,420].forEach(x=>{box(g,30,30,720,G2,x,330,0);});
 /* rollers into the NG rack */
 [898,904].forEach(y=>cyl(g,5,5,200,M.steel,240,y,ZN,{rx:PI/2,seg:8}));
 /* ---- NG rack / buffer magazine on its own indexing carriage ---- */
 const rackY=new THREE.Group();rackY.position.set(RX,875,ZN);g.add(rackY);
 box(rackY,300,8,260,G2,0,-4,0);box(rackY,280,80,8,G2,0,40,zs*140);box(rackY,40,8,60,M.steel,0,-12,zs*150);
 [-1,1].forEach(q=>{box(g,24,820,24,G2,RX+q*110,520,ZN+zs*160);});box(g,260,16,20,G,RX,930,ZN+zs*160);
 const rackMag=K.mag(rackY,{slots:RS,mz:250,bx:-30});
 const rackLevel=n=>900-(Y0+SLOT*n);
 plate(g,[SH?'NG REJECT RACK':'NG BUFFER',RS+' slots · operator empties'],170,50,RX,500,ZN+zs*(SH?190:190),{pw:400,bg:'#f2c400',border:'#111'});
 /* ---- repair / verification station (merge) ---- */
 let fix=null,mon=null,ver=null;
 if(!SH){const x0=DX,zD=-780;box(g,520,30,260,W,x0,860,zD);[-1,1].forEach(a=>[-1,1].forEach(b=>{box(g,40,846,40,G2,x0+a*230,423,zD+b*105);cyl(g,34,38,14,M.steel,x0+a*230,7,zD+b*105,{seg:16});}));
  box(g,500,40,10,G2,x0,380,zD+105);box(g,500,40,10,G2,x0,380,zD-105);
  box(g,420,3,210,std(0x2e7d4f,.9,0),x0,876.5,zD,NOSH);fix=new THREE.Mesh(new THREE.BoxGeometry(250,5,200),K.boardMat);fix.position.set(x0-130,880,zD);fix.visible=false;g.add(fix);box(g,270,4,220,G2,x0-130,876,zD,NOSH);
  cyl(g,14,14,230,M.steel,x0-250,990,zD,{seg:10});box(g,140,16,16,G2,x0-180,1090,zD,NOSH);cyl(g,22,22,140,M.black,x0-130,1000,zD,{seg:16});cyl(g,26,26,12,M.dark,x0-130,935,zD,{seg:16});
  box(g,30,430,30,G2,x0+210,1090,zD-110);box(g,30,30,130,G2,x0+210,1290,zD-45);box(g,300,190,18,M.black,x0+110,1200,zD-5);
  const mc=document.createElement('canvas');mc.width=512;mc.height=300;mon={c:mc,ctx:mc.getContext('2d'),tex:new THREE.CanvasTexture(mc)};mon.tex.encoding=THREE.sRGBEncoding;
  const sc=new THREE.Mesh(new THREE.PlaneGeometry(284,172),new THREE.MeshBasicMaterial({map:mon.tex,toneMapped:false}));sc.position.set(x0+110,1200,zD+4.5);g.add(sc);
  cyl(g,150,150,36,G,x0+380,520,-1010,{seg:20});cyl(g,18,18,480,M.steel,x0+380,260,-1010,{seg:10});cyl(g,200,220,10,M.steel,x0+380,5,-1010,{seg:20});
  plate(g,['REPAIR / VERIFICATION','microscope · monitor · ESD mat'],240,44,x0,905,zD+135,{pw:400,bg:'#dfe3e8'});}
 const drawMon=()=>{if(!mon)return;const c=mon.ctx;c.fillStyle='#101418';c.fillRect(0,0,512,300);c.fillStyle='#e8edf2';c.font='600 20px Arial';c.textBaseline='middle';
  if(!ver){c.fillStyle='#8fa3bd';c.fillText('VERIFICATION STATION · idle',20,40);}
  else{c.fillText('NG #'+ver.i+' / '+ver.n+'  ·  verify',20,30);c.fillStyle='#187a36';c.fillRect(60,60,392,200);c.fillStyle='#0d4f22';for(let k=0;k<30;k++)c.fillRect(80+(k*37)%350,75+(k*53)%160,24,12);
   const px=100+ver.pos[0]*300,py=90+ver.pos[1]*140;c.lineWidth=5;c.strokeStyle=ver.real?'#ff3a3a':'#3ddc84';c.beginPath();c.arc(px,py,26,0,7);c.stroke();c.fillStyle=ver.real?'#ff6b6b':'#3ddc84';c.font='700 22px Arial';c.fillText(ver.real?'REAL DEFECT':'FALSE CALL',20,282);}
  mon.tex.needsUpdate=true;};
 /* ---- tower, e-stops, HMI, SMEMA ---- */
 const tw=K.tower(g,-520,HH,-620);K.estop(g,-535,1040,655,0);K.estop(g,535,1040,655,0);
 const smI=K.smema(g,-574,790,SH?Z1+170:Z1+170,-PI/2),smO=K.smema(g,574,790,Z1+170,PI/2);
 const op=K.op(g);
 const m=C.machine({id:ID,name:SH?'SHUTTLE':'MERGE',kind,group:g,x:X0,length:1100,depth:1300,height:HH,lanes:[1,2],lanesIn:SH?[1]:[1,2],lanesOut:SH?[1,2]:[1],inReach:120,outReach:120,parallel:1,line:opts.line});
 const st={busy:false,cur:null,inc:SH?false:{1:false,2:false},moving:false,last:2,rackN:0,rejTotal:0,fullT:null,lastSvc:0,svc:0,real:0,fc:0,entry:{1:null,2:null},ngList:[],cap:RS};m.st=st;
 const Zl=l=>l===1?Z1:Z2;
 const partner=l=>{const o=m.line.order.length?m.line.order:m.line.machines.slice().sort((a,b)=>a.x-b.x);for(const q of o)if(q!==m&&q.x>m.x&&q.lanesIn.includes(l))return q;return null;};
 const hmi=K.hmi(g,-420,1060,690,.2,(c,W_,H)=>{hdrDraw(c,W_,H,SH?'SHUTTLE':'MERGE',m,C);c.fillStyle='#8fa3bd';c.font='500 12px Arial';c.fillText(m.step+(m.detail?' · '+m.detail:''),10,48);
  const zy=z=>58+(-z*zs+430)/860*88;[[Z1,'LANE 1'],[Z2,'LANE 2'],[ZN,SH?'REJECT':'NG']].forEach(a=>{const y=zy(a[0]);c.strokeStyle='#33405a';c.beginPath();c.moveTo(10,y);c.lineTo(150,y);c.stroke();c.fillStyle='#8fa3bd';c.fillText(a[1],160,y+4);});
  c.fillStyle='#1e6fd9';c.fillRect(50,zy(seg.position.z)-5,60,10);if(st.cur){c.fillStyle='#3ddc84';c.fillRect(60,zy(seg.position.z)-3,40,6);}
  c.fillStyle='#fff';c.font='700 14px Arial';c.fillText('IN '+m.counters.in+'  OUT '+m.counters.out+'  NG '+m.counters.ng,10,200);c.font='500 12px Arial';c.fillStyle='#8fa3bd';c.fillText((SH?'REJECT RACK ':'NG BUFFER ')+st.rackN+' / '+RS+'   Cycle '+(m.avgCt()?m.avgCt().toFixed(1)+'s':'—'),10,164);
  if(!SH)c.fillText('Real '+st.real+'  False calls '+st.fc,10,182);else c.fillText('Emptied '+st.svc+'x ('+st.rejTotal+')',10,182);foot(c,m);});
 function* segTo(z,b){const a=seg.position.z,d=Math.abs(z-a);if(d<1)return;st.moving=true;m.setState('RUN','TRANSLATE','segment -> z '+z);yield* C.tween(.3+d/700,k=>{seg.position.z=a+(z-a)*k;if(b)b.setZ(seg.position.z);});seg.position.z=z;if(b)b.setZ(z);st.moving=false;}
 const rm=b=>{const i=m.boards.indexOf(b);if(i>=0)m.boards.splice(i,1);};
 function* storeNG(b){yield* C.conveyTo(b,m.world(360),bt);const real=(b.aoi&&b.aoi.real!==undefined)?b.aoi.real:b.defects.length>0;st.ngList.push(real);rackMag.set(rackMag.n+1);b.dispose();rm(b);st.rackN++;m.counters.ng++;if(st.rackN>=RS)st.fullT=C.T.sim;
  m.addLog((SH?'SPI NG rejected':'AOI NG buffered')+' #'+b.sn+' ('+st.rackN+'/'+RS+')','ng');}
 function* shuttleMain(){for(;;){
  while(!st.cur){m.setState('STARVED','WAITING FOR BOARD','input lane 1');yield FRAME;}
  const b=st.cur,t0=b.tIn;let lane=0;
  if(b.spi&&b.spi.ng){while(st.rackN>=RS){m.setState('BLOCKED','REJECT RACK FULL','operator called');yield FRAME;}
   yield* segTo(ZN,b);m.setState('RUN','REJECT','to rack');yield* storeNG(b);st.cur=null;m.endCycle(b,t0);
   yield* K.par(segTo(Z1),K.mv(rackY,{y:rackLevel(st.rackN)},.5));continue;}
  while(!lane){const free=[1,2].filter(l=>!m.outQ[l]);if(free.length){const rdy=free.filter(l=>{const P=partner(l);return P&&P.canAccept(l,b);}),c=rdy.length?rdy:free;lane=c.length>1?(st.last===1?2:1):c[0];}
   else{m.setState('BLOCKED','BOTH OUTPUTS OCCUPIED','waiting for downstream');yield FRAME;}}
  m.setState('RUN','DISPATCH','lane '+lane);yield* segTo(Zl(lane),b);
  if(m.outQ[lane]){const o=lane===1?2:1;if(!m.outQ[o]){lane=o;yield* segTo(Zl(o),b);}else while(m.outQ[lane])yield FRAME;}   /* re-check on arrival */
  let done=false;C.run((function*(){yield* C.conveyTo(b,m.world(EX),bt);done=true;})());
  while(!done&&b.x<m.world(365))yield FRAME;
  yield* segTo(Z1);while(!done)yield FRAME;   /* the segment returns while the board is still running off */
  b.setLane(lane);st.cur=null;st.last=lane;m.setReady(b,lane);m.endCycle(b,t0);}}
 function* mergeMain(){for(;;){
  while(!st.entry[1]&&!st.entry[2]){m.setState('STARVED','WAITING FOR BOARDS','lanes 1 / 2');yield FRAME;}
  const lane=st.entry[1]&&st.entry[2]?(st.entry[1].tIn<=st.entry[2].tIn?1:2):(st.entry[1]?1:2),b=st.entry[lane],t0=b.tIn,ng=b.result==='NG';
  while(ng?st.rackN>=RS:!!m.outQ[1]){m.setState('BLOCKED',ng?'NG BUFFER FULL':'OUTPUT OCCUPIED',ng?'operator called':'waiting for downstream');yield FRAME;}
  yield* segTo(Zl(lane));pins[lane].userData.up=false;yield .2;
  m.setState('RUN','TRANSFER ONTO SEGMENT','lane '+lane);yield* C.conveyTo(b,m.world(0),bt);st.entry[lane]=null;pins[lane].userData.up=true;
  if(ng){yield* segTo(ZN,b);m.setState('RUN','NG TO BUFFER','');yield* storeNG(b);rm(b);m.endCycle(b,t0);yield* K.mv(rackY,{y:rackLevel(st.rackN)},.5);}
  else{yield* segTo(Z1,b);yield* C.conveyTo(b,m.world(EX),bt);b.setLane(1);m.setReady(b,1);m.endCycle(b,t0);}}}
 m.canAccept=SH?(()=>!m.down&&!st.cur&&!st.inc&&!st.moving&&Math.abs(seg.position.z-Z1)<1):(l=>!m.down&&!st.entry[l]&&!st.inc[l]);
 m.onAccept=SH?(b=>{st.inc=true;C.run((function*(){yield* C.conveyTo(b,m.world(0),bt);st.inc=false;st.cur=b;})());}):((b,l)=>{st.inc[l]=true;C.run((function*(){yield* C.conveyTo(b,m.world(-EX),bt);st.inc[l]=false;st.entry[l]=b;})());});
 m.onRelease=(b,l)=>{const p=pinsOut[l];p.userData.up=false;bt.moving++;C.run((function*(){yield 1.6;bt.moving--;p.userData.up=true;})());};
 function* serveRack(){const n=st.rackN,list=st.ngList.slice(),ry=zs>0?0:PI;st.busy=true;door.target=1;C.run(K.serve(op,RX,zs*800,ry,3));yield 2.6;rackMag.set(0);
  st.ngList=[];st.rackN=0;st.fullT=null;st.lastSvc=C.T.sim;st.svc++;st.rejTotal+=n;yield* K.mv(rackY,{y:rackLevel(0)},.8);yield 3;door.target=0;
  if(SH){m.addLog('Operator emptied reject rack ('+n+' boards)','ok');}
  else{const real=list.filter(Boolean).length,fc=n-real,per=Math.min(30,4+n*1.3)/Math.max(1,n);
   C.run(K.serve(op,DX,-1080,PI,per*n+.5));yield 1.4;fix.visible=true;
   for(let i=0;i<n;i++){ver={i:i+1,n,real:list[i],pos:[C.rnd(),C.rnd()]};drawMon();yield per;}
   ver=null;fix.visible=false;drawMon();st.real+=real;st.fc+=fc;m.addLog('Operator verified '+n+' NG: '+real+' real, '+fc+' false calls','ok');yield 1.6;}
  st.busy=false;}
 m.emptyRack=()=>st.rackN>0&&!st.busy?C.run(serveRack()):0;
 if(auto)C.run((function*(){for(;;){yield 5;if(!st.busy&&st.rackN>0&&(C.T.sim-st.lastSvc>=PERIOD||(st.rackN>=RS&&C.T.sim-st.fullT>=20)))yield* serveRack();}})());
 m.update=(dt,rdt)=>{
  C.tower(m,tw,st.rackN>=RS-1);hood.upd(rdt);door.open+=(door.target-door.open)*Math.min(1,(rdt||0)*3);door.rotation.y=-zs*door.open*1.4;
  const zB=seg.position.z,D=(zB-zA)*zs,F=zA+zs*((LC+D)/2),l1=Math.max(1,Math.abs(F-zA)),l2=Math.max(1,Math.abs(F-zB));
  chA.scale.z=l1;chA.position.set(300,772,(zA+F)/2);chA.material.map.repeat.set(1,l1/20);chB.scale.z=l2;chB.position.set(300,804,(zB+F)/2);chB.material.map.repeat.set(1,l2/20);chF.position.z=F;
  smI.a.emissiveIntensity=m.state==='RUN'?1.8:.05;smO.a.emissiveIntensity=(m.outQ[1]||m.outQ[2])?1.8:.05;smI.b.emissiveIntensity=smO.b.emissiveIntensity=(m.state==='BLOCKED'||m.state==='STARVED')?1.4:.05;K.opUpd(op);};
 C.onSlow(()=>{if(m.near)hmi.redraw();});drawMon();
 m.info=()=>[['State',m.state+' · '+m.step],['Detail',m.detail||'—'],['Boards in',m.counters.in],['Boards out',m.counters.out],[SH?'Rejected (SPI NG)':'NG buffered',m.counters.ng],[SH?'Reject rack':'NG buffer',st.rackN+' / '+RS],
  [SH?'Rack emptied':'Verified (real / false call)',SH?st.svc+'x ('+st.rejTotal+')':st.real+' / '+st.fc],['Segment z',Math.round(seg.position.z)+' mm'],['Cycle',m.avgCt()?m.avgCt().toFixed(1)+' s':'—'],['Alarms',m.faults||0]];
 m.views={over:{p:[-1500,1800,3200],t:[0,700,0]},seg:{p:[500,1350,1300],t:[0,880,0],hood:1},drive:{p:[-900,1500,1400*zs],t:[0,800,-250*zs],hood:1},[SH?'reject':'ngbuf']:{p:[1000,1600,1700*zs],t:[RX,900,ZN],hood:1},top:{p:[0,3700,200],t:[0,900,0],hood:1},out:{p:[1200,1200,1000],t:[500,900,0]}};
 m.setHood=o=>{hood.target=o?1:0;};
 C.tag(SH?'Lane shuttle':'Lane merge',g,0,1300,0);C.tag('Translating conveyor segment',seg,0,950,0);C.tag('Linear guide + servo belt drive',g,0,830,mz+100);C.tag('Cable chain',g,300,820,zc);C.tag(SH?'NG reject rack (10 slots)':'NG buffer magazine (20 slots)',rackY,0,200,0);C.tag('Signal tower',g,-520,HH+330,-620);C.tag('Operator panel',g,-420,1250,690);
 C.dyn(seg,chA,chB,chF,rackY,hp,door,...(fix?[fix]:[]),pinsOut[1],pinsOut[2],pins[1],pins[2]);
 C.bake(g);
 C.run(SH?shuttleMain():mergeMain());
 return m;
}
function BD(C){return C.BD;}

/* ===================== CONVEYOR (link / visual inspection) ===================== */
function conveyorMod(C,opts){
 const K=kit(C),{THREE,box,cyl,label,plate,std,M,NOSH,FRAME,CONV_Y,BD}=C;
 opts=opts||{};
 const len=opts.length||1200,lanes=opts.lanes||[1],insp=!!opts.inspection,X0=opts.x||0,ID=opts.id||'conveyor';
 const {W,G,G2,FR,BL}=K,LZs=lanes.map(l=>l===1?170:-170),zf=Math.max(...LZs)+135,zr=Math.min(...LZs)-135,zm=(zf+zr)/2,exitX=len/2-EXIT;
 const g=new THREE.Group();g.position.x=X0;C.parentFor(opts).add(g);
 const bl={},pins={},sens={},ls={},DW=opts.dwell||[12,25],CAPL=insp?2:1;
 /* frame */
 [-len/2+70,len/2-70].forEach(x=>{[zf,zr].forEach(z=>{box(g,40,CONV_Y-60-30,40,G2,x,(CONV_Y-60+30)/2,z);cyl(g,30,30,16,M.steel,x,8,z,{seg:20});});box(g,30,30,zf-zr,G2,x,300,zm);});
 [zf,zr].forEach(z=>{box(g,len-160,30,30,G2,0,300,z);box(g,len-100,60,8,W,0,820,z+(z>zm?-33:33),NOSH);});
 box(g,len-160,6,zf-zr,G,0,318,zm,NOSH);
 lanes.forEach((l,i)=>{const z=LZs[i];bl[l]=C.belt(Math.round(len/12));C.railSeg(g,-len/2,len/2,z,{belt:bl[l]});
  pins[l]=C.stopper(g,exitX+125+7,z);pins[l].userData.up=true;box(g,60,34,16,M.black,-len/2+60,CONV_Y-17,z+BD/2+21,NOSH);
  const mk=x=>C.emissive(0xff8a00,.05),sx=[-len/2+170,0,exitX+100];sens[l]=sx.map(x=>{const mt=mk();cyl(g,7,7,10,mt,x,CONV_Y+12,z+BD/2+13,{cast:false,seg:10});box(g,16,22,12,G2,x,CONV_Y-4,z+BD/2+15,NOSH);return {x,mt};});
  ls[l]={list:[],phase:''};});
 /* adjustable width: hand wheel + spindle + scale */
 const hw=new THREE.Group();hw.position.set(-len/2+30,CONV_Y-60,zf+30);g.add(hw);cyl(hw,50,50,10,M.red,0,0,0,{rx:PI/2,seg:24});cyl(hw,7,7,30,M.steel,0,0,-15,{rx:PI/2,seg:8});[0,1,2].forEach(k=>box(hw,90,8,8,M.dark,0,0,6,{rz:k*PI/3}));
 cyl(g,8,8,zf-zr,M.steel,-len/2+30,CONV_Y-40,zm,{rx:PI/2,seg:10});plate(g,['RAIL WIDTH','200.0 mm (50–330)'],130,44,-len/2+120,780,zf+3,{pw:360,bg:'#dfe3e8'});
 /* SMEMA + tower + labels */
 const smI=K.smema(g,-len/2+110,800,zf+14,0),smO=K.smema(g,len/2-110,800,zf+14,0);
 box(g,30,640,30,G2,len/2-90,580,zr-40);const tw=K.tower(g,len/2-90,900,zr-40);
 label(g,insp?'INSPECTION CONVEYOR':'LINK CONVEYOR',320,44,-len/4,640,zf+5.5,{fg:'#1c2128',bg:'#e9ebee',pw:640,size:.62});
 /* visual inspection station: arch, work light, magnifier lamp */
 const lightM=C.emissive(0xeaf6ff,.3),ringM={};
 if(insp){[zf+30,zr-30].forEach(z=>box(g,40,560,40,G2,0,1180,z));box(g,80,40,zf-zr+100,G2,0,1440,zm);
  box(g,520,22,130,lightM,0,1405,zm,NOSH);box(g,540,10,150,G,0,1423,zm);
  lanes.forEach((l,i)=>{const zL=LZs[i],q=zL>zm?1:-1,pz=q>0?zf+30:zr-30;ringM[l]=C.emissive(0xffffff,.3);
   const lens=new THREE.Mesh(new THREE.CylinderGeometry(80,80,5,32),std(0x9db4c8,.05,.2,{transparent:true,opacity:.28,depthWrite:false}));
   const ring=new THREE.Mesh(new THREE.TorusGeometry(88,9,8,36),ringM[l]);ring.rotation.x=PI/2;ring.position.set(0,1100,zL);g.add(ring);lens.position.set(0,1098,zL);g.add(lens);
   box(g,16,16,Math.abs(pz-zL)-88,G2,0,1100,(pz+zL+q*88)/2);box(g,60,40,30,G,0,1100,pz-q*10);box(g,20,20,40,M.steel,0,1100,zL+q*100,NOSH);
   C.tag('Magnifier lamp lane '+l,g,0,1150,zL);});
  plate(g,['VISUAL INSPECTION','dwell '+DW[0]+'–'+DW[1]+' s · lamp 3 dpt'],220,44,0,1000,zf+33,{pw:440,bg:'#f2c400',border:'#111'});}
 const m=C.machine({id:ID,name:opts.name||(insp?'INSPECTION CONVEYOR':'CONVEYOR'),kind:'conveyor',group:g,x:X0,length:len,depth:zf-zr+80,height:insp?1450:900,lanes,lanesIn:lanes,lanesOut:lanes,inReach:0,outReach:0,line:opts.line});
 const st={insp:0,ls,dwell:0};m.st=st;
 m.canAccept=l=>!m.down&&ls[l].list.length<CAPL&&!ls[l].list.some(x=>x._ph==='IN');
 m.onAccept=(b,l)=>{const q=ls[l];q.list.push(b);b._ph='IN';if(opts.onBoard)opts.onBoard(b);C.run((function*(){
   const ahead=()=>q.list.some(x=>x!==b&&(x._ph==='IN'||x._ph==='INSPECT'));
   if(insp&&ahead()){yield* C.conveyTo(b,m.world(-290),bl[l]);b._ph='QUEUE';while(ahead())yield FRAME;}
   yield* C.conveyTo(b,m.world(insp?0:exitX),bl[l]);
   if(insp){b._ph='INSPECT';q.phase='INSPECT';st.dwell=DW[0]+C.rnd()*(DW[1]-DW[0]);yield st.dwell;st.insp++;b._ph='DONE';
    while(q.list.some(x=>x!==b&&(x._ph==='OUT'||x._ph==='READY')))yield FRAME;b._ph='OUT';yield* C.conveyTo(b,m.world(exitX),bl[l]);}
   b._ph='READY';m.setReady(b,l);})());};
 m.onRelease=(b,l)=>{const q=ls[l],i=q.list.indexOf(b);if(i>=0)q.list.splice(i,1);const p=pins[l];p.userData.up=false;bl[l].moving++;C.run((function*(){yield 1.6;bl[l].moving--;p.userData.up=true;})());};
 C.onTick(()=>{let run=false,blk=false;lanes.forEach(l=>ls[l].list.forEach(b=>{if(b._ph==='READY')blk=true;else run=true;}));
  if(run)m.setState('RUN',lanes.some(l=>ls[l].list.some(b=>b._ph==='INSPECT'))?'VISUAL INSPECTION · '+st.dwell.toFixed(0)+' s':'TRANSPORT','');else if(blk)m.setState('BLOCKED','BOARD AT EXIT','waiting for downstream');else m.setState('STARVED','WAITING FOR BOARD','');});
 m.update=()=>{C.tower(m,tw,false);let on=false;
  lanes.forEach(l=>{const bs=ls[l].list;sens[l].forEach(s=>{s.mt.emissiveIntensity=bs.some(b=>Math.abs(b.x-m.world(s.x))<130)?1.8:.05;});const li=bs.some(b=>b._ph==='INSPECT');if(li)on=true;if(ringM[l])ringM[l].emissiveIntensity=li?2.2:.2;});
  lightM.emissiveIntensity=on?1.6:.25;smI.a.emissiveIntensity=smO.a.emissiveIntensity=m.state==='RUN'?1.8:.05;smO.b.emissiveIntensity=m.state==='BLOCKED'?1.4:.05;smI.b.emissiveIntensity=m.state==='STARVED'?1.4:.05;};
 m.info=()=>[['State',m.state+' · '+m.step],['Boards in',m.counters.in],['Boards out',m.counters.out],['Lane 1',ls[1]?(ls[1].list.length?ls[1].list.map(b=>'#'+b.sn+' '+b._ph).join(', '):'free'):'—'],['Lane 2',ls[2]?(ls[2].list.length?ls[2].list.map(b=>'#'+b.sn+' '+b._ph).join(', '):'free'):'—'],['Inspected',st.insp],['Last dwell',insp&&st.dwell?st.dwell.toFixed(0)+' s':'—']];
 m.views={over:{p:[-900,1600,2300],t:[0,950,0]},lamp:{p:[600,1450,1100],t:[0,1050,0]},rails:{p:[-len/2+500,1000,900],t:[-len/2+60,820,zm]},out:{p:[len/2+300,1200,900],t:[len/2-150,900,0]}};
 m.setHood=()=>{};
 C.tag(insp?'Inspection conveyor':'Conveyor',g,0,insp?1500:1000,0);C.tag('Width adjustment',g,-len/2+30,CONV_Y-60,zf+80);C.tag('Board sensor',g,exitX+160,CONV_Y+20,zf-120);C.tag('SMEMA box',g,len/2-110,860,zf+14);if(insp)C.tag('Work light',g,0,1440,zm);
 C.dyn(pins[1],pins[2]);C.bake(g);
 return m;
}
SMT3D.register('loader',(C,o)=>handler(C,o,'loader'));
SMT3D.register('unloader',(C,o)=>handler(C,o,'unloader'));
SMT3D.register('shuttle',(C,o)=>splitter(C,o,'shuttle'));
SMT3D.register('merge',(C,o)=>splitter(C,o,'merge'));
SMT3D.register('conveyor',conveyorMod);
})();
