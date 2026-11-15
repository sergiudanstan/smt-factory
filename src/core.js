/* ===================================================================
   SMT FACTORY SUITE — core 3D framework.  THREE r147, units: millimetres.
   X = board flow (left -> right), Y = up, Z = toward the operator.
   Conveyor (board top) at 900 mm; lane 1 at z = +170, lane 2 at z = -170.
   Load order: vendor -> shell.js -> pcbkit.js -> core.js -> line.js -> machines -> page.
   =================================================================== */
'use strict';
window.SMT3D=(function(){
const PI=Math.PI,$=id=>document.getElementById(id);
const registry={};
function register(id,builder){registry[id]=builder;}

function init(opts={}){
  const CFG=Object.assign({shadow:1500,shadowFar:6000,shadowMap:2048,maxDist:9000,esd:3400,contact:[4300,2700],
    camPos:[-2450,1950,3600],camTgt:[0,880,120],floorSize:40000,followShadow:false,esdLines:true,contactShadow:true,
    exposure:1.05,fov:38,far:40000,subStep:.02,maxSpeed:64},opts);
  THREE.ColorManagement.legacyMode=false;
  const BGU=THREE.BufferGeometryUtils;
  let seed=20261;
  function rnd(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
  const rr=(a,b)=>a+(b-a)*rnd(), pick=a=>a[Math.floor(rnd()*a.length)];

  /* ---------- renderer / scene ---------- */
  const canvas=$('c');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=CFG.exposure;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.autoClear=false;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x10151d);
  const camera=new THREE.PerspectiveCamera(CFG.fov,1,10,CFG.far);
  camera.position.set(...CFG.camPos);
  camera.layers.enable(1);camera.layers.enable(2);
  const controls=new THREE.OrbitControls(camera,canvas);
  controls.target.set(...CFG.camTgt);controls.enableDamping=true;controls.dampingFactor=.08;
  controls.minDistance=45;controls.maxDistance=CFG.maxDist;controls.maxPolarAngle=PI*.495;

  /* environment for reflections (small procedural studio) */
  (function(){
    const es=new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.BoxGeometry(100,100,100),new THREE.MeshBasicMaterial({color:0x3a4250,side:THREE.BackSide})));
    const pm=new THREE.MeshBasicMaterial({color:0xffffff});
    [[0,49,0,60,1,60],[-49,10,0,1,40,70],[49,15,20,1,30,40],[0,10,49,70,30,1]].forEach(a=>{const m=new THREE.Mesh(new THREE.BoxGeometry(a[3],a[4],a[5]),pm);m.position.set(a[0],a[1],a[2]);es.add(m);});
    const fl=new THREE.Mesh(new THREE.BoxGeometry(100,1,100),new THREE.MeshBasicMaterial({color:0x1a1d22}));fl.position.y=-49;es.add(fl);
    const pg=new THREE.PMREMGenerator(renderer);
    scene.environment=pg.fromScene(es,0.04).texture;pg.dispose();
  })();
  const hemi=new THREE.HemisphereLight(0xdfeaff,0x4a4f58,.75);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffffff,1.9);
  sun.position.set(900,2900,1900);sun.castShadow=true;
  sun.shadow.mapSize.set(CFG.shadowMap,CFG.shadowMap);
  Object.assign(sun.shadow.camera,{left:-CFG.shadow,right:CFG.shadow,top:CFG.shadow,bottom:-CFG.shadow,near:200,far:CFG.shadowFar});
  sun.shadow.bias=-.0004;sun.shadow.normalBias=1.2;
  scene.add(sun);scene.add(sun.target);
  const fill=new THREE.DirectionalLight(0x9fc0ff,.35);fill.position.set(-2000,1500,-1500);scene.add(fill);

  /* ---------- helpers ---------- */
  function canvasTex(w,h,draw,opt={}){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=renderer.capabilities.getMaxAnisotropy();if(opt.repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;}return t;}
  const std=(color,rough=.6,metal=0,extra={})=>new THREE.MeshStandardMaterial(Object.assign({color,roughness:rough,metalness:metal,envMapIntensity:metal>.5?1.1:.5},extra));
  function box(parent,w,h,d,mat,x,y,z,o={}){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);if(o.cast!==false)m.castShadow=true;if(o.recv!==false)m.receiveShadow=true;if(o.rx)m.rotation.x=o.rx;if(o.ry)m.rotation.y=o.ry;if(o.rz)m.rotation.z=o.rz;parent.add(m);return m;}
  function cyl(parent,r1,r2,h,mat,x,y,z,o={}){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,o.seg||28,1,!!o.open),mat);m.position.set(x,y,z);if(o.cast!==false)m.castShadow=true;m.receiveShadow=true;if(o.rx)m.rotation.x=o.rx;if(o.ry)m.rotation.y=o.ry;if(o.rz)m.rotation.z=o.rz;parent.add(m);return m;}
  function label(parent,text,w,h,x,y,z,o={}){
    const t=canvasTex(o.pw||512,o.ph||Math.round((o.pw||512)*h/w),(g,W,H)=>{if(o.bg){g.fillStyle=o.bg;g.fillRect(0,0,W,H);}g.fillStyle=o.fg||'#fff';g.font=(o.weight||'700')+' '+Math.round(H*(o.size||.62))+'px "Segoe UI",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,W/2,H/2+H*.04);});
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:!o.bg,toneMapped:false}));
    m.position.set(x,y,z);if(o.ry)m.rotation.y=o.ry;if(o.rx)m.rotation.x=o.rx;if(o.rz)m.rotation.z=o.rz;parent.add(m);return m;
  }
  /* multi-line text plate (sticker / nameplate / warning) */
  function plate(parent,lines,w,h,x,y,z,o={}){
    const pw=o.pw||512,ph=Math.round(pw*h/w);
    const t=canvasTex(pw,ph,(g,W,H)=>{g.fillStyle=o.bg||'#f4f4f0';g.fillRect(0,0,W,H);if(o.border){g.strokeStyle=o.border;g.lineWidth=Math.max(2,H*.03);g.strokeRect(g.lineWidth/2,g.lineWidth/2,W-g.lineWidth,H-g.lineWidth);}
      g.fillStyle=o.fg||'#111';g.textAlign=o.align||'center';g.textBaseline='middle';const n=lines.length;
      lines.forEach((l,i)=>{const big=i==0&&n>1;g.font=(big?'700 ':'500 ')+Math.round(H/(n+.6)*(big?.9:.72))+'px "Segoe UI",Arial,sans-serif';g.fillText(l,o.align=='left'?W*.06:W/2,H*(i+.5)/n+H*.02);});});
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,roughness:.6,metalness:0,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
    m.position.set(x,y,z);if(o.ry)m.rotation.y=o.ry;if(o.rx)m.rotation.x=o.rx;if(o.rz)m.rotation.z=o.rz;parent.add(m);return m;
  }
  const NOSH={cast:false};

  /* ---------- shared material palette (machines add their own) ---------- */
  const M={
    alu:std(0xb9c0c8,.35,.85),aluD:std(0x7d858f,.45,.8),steel:std(0xd5dadf,.22,.95),black:std(0x15171a,.55,.2),dark:std(0x24272b,.6,.2),
    bed:std(0x1d2024,.6,.1),granite:std(0x1d2024,.6,.1),red:std(0xc8202a,.5,.1),white:std(0xf1f2f3,.7,0),blue:std(0x1e78d6,.4,.1),
    camBlue:std(0x1b4fb0,.35,.6),glassLens:std(0x0b1020,.05,.9),copper:std(0xb87333,.35,.9),rubber:std(0x1b1d20,.9,0),yellow:std(0xf2c400,.5,0),
    green:std(0x1f9e55,.45,0),orange:std(0xff8a00,.5,0),cable:std(0x202326,.8,0),hose:std(0x2b6fd6,.6,0),brass:std(0xc9a54a,.3,.9)
  };
  const emissive=(c,i=1)=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:i,roughness:.4});

  /* ---------- floor (re-tinted by the theme) ---------- */
  const floorMat=std(0xffffff,.82,0);
  const stubMat=std(0x2b323d,.75,.1);          /* neighbouring machines in the line */
  (function(){
    const f=new THREE.Mesh(new THREE.PlaneGeometry(CFG.floorSize,CFG.floorSize),floorMat);
    f.rotation.x=-PI/2;f.receiveShadow=true;scene.add(f);
    if(CFG.esdLines){const lt=canvasTex(64,64,(g)=>{g.fillStyle='#e8b923';g.fillRect(0,0,64,64);});
      [[0,1250,CFG.esd,60],[0,-1250,CFG.esd,60]].forEach(a=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(a[2],a[3]),new THREE.MeshBasicMaterial({map:lt,transparent:true,opacity:.55}));m.rotation.x=-PI/2;m.position.set(a[0],1,a[1]);scene.add(m);});}
    if(CFG.contactShadow){const st=canvasTex(256,256,(g,W,H)=>{const gr=g.createRadialGradient(W/2,H/2,W*.18,W/2,H/2,W*.5);gr.addColorStop(0,'rgba(0,0,0,.75)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);});
      const s=new THREE.Mesh(new THREE.PlaneGeometry(CFG.contact[0],CFG.contact[1]),new THREE.MeshBasicMaterial({map:st,transparent:true,depthWrite:false}));
      s.rotation.x=-PI/2;s.position.y=2;scene.add(s);}
  })();
  function floorTex(dark){const t=canvasTex(512,512,(g,W,H)=>{g.fillStyle=dark?'#232a34':'#d5dae0';g.fillRect(0,0,W,H);g.strokeStyle=dark?'rgba(255,255,255,.055)':'rgba(0,0,0,.07)';g.lineWidth=2;g.strokeRect(0,0,W,H);
    for(let i=0;i<900;i++){g.fillStyle=(dark?'rgba(255,255,255,':'rgba(0,0,0,')+(Math.random()*.025)+')';g.fillRect(Math.random()*W,Math.random()*H,2,2);}},{repeat:true});t.repeat.set(CFG.floorSize/1000,CFG.floorSize/1000);return t;}
  const _ftex={},themeCbs=[];
  SMT.onTheme(d=>{
    scene.background.set(d?0x10151d:0xeef1f5);
    const k=d?'d':'l';if(!_ftex[k])_ftex[k]=floorTex(d);floorMat.map=_ftex[k];floorMat.needsUpdate=true;
    stubMat.color.set(d?0x2b323d:0xb7bfc9);hemi.intensity=d?.75:.95;hemi.groundColor.set(d?0x4a4f58:0x9aa3ad);
    renderer.toneMappingExposure=d?CFG.exposure:CFG.exposure-.05;
    themeCbs.forEach(f=>f(d));
  });
  function lineStub(x,z,w,d,text){box(scene,w,1000,d,stubMat,x,500,z,NOSH);
    label(scene,text,Math.min(560,w-60),78,x,1001,z+d/2-90,{rx:-PI/2,bg:'#1e6fd9',fg:'#ffffff',pw:900,size:.46});}

  /* ---------- constants shared by every machine ---------- */
  const CONV_Y=900,BW=250,BD=200,BT=1.6,LANE_Z=[170,-170];

  /* ---------- the one demo board ---------- */
  const KIT=makePCBKit(THREE,a=>BGU.mergeBufferGeometries(a,false),canvasTex);

  /* ---------- tiny coroutine scheduler (sim time, seconds) ---------- */
  const FRAME=-1,cos=[];
  class Co{constructor(g){this.g=g;this.wait=0;this.done=false;}
    step(dt){if(this.done)return;this.wait-=dt;let pass=dt,guard=0;
      while(this.wait<=0&&guard++<64){const r=this.g.next(pass);pass=0;if(r.done){this.done=true;return;}if(r.value===FRAME){this.wait=1e-9;return;}this.wait+=r.value;}}}
  function run(g){const c=new Co(g);cos.push(c);return c;}
  const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  const smooth=t=>t*t*t*(10+t*(6*t-15));
  function* tween(dur,fn,lin){let t=0;while(t<dur){t+=yield FRAME;const k=Math.min(1,t/dur);fn(lin?k:ease(k));}}
  function* waitUntil(pred){while(!pred())yield FRAME;}

  /* ---------- time / speed ---------- */
  const T={sim:0,speed:1,paused:false};
  const frameCbs=[],hudCbs=[],slowCbs=[],renderCbs=[],tickCbs=[];
  function onTick(f){tickCbs.push(f);}        /* f(subDt) — LOGIC, runs inside every sim sub-step (also during fast-forward) */
  function onFrame(f){frameCbs.push(f);}      /* f(dt, rdt)  VISUALS, once per rendered frame; dt = sim seconds (0 when paused) */
  function onHud(f){hudCbs.push(f);}          /* every 80 ms real time */
  function onSlow(f){slowCbs.push(f);}        /* every 200 ms real time (operator monitors) */
  function onRender(f){renderCbs.push(f);}    /* after the main render (insets) */

  /* ---------- labels (tags) ---------- */
  const tags=[];let showTags=false;
  function tag(text,obj,x,y,z){const el=document.createElement('div');el.className='tag';el.textContent=text;$('tags').appendChild(el);const t={el,obj,v:new THREE.Vector3(x,y,z)};tags.push(t);return t;}
  function setTags(on){showTags=on;const b=$('bLab');if(b)b.classList.toggle('on',on);if(!on)tags.forEach(t=>t.el.style.display='none');}

  /* ---------- camera views ---------- */
  let camTween=null;
  function flyTo(p,t,dur=1.2){camTween={p0:camera.position.clone(),t0:controls.target.clone(),p1:new THREE.Vector3(...p),t1:new THREE.Vector3(...t),t:0,dur};}
  const views={};let followFn=null;
  function addViews(map){Object.assign(views,map);}
  function setView(name){const v=views[name];if(!v)return;followFn=null;
    document.querySelectorAll('[data-v]').forEach(x=>x.classList.toggle('on',x.dataset.v===name));
    if(typeof v==='function'){const r=v();if(typeof r==='function')followFn=r;}   /* a view function may return a per-frame follow(rdt) callback */
    else{if(v.before)v.before();flyTo(v.p,v.t,v.dur||1.2);if(v.follow)followFn=v.follow;}}
  controls.addEventListener('start',()=>{camTween=null;followFn=null;});

  /* ---------- clickable parts (hoods, doors) ---------- */
  const clickables=[];
  function clickable(obj,handler,cursorName){clickables.push({obj,handler});}
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let downAt=null;
  function hitClickable(e){if(!clickables.length)return null;SMT.ndc(e,mouse);ray.setFromCamera(mouse,camera);
    const hits=ray.intersectObjects(clickables.map(c=>c.obj),true);if(!hits.length)return null;
    for(let o=hits[0].object;o;o=o.parent){const c=clickables.find(c=>c.obj===o);if(c)return c;}return null;}
  canvas.addEventListener('pointerdown',e=>{downAt=[e.clientX,e.clientY];});
  canvas.addEventListener('pointerup',e=>{if(!downAt||Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1])>5)return;const c=hitClickable(e);if(c)c.handler(e);});
  canvas.addEventListener('pointermove',e=>{if(e.buttons)return;canvas.style.cursor=hitClickable(e)?'pointer':'';});

  /* ---------- x-ray: materials of outer covers ---------- */
  const shellMats=[];let xray=false;
  function setXray(on){xray=on;const b=$('bXray');if(b)b.classList.toggle('on',on);shellMats.forEach(m=>{m.transparent=on;m.opacity=on?.1:1;m.depthWrite=!on;m.needsUpdate=true;});xrayCbs.forEach(f=>f(on));}
  const xrayCbs=[];

  /* ---------- insets (what a camera sees), rendered after the main view ---------- */
  const insets=[];  /* {id, cam, prepare(cam), override?} */
  function inset(id,cam,prepare,override){const e={id,cam,prepare,override};insets.push(e);return e;}  /* returns the entry: e.cam / e.prepare / e.override may be swapped later */

  /* ---------- UI wiring (only for elements that exist on the page) ---------- */
  document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>setView(b.dataset.v));
  document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-s]').forEach(x=>x.classList.remove('on'));b.classList.add('on');T.speed=+b.dataset.s;});
  function setPaused(p){T.paused=p;const b=$('bPause');if(b){b.textContent=p?'Resume':'Pause';b.classList.toggle('on',p);}}
  if($('bPause'))$('bPause').onclick=()=>setPaused(!T.paused);
  if($('bXray'))$('bXray').onclick=()=>setXray(!xray);
  if($('bLab'))$('bLab').onclick=()=>setTags(!showTags);
  addEventListener('keydown',e=>{if(e.code==='Space'&&!/INPUT|BUTTON|TEXTAREA/.test(e.target.tagName)){e.preventDefault();setPaused(!T.paused);}});

  /* ---------- main loop ---------- */
  function resize(){const [w,h]=SMT.size();if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(SMT.stage());resize();
  renderer.shadowMap.autoUpdate=false;
  const clock=new THREE.Clock();let hudT=0,slowT=0,lastCalls=0,lastTris=0;const _p=new THREE.Vector3();
  function stepSim(dt){
    const n=Math.max(1,Math.ceil(dt/CFG.subStep)),h=dt/n;
    for(let i=0;i<n;i++){T.sim+=h;for(let k=0;k<cos.length;k++)cos[k].step(h);for(let k=0;k<tickCbs.length;k++)tickCbs[k](h);}
    for(let k=cos.length-1;k>=0;k--)if(cos[k].done)cos.splice(k,1);}
  let started=false;
  function frame(){
    requestAnimationFrame(frame);
    const rdt=Math.min(clock.getDelta(),.05);
    const dt=T.paused?0:(window.__step!==undefined?window.__step:rdt*T.speed);
    if(dt>0)stepSim(dt);
    frameCbs.forEach(f=>f(dt,rdt));
    if(camTween){camTween.t+=rdt;const k=ease(Math.min(1,camTween.t/camTween.dur));camera.position.lerpVectors(camTween.p0,camTween.p1,k);controls.target.lerpVectors(camTween.t0,camTween.t1,k);if(k>=1)camTween=null;}
    if(followFn&&!camTween)followFn(rdt);
    controls.update();
    const dist=camera.position.distanceTo(controls.target);camera.near=Math.max(1.5,Math.min(10,dist*.03));camera.updateProjectionMatrix();
    if(CFG.followShadow){sun.target.position.copy(controls.target);sun.position.set(controls.target.x+900,2900,controls.target.z+1900);}
    const [W,H]=SMT.size();
    renderer.setScissorTest(false);renderer.setViewport(0,0,W,H);renderer.clear();
    renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);
    lastCalls=renderer.info.render.calls;lastTris=renderer.info.render.triangles;
    if(insets.length){let any=false;
      insets.forEach(i=>{if(!i.cam)return;const R=SMT.rect(i.id);if(!R)return;if(!any){renderer.setScissorTest(true);any=true;}
        i.prepare(i.cam);renderer.setViewport(...R);renderer.setScissor(...R);renderer.clear();
        if(i.override)scene.overrideMaterial=i.override;renderer.render(scene,i.cam);scene.overrideMaterial=null;});
      if(any)renderer.setScissorTest(false);}
    renderCbs.forEach(f=>f());
    if(showTags)tags.forEach(t=>{_p.copy(t.v);t.obj.localToWorld(_p);_p.project(camera);const vis=_p.z<1&&Math.abs(_p.x)<1&&Math.abs(_p.y)<1;t.el.style.display=vis?'block':'none';if(vis){t.el.style.left=((_p.x+1)/2*W)+'px';t.el.style.top=((1-_p.y)/2*H)+'px';}});
    hudT+=rdt;if(hudT>.08){hudT=0;hudCbs.forEach(f=>f());}
    slowT+=rdt;if(slowT>.2){slowT=0;slowCbs.forEach(f=>f());}
  }
  function start(){if(started)return;started=true;frame();}

  /* ---------- performance: mark animated objects, merge everything else ---------- */
  function dyn(...objs){objs.forEach(o=>{if(o)o.userData.dynamic=true;});return objs[0];}
  function bake(root){
    root.updateMatrixWorld(true);
    const inv=new THREE.Matrix4().copy(root.matrixWorld).invert(),buckets=new Map(),victims=[];
    root.traverse(o=>{
      if(!o.isMesh||o.isInstancedMesh||o===root)return;
      for(let p=o;p&&p!==root;p=p.parent)if(p.userData.dynamic||p.userData.noBake)return;
      const mat=o.material;if(Array.isArray(mat)||mat.transparent||o.layers.mask!==1||o.renderOrder)return;
      const key=mat.uuid+'|'+(o.castShadow?1:0)+(o.receiveShadow?1:0);
      let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
      for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal'&&k!=='uv')g.deleteAttribute(k);
      if(!g.attributes.normal)g.computeVertexNormals();
      if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
      g.clearGroups();
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));
      if(!buckets.has(key))buckets.set(key,{mat,cast:o.castShadow,recv:o.receiveShadow,geos:[]});
      buckets.get(key).geos.push(g);victims.push(o);
    });
    let made=0;
    buckets.forEach(b=>{if(b.geos.length<2){b.geos.forEach(g=>g.dispose());b.single=true;return;}
      const mg=BGU.mergeBufferGeometries(b.geos,false);b.geos.forEach(g=>g.dispose());if(!mg)return;
      const m=new THREE.Mesh(mg,b.mat);m.castShadow=b.cast;m.receiveShadow=b.recv;m.userData.baked=true;root.add(m);made++;b.done=true;});
    let removed=0;
    victims.forEach(o=>{const key=o.material.uuid+'|'+(o.castShadow?1:0)+(o.receiveShadow?1:0),b=buckets.get(key);if(b&&b.done){o.parent.remove(o);removed++;}});
    return {merged:made,removed};
  }
  const lods=[];
  function lod(obj,maxDist){const p=new THREE.Vector3();obj.updateMatrixWorld(true);obj.getWorldPosition(p);lods.push({obj,p,d2:maxDist*maxDist});return obj;}
  onFrame(()=>{if(!lods.length)return;const c=camera.position;for(const l of lods){const v=c.distanceToSquared(l.p)<l.d2;if(l.obj.visible!==v&&!l.obj.userData.forceHidden)l.obj.visible=v;}});

  /* ---------- test / automation hook ---------- */
  const sim=window.__sim={get time(){return T.sim;},setSpeed:s=>T.speed=s,pause:()=>setPaused(true),resume:()=>setPaused(false),
    ff:(s,h)=>{h=h||.02;const n=Math.round(s/h);for(let i=0;i<n;i++)stepSim(h);frameCbs.forEach(f=>f(1e-6,0));hudCbs.forEach(f=>f());slowCbs.forEach(f=>f());},
    views,setView,setXray,setTags,
    snapCam:()=>{if(camTween){camera.position.copy(camTween.p1);controls.target.copy(camTween.t1);camTween=null;}controls.update();},
    stats:()=>({calls:lastCalls,tris:lastTris,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures})};
  function expose(o){Object.assign(sim,o);}

  return {THREE,CFG,PI,$,rnd,rr,pick,renderer,scene,camera,controls,canvasTex,std,box,cyl,label,plate,NOSH,M,emissive,floorMat,stubMat,lineStub,hemi,sun,fill,
    CONV_Y,BW,BD,BT,LANE_Z,KIT,FIDS:KIT.FIDS,FLAT:KIT.FLAT,PM:KIT.PM,BGU,
    FRAME,run,tween,ease,smooth,waitUntil,T,onTick,onFrame,onHud,dyn,bake,lod,stepSim,onSlow,onRender,tag,setTags,flyTo,addViews,setView,views,clickable,shellMats,setXray,onXray:f=>xrayCbs.push(f),
    onTheme:f=>{themeCbs.push(f);f(SMT.isDark());},inset,setPaused,start,expose,registry,build:(id,o)=>registry[id](C_,o),get C(){return C_;}};
}
let C_=null;
return {register,registry,init:o=>{C_=init(o);return C_;}};
})();
