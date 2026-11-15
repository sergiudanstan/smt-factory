/* ===================================================================
   SMT FACTORY SUITE — factory props library.  THREE r147, units mm.
   Every prop: origin = bottom centre on the floor (y = 0), FRONT = +Z.
   window.SMT_PROPS.name(C, opts) -> THREE.Group  (caller positions it).
   Materials are SHARED through one cache (the area builder merges
   geometry per material). Moving props set userData.dynamic = true.
   =================================================================== */
'use strict';
window.SMT_PROPS=(function(){
const PI=Math.PI;
const _m={};                                          /* one material cache */
const mat=(C,key,color,rough=.6,metal=0)=>_m[key]||(_m[key]=C.std(color,rough,metal));
const emat=(C,key,color,i=1.5)=>_m[key]||(_m[key]=C.emissive(color,i));

/* merged box construction: items = [w,h,d,x,y,z,rx?,ry?,rz?] -> ONE mesh */
function boxes(C,parent,m,items){
  if(!items||!items.length)return null;
  const geos=[],q=new THREE.Quaternion(),e=new THREE.Euler(),p=new THREE.Vector3(),s=new THREE.Vector3(1,1,1),k=new THREE.Matrix4();
  for(const it of items){const g=new THREE.BoxGeometry(it[0],it[1],it[2]);
    p.set(it[3],it[4],it[5]);e.set(it[6]||0,it[7]||0,it[8]||0);q.setFromEuler(e);k.compose(p,q,s);g.applyMatrix4(k);geos.push(g);}
  const mg=C.BGU.mergeBufferGeometries(geos,false);geos.forEach(g=>g.dispose());
  if(!mg)return null;
  const mesh=new THREE.Mesh(mg,m);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
/* instanced construction: items=[{x,y,z,rx?,ry?,rz?,sx?,sy?,sz?,c?}] */
function instanced(parent,geo,m,items,colors){
  const im=new THREE.InstancedMesh(geo,m,items.length),d=new THREE.Object3D(),col=new THREE.Color();
  items.forEach((it,i)=>{d.position.set(it.x||0,it.y||0,it.z||0);d.rotation.set(it.rx||0,it.ry||0,it.rz||0);
    d.scale.set(it.sx||1,it.sy||1,it.sz||1);d.updateMatrix();im.setMatrixAt(i,d.matrix);
    if(colors)im.setColorAt(i,col.set(it.c||0xffffff));});
  if(colors&&im.instanceColor)im.instanceColor.needsUpdate=true;
  im.castShadow=im.receiveShadow=true;parent.add(im);return im;
}
/* cached basic material with canvas texture (identical repeated labels / screens) */
function lmat(C,key,text,w,h,o={}){
  if(_m[key])return _m[key];
  const pw=o.pw||256,ph=Math.max(8,Math.round(pw*h/w)),lines=Array.isArray(text)?text:[text];
  const t=C.canvasTex(pw,ph,(g,W,H)=>{g.fillStyle=o.bg||'#f2f2ee';g.fillRect(0,0,W,H);if(o.border){g.strokeStyle=o.border;g.lineWidth=Math.max(2,H*.05);g.strokeRect(g.lineWidth,g.lineWidth,W-2*g.lineWidth,H-2*g.lineWidth);}
    g.fillStyle=o.fg||'#222';g.textAlign='center';g.textBaseline='middle';const n=lines.length;
    lines.forEach((l,i)=>{g.font='700 '+Math.round(H/(n+.5)*(i===0&&n>1?.85:.68))+'px "Segoe UI",Arial,sans-serif';g.fillText(l,W/2,H*(i+.5)/n+H*.02);});});
  return _m[key]=new THREE.MeshBasicMaterial({map:t,toneMapped:false});
}
function quad(parent,lm,w,h,x,y,z,o={}){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),lm);m.position.set(x,y,z);
  if(o.rx)m.rotation.x=o.rx;if(o.ry)m.rotation.y=o.ry;if(o.rz)m.rotation.z=o.rz;parent.add(m);return m;
}
/* cached basic-material screen with a custom canvas draw */
function screen(C,key,w,h,draw){
  if(_m[key])return _m[key];
  return _m[key]=new THREE.MeshBasicMaterial({map:C.canvasTex(w,h,draw),toneMapped:false});
}
/* small floor casters: wheel + top plate */
function casters(C,g,pts,r=40,tw=30){
  const wm=mat(C,'wheel',0x1b1d20,.85,0),pm=mat(C,'castPlate',0x4a5158,.5,.6);
  pts.forEach(p=>{C.cyl(g,r,r,tw,wm,p[0],r,p[2],{rz:PI/2,seg:20});C.box(g,tw+44,12,tw+22,pm,p[0],2*r+6,p[2]);});
}

/* -------------------------------------------------------------------
   pallet  1200 x 800 x 144 (EUR) + stacked cardboard load
   ------------------------------------------------------------------- */
function pallet(C,opts={}){
  const g=new THREE.Group(),wood=mat(C,'wood',0xc8a46e,.85,0),items=[];
  for(let i=0;i<5;i++)items.push([1200,22,145,0,133,-290+i*145]);
  for(let i=0;i<3;i++)items.push([1200,22,145,0,11,-260+i*260]);
  for(const bx of[-527.5,0,527.5])for(const bz of[-350,0,350])items.push([145,78,100,bx,61,bz]);
  boxes(C,g,wood,items);
  if(opts.loaded!==false){
    const h=opts.h===undefined?900:opts.h,cb=mat(C,'cardboard',0xb8915a,.8,0),tp=mat(C,'tape',0xd8c08a,.6,0);
    const cItems=[],tItems=[];let y=144,L=0;
    while(y+300<=h+18){
      if(L%2===0){[[-300,200],[300,200],[-300,-200],[300,-200]].forEach(p=>{
        cItems.push([600,300,400,p[0],y+150,p[1]]);tItems.push([600,3,60,p[0],y+301,p[1]],[60,296,3,p[0],y+150,p[1]+201]);});}
      else{[[-300,200],[300,200]].forEach(p=>{
        cItems.push([600,300,400,p[0],y+150,p[1]]);tItems.push([600,3,60,p[0],y+301,p[1]],[60,296,3,p[0],y+150,p[1]+201]);});
        [[-300,-250],[300,-250]].forEach(p=>{
        cItems.push([400,300,300,p[0],y+150,p[1]]);tItems.push([400,3,60,p[0],y+301,p[1]],[60,296,3,p[0],y+150,p[1]-149]);});}
      y+=300;L++;
    }
    boxes(C,g,cb,cItems);boxes(C,g,tp,tItems);
    quad(g,lmat(C,'shipLbl',['SHIP TO  SMT LINE 1','PALLET 0421  ·  812 PCS','CHECK ESD BAGS'],240,150,-300,294,402,{bg:'#f6f6f2',fg:'#333',border:'#999',pw:256}),240,150,-300,294,402);
  }
  return g;
}

/* -------------------------------------------------------------------
   palletRack  bays x bayW x depth x height, blue uprights + orange beams
   ------------------------------------------------------------------- */
function palletRack(C,opts={}){
  const bays=opts.bays||3,levels=opts.levels===undefined?4:opts.levels,bayW=opts.bayW||2700,D=opts.depth||1100,H=opts.height||5000;
  const g=new THREE.Group(),blue=mat(C,'rackBlue',0x1f4fa0,.5,.25),org=mat(C,'rackOrange',0xe8731a,.5,.2);
  const W=bays*bayW,ux=[],LVL=[150,1500,2850,4200].slice(0,levels);
  for(let i=0;i<=bays;i++)ux.push(-W/2+i*bayW);
  const up=[],br=[],be=[];
  for(const x of ux){
    for(const zs of[1,-1]){
      up.push([90,H,70,x,H/2,zs*(D/2-35)],[150,10,150,x,5,zs*(D/2-35)]);
      br.push([60,60,D-70,x,250,0],[60,60,D-70,x,1250,0]);
      const dy=900,dz=D-70,L=Math.hypot(dy,dz),a=Math.atan2(dz,dy);
      br.push([50,L,50,x,700,0,a],[50,L,50,x,700,0,-a]);
    }
  }
  boxes(C,g,blue,up);boxes(C,g,blue,br);
  for(let b=0;b<bays;b++){const cx=-W/2+bayW/2+b*bayW;
    for(const y of LVL)for(const zs of[1,-1])be.push([bayW-90,50,130,cx,y,zs*505]);
  }
  boxes(C,g,org,be);
  if(opts.loads!==false){
    for(let b=0;b<bays;b++){const cx=-W/2+bayW/2+b*bayW;
      const rows=[0];LVL.forEach(y=>rows.push(y+25));
      for(const base of rows)for(const off of[-900,0,900]){
        const p=pallet(C,{loaded:true,h:C.rr(600,1200)});
        p.rotation.y=PI/2;p.position.set(cx+off,base,0);g.add(p);
      }
    }
  }
  C.box(g,16,260,500,mat(C,'rackSign',0x8a9097,.45,.6),ux[0]-53,1800,0);
  C.plate(g,['MAX 1000 kg','PER LEVEL','DO NOT CLIMB'],460,220,ux[0]-63,1800,0,{ry:-PI/2,bg:'#f4f4f0',fg:'#c22a1e',border:'#c22a1e'});
  return g;
}

/* -------------------------------------------------------------------
   esdBench  1500 x 750, worktop top at y=900, full equipment set
   ------------------------------------------------------------------- */
function esdBench(C,opts={}){
  const w=opts.w||1500,d=opts.d||750,shelf=opts.shelf!==false,monitor=opts.monitor!==false,solder=opts.solder!==false,micro=!!opts.microscope;
  const g=new THREE.Group(),fr=mat(C,'benchSteel',0x8a9097,.45,.6),top=mat(C,'benchTop',0x8f9a92,.7,0),esdm=mat(C,'esdMat',0x5b8fb9,.65,0);
  const hw=w/2,hd=d/2;
  [[-hw+20,hd-20],[hw-20,hd-20],[-hw+20,-hd+20],[hw-20,-hd+20]].forEach(p=>C.box(g,40,860,40,fr,p[0],430,p[1]));
  C.box(g,w-80,40,40,fr,0,840,hd-20);C.box(g,w-80,40,40,fr,0,840,-hd+20);
  C.box(g,40,40,d-80,fr,-hw+20,840,0);C.box(g,40,40,d-80,fr,hw-20,840,0);
  C.box(g,w-80,30,30,fr,0,150,-hd+60);C.box(g,w-80,30,30,fr,0,150,hd-60);
  C.box(g,w,30,d,top,0,885,0);
  C.box(g,w-40,4,d-40,esdm,0,902,0);
  C.box(g,40,1046,40,fr,-hw+90,1427,-hd+20);C.box(g,40,1046,40,fr,hw-90,1427,-hd+20);
  if(shelf){C.box(g,w-160,25,300,fr,0,1500,-hd+100);
    boxes(C,g,mat(C,'cardboard',0xb8915a,.8,0),[[260,172,220,-490,1599,-265],[220,172,220,490,1599,-265]]);}
  C.box(g,w-240,45,70,mat(C,'lampHouse',0x3a4048,.5,.3),0,1850,-hd+30);
  C.box(g,w-280,25,30,emat(C,'ledWhite',0xffffff,1.2),0,1850,-hd+57,{cast:false});
  /* louvered bin panel + 18 instanced bins */
  C.box(g,w-140,500,25,mat(C,'louver',0x3a4048,.55,.2),0,1200,-hd+17);
  const bins=[],bc=[0x1f6fd1,0xc23b3b,0xe8c22a];
  for(let r=0;r<3;r++)for(let c=0;c<6;c++)bins.push({x:-330+c*132,y:1030+r*110,z:-hd+115,sx:120,sy:80,sz:170,c:bc[(r+c)%3]});
  instanced(g,new THREE.BoxGeometry(1,1,1),mat(C,'bins',0xffffff,.55,0),bins,true);
  /* yellow-green ground snap on the front edge */
  C.box(g,w-60,10,14,mat(C,'snapStrip',0x9fbe2e,.5,0),0,909,hd-14);
  C.cyl(g,18,18,8,mat(C,'snapDome',0xc9d43a,.4,.3),-w/4,918,hd-14,{seg:16});
  C.cyl(g,18,18,8,mat(C,'snapDome',0xc9d43a,.4,.3),w/4,918,hd-14,{seg:16});
  /* drawer unit under the left end */
  const dr=C.M.aluD;
  C.box(g,400,620,600,dr,-550,310,0);
  [120,320,520].forEach(y=>{C.box(g,360,180,8,dr,-550,y,301);C.box(g,140,20,20,mat(C,'drHandle',0x2a2f38,.5,.4),-550,y+40,312);});
  if(monitor){
    C.box(g,200,25,200,mat(C,'monBase',0x2a2f38,.5,.2),250,916,-hd+95);
    C.box(g,50,320,50,mat(C,'monPost',0x2a2f38,.5,.2),250,1088,-hd+140);
    C.box(g,540,320,40,mat(C,'monBody',0x1c1f22,.4,.3),250,1310,-hd+105);
    C.plate(g,['LINE 1','MES · 3 queued','OK 128  NG 2'],480,270,250,1310,-hd+128,{bg:'#0d1420',fg:'#9fd0ff',border:'#1d3f7a'});
  }
  if(solder){
    const st=mat(C,'solderBox',0x31414f,.5,.2);
    C.box(g,150,120,100,st,560,964,-hd+110);
    C.plate(g,['370 °C','CH1'],90,50,560,1005,-hd+161,{bg:'#0d1420',fg:'#57d977'});
    C.cyl(g,32,32,9,mat(C,'ironCoil',0x444a52,.4,.5),560,1033,-hd+85,{seg:18});
    const iron=new THREE.Mesh(new THREE.CapsuleGeometry(12,180,4,12),mat(C,'ironGrip',0x2a2f38,.6,.1));
    iron.rotation.z=PI/2;iron.position.set(560,1040,-hd+85);g.add(iron);
    C.box(g,120,18,60,mat(C,'sponge',0xd9dde1,.9,0),700,922,-hd+110);
  }
  if(micro){
    C.box(g,220,35,260,mat(C,'micBase',0x3a4048,.5,.3),-450,921,-hd+130);
    C.cyl(g,25,25,380,mat(C,'micCol',0x9aa1a8,.35,.8),-450,1128,-hd+190,{seg:16});
    C.box(g,50,60,200,mat(C,'micArm',0x9aa1a8,.35,.8),-450,1330,-85);
    C.box(g,110,90,160,mat(C,'micHead',0x2a2f38,.4,.4),-450,1255,-40);
    [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.CylinderGeometry(20,24,90,14),mat(C,'micEye',0x1c1f22,.4,.3));
      e.position.set(-450+s*28,1330,-70);e.rotation.x=-2.2;g.add(e);});
  }
  C.plate(g,['ESD PROTECTED AREA','wrist strap mandatory'],360,90,0,855,hd+2,{bg:'#eef3f7',fg:'#1f6fb5',border:'#1f6fb5'});
  return g;
}
/* -------------------------------------------------------------------
   dryCabinet  600 x 700 x 1800, fake-glass door, reels, casters
   ------------------------------------------------------------------- */
function dryCabinet(C,opts={}){
  const w=opts.w||600,d=opts.d||700,h=opts.h||1800,doors=opts.doors||1;
  const g=new THREE.Group(),body=mat(C,'cabGrey',0xd9dde1,.55,.1);
  casters(C,g,[[-w/2+60,d/2-60],[w/2-60,d/2-60],[-w/2+60,-d/2+60],[w/2-60,-d/2+60]],37.5);
  C.box(g,w,h-87,d,body,0,87+(h-87)/2,0);
  /* door(s) with fake glass */
  const dw=(w-16)/doors;
  for(let k=0;k<doors;k++){
    const x=doors===1?0:(-.5+ (k+.5))*dw;
    C.box(g,dw-8,h-260,35,body,x,150+(h-260)/2,d/2+17.5);
    C.box(g,dw-70,h-380,12,mat(C,'glass',0x1d2a36,.08,.6),x,175+(h-380)/2+90,d/2+17.5+23);
    C.cyl(g,14,14,Math.min(300,h-500),C.M.black,doors===1?w/2-70:x+dw/2-55,h/2,d/2+40,{seg:12});
  }
  /* 5 shelves with standing reels */
  const rc=[mat(C,'reelW',0xf2f4f6,.5,.1),mat(C,'reelBlu',0x5b8fb9,.5,.1),mat(C,'reelK',0x24272b,.5,.1)],rcol=[0xe8731a,0x1f9e55,0xc8202a];
  for(let s=0;s<5;s++){
    const sy=300+s*290;
    C.box(g,w-50,20,d-70,mat(C,'shelfGrey',0xb9c0c7,.5,.3),0,sy,0);
    for(let r=0;r<3;r++){
      const i=(s*3+r)%3,x=-170+r*170,c=rc[i];
      C.cyl(g,165,165,16,c,x,sy+175,-30,{rx:PI/2,seg:24});
      C.cyl(g,168,168,7,mat(C,'rimC'+i,rcol[i],.5,0),x,sy+175,-30,{rx:PI/2,seg:24});
    }
  }
  C.label(g,'2.1 %RH',300,90,0,h-18,d/2+2,{bg:'#04110a',fg:'#39ff88',pw:256,size:.6});
  return g;
}

/* -------------------------------------------------------------------
   reelTower  900 x 900 x 2050 smart reel storage tower
   ------------------------------------------------------------------- */
function reelTower(C,opts={}){
  const w=opts.w||900,d=opts.d||900,h=opts.h||2050;
  const g=new THREE.Group(),body=mat(C,'whiteBody',0xeceff2,.55,.1);
  [[-w/2+50,d/2-50],[w/2-50,d/2-50],[-w/2+50,-d/2+50],[w/2-50,-d/2+50]].forEach(p=>C.box(g,80,60,80,C.M.black,p[0],30,p[1]));
  C.box(g,w,h-120,d,body,0,60+(h-120)/2,0);
  C.box(g,w,60,d,body,0,h-30,0);
  /* fan unit with 2 grilles on top */
  C.box(g,w-80,16,d-80,mat(C,'fanHole',0x14171b,.6,0),0,h+8,0,{cast:false});
  const fan=screen(C,'fanTex',256,256,(g2,W)=>{g2.fillStyle='#101317';g2.fillRect(0,0,W,W);g2.strokeStyle='#3a424c';g2.lineWidth=7;
    g2.beginPath();g2.arc(W/2,W/2,W*.4,0,PI*2);g2.stroke();
    for(let i=0;i<8;i++){g2.beginPath();g2.moveTo(W/2,W/2);const a=i/8*PI*2+.35;g2.arc(W/2,W/2,W*.38,a,a+.5);g2.lineTo(W/2,W/2);g2.fillStyle='#232a33';g2.fill();}});
  [[-w/4,0],[w/4,0]].forEach(p=>{const m=quad(g,fan,200,200,p[0],h+18,p[1],{rx:-PI/2});m.castShadow=false;});
  /* dark blue band 1500..1650 */
  C.box(g,w+6,150,d+6,mat(C,'bandBlue',0x1d3f7a,.45,.3),0,1575,0);
  /* touch display */
  C.box(g,520,320,30,mat(C,'bezel',0x14171b,.45,.2),0,1780,d/2+15);
  const ui=screen(C,'towerUi',512,320,(g2,W,H)=>{g2.fillStyle='#0b1526';g2.fillRect(0,0,W,H);g2.fillStyle='#12294d';g2.fillRect(0,0,W,56);
    g2.fillStyle='#bfe0ff';g2.font='700 30px "Segoe UI",Arial';g2.textAlign='left';g2.fillText('REEL STORE',24,38);
    g2.font='500 24px "Segoe UI",Arial';g2.fillText('1240 reels · 4 requests',300,38);
    g2.font='500 26px "Segoe UI",Arial';['PICK  Q3-1142  ·  lane 4','PICK  Q1-0788  ·  lane 1','AUDIT  OK  ·  RH 2.1 %'].forEach((l,i)=>{
      g2.fillStyle='#4d7cc9';g2.fillRect(24,84+i*62,20,20);g2.fillStyle='#d7e7ff';g2.fillText(l,58,106+i*62);});});
  quad(g,ui,480,280,0,1780,d/2+32);
  /* output slot door + green status ring */
  C.box(g,440,140,50,mat(C,'slotDark',0x14171b,.5,0),0,1000,d/2-25,{cast:false});
  C.box(g,470,170,16,mat(C,'slotFrame',0x9aa1a8,.4,.6),0,1000,d/2-6);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(64,10,10,32),emat(C,'ledGreen',0x27d267,1.6));ring.position.set(w/2-110,1000,d/2+2);g.add(ring);
  C.plate(g,['SMT STORE · TOWER 1'],380,80,0,1330,d/2+2,{bg:'#eef1f4',fg:'#1d3f7a',border:'#1d3f7a'});
  return g;
}

/* -------------------------------------------------------------------
   reelShelf  1800 x 400 x 2000, reels standing on edge (InstancedMesh)
   ------------------------------------------------------------------- */
function reelShelf(C,opts={}){
  const w=opts.w||1800,d=opts.d||400,h=opts.h||2000,levels=opts.levels||5;
  const g=new THREE.Group(),st=mat(C,'shelfSteel',0xb9bfc6,.5,.35);
  for(const sx of[-1,1])for(const sz of[-1,1])C.box(g,60,h,40,st,sx*(w/2-30),h/2,sz*(d/2-20));
  const pitch=(h-480)/(levels-1);
  for(let s=0;s<levels;s++){
    const sy=150+s*pitch;
    C.box(g,w-120,30,d-40,st,0,sy-15,0);
  }
  const dx=w-120,L=Math.hypot(dx,pitch),ang=Math.atan2(pitch,dx);
  for(const s of[-1,1])C.box(g,L,36,18,st,0,150+(levels-1)*pitch/2,-(d/2-20),{rz:s*ang,cast:false});  /* reels: two diameters, mixed colours, thin coloured rim strip */
  const any=mat(C,'reelAny',0xffffff,.5,.1);
  const bcol=[0xf2f4f6,0x5b8fb9,0x24272b],lcol=[0xe8731a,0x27d267,0xc8202a,0x1f6fd1];
  const I330=[],I180=[],R330=[],R180=[];
  for(let s=0;s<levels;s++){
    const sy=150+s*pitch;let x=-w/2+90;
    while(x<w/2-100){
      const is330=C.pick([1,1,0,0,0])===1,d=is330?330:180,t=C.rr(8,16),z=is330?0:C.pick([-55,55]);
      const y=sy+d/2,c=bcol[Math.floor(C.rnd()*3)],lc=lcol[Math.floor(C.rnd()*4)];
      const it={x:x+d/2,y,z,rx:PI/2,sy:t/16,c},ls={x:x+d/2,y,z,rx:PI/2,c:lc};
      if(is330){I330.push(it);R330.push(ls);}else{I180.push(it);R180.push(ls);}
      x+=d+6+C.rr(2,26);
    }
  }
  instanced(g,new THREE.CylinderGeometry(165,165,16,24),any,I330,true);
  instanced(g,new THREE.CylinderGeometry(90,90,16,20),any,I180,true);
  instanced(g,new THREE.CylinderGeometry(167,167,6,24),any,R330,true);
  instanced(g,new THREE.CylinderGeometry(92,92,6,20),any,R180,true);
  C.plate(g,['SMD REELS  ·  8-56 mm'],360,80,0,150+(levels-1)*pitch-15,d/2-18,{bg:'#eef1f4',fg:'#333',border:'#8a9097'});
  return g;
}

/* -------------------------------------------------------------------
   feederCart  650 x 750 x 1000, 30 feeders + reel rows below
   ------------------------------------------------------------------- */
function feederCart(C,opts={}){
  const slots=opts.slots||30;
  const g=new THREE.Group(),fs=mat(C,'fSteel',0xc9cdd2,.4,.5),dk=mat(C,'fDark',0x24272b,.5,.2);
  casters(C,g,[[-215,270],[215,270],[-215,-270],[215,-270]],40);
  [[-285,330],[285,330],[-285,-330],[285,-330]].forEach(p=>C.box(g,50,860,50,fs,p[0],522,p[1]));
  C.box(g,620,40,40,fs,0,880,330);C.box(g,620,40,40,fs,0,880,-330);
  C.box(g,40,40,700,fs,-285,880,0);C.box(g,40,40,700,fs,285,880,0);
  C.box(g,580,25,680,fs,0,222,0);
  /* feeder bank */
  C.box(g,640,30,700,fs,0,875,0);
  const fb=[],caps=[],fcols=[0x27d267,0xe8731a,0x1f6fd1,0xc8202a,0xe8c22a],flbl=[];
  const pitch=390/slots;
  for(let i=0;i<slots;i++){
    const x=-195+pitch/2+i*pitch;
    fb.push({x,y:945,z:0,sx:11,sy:110,sz:560});
    caps.push({x,y:987,z:240,sx:11,sy:26,sz:40});
    flbl.push({x,y:935,z:281,sx:11,sy:30,sz:4,c:fcols[i%5]});
  }
  instanced(g,new THREE.BoxGeometry(1,1,1),fs,fb);instanced(g,new THREE.BoxGeometry(1,1,1),dk,caps);
  instanced(g,new THREE.BoxGeometry(1,1,1),mat(C,'flbl',0xffffff,.5,0),flbl,true);
  /* reel rows below */
  C.box(g,560,25,620,fs,0,470,0);
  const rl=[],rstrip=[],rcol=[0xf2f4f6,0x5b8fb9,0x24272b],lcol=[0xe8731a,0x27d267,0xc8202a];
  for(let r=0;r<2;r++)for(let i=0;i<7;i++){
    const x=-234+i*78,z=r===0?140:-140,c=rcol[Math.floor(C.rnd()*3)];
    rl.push({x,y:482+90,z,rx:PI/2,sy:C.rr(.5,1),c});
    rstrip.push({x,y:482+90,z,rx:PI/2,c:lcol[Math.floor(C.rnd()*3)]});
  }
  instanced(g,new THREE.CylinderGeometry(90,90,16,20),mat(C,'reelAny',0xffffff,.5,.1),rl,true);
  instanced(g,new THREE.CylinderGeometry(92,92,6,20),mat(C,'reelAny',0xffffff,.5,.1),rstrip,true);
  C.box(g,560,40,40,dk,0,1090,-330);C.box(g,40,200,40,fs,-250,990,-330);C.box(g,40,200,40,fs,250,990,-330);
  C.plate(g,['FEEDER CART  ·  '+slots+'× 8mm'],320,80,0,470,312,{bg:'#eef1f4',fg:'#333',border:'#8a9097'});
  return g;
}

/* -------------------------------------------------------------------
   stencilRack  1100 x 800 x 900, n stencil frames in slots, casters
   ------------------------------------------------------------------- */
function stencilRack(C,opts={}){
  const n=opts.n||12;
  const g=new THREE.Group(),fr=mat(C,'benchSteel',0x8a9097,.45,.6),alu=C.M.alu,foil=mat(C,'foil',0xb3b8bd,.3,.9);
  casters(C,g,[[-450,300],[450,300],[-450,-300],[450,-300]],40);
  [[-510,360],[510,360],[-510,-360],[510,-360]].forEach(p=>C.box(g,40,820,40,fr,p[0],470,p[1]));
  C.box(g,1020,40,40,fr,0,905,360);C.box(g,1020,40,40,fr,0,905,-360);
  C.box(g,1020,40,40,fr,0,65,360);C.box(g,1020,40,40,fr,0,65,-360);
  C.box(g,40,40,720,fr,-510,65,0);C.box(g,40,40,720,fr,510,65,0);
  const hbars=[],vbars=[],foils=[];
  for(let k=0;k<n;k++){
    const x=-449+81.7*k;
    hbars.push({x,y:781,z:0,sx:30,sy:40,sz:736},{x,y:85,z:0,sx:30,sy:40,sz:736});
    vbars.push({x,y:433,z:-348,sx:30,sy:736,sz:40},{x,y:433,z:348,sx:30,sy:736,sz:40});
    foils.push({x,y:433,z:0,sx:3,sy:640,sz:640});
    quad(g,lmat(C,'stId'+k,'ST-'+(k+1<10?'0':'')+(k+1),90,46,{bg:'#f4f4f0',fg:'#333',border:'#999',pw:96}),90,46,x+17,700,-100,{ry:PI/2});
  }
  instanced(g,new THREE.BoxGeometry(1,1,1),alu,hbars);instanced(g,new THREE.BoxGeometry(1,1,1),alu,vbars);
  instanced(g,new THREE.BoxGeometry(1,1,1),foil,foils);
  C.box(g,40,120,40,fr,-500,950,-400);C.box(g,40,120,40,fr,500,950,-400);C.box(g,1040,40,40,fr,0,985,-400);
  C.plate(g,['STENCIL RACK'],300,80,0,905,382,{bg:'#eef1f4',fg:'#333',border:'#8a9097'});
  return g;
}

/* -------------------------------------------------------------------
   pasteFridge  600 x 620 x 1400, paste jars + cartridges
   ------------------------------------------------------------------- */
function pasteFridge(C,opts={}){
  const w=600,d=620,h=1400;
  const g=new THREE.Group(),body=mat(C,'fridgeWhite',0xeef0f2,.5,.1);
  [[-w/2+50,d/2-50],[w/2-50,d/2-50],[-w/2+50,-d/2+50],[w/2-50,-d/2+50]].forEach(p=>C.box(g,60,60,60,C.M.black,p[0],30,p[1]));
  C.box(g,w,h-120,d,body,0,60+(h-120)/2,0);
  C.box(g,560,1200,40,body,0,60+660,d/2+20);
  C.box(g,480,1080,12,mat(C,'glass',0x1d2a36,.08,.6),0,740,d/2+56);
  C.cyl(g,12,12,300,C.M.black,-230,760,d/2+44,{seg:12});
  const jarW=mat(C,'jarWhite',0xf4f6f8,.6,0),lid=mat(C,'lidBlue',0x2f6fb5,.45,.1),car=mat(C,'carGrey',0x9aa1a8,.35,.7);
  for(let s=0;s<4;s++){
    const sy=300+s*280;
    C.box(g,520,20,560,mat(C,'shelfGrey',0xb9c0c7,.5,.3),0,sy,0);
    for(let j=0;j<3;j++){
      const x=-160+j*160;
      C.cyl(g,33,33,70,jarW,x,sy+45,0,{seg:18});C.cyl(g,34,34,14,lid,x,sy+87,0,{seg:18});
    }
  }
  /* 6 cartridges (Ø55 x 230) standing at the back on the two upper shelves */
  for(let s=0;s<2;s++)for(let j=0;j<3;j++){
    const x=-160+j*160,sy=860+s*280;
    C.cyl(g,27.5,27.5,230,car,x,sy+125,190,{seg:16});
    C.cyl(g,29,29,20,mat(C,'carCap',0x24272b,.5,.2),x,sy+250,190,{seg:16});
  }
  C.label(g,'4.2 °C',240,80,150,1300,d/2+2,{bg:'#04110a',fg:'#39ff88',pw:192,size:.6});
  return g;
}

/* -------------------------------------------------------------------
   lockers  n columns 300 x 500 x 1800 with numbered doors
   ------------------------------------------------------------------- */
function lockers(C,opts={}){
  const n=opts.n||6,W=n*300;
  const g=new THREE.Group(),body=mat(C,'lockerGrey',0x7b8794,.55,.15),dk=mat(C,'vent',0x2a2f38,.6,0);
  C.box(g,W,120,470,C.M.black,0,60,-15);
  for(let k=0;k<n;k++){
    const x=-W/2+150+k*300;
    C.box(g,296,1680,490,body,x,60+840,0);
    C.box(g,276,1660,30,body,x,900,247);
    [1480,1520,1560].forEach(y=>C.box(g,190,12,8,dk,x,y,262));
    C.box(g,26,90,26,mat(C,'lockerHandle',0x24272b,.4,.4),x+95,950,268);
    C.label(g,String(k+1),80,80,x-70,1600,266,{bg:'#f4f4f0',fg:'#222',pw:96,size:.7});
  }
  return g;
}
/* -------------------------------------------------------------------
   wall kits: fireExtinguisher · firstAid · sign  (slim backing panel)
   ------------------------------------------------------------------- */
function wallPanel(C,g,w,h){
  C.box(g,w+40,h+40,25,mat(C,'wallGrey',0xdadde0,.7,0),0,h/2+20,-13);
}
function fireExtinguisher(C,opts={}){
  const g=new THREE.Group();
  wallPanel(C,g,340,1750);
  C.box(g,240,620,30,mat(C,'bracket',0x2a2f38,.5,.3),0,900,-10);
  const red=mat(C,'extRed',0xc8202a,.45,.15);
  C.cyl(g,80,80,550,red,0,900,85,{seg:24});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(80,24,12,0,PI*2,0,PI/2),red);dome.scale.y=.55;dome.position.set(0,1175,85);g.add(dome);
  C.cyl(g,82,82,20,mat(C,'extBase',0x24272b,.6,0),0,635,85,{seg:24});
  C.cyl(g,22,22,60,mat(C,'extBrass',0xc9a54a,.3,.9),0,1218,85,{seg:12});
  C.box(g,110,16,22,C.M.black,18,1252,95);
  C.box(g,20,40,70,C.M.black,-78,780,60);C.box(g,20,40,70,C.M.black,78,780,60);
  C.box(g,20,40,70,C.M.black,-78,1020,60);C.box(g,20,40,70,C.M.black,78,1020,60);
  C.cyl(g,20,20,14,mat(C,'gauge',0xf4f6f8,.4,0),58,1195,85,{rx:PI/2,seg:14});
  C.cyl(g,9,9,200,C.M.black,138,1090,85,{rz:.12,seg:8});
  C.cyl(g,14,30,90,C.M.black,172,1000,85,{seg:14});
  C.plate(g,['FIRE','EXTINGUISHER'],360,100,0,1600,1,{bg:'#c8202a',fg:'#ffffff',border:'#ffffff'});
  return g;
}
function firstAid(C,opts={}){
  const g=new THREE.Group();
  wallPanel(C,g,460,1480);
  C.box(g,400,150,300,C.M.green,0,1300,60);
  C.box(g,56,110,8,mat(C,'cross',0xf4f6f8,.4,0),0,1300,216);
  C.box(g,110,56,8,mat(C,'cross',0xf4f6f8,.4,0),0,1300,216);
  C.box(g,120,20,16,C.M.black,0,1385,190);
  C.box(g,20,40,10,mat(C,'latch',0x24272b,.4,.4),-150,1300,216);C.box(g,20,40,10,mat(C,'latch',0x24272b,.4,.4),150,1300,216);
  return g;
}
function sign(C,opts={}){
  const w=opts.w||600,h=opts.h||200,bg=opts.bg||'#1f9e55',fg=opts.fg||'#ffffff',text=opts.text||'EXIT';
  const g=new THREE.Group();
  wallPanel(C,g,w,h);
  C.plate(g,[text],w,h,0,h/2,2,{bg,fg,pw:512,size:.62});
  return g;
}

/* -------------------------------------------------------------------
   person  1750 tall, capsule limbs on hip / shoulder pivots
   ------------------------------------------------------------------- */
function person(C,opts={}){
  const smock=mat(C,'smock',opts.smock||0x2f6fb5,.7,0),tr=mat(C,'trousers',opts.trousers||0x2a2f38,.8,0),
        skin=mat(C,'skin',opts.skin||0xd9a77f,.6,0),shoe=mat(C,'shoe',0x15171a,.7,0);
  const g=new THREE.Group(),caps=(r,len,m)=>new THREE.Mesh(new THREE.CapsuleGeometry(r,len,4,12),m);
  /* legs on hip pivots y=900 */
  const legs=[-1,1].map(s=>{
    const p=new THREE.Group();p.position.set(s*110,900,0);g.add(p);
    const leg=caps(55,760,tr);leg.position.y=-435;p.add(leg);
    const sh=C.box(p,110,70,260,shoe,s*0,-865,40);sh.castShadow=true;
    return p;});
  /* torso + head */
  C.box(g,420,560,240,smock,0,1180,0);
  C.box(g,440,60,260,smock,0,900,0);
  C.cyl(g,45,45,60,skin,0,1490,0,{seg:12});
  const head=new THREE.Mesh(new THREE.SphereGeometry(110,20,14),skin);head.position.y=1620;g.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(112,20,10,0,PI*2,0,PI*.55),mat(C,'hair',0x2a2320,.8,0));hair.position.y=1640;g.add(hair);
  C.plate(g,['ESD'],90,60,0,1320,122,{bg:'#eef3f7',fg:'#1f6fb5',border:'#1f6fb5'});
  /* arms on shoulder pivots y=1450 */
  const arms=[-1,1].map(s=>{
    const p=new THREE.Group();p.position.set(s*240,1450,0);g.add(p);
    const arm=caps(48,604,smock);arm.position.y=-350;p.add(arm);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(50,14,10),skin);hand.position.y=-700;p.add(hand);
    return p;});
  g.userData={dynamic:true,legs,arms};
  return g;
}

/* -------------------------------------------------------------------
   trolley  900 x 500 x 950, 2 shelves
   ------------------------------------------------------------------- */
function trolley(C,opts={}){
  const g=new THREE.Group(),fr=mat(C,'benchSteel',0x8a9097,.45,.6),sh=mat(C,'shelfGrey',0xb9c0c7,.5,.3);
  casters(C,g,[[-390,160],[390,160],[-390,-160],[390,-160]],42);
  [[-430,210],[430,210],[-430,-210],[430,-210]].forEach(p=>C.box(g,40,860,40,fr,p[0],472,p[1]));
  C.box(g,900,25,500,sh,0,132,0);C.box(g,900,25,500,sh,0,888,0);
  C.box(g,900,30,20,fr,0,918,240);C.box(g,900,30,20,fr,0,918,-240);
  C.box(g,20,30,500,fr,-450,918,0);C.box(g,20,30,500,fr,450,918,0);
  C.box(g,860,300,12,sh,0,300,244);C.box(g,860,300,12,sh,0,300,-244);
  C.box(g,40,140,40,fr,-380,958,-210);C.box(g,40,140,40,fr,380,958,-210);
  C.box(g,800,40,40,fr,0,1028,-210);
  return g;
}

/* -------------------------------------------------------------------
   magazine  320 x 355 x 563, 50 grooves @ 10 mm, boards instanced
   ------------------------------------------------------------------- */
function magazine(C,opts={}){
  const fill=opts.fill===undefined?.6:opts.fill;
  const g=new THREE.Group(),blk=mat(C,'esdBlack',0x1c1f22,.55,.1);
  C.box(g,320,15,355,blk,0,7.5,0);C.box(g,320,15,355,blk,0,555.5,0);
  C.box(g,18,533,355,blk,-151,281.5,0);C.box(g,18,533,355,blk,151,281.5,0);
  const gro=screen(C,'grooves',64,512,(g2,W,H)=>{g2.fillStyle='#181b1e';g2.fillRect(0,0,W,H);
    g2.fillStyle='#0c0e10';for(let i=0;i<51;i++)g2.fillRect(0,10+i*9.8,W,2.4);});
  [-141,141].forEach(x=>{const m=quad(g,gro,320,500,x,281.5,0,{ry:x<0?PI/2:-PI/2});m.castShadow=false;});
  C.box(g,24,60,24,blk,-80,593,0);C.box(g,24,60,24,blk,80,593,0);C.box(g,200,24,24,blk,0,635,0);
  const n=Math.round(fill*50),items=[];
  for(let k=0;k<n;k++)items.push({x:0,y:20+10*k,z:0});
  instanced(g,new THREE.BoxGeometry(250,1.6,200),mat(C,'pcbGreen',0x0f5a31,.5,.05),items);
  C.plate(g,['MAGAZINE','250×200 · 50 slots'],260,80,0,553,179,{bg:'#eef1f4',fg:'#333',border:'#8a9097'});
  return g;
}

/* -------------------------------------------------------------------
   amr  890 x 580 x 350, LED strip, lidars, top: magazine | cart | none
   ------------------------------------------------------------------- */
function amr(C,opts={}){
  const top=opts.top||'magazine';
  const g=new THREE.Group(),grey=mat(C,'amrGrey',0xb7bcc2,.5,.15);
  const led=emat(C,'amrLed',0x2fa8ff,2);
  [[-330,220],[330,220],[-330,-220],[330,-220]].forEach(p=>C.cyl(g,70,70,45,C.M.rubber,p[0],70,p[1],{rz:PI/2,seg:20}));
  C.box(g,890,200,580,grey,0,200,0);
  C.box(g,870,50,560,mat(C,'amrTop',0x9aa1a8,.5,.2),0,325,0);
  boxes(C,g,C.M.black,[[25,130,560,-445,160,0],[25,130,560,445,160,0],[860,130,25,0,160,290],[860,130,25,0,160,-290]]);
  boxes(C,g,led,[[880,12,8,0,250,289],[880,12,8,0,250,-289],[8,12,560,-443,250,0],[8,12,560,443,250,0]]);
  [[360,-180],[-360,180]].forEach(p=>{
    C.cyl(g,42,42,55,C.M.black,p[0],377,p[1],{seg:18});
    C.cyl(g,30,30,6,emat(C,'lidarRing',0x2fa8ff,1.4),p[0],408,p[1],{seg:18});});
  const tg=new THREE.Group();tg.position.y=350;g.add(tg);
  if(top==='magazine'){
    C.box(tg,850,40,560,mat(C,'fSteel',0xc9cdd2,.4,.5),0,20,0);
    C.box(tg,850,50,20,mat(C,'fSteel',0xc9cdd2,.4,.5),0,45,270);C.box(tg,850,50,20,mat(C,'fSteel',0xc9cdd2,.4,.5),0,45,-270);
    C.box(tg,20,50,560,mat(C,'fSteel',0xc9cdd2,.4,.5),-415,45,0);C.box(tg,20,50,560,mat(C,'fSteel',0xc9cdd2,.4,.5),415,45,0);
    for(let i=0;i<10;i++)C.cyl(tg,25,25,520,C.M.steel,-382+85*i,65,0,{rx:PI/2,seg:14});
    [-170,170].forEach(x=>{const m=magazine(C,{fill:.5});m.position.set(x,90,0);tg.add(m);});
  }else if(top==='cart'){
    C.box(tg,140,60,40,C.M.black,0,60,-260);
    C.cyl(tg,18,18,100,C.M.steel,0,55,-285,{rx:PI/2,seg:12});
    const hook=new THREE.Mesh(new THREE.TorusGeometry(35,12,10,20),C.M.steel);hook.rotation.x=PI/2;hook.position.set(0,55,-330);tg.add(hook);
  }
  g.userData={dynamic:true,leds:led,top:tg};
  return g;
}
/* -------------------------------------------------------------------
   forklift  2000 x 1000, mast 2200 at +X, forks 1150 (userData.forks)
   ------------------------------------------------------------------- */
function forklift(C,opts={}){
  const g=new THREE.Group(),yl=mat(C,'fkYellow',0xf2b800,.45,.1),dk=mat(C,'fkDark',0x24272b,.55,.2);
  C.box(g,1350,700,900,yl,-325,420,0);
  C.box(g,350,800,950,dk,-825,450,0);
  C.box(g,900,40,850,mat(C,'fkFloor',0x3a4048,.7,0),-250,790,0);
  /* overhead guard 2100 */
  [[-760,380],[-760,-380],[480,380],[480,-380]].forEach(p=>C.box(g,80,1300,80,yl,p[0],1430,p[1]));
  C.box(g,1300,50,820,yl,-140,2075,0);
  const slats=[];for(let i=0;i<6;i++)slats.push([1240,14,50,-140,2105,-300+i*120]);
  boxes(C,g,dk,slats);
  C.box(g,500,100,450,C.M.black,-450,830,0);
  C.box(g,100,450,450,C.M.black,-680,1105,0,{rz:.15});
  const col=new THREE.Mesh(new THREE.CylinderGeometry(25,25,250,12),dk);col.rotation.z=.8;col.position.set(180,950,0);g.add(col);
  const wheelS=new THREE.Mesh(new THREE.TorusGeometry(120,22,10,24),C.M.black);wheelS.rotation.y=PI/2;wheelS.position.set(140,1120,0);g.add(wheelS);
  /* mast 2200 + hydraulics */
  const ms=mat(C,'mastSteel',0x3a4048,.5,.4);
  C.box(g,140,2200,90,ms,770,1100,300);C.box(g,140,2200,90,ms,770,1100,-300);
  C.box(g,140,90,690,ms,770,500,0);C.box(g,140,90,690,ms,770,1600,0);
  C.cyl(g,55,55,1400,C.M.steel,770,800,120,{seg:16});C.cyl(g,55,55,1400,C.M.steel,770,800,-120,{seg:16});
  /* forks group (moves up) */
  const fk=new THREE.Group();g.add(fk);
  C.box(fk,90,400,700,dk,870,250,0);
  [-270,270].forEach(z=>{
    C.box(fk,80,500,130,dk,940,300,z);
    C.box(fk,1150,55,130,dk,1475,75,z);
  });
  /* wheels + lights */
  [[350,400],[350,-400]].forEach(p=>C.cyl(g,300,300,180,C.M.rubber,p[0],300,p[1],{rz:PI/2,seg:24}));
  [[-800,400],[-800,-400]].forEach(p=>C.cyl(g,230,230,160,C.M.rubber,p[0],230,p[1],{rz:PI/2,seg:22}));
  [[330,-330],[330,330]].forEach(p=>C.box(g,40,60,80,emat(C,'fkLight',0xfff2cc,1.2),p[0],700,p[1],{cast:false}));
  C.cyl(g,45,45,70,emat(C,'beaconAm',0xffa629,1.6),-140,2165,0,{seg:16});
  C.plate(g,['ELECTRIC','FORKLIFT · 2500 kg'],300,110,100,640,452,{bg:'#f4f4f0',fg:'#333',border:'#8a9097'});
  C.cyl(g,28,28,25,mat(C,'estopRed',0xc8202a,.4,.1),240,700,452,{rx:PI/2,seg:14});
  g.userData={dynamic:true,forks:fk};
  return g;
}

/* -------------------------------------------------------------------
   palletJack  manual pallet truck, forks 1150 along Z
   ------------------------------------------------------------------- */
function palletJack(C,opts={}){
  const g=new THREE.Group(),grey=mat(C,'pjGrey',0x6f7a84,.5,.35),dk=C.M.black,red=mat(C,'pjRed',0xc8202a,.45,.15);
  [-145,145].forEach(x=>{
    C.box(g,160,55,1150,dk,x,60,0);
    C.cyl(g,38,38,24,C.M.rubber,x,38,430,{rx:PI/2,seg:16});
    C.cyl(g,38,38,24,C.M.rubber,x,38,-430,{rx:PI/2,seg:16});
  });
  C.box(g,460,320,460,grey,0,280,-430);
  C.cyl(g,45,45,200,C.M.steel,0,530,-509,{seg:14});
  [[280,-430],[-280,-430]].forEach(p=>C.cyl(g,90,90,80,C.M.rubber,p[0],90,p[1],{rz:PI/2,seg:20}));
  const post=new THREE.Mesh(new THREE.CylinderGeometry(30,30,660,12),red);post.rotation.x=.2;post.position.set(0,925,-445);g.add(post);
  const grip=C.box(g,560,50,50,dk,0,1262,-380);grip.rotation.x=.2;
  C.plate(g,['2500 kg'],160,60,0,180,80,{bg:'#f4f4f0',fg:'#333'});
  g.userData={dynamic:true};
  return g;
}

/* -------------------------------------------------------------------
   testStation  19" rack + table with pneumatic test press
   ------------------------------------------------------------------- */
function testStation(C,opts={}){
  const g=new THREE.Group(),rk=mat(C,'rackDark',0x2b2f34,.5,.2),pn=mat(C,'panelDark',0x22262b,.45,.3);
  C.box(g,600,60,780,C.M.black,-650,30,0);
  C.box(g,600,1940,800,rk,-650,1030,0);
  const names=[['IN-CIRCUIT TEST',0x27d267],['FUNCTIONAL TEST',0xffa629],['ISP PROGRAMMER',0x27d267],['POWER SUPPLY',0x2fa8ff]];
  names.forEach((nm,i)=>{
    C.box(g,520,260,30,pn,-650,350+i*350,401);
    C.label(g,nm[0],440,120,-650,385+i*350,419,{bg:'#101317',fg:'#cfe2ff',pw:512,size:.38});
    C.box(g,18,18,8,emat(C,'dot'+i,nm[1],1.4),-820,470+i*350,419,{cast:false});
  });
  C.box(g,500,60,300,mat(C,'rackTop',0x3a4048,.6,0),-650,2030,-200);
  /* table + ESD mat */
  const st=mat(C,'benchSteel',0x8a9097,.45,.6);
  [[-540,320],[540,320],[-540,-320],[540,-320]].forEach(p=>C.box(g,80,860,80,st,250+p[0],430,p[1]));
  C.box(g,1200,40,800,mat(C,'benchTop',0x8f9a92,.7,0),250,880,0);
  C.box(g,1140,4,740,mat(C,'esdMat',0x5b8fb9,.65,0),250,902,0);
  /* pneumatic press */
  const fs=mat(C,'fSteel',0xc9cdd2,.4,.5);
  C.box(g,600,40,500,fs,150,920,0);
  [[-260,190],[260,190],[-260,-190],[260,-190]].forEach(p=>C.box(g,60,880,60,fs,150+p[0],1380,p[1]));
  C.box(g,600,50,500,fs,150,1845,0);
  C.cyl(g,70,70,280,C.M.steel,150,2010,0,{seg:18});
  C.cyl(g,25,25,210,C.M.steel,150,1765,0,{seg:12});
  C.box(g,320,90,320,mat(C,'pressHead',0x3a4048,.5,.3),150,1615,0);
  C.box(g,420,120,340,fs,150,980,0);
  C.box(g,300,2,250,mat(C,'pcbGreen',0x0f5a31,.5,.05),150,1042,0);
  /* monitor + keyboard */
  C.box(g,200,25,200,C.M.black,560,914,-180);
  C.box(g,50,180,50,C.M.black,560,1016,-180);
  C.box(g,540,320,40,mat(C,'monBody',0x1c1f22,.4,.3),560,1190,-150);
  C.plate(g,['UUT 0421','FCT PASS'],480,270,560,1190,-128,{bg:'#0d1420',fg:'#9fd0ff',border:'#1d3f7a'});
  C.box(g,440,20,150,mat(C,'kbd',0x2a2f38,.6,0),560,912,80);
  return g;
}

/* -------------------------------------------------------------------
   xray  1400 x 1300 x 1950, lead glass, warning triangle, 2 monitors
   ------------------------------------------------------------------- */
function xray(C,opts={}){
  const g=new THREE.Group(),grey=mat(C,'xrGrey',0xd3d7db,.55,.1),dk=mat(C,'xrDark',0x2a2f38,.5,.2);
  C.box(g,1360,80,1260,C.M.black,0,40,0);
  C.box(g,1400,1790,1300,grey,0,80+895,0);
  C.box(g,1400,80,1300,mat(C,'xrTop',0xc4c9cd,.55,.1),0,1910,0);
  /* radiation warning triangle (procedural sticker) */
  if(!_m.warnTri){
    const t=C.canvasTex(256,256,(g2,W,H)=>{
      g2.fillStyle='#f2c400';g2.strokeStyle='#111';g2.lineWidth=12;
      g2.beginPath();g2.moveTo(W/2,26);g2.lineTo(W-30,H-28);g2.lineTo(30,H-28);g2.closePath();g2.fill();g2.stroke();
      g2.fillStyle='#111';const cx=W/2,cy=H*.62,r=W*.16;
      g2.beginPath();g2.arc(cx,cy,r*.28,0,PI*2);g2.fill();
      for(let i=0;i<3;i++){const a=i*PI*2/3-PI/2;g2.beginPath();
        g2.moveTo(cx+Math.cos(a)*r*.28,cy+Math.sin(a)*r*.28);
        g2.arc(cx,cy,r,a-.52,a+.52);g2.closePath();g2.fill();}});
    _m.warnTri=new THREE.MeshStandardMaterial({map:t,roughness:.5,metalness:0});
  }
  quad(g,_m.warnTri,180,170,350,1500,652);
  /* lead-glass window + frame */
  C.box(g,560,420,30,mat(C,'glass',0x1d2a36,.08,.6),-250,1150,640);
  C.box(g,620,40,12,dk,-250,1370,650);C.box(g,620,40,12,dk,-250,930,650);
  C.box(g,40,500,12,dk,-540,1150,650);C.box(g,40,500,12,dk,40,1150,650);
  /* door seam / handle / hinges */
  C.box(g,14,1700,8,dk,250,965,652);
  C.cyl(g,16,16,320,dk,610,950,665,{seg:12});
  [[680,600],[680,1300]].forEach(p=>C.box(g,24,70,30,dk,p[0],p[1],655));
  /* keyboard tray */
  C.box(g,520,25,420,mat(C,'tray',0x9aa1a8,.5,.4),-250,780,720);
  C.box(g,420,22,140,mat(C,'kbd',0x2a2f38,.6,0),-250,803,780);
  /* monitor arm + 2 monitors on the right side */
  C.box(g,120,30,120,dk,600,1965,-350);
  C.cyl(g,30,30,350,dk,600,2140,-350,{seg:12});
  C.box(g,60,50,500,dk,600,2265,-100);
  C.box(g,40,80,30,dk,600,1900,30);
  [2080,1720].forEach(y=>{
    C.box(g,500,310,40,mat(C,'monBody',0x1c1f22,.4,.3),600,y,30);
    C.plate(g,['X-RAY',y===2080?'VOIDS · OK':'ARCHIVE'],460,260,600,y,52,{bg:'#0d1420',fg:'#9fd0ff',border:'#1d3f7a'});
  });
  /* signal tower on top */
  C.cyl(g,40,40,30,dk,-500,1980,-400,{seg:14});
  C.cyl(g,14,14,200,dk,-500,2095,-400,{seg:10});
  C.cyl(g,42,42,80,emat(C,'twR',0xff2a2a,1.1),-500,2185,-400,{seg:14});
  C.cyl(g,42,42,80,emat(C,'twY',0xffb020,.9),-500,2265,-400,{seg:14});
  C.cyl(g,42,42,80,emat(C,'twG',0x27d267,1.1),-500,2345,-400,{seg:14});
  C.cyl(g,46,46,20,dk,-500,2395,-400,{seg:14});
  C.cyl(g,28,28,25,mat(C,'estopRed',0xc8202a,.4,.1),-150,680,658,{rx:PI/2,seg:14});
  C.plate(g,['X-RAY · 100 kV'],380,90,-250,1650,652,{bg:'#f4f4f0',fg:'#333',border:'#8a9097'});
  return g;
}

/* -------------------------------------------------------------------
   selectiveSolder  2100 x 1600 x 1650, window, SMEMA both X ends
   ------------------------------------------------------------------- */
function selectiveSolder(C,opts={}){
  const g=new THREE.Group(),dk=mat(C,'mDark',0x3a4048,.5,.25),dk2=mat(C,'mDark2',0x464d55,.5,.25),acc=mat(C,'accBlue',0x1f6fd1,.45,.2);
  C.box(g,2040,80,1540,C.M.black,0,40,0);
  C.box(g,2100,1450,1600,dk,0,80+725,0);
  C.box(g,2100,120,1600,dk2,0,1590,0);
  C.box(g,2100,100,16,acc,0,1430,804);
  C.box(g,60,1400,16,acc,-1000,830,802);C.box(g,60,1400,16,acc,1000,830,802);
  C.box(g,620,480,30,mat(C,'glass',0x1d2a36,.08,.6),-450,750,795);
  C.box(g,680,30,14,dk,-450,1000,802);C.box(g,680,30,14,dk,-450,500,802);
  C.box(g,30,540,14,dk,-770,750,802);C.box(g,30,540,14,dk,-130,750,802);
  /* exhaust stub Ø150 */
  C.cyl(g,75,75,220,mat(C,'duct',0x9aa1a8,.5,.5),300,1760,-400,{seg:20});
  C.cyl(g,95,95,20,dk2,300,1660,-400,{seg:20});
  /* signal tower */
  C.cyl(g,30,30,30,dk,950,1665,-600,{seg:12});
  C.cyl(g,12,12,170,dk,950,1765,-600,{seg:10});
  C.cyl(g,40,40,80,emat(C,'twR',0xff2a2a,1.1),950,1860,-600,{seg:14});
  C.cyl(g,40,40,80,emat(C,'twY',0xffb020,.9),950,1940,-600,{seg:14});
  C.cyl(g,40,40,80,emat(C,'twG',0x27d267,1.1),950,2020,-600,{seg:14});
  /* monitor on an arm */
  C.box(g,120,30,120,dk,700,1665,500);
  C.cyl(g,28,28,320,dk,700,1840,500,{seg:12});
  C.box(g,60,50,420,dk,700,1995,290);
  C.box(g,540,320,40,mat(C,'monBody',0x1c1f22,.4,.3),700,1810,340);
  C.plate(g,['SOLDER','N2 · 285 °C'],480,270,700,1810,362,{bg:'#0d1420',fg:'#9fd0ff',border:'#1d3f7a'});
  /* SMEMA openings both X ends, board height 900 */
  [[-1,0],[1,0]].forEach(s=>{
    C.box(g,30,520,1200,mat(C,'openDark',0x0e1114,.8,0),s[0]*1035,900,0,{cast:false});
    [[-170],[170]].forEach(z=>{C.box(g,160,40,60,C.M.steel,s[0]*1120,880,z[0]);});
    C.box(g,60,40,900,dk2,s[0]*1075,940,0);
  });
  /* door seam, handle, panel lines, E-stop, nameplate */
  C.box(g,14,1300,8,mat(C,'seam',0x24272b,.6,0),420,700,802);
  C.cyl(g,15,15,300,mat(C,'seam',0x24272b,.6,0),560,700,812,{seg:10});
  C.box(g,2060,6,6,dk,0,480,802,{cast:false});C.box(g,2060,6,6,dk,0,1080,802,{cast:false});
  C.cyl(g,28,28,25,mat(C,'estopRed',0xc8202a,.4,.1),-620,900,812,{rx:PI/2,seg:14});
  C.plate(g,['SELECTIVE','SOLDERING · N2'],420,120,-620,1150,808,{bg:'#f4f4f0',fg:'#333',border:'#8a9097'});
  return g;
}
/* -------------------------------------------------------------------
   air / utility props
   ------------------------------------------------------------------- */
function compressor(C,opts={}){
  const g=new THREE.Group(),grey=mat(C,'compGrey',0x9aa1a8,.5,.2);
  C.box(g,1440,60,860,C.M.black,0,30,0);
  C.box(g,1500,1380,900,grey,0,60+690,0);
  C.box(g,1400,60,700,mat(C,'compTop',0x6f7a84,.55,.2),0,1470,0);
  [-1,1].forEach(s=>{
    C.box(g,20,500,600,mat(C,'grilleD',0x2a2f38,.6,0),s*741,700,0,{cast:false});
    quad(g,screen(C,'louverT',128,128,(g2,W,H)=>{g2.fillStyle='#2a2f38';g2.fillRect(0,0,W,H);g2.fillStyle='#3d444d';for(let y=8;y<H;y+=16)g2.fillRect(0,y,W,7);}),500,600,s*751.5,700,0,{ry:s>0?PI/2:-PI/2});
  });
  C.box(g,14,1300,8,mat(C,'seam',0x24272b,.6,0),250,700,452);
  C.cyl(g,15,15,300,mat(C,'seam',0x24272b,.6,0),330,700,462,{seg:10});
  C.plate(g,['COMPRESSOR','7.5 kW · 8 bar'],320,110,350,1250,454,{bg:'#f4f4f0',fg:'#333',border:'#8a9097'});
  C.cyl(g,28,28,25,mat(C,'estopRed',0xc8202a,.4,.1),-600,700,455,{rx:PI/2,seg:14});
  return g;
}
function airReceiver(C,opts={}){
  const g=new THREE.Group(),red=mat(C,'tankRed',0xb03a30,.45,.25);
  for(let i=0;i<3;i++){const a=i*PI*2/3;C.cyl(g,60,60,500,C.M.dark,Math.sin(a)*380,250,Math.cos(a)*380,{seg:14});}
  C.cyl(g,550,550,2600,red,0,1800,0,{seg:32});
  const top=new THREE.Mesh(new THREE.SphereGeometry(550,28,14,0,PI*2,0,PI/2),red);top.scale.y=.45;top.position.y=3100;g.add(top);
  const bot=new THREE.Mesh(new THREE.SphereGeometry(550,28,14,0,PI*2,PI/2,PI/2),red);bot.scale.y=.45;bot.position.y=500;g.add(bot);
  C.cyl(g,40,40,120,C.M.brass,0,3320,0,{seg:12});
  const sv=new THREE.Mesh(new THREE.CylinderGeometry(25,25,110,10),C.M.brass);sv.rotation.z=.4;sv.position.set(160,3330,0);g.add(sv);
  C.cyl(g,20,20,90,C.M.brass,0,530,555,{rx:PI/2,seg:10});
  C.plate(g,['AIR RECEIVER','500 l · 11 bar'],500,150,0,2200,552,{bg:'#f4f4f0',fg:'#333',border:'#8a9097'});
  C.label(g,'11.2 bar',150,60,551,1500,0,{ry:PI/2,bg:'#04110a',fg:'#39ff88',pw:128,size:.6});
  return g;
}
function airDryer(C,opts={}){
  const g=new THREE.Group(),grey=mat(C,'dryGrey',0x8a949c,.5,.2);
  C.box(g,760,50,660,C.M.black,0,25,0);
  C.box(g,800,1000,700,grey,0,50+500,0);
  C.box(g,760,50,660,mat(C,'dryTop',0x6f7a84,.55,.2),0,1075,0);
  [-1,1].forEach(s=>{C.box(g,20,420,500,mat(C,'grilleD',0x2a2f38,.6,0),s*406,620,0,{cast:false});});
  C.plate(g,['AIR DRYER','dp -40 °C'],300,110,0,900,354,{bg:'#f4f4f0',fg:'#333',border:'#8a9097'});
  C.cyl(g,26,26,220,C.M.hose,350,120,-200,{rx:PI/2,rz:.2,seg:10});
  C.cyl(g,26,26,220,C.M.hose,350,120,220,{rx:PI/2,rz:-.2,seg:10});
  return g;
}
function n2Generator(C,opts={}){
  const g=new THREE.Group(),fr=mat(C,'steelD',0x5a626b,.5,.35),blue=mat(C,'n2Blue',0x3f6ea5,.45,.3);
  C.box(g,1800,150,900,fr,0,75,0);
  C.box(g,1800,40,760,mat(C,'steelD2',0x4a515a,.5,.35),0,170,0);
  [-550,-150].forEach(x=>C.cyl(g,150,150,1800,blue,x,1075,0,{seg:24}));
  [-550,-150].forEach(x=>{const cap=new THREE.Mesh(new THREE.SphereGeometry(150,20,10,0,PI*2,0,PI/2),blue);cap.scale.y=.4;cap.position.y=1975;x?cap.position.x=x:0;cap.position.set(x,1975,0);g.add(cap);});
  C.cyl(g,300,300,1600,blue,500,990,0,{seg:26});
  const bt=new THREE.Mesh(new THREE.SphereGeometry(300,24,12,0,PI*2,0,PI/2),blue);bt.scale.y=.4;bt.position.y=1790;g.add(bt);
  C.box(g,300,700,200,mat(C,'mDark',0x3a4048,.5,.25),250,570,350);
  C.plate(g,['N2','GENERATOR','99.999%'],260,120,250,700,456,{bg:'#0d1420',fg:'#9fd0ff',border:'#1d3f7a'});
  C.cyl(g,40,40,700,C.M.steel,-200,1650,0,{rx:PI/2,seg:12});
  C.cyl(g,40,40,300,C.M.steel,-350,1500,0,{seg:10});
  return g;
}

/* -------------------------------------------------------------------
   office props
   ------------------------------------------------------------------- */
function desk(C,opts={}){
  const g=new THREE.Group(),wood=mat(C,'deskTop',0xa8957e,.6,0),dk=mat(C,'deskLeg',0x3a4048,.5,.2);
  C.box(g,1600,30,800,wood,0,725,0);
  C.box(g,30,710,700,dk,-770,355,0);C.box(g,30,710,700,dk,770,355,0);
  C.box(g,1500,300,20,dk,0,560,-350);
  C.box(g,220,25,180,C.M.black,0,752,-120);
  C.box(g,50,200,50,C.M.black,0,865,-170);
  C.box(g,540,320,35,mat(C,'monBody',0x1c1f22,.4,.3),0,1040,-170);
  C.plate(g,['FACTORY','DASHBOARD','LINE 1 · 412'],490,270,0,1040,-150,{bg:'#0d1420',fg:'#9fd0ff',border:'#1d3f7a'});
  C.box(g,440,18,140,mat(C,'kbd',0x2a2f38,.6,0),0,749,60);
  C.box(g,60,18,90,mat(C,'kbd',0x2a2f38,.6,0),280,749,70);
  return g;
}
function officeChair(C,opts={}){
  const g=new THREE.Group(),dk=mat(C,'chairDark',0x2a2f38,.7,0),al=C.M.alu;
  for(let i=0;i<5;i++){
    const a=i*PI*2/5;
    C.box(g,280,40,50,dk,Math.sin(a)*130,60,Math.cos(a)*130,{ry:a});
    C.cyl(g,28,28,24,C.M.black,Math.sin(a)*222,28,Math.cos(a)*222,{seg:12});
  }
  C.cyl(g,28,28,340,al,0,230,0,{seg:12});
  C.box(g,480,70,460,dk,0,470,20);
  C.box(g,440,480,60,dk,0,770,-215,{rx:.12});
  [-1,1].forEach(s=>{
    C.box(g,40,160,200,mat(C,'armRest',0x24272b,.5,.2),s*250,585,0);
    C.box(g,140,30,220,dk,s*250,680,10);
  });
  return g;
}
function meetingTable(C,opts={}){
  const seats=opts.seats||8;
  const g=new THREE.Group(),wood=mat(C,'deskTop',0xa8957e,.6,0),dk=mat(C,'chairDark',0x2a2f38,.7,0);
  C.box(g,3200,45,1100,wood,0,728,0);
  C.box(g,400,705,800,dk,-1000,352,0);C.box(g,400,705,800,dk,1000,352,0);
  const nl=Math.max(1,Math.floor((seats-2)/2)),pos=[];
  const xs=nl===1?[0]:[-1050,0,1050].slice(0,nl).map(x=>x*(nl===2?.85:1));
  for(const x of xs)pos.push([x,0,700,PI],[x,0,-700,0]);
  pos.push([-1450,0,0,PI/2],[1450,0,0,-PI/2]);
  pos.forEach(p=>{
    const ch=new THREE.Group();ch.position.set(p[0],0,p[2]);ch.rotation.y=p[3];g.add(ch);
    C.box(ch,440,55,420,dk,0,452,20);
    C.box(ch,400,420,50,dk,0,770,-215,{rx:.1});
    [[-180,160],[180,160],[-180,-160],[180,-160]].forEach(l=>C.box(ch,40,450,40,mat(C,'chairLeg',0x24272b,.5,.3),l[0],225,l[1]));
  });
  return g;
}
function whiteboard(C,opts={}){
  const g=new THREE.Group(),fr=C.M.alu;
  C.box(g,1800,1200,45,fr,0,1400,0);
  if(!_m.wbTex){
    _m.wbTex=new THREE.MeshStandardMaterial({map:C.canvasTex(512,320,(g2,W,H)=>{
      g2.fillStyle='#f6f8fa';g2.fillRect(0,0,W,H);
      g2.strokeStyle='#2b6fb5';g2.lineWidth=6;g2.strokeRect(30,30,W*.44,90);
      g2.fillStyle='#2b6fb5';g2.font='700 30px "Segoe UI",Arial';g2.fillText('SHIFT PLAN',48,72);
      g2.fillStyle='#333';g2.font='500 22px "Segoe UI",Arial';
      ['line 1 · 0700 run','reel audit 10:00','N2 tank swap 14:00'].forEach((l,i)=>g2.fillText(l,42,150+i*34));
      g2.strokeStyle='#c23b3b';g2.lineWidth=5;g2.beginPath();g2.arc(W*.72,110,52,0,PI*2);g2.stroke();
      g2.fillStyle='#c23b3b';g2.font='700 26px "Segoe UI",Arial';g2.fillText('5S',W*.72-18,120);
      g2.strokeStyle='#222';g2.lineWidth=3;g2.beginPath();g2.moveTo(40,270);g2.lineTo(W-40,268);g2.stroke();
      g2.beginPath();g2.moveTo(40,290);g2.lineTo(W*.6,292);g2.stroke();}),roughness:.4,metalness:0});
  }
  quad(g,_m.wbTex,1700,1100,0,1400,24);
  [-1,1].forEach(s=>{
    C.box(g,60,2000,60,mat(C,'wbLeg',0x9aa1a8,.45,.6),s*840,1000,0);
    C.box(g,120,40,700,mat(C,'wbFoot',0x9aa1a8,.45,.6),s*840,20,0);
  });
  C.box(g,1400,20,90,mat(C,'penTray',0x24272b,.5,0),0,788,60);
  C.box(g,120,24,24,mat(C,'markerB',0x1f6fd1,.5,0),-200,810,60);
  C.box(g,120,24,24,mat(C,'markerR',0xc23b3b,.5,0),-40,810,60);
  return g;
}

/* -------------------------------------------------------------------
   andonBoard  live canvas screen, userData {ctx, tex}
   ------------------------------------------------------------------- */
function andonBoard(C,opts={}){
  const w=opts.w||1600,h=opts.h||900,hang=opts.hang||0;
  const g=new THREE.Group();
  C.box(g,w+80,h,70,mat(C,'andonFrame',0x14171b,.5,.2),0,h/2,-5);
  const cv=document.createElement('canvas');cv.width=1024;cv.height=576;
  const ctx=cv.getContext('2d');
  (function draw(){
    ctx.fillStyle='#0a0e14';ctx.fillRect(0,0,1024,576);
    ctx.fillStyle='#12325e';ctx.fillRect(0,0,1024,64);
    ctx.fillStyle='#dce9ff';ctx.font='700 34px "Segoe UI",Arial';ctx.textAlign='left';ctx.fillText('LINE 1 · ANDON',24,44);
    const cell=(x,y,t,v,c)=>{ctx.fillStyle='#10161f';ctx.fillRect(x,y,236,150);ctx.fillStyle=c;ctx.fillRect(x,y,236,10);
      ctx.fillStyle='#8fa7c4';ctx.font='500 24px "Segoe UI",Arial';ctx.fillText(t,x+16,y+52);
      ctx.fillStyle=c;ctx.font='700 62px "Segoe UI",Arial';ctx.fillText(v,x+16,y+126);};
    cell(24,96,'OUTPUT','412','#57d977');cell(280,96,'OEE','84.2%','#57d977');cell(536,96,'FPY','98.7%','#57d977');
    cell(792,96,'NG','6','#ff6a5e');
    ctx.fillStyle='#10161f';ctx.fillRect(24,266,1004,180);
    ctx.fillStyle='#57d977';ctx.fillRect(24,266,1004,10);
    ctx.fillStyle='#8fa7c4';ctx.font='500 26px "Segoe UI",Arial';ctx.fillText('STATIONS',44,312);
    ['PRINTER','PLACEMENT','REFLOW','AOI'].forEach((s,i)=>{
      ctx.fillStyle=i===2?'#ffb020':'#57d977';ctx.fillRect(44+i*250,340,190,26);
      ctx.fillStyle='#dce9ff';ctx.font='500 22px "Segoe UI",Arial';ctx.fillText(s,44+i*250,404);});
    ctx.fillStyle='#0f2c1c';ctx.fillRect(24,466,1004,86);
    ctx.fillStyle='#57d977';ctx.font='700 40px "Segoe UI",Arial';ctx.textAlign='center';ctx.fillText('▶  RUNNING  ·  no alarms',526,520);
  })();
  const tex=new THREE.CanvasTexture(cv);tex.encoding=THREE.sRGBEncoding;
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));
  scr.position.set(0,h/2,31.5);g.add(scr);
  if(hang>0)for(const s of[-1,1])C.cyl(g,14,14,hang,mat(C,'rod',0x24272b,.5,.4),s*w/4,h+hang/2,-5,{seg:10});
  g.userData={ctx,tex};
  return g;
}

/* -------------------------------------------------------------------
   turnstile  ESD tester gate
   ------------------------------------------------------------------- */
function turnstile(C,opts={}){
  const g=new THREE.Group(),grey=mat(C,'cabGrey',0xd9dde1,.55,.1),dk=mat(C,'turnstileDark',0x2a2f38,.5,.2);
  C.box(g,600,20,400,mat(C,'steelD',0x5a626b,.5,.35),0,10,0);
  C.box(g,300,830,300,grey,0,435,-100);
  C.box(g,320,40,320,grey,0,870,-100);
  C.box(g,220,18,260,C.M.steel,0,700,45);
  C.plate(g,['ESD WRIST STRAP','TEST · watch LED','touch plate'],280,110,0,580,52,{bg:'#eef1f4',fg:'#1f6fb5',border:'#1f6fb5'});
  C.box(g,50,24,10,emat(C,'ledG',0x27d267,1.5),-70,850,56,{cast:false});
  C.box(g,50,24,10,emat(C,'ledR',0xff2a2a,1.3),70,850,56,{cast:false});
  C.box(g,80,120,30,mat(C,'reader',0x24272b,.5,.2),120,400,42);
  /* tripod arms — three arms radiating horizontally from the stand-off hub */
  C.cyl(g,60,60,110,dk,0,930,165,{rx:PI/2,seg:18});
  [0,PI*2/3,PI*4/3].forEach(p=>{
    const arm=new THREE.Mesh(new THREE.BoxGeometry(470,36,30),mat(C,'armSteel',0xb9c0c7,.35,.7));
    arm.position.set(235*Math.cos(p),930,165-235*Math.sin(p));arm.rotation.y=p;g.add(arm);
  });
  return g;
}

/* -------------------------------------------------------------------
   wasteBins  three 60 l bins
   ------------------------------------------------------------------- */
function wasteBins(C,opts={}){
  const g=new THREE.Group(),cols=[mat(C,'binBlue',0x1f6fd1,.55,.05),mat(C,'binYellow',0xe8c22a,.55,.05),C.M.black];
  const names=['PAPER','PLASTIC','GENERAL'];
  [-430,0,430].forEach((x,i)=>{
    const c=cols[i];
    [[-160,120],[160,120],[-160,-120],[160,-120]].forEach(p=>C.box(g,50,30,50,mat(C,'binFoot',0x24272b,.5,0),x+p[0],15,p[1]));
    C.box(g,380,470,290,c,x,30+235,0);
    C.box(g,400,35,310,mat(C,'binLid'+i,i===2?0x2a2f38:[0x2a5fb1,0xc4a81f][i],.55,0),x,517,0);
    C.box(g,140,25,20,mat(C,'binHandle'+i,0x2a2f38,.5,0),x,547,130);
    C.plate(g,[names[i]],160,70,x,300,148,{bg:'#f4f4f0',fg:'#333',border:'#8a9097'});
  });
  return g;
}

/* -------------------------------------------------------------------
   reworkStation  BGA rework machine on an esdBench
   ------------------------------------------------------------------- */
function reworkStation(C,opts={}){
  const g=new THREE.Group();
  const bench=esdBench(C,{w:1500,d:750,shelf:true,monitor:false,solder:false,microscope:false});
  g.add(bench);
  const dk=mat(C,'mDark',0x3a4048,.5,.25),fs=mat(C,'fSteel',0xc9cdd2,.4,.5);
  C.box(g,700,250,650,dk,0,1029,-30);
  C.box(g,500,25,450,fs,0,1166,-10);
  C.box(g,250,2,200,mat(C,'pcbGreen',0x0f5a31,.5,.05),0,1180,-10);
  C.box(g,110,896,110,fs,-250,1602,-220);
  C.box(g,500,70,90,fs,0,2020,-180);
  C.cyl(g,95,95,70,mat(C,'heater',0x24272b,.5,.3),0,1950,-10,{seg:20});
  C.cyl(g,45,70,90,mat(C,'nozzle',0x9aa1a8,.35,.7),0,1885,-10,{seg:18});
  C.box(g,90,650,90,fs,250,1479,-220);
  C.box(g,120,110,160,mat(C,'camBody',0x2a2f38,.4,.3),250,1840,-80);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(35,35,70,14),mat(C,'glass',0x1d2a36,.08,.6));
  lens.rotation.x=2.2;lens.position.set(250,1770,-20);g.add(lens);
  C.box(g,200,120,30,dk,250,1210,296);
  C.plate(g,['BGA','REWORK'],170,80,250,1210,314,{bg:'#0d1420',fg:'#9fd0ff'});
  C.cyl(g,24,24,22,mat(C,'estopRed',0xc8202a,.4,.1),-300,1210,300,{rx:PI/2,seg:12});
  return g;
}

/* ------------------------------------------------------------------ */
return {palletRack,pallet,esdBench,dryCabinet,reelTower,reelShelf,feederCart,stencilRack,
  pasteFridge,lockers,fireExtinguisher,firstAid,sign,person,trolley,magazine,amr,
  forklift,palletJack,testStation,xray,selectiveSolder,compressor,airReceiver,airDryer,
  n2Generator,desk,officeChair,meetingTable,whiteboard,andonBoard,turnstile,wasteBins,reworkStation};
})();


