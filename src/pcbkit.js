/* ===================================================================
   SHARED PCB KIT — the one demo board every machine in the line uses.
   250 x 200 x 1.6 mm, 289 SMD parts.  Units mm, board top at y = BT.
   =================================================================== */
function makePCBKit(THREE,merge,canvasTex){
const PI=Math.PI;let seed=20261;
function rnd(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
const rr=(a,b)=>a+(b-a)*rnd(), pick=a=>a[Math.floor(rnd()*a.length)];
const std=(color,rough=.6,metal=0,extra={})=>new THREE.MeshStandardMaterial(Object.assign({color,roughness:rough,metalness:metal,envMapIntensity:metal>.5?1.1:.5},extra));
const BW=250,BD=200,BT=1.6,BALLS=[];
/* --- — high-detail assembled board (built once, instanced per board)
   =================================================================== */
const PM={ // component materials
  icBody:std(0x16181b,.55,.05), bgaSub:std(0x0e3b26,.5,.05), tin:std(0xd6dadd,.28,.9), solder:std(0xc9ced2,.2,.95),
  ceramic:std(0xe8e6df,.6,0), resTop:std(0x121314,.5,0), mlcc:std(0xb08a5a,.55,0), mlcc2:std(0x8d6b46,.55,0),
  alu:std(0xcfd4d8,.25,.92), ecapBase:std(0x111214,.6,0), tant:std(0xd99a1c,.55,0), tantMark:std(0x7a4a08,.6,0),
  ferrite:std(0x3a3d41,.75,.1), steel:std(0xd9dde0,.2,.95), plastic:std(0x1a1b1e,.6,0), gold:std(0xe2b84a,.25,.95),
  ledBase:std(0xf0efe8,.5,0), ledG:std(0x7dff9a,.3,0,{emissive:0x1bbf4a,emissiveIntensity:.5}), ledR:std(0xff8a8a,.3,0,{emissive:0xd02020,emissiveIntensity:.5}),
  fr4:std(0x0d4a2a,.6,.05)
};
function markMat(w,h,draw){const t=canvasTex(w,h,draw);return new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:.35,roughness:.6,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});}
const mk=(lines,col='#b9bdc2')=>(g,W,H)=>{g.clearRect(0,0,W,H);g.fillStyle=col;g.textAlign='center';g.textBaseline='middle';const n=lines.length;lines.forEach((l,i)=>{g.font=(i==0?'700 ':'500 ')+Math.round(H/(n+1.2)*(i==0?1.05:.8))+'px Arial';g.fillText(l,W/2,H*(i+1)/(n+1));});};
PM.markR=markMat(96,48,mk(['103'],'#e8e8e8'));
PM.markR2=markMat(96,48,mk(['4701'],'#e8e8e8'));
PM.markIC=markMat(256,128,mk(['OPA-2','2231 K7'],'#aeb3b8'));
PM.markIC2=markMat(256,96,mk(['SR-8','A2241'],'#aeb3b8'));
PM.markMCU=markMat(256,256,(g,W,H)=>{mk(['MCU','U-100','2244','9A'])(g,W,H);g.beginPath();g.arc(30,H-30,11,0,7);g.fillStyle='#63686d';g.fill();});
PM.markBGA=markMat(256,256,(g,W,H)=>{mk(['SoC','4-CORE','AB1234.01','2245'])(g,W,H);g.beginPath();g.arc(26,H-26,9,0,7);g.fillStyle='#8a8f94';g.fill();});
PM.markL=markMat(96,96,mk(['4R7'],'#d0d0d0'));
PM.markEcap=(function(){const t=canvasTex(128,128,(g,W,H)=>{g.fillStyle='#c9ced2';g.beginPath();g.arc(64,64,64,0,7);g.fill();g.fillStyle='#17181a';g.beginPath();g.arc(64,64,64,PI*.62,PI*1.38);g.closePath();g.fill();g.fillStyle='#17181a';g.font='700 26px Arial';g.textAlign='center';g.fillText('100',78,52);g.fillText('16V',78,82);g.font='500 16px Arial';g.fillText('K2A',78,104);});return std(0xffffff,.35,.5,{map:t});})();
PM.label=(function(){const t=canvasTex(300,100,(g,W,H)=>{g.fillStyle='#f4f4f0';g.fillRect(0,0,W,H);g.fillStyle='#111';let x=14;while(x<W-14){const w=1+Math.floor(Math.random()*4);g.fillRect(x,10,w,52);x+=w+1+Math.floor(Math.random()*3);}g.font='600 20px Consolas,monospace';g.textAlign='center';g.fillText('SN 0042-A17',W/2,86);});return std(0xffffff,.7,0,{map:t});})();

const geoCache={};
const BX=(w,h,d)=>{const k='b'+w+'_'+h+'_'+d;return geoCache[k]||(geoCache[k]=new THREE.BoxGeometry(w,h,d));};
const CY=(r1,r2,h,s=20)=>{const k='c'+r1+'_'+r2+'_'+h+'_'+s;return geoCache[k]||(geoCache[k]=new THREE.CylinderGeometry(r1,r2,h,s));};
const FLAT=(w,d)=>{const k='f'+w+'_'+d;if(!geoCache[k]){const g=new THREE.PlaneGeometry(w,d);g.rotateX(-PI/2);geoCache[k]=g;}return geoCache[k];};
const DISC=(r)=>{const k='d'+r;if(!geoCache[k]){const g=new THREE.CircleGeometry(r,28);g.rotateX(-PI/2);geoCache[k]=g;}return geoCache[k];};
const BALL=(r)=>{const k='s'+r;return geoCache[k]||(geoCache[k]=new THREE.SphereGeometry(r,7,5));};
class Bucket{constructor(){this.m={};}
  add(mat,geo,mtx){const g=geo.clone();g.applyMatrix4(mtx);(this.m[mat]=this.m[mat]||[]).push(g);}
  build(parent){for(const k in this.m){const g=merge(this.m[k]);this.m[k].forEach(x=>x.dispose());const mesh=new THREE.Mesh(g,PM[k]);mesh.receiveShadow=true;parent.add(mesh);}return parent;}}
const _m=new THREE.Matrix4(),_v=new THREE.Vector3();
function P(ls,mat,geo,x,y,z,ang=0){const m=new THREE.Matrix4().makeRotationY(ang);m.setPosition(x,y,z);ls.push([mat,geo,m]);}
function PR(ls,mat,geo,ang,x,y,z){const m=new THREE.Matrix4().makeRotationY(ang);_v.set(x,y,z).applyMatrix4(m);m.setPosition(_v);ls.push([mat,geo,m]);}
function padR(pd,ang,x,z,w,d){const c=Math.cos(ang),s=Math.sin(ang),odd=Math.abs(s)>.5;pd.push([x*c+z*s,-x*s+z*c,odd?d:w,odd?w:d]);}
function leadRow(ls,pd,n,pitch,edge,H,ang,lw){
  for(let i=0;i<n;i++){const px=(i-(n-1)/2)*pitch;
    PR(ls,'tin',BX(lw,.15,.5),ang,px,H*.55,edge+.2);
    PR(ls,'tin',BX(lw,+(H*.55).toFixed(3),.15),ang,px,H*.275+.04,edge+.45);
    PR(ls,'tin',BX(lw,.15,.65),ang,px,.075,edge+.72);
    padR(pd,ang,px,edge+.75,+(lw+.12).toFixed(3),1.35);}
}
/* --- component builders: fill part list (ls) + pad list (pd), return footprint info --- */
const C={
  chip:(L,W,H,type,mark)=>(ls,pd)=>{const t=+(Math.max(.22,L*.2)).toFixed(3);
    P(ls,type=='R'?'ceramic':(type=='C2'?'mlcc2':'mlcc'),BX(+(L-2*t).toFixed(3),H,W),0,H/2,0);
    P(ls,'tin',BX(t,+(H+.04).toFixed(3),+(W+.04).toFixed(3)),-(L-t)/2,H/2,0);P(ls,'tin',BX(t,+(H+.04).toFixed(3),+(W+.04).toFixed(3)),(L-t)/2,H/2,0);
    if(type=='R'){P(ls,'resTop',BX(+(L-2*t-.04).toFixed(3),.03,+(W-.08).toFixed(3)),0,H+.015,0);if(L>=1.6)P(ls,mark||'markR',FLAT(+(L-2*t-.15).toFixed(3),+(W*.72).toFixed(3)),0,H+.04,0);}
    pd.push([-L/2,0,L*.44,W*1.22],[L/2,0,L*.44,W*1.22]);return{w:L+.9,d:W+.7,h:H,kind:'chip',len:L};},
  led:(col)=>(ls,pd)=>{P(ls,'ledBase',BX(1.6,.3,.8),0,.15,0);P(ls,col,BX(1.0,.45,.78),0,.52,0);P(ls,'tin',BX(.3,.34,.84),-.65,.17,0);P(ls,'tin',BX(.3,.34,.84),.65,.17,0);
    pd.push([-.8,0,.7,1],[.8,0,.7,1]);return{w:2.5,d:1.5,h:.75,kind:'led',len:1.6};},
  soic:(n)=>(ls,pd)=>{const bl=+(n/2*1.27-.18).toFixed(2);
    P(ls,'icBody',BX(bl,1.45,3.9),0,.1+.725,0);P(ls,n>8?'markIC2':'markIC',FLAT(+(bl*.86).toFixed(2),n>8?2.9:3.1),0,1.57,0);
    P(ls,'tin',CY(.28,.28,.02,12),-bl/2+.7,1.56,1.3);
    leadRow(ls,pd,n/2,1.27,1.95,1.5,0,.42);leadRow(ls,pd,n/2,1.27,1.95,1.5,PI,.42);
    return{w:bl+.8,d:6.6,h:1.6,kind:'ic'};},
  qfp:(nps,body,pitch)=>(ls,pd)=>{
    P(ls,'icBody',BX(body,1.4,body),0,.1+.7,0);P(ls,'markMCU',FLAT(+(body*.82).toFixed(2),+(body*.82).toFixed(2)),0,1.52,0);
    for(let k=0;k<4;k++)leadRow(ls,pd,nps,pitch,body/2,1.5,k*PI/2,+(pitch*.46).toFixed(3));
    return{w:body+2.8,d:body+2.8,h:1.6,kind:'ic'};},
  bga:(size,pitch)=>(ls,pd)=>{const n=Math.floor((size-1)/pitch);for(let i=0;i<n;i++)for(let j=0;j<n;j++)BALLS.push([(i-(n-1)/2)*pitch,(j-(n-1)/2)*pitch,pitch*.5,pitch*.5]);
    for(let i=0;i<n;i++)for(let j=0;j<n;j++){if(i>1&&i<n-2&&j>1&&j<n-2)continue;P(ls,'solder',BALL(+(pitch*.3).toFixed(3)),(i-(n-1)/2)*pitch,.24,(j-(n-1)/2)*pitch);}
    P(ls,'bgaSub',BX(size,.36,size),0,.44+.18,0);P(ls,'icBody',BX(size-1.6,1.0,size-1.6),0,.8+.5,0);
    P(ls,'markBGA',FLAT(+(size*.74).toFixed(2),+(size*.74).toFixed(2)),0,1.82,0);
    return{w:size+1,d:size+1,h:1.85,kind:'ic'};},
  qfn:(s)=>(ls,pd)=>{P(ls,'icBody',BX(s,.85,s),0,.45,0);P(ls,'tin',CY(.25,.25,.02,12),-s/2+.7,.87,s/2-.7);
    const n=Math.round(s/.5)-2;for(let k=0;k<4;k++)for(let i=0;i<n;i++)padR(pd,k*PI/2,(i-(n-1)/2)*.5,s/2+.05,.26,.8);
    return{w:s+1,d:s+1,h:.9,kind:'ic'};},
  ecap:(d,h)=>(ls,pd)=>{const r=d/2;
    P(ls,'ecapBase',BX(d+.6,1.5,d+.6),0,.75,0);P(ls,'alu',CY(r,r,+(h-1.9).toFixed(2),28),0,1.4+(h-1.9)/2,0);
    P(ls,'alu',CY(+(r-.5).toFixed(2),r,.5,28),0,h-.25,0);P(ls,'markEcap',DISC(+(r-.5).toFixed(2)),0,h+.02,0);
    P(ls,'tin',BX(1.1,.25,.9),-(r+.75),.125,0);P(ls,'tin',BX(1.1,.25,.9),(r+.75),.125,0);
    pd.push([-(r+.5),0,d*.5,1.9],[(r+.5),0,d*.5,1.9]);return{w:d+1.2,d:d+1.2,h:h,kind:'ecap',round:r+.9};},
  tant:(L,W,H)=>(ls,pd)=>{P(ls,'tant',BX(L-.5,H,W),0,H/2+.03,0);P(ls,'tantMark',BX(.7,.03,W),-L/2+1.1,H+.045,0);
    P(ls,'tin',BX(.4,H*.6,W*.8),-L/2+.1,H*.3,0);P(ls,'tin',BX(.4,H*.6,W*.8),L/2-.1,H*.3,0);
    pd.push([-L/2+.2,0,1.6,W*.9],[L/2-.2,0,1.6,W*.9]);return{w:L+1,d:W+.8,h:H,kind:'tant'};},
  sot23:()=>(ls,pd)=>{P(ls,'icBody',BX(2.9,1.0,1.3),0,.6,0);leadRow(ls,pd,2,1.9,.65,1.0,0,.4);leadRow(ls,pd,1,1.9,.65,1.0,PI,.4);return{w:3.4,d:3.4,h:1.1,kind:'ic'};},
  ind:(s,h)=>(ls,pd)=>{P(ls,'ferrite',BX(s,h,s),0,h/2,0);P(ls,'markL',FLAT(s*.6,s*.6),0,h+.03,0);
    P(ls,'tin',BX(.5,h*.5,s*.7),-s/2,h*.25,0);P(ls,'tin',BX(.5,h*.5,s*.7),s/2,h*.25,0);pd.push([-s/2,0,1.8,s*.8],[s/2,0,1.8,s*.8]);return{w:s+1.2,d:s+.8,h:h,kind:'ic'};},
  xtal:()=>(ls,pd)=>{P(ls,'plastic',BX(11.6,.5,4.9),0,.25,0);P(ls,'steel',BX(10.6,3.0,4.1),0,2,0);pd.push([-5.6,0,2.4,2.2],[5.6,0,2.4,2.2]);return{w:13,d:5.6,h:3.5,kind:'ic'};},
  header:(n,rows)=>(ls,pd)=>{P(ls,'plastic',BX(+(n*2.54).toFixed(2),2.5,+(rows*2.54).toFixed(2)),0,1.25,0);
    for(let i=0;i<n;i++)for(let j=0;j<rows;j++)P(ls,'gold',BX(.64,8.4,.64),(i-(n-1)/2)*2.54,4.2,(j-(rows-1)/2)*2.54);
    return{w:n*2.54+.8,d:rows*2.54+.8,h:8.4,kind:'conn'};},
  usb:()=>(ls,pd)=>{P(ls,'steel',BX(14,7,13),0,3.5,0);P(ls,'plastic',BX(12,5,.5),0,3.5,6.4);pd.push([-7.2,-3,2,3],[7.2,-3,2,3]);return{w:15.5,d:14,h:7,kind:'conn'};},
  dpak:()=>(ls,pd)=>{P(ls,'icBody',BX(6.5,2.3,6.1),0,1.15,0);P(ls,'tin',BX(5.3,.5,1.3),0,.25,-3.6);leadRow(ls,pd,2,4.57,3.05,1.3,0,.8);
    pd.push([0,-1.6,6.4,6.6]);return{w:7.6,d:10,h:2.3,kind:'ic'};}
};

const FIDS=[{x:-105,z:-90},{x:105,z:-90},{x:-105,z:90}];
const T=(function buildTemplate(){
  const S=10,CW=BW*S,CH=BD*S;
  const bucket=new Bucket(),cands=[],places=[],refs={};
  const SIZ={ '0402':[1.0,.5,.35],'0603':[1.6,.8,.45],'0805':[2.0,1.25,.5],'1206':[3.2,1.6,.55] };
  function place(pre,x,z,rot,builder,o={}){
    BALLS.length=0;const ls=[],pd=[],info=builder(ls,pd);refs[pre]=(refs[pre]||0)+1;const name=pre+refs[pre];
    const key=info.kind+'|'+ls.map(q=>q[0]).join(',')+'|'+info.w.toFixed(2)+'x'+info.d.toFixed(2)+'x'+(+info.h).toFixed(2);
    places.push({name,x,z,rot,pd,balls:BALLS.slice(),info,ls,key,cand:!!o.cand,silk:o.silk!==false});
  }
  const R=(sz,x,z,rot,o)=>{const s=SIZ[sz];place('R',x,z,rot,C.chip(s[0],s[1],s[2],'R',rnd()<.5?'markR':'markR2'),o);};
  const Cc=(sz,x,z,rot,o)=>{const s=SIZ[sz];place('C',x,z,rot,C.chip(s[0],s[1],+(Math.min(s[1]*.95,1.3)).toFixed(2),rnd()<.3?'C2':'C'),o);};
  const H=PI/2;
  /* ---- layout (mm, origin = board centre) ---- */
  // U1: big BGA + decoupling ring
  place('U',-65,-40,0,C.bga(27,1.0));
  for(let i=0;i<7;i++){Cc('0402',-77+i*4,-59,0);Cc('0402',-77+i*4,-21,0);Cc('0402',-84,-52+i*4,H);Cc('0402',-46,-52+i*4,H);}
  // U2: QFP-100 + crystal
  place('U',-65,40,0,C.qfp(25,14,.5));
  for(let i=0;i<7;i++){R('0603',-80+i*5,56,H);Cc('0603',-80+i*5,25,H);}
  place('Y',-93,40,H,C.xtal());Cc('0603',-93,50,0);Cc('0603',-93,30,0);
  // U3: BGA 17
  place('U',-5,-50,0,C.bga(17,.8));
  for(let i=0;i<4;i++){Cc('0402',9,-56+i*4,H);Cc('0402',-19,-56+i*4,H);Cc('0402',-11+i*4,-64,0);}
  // U4: QFP-64
  place('U',0,15,0,C.qfp(16,10,.5));
  for(let i=0;i<5;i++){R('0805',-12+i*6,30,H,{cand:i==1});Cc('0805',-12+i*6,1,H);}
  // U5: QFP-44
  place('U',-5,65,0,C.qfp(11,10,.8));
  for(let i=0;i<4;i++){R('1206',15+i*5,61,H,{cand:i==2});Cc('1206',15+i*5,71,H);}
  // SOIC logic row
  for(let i=0;i<4;i++)place('U',35+i*12,-6,0,C.soic(8),{cand:i==1});
  place('U',40,15,0,C.soic(16));place('U',62,15,0,C.soic(16));
  for(let i=0;i<7;i++)Cc('0603',35+i*6,5,0);
  for(let i=0;i<9;i++)R('1206',34+i*6,28,H,{cand:i==4||i==7});
  // power section
  place('U',40,-35,0,C.qfn(5));place('U',55,-35,0,C.qfn(5));
  place('L',72,-35,0,C.ind(6,3));place('L',72,-52,0,C.ind(6,3));
  place('Q',40,-56,0,C.dpak());
  place('C',56,-50,0,C.tant(7.3,4.3,2.8),{cand:true});place('C',56,-58,0,C.tant(7.3,4.3,2.8));
  [[95,-76],[108,-76],[95,-61],[108,-61]].forEach(p=>place('C',p[0],p[1],0,C.ecap(8,10)));
  place('C',94,-46,0,C.ecap(6.3,7.7),{cand:true});place('C',105,-46,0,C.ecap(6.3,7.7));
  place('C',100,-29,0,C.ecap(10,10.5));
  for(let i=0;i<3;i++)place('C',95+i*10,-9,H,C.tant(3.5,2.8,1.9));
  // connectors
  place('J',100,20,H,C.header(10,2));place('J',100,60,H,C.header(8,1));
  place('J',50,-90,0,C.header(13,2));place('J',85,90,0,C.usb());
  // LEDs and small-signal
  for(let i=0;i<6;i++){place('D',20+i*8,89,0,C.led(i%2?'ledR':'ledG'),{cand:i==2});R('0603',20+i*8,83,0);}
  for(let i=0;i<6;i++){place('Q',30+i*10,45,0,C.sot23(),{cand:i==3});R('0603',30+i*10,38.5,0);Cc('0402',30+i*10,51,0);}
  // passive fields
  for(let i=0;i<21;i++)(i%2?R:Cc)('0805',-110,-70+i*7,0,{cand:i==6||i==15});
  for(let c=0;c<3;c++)for(let i=0;i<10;i++)(((c+i)%3)?R:Cc)('0603',-38+c*6,-60+i*4,H,{cand:(c==1&&i==5)});
  place('U',-32,13,0,C.soic(8));place('U',-32,26,0,C.soic(8));
  for(let c=0;c<5;c++)for(let i=0;i<5;i++)(((c*2+i)%3)?R:Cc)('0805',-42+c*5,42+i*7,H,{cand:(c==2&&i==2)||(c==4&&i==0)});
  for(let i=0;i<11;i++)Cc('1206',22+i*6,-76,H,{cand:i==5});
  for(let i=0;i<15;i++)R('0603',-100+i*5,-72,H);
  for(let i=0;i<21;i++)Cc('0402',-50+i*3,86,H);
  for(let i=0;i<11;i++)R('0805',113,10+i*6,0,{cand:i==8});

  /* ---- board artwork (solder mask, traces, pads, silkscreen) ---- */
  const tex=canvasTex(CW,CH,(g)=>{
    const X=x=>(x+BW/2)*S,Z=z=>(z+BD/2)*S;
    g.fillStyle='#0f5a31';g.fillRect(0,0,CW,CH);
    // subtle copper-pour hatch
    g.strokeStyle='rgba(30,140,80,.18)';g.lineWidth=1;for(let i=-CH;i<CW;i+=14){g.beginPath();g.moveTo(i,0);g.lineTo(i+CH,CH);g.stroke();}
    // traces
    const padPts=[];places.forEach(p=>{const c=Math.cos(p.rot),s=Math.sin(p.rot);p.pd.forEach(a=>padPts.push([p.x+a[0]*c+a[1]*s,p.z-a[0]*s+a[1]*c]));});
    const dirs=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
    g.lineCap='round';g.lineJoin='round';
    for(let i=0;i<620;i++){let p=pick(padPts),x=p[0],z=p[1],d=Math.floor(rnd()*8);
      g.strokeStyle=rnd()<.5?'#178049':'#1a8a4f';g.lineWidth=rnd()<.12?5:(rnd()<.5?2.2:1.6);g.beginPath();g.moveTo(X(x),Z(z));
      const n=2+Math.floor(rnd()*4);for(let k=0;k<n;k++){const l=rr(2,16),dd=dirs[d];x=Math.max(-121,Math.min(121,x+dd[0]*l));z=Math.max(-96,Math.min(96,z+dd[1]*l));g.lineTo(X(x),Z(z));d=(d+(rnd()<.5?1:7))%8;}
      g.stroke();
      if(rnd()<.75){g.fillStyle='#c9a54a';g.beginPath();g.arc(X(x),Z(z),3.6,0,7);g.fill();g.fillStyle='#0a2e1a';g.beginPath();g.arc(X(x),Z(z),1.5,0,7);g.fill();}
    }
    // pads (ENIG gold)
    places.forEach(p=>{g.save();g.translate(X(p.x),Z(p.z));g.rotate(-p.rot);
      p.pd.forEach(a=>{g.fillStyle='#0a3f22';g.fillRect((a[0]-a[2]/2)*S-1.5,(a[1]-a[3]/2)*S-1.5,a[2]*S+3,a[3]*S+3);g.fillStyle='#d9b85c';g.fillRect((a[0]-a[2]/2)*S,(a[1]-a[3]/2)*S,a[2]*S,a[3]*S);});
      g.restore();});
    places.forEach(p=>{if(!p.balls.length)return;g.save();g.translate(X(p.x),Z(p.z));g.rotate(-p.rot);
      p.balls.forEach(a=>{g.fillStyle='#d9b85c';g.beginPath();g.arc(a[0]*S,a[1]*S,a[2]*S*.55,0,7);g.fill();});g.restore();});
    // silkscreen
    g.strokeStyle='#f1f3f0';g.fillStyle='#f1f3f0';g.lineWidth=1.6;
    places.forEach(p=>{const i=p.info;if(!p.silk||i.w<2.4)return;g.save();g.translate(X(p.x),Z(p.z));g.rotate(-p.rot);
      if(i.round){g.beginPath();g.arc(0,0,i.round*S,0,7);g.stroke();g.font='700 22px Arial';g.fillText('+',-i.round*S-16,-i.round*S+10);}
      else if(i.kind=='ic'||i.kind=='conn'||i.kind=='tant'){const w=i.w*S+6,d=i.d*S+6;const c=10;
        [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(q=>{g.beginPath();g.moveTo(q[0]*w/2,q[1]*(d/2-c));g.lineTo(q[0]*w/2,q[1]*d/2);g.lineTo(q[0]*(w/2-c),q[1]*d/2);g.stroke();});
        g.beginPath();g.arc(-w/2-5,d/2+5,2.6,0,7);g.fill();}
      g.restore();
      if(i.kind!='chip'&&i.kind!='led'){g.font='600 13px Arial';const ex=(Math.abs(Math.sin(p.rot))>.5?i.d:i.w)/2,ez=(Math.abs(Math.sin(p.rot))>.5?i.w:i.d)/2;g.fillText(p.name,X(p.x-ex),Z(p.z-ez)-8);}
    });
    g.font='700 26px Arial';g.fillText('SMT DEMO BOARD · REV C',X(-100),Z(96.5));
    g.font='600 15px Arial';g.fillText('SMT LINE SIMULATION · 94V-0 · 2026-W46',X(-30),Z(96.5));
    // fiducials + tooling holes
    FIDS.forEach(f=>{g.fillStyle='#3a2a16';g.beginPath();g.arc(X(f.x),Z(f.z),15,0,7);g.fill();g.fillStyle='#e0bf62';g.beginPath();g.arc(X(f.x),Z(f.z),5,0,7);g.fill();});
    [[-118,-93],[118,-93],[-118,93],[118,93]].forEach(h=>{g.fillStyle='#d9b85c';g.beginPath();g.arc(X(h[0]),Z(h[1]),30,0,7);g.fill();g.fillStyle='#07090b';g.beginPath();g.arc(X(h[0]),Z(h[1]),16,0,7);g.fill();});
    g.strokeStyle='#caa64a';g.lineWidth=3;g.strokeRect(2,2,CW-4,CH-4);
  });
  const boardTop=std(0xffffff,.42,.12,{map:tex});
  const st=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(BW,BT,BD),PM.fr4);body.position.y=BT/2;body.castShadow=true;body.receiveShadow=true;st.add(body);
  const top=new THREE.Mesh(FLAT(BW,BD),boardTop);top.position.y=BT+.01;top.receiveShadow=true;st.add(top);
  const lb=new THREE.Mesh(FLAT(30,10),PM.label);lb.position.set(-68,BT+.05,-86);st.add(lb);
  const all=new Bucket(),noCand=new Bucket();
  places.forEach(p=>{const m=new THREE.Matrix4().makeRotationY(p.rot);m.setPosition(p.x,BT,p.z);
    p.ls.forEach(a=>{const mm=new THREE.Matrix4().multiplyMatrices(m,a[2]);all.add(a[0],a[1],mm);if(!p.cand)noCand.add(a[0],a[1],mm);});
    if(p.cand){const g=new THREE.Group(),b=new Bucket();p.ls.forEach(a=>b.add(a[0],a[1],a[2]));b.build(g);g.position.set(p.x,BT,p.z);g.rotation.order='YXZ';g.rotation.y=p.rot;
      cands.push({name:p.name,kind:p.info.kind,len:p.info.len||0,group:g,x:p.x,z:p.z,rot:p.rot,w:p.info.w,d:p.info.d,h:p.info.h});}});
  const compsAll=all.build(new THREE.Group()),compsNoCand=noCand.build(new THREE.Group());
  /* pad list for paste / stencil apertures: [x, z, w, d, name] (connectors are through-hole: no paste) */
  const pads=[];
  places.forEach(p=>{if(p.info.kind=='conn')return;const c=Math.cos(p.rot),s=Math.sin(p.rot),odd=Math.abs(s)>.5;
    p.pd.concat(p.balls).forEach((a,k)=>{pads.push([p.x+a[0]*c+a[1]*s,p.z-a[0]*s+a[1]*c,+((odd?a[3]:a[2])*.9).toFixed(3),+((odd?a[2]:a[3])*.9).toFixed(3),p.name+(p.pd.length>2?'.'+(k+1):'')]);});});
  function pasteGeo(skip){const pg=[];pads.forEach((q,i)=>{if(skip&&skip.has(i))return;const g=new THREE.BoxGeometry(q[2],.13,q[3]);g.translate(q[0],BT+.075,q[1]);pg.push(g);});const m=merge(pg);pg.forEach(g=>g.dispose());return m;}
  function candPadIdx(n){const idx=new Set(),stp=Math.floor(pads.length/n);for(let i=0;i<pads.length&&idx.size<n;i+=stp){let k=i;while(k<pads.length&&pads[k][2]*pads[k][3]<.25)k++;if(k<pads.length)idx.add(k);}return idx;}
  function partGroup(p){const g=new THREE.Group(),b=new Bucket();p.ls.forEach(a=>b.add(a[0],a[1],a[2]));b.build(g);g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}
  /* a new Group of fresh meshes sharing geometry/material with template groups */
  function inst(...groups){const g=new THREE.Group();groups.forEach(t=>t.children.forEach(m=>{const c=new THREE.Mesh(m.geometry,m.material);c.position.copy(m.position);c.rotation.copy(m.rotation);c.receiveShadow=true;c.castShadow=m.castShadow;g.add(c);}));return g;}
  let tris=0;compsAll.traverse(o=>{if(o.isMesh)tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;});
  return{board:st,boardTop,compsAll,compsNoCand,cands,places,pads,pasteGeo,candPadIdx,partGroup,inst,tris:Math.round(tris)};
})();


return Object.assign(T,{BW,BD,BT,FIDS,FLAT,PM});
}
