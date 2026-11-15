/* ===================================================================
   SMT FACTORY SUITE — line layer: Board entity, Machine base, SMEMA-style
   handoff, link conveyors, source/sink stubs, line controller + statistics.
   Requires core.js (window.SMT3D) — call SMT_LINE.install(C) once.
   =================================================================== */
'use strict';
window.SMT_LINE=(function(){
function install(C){
  const {THREE,KIT,CONV_Y,BW,BD,BT,LANE_Z,run,FRAME,std,box,cyl,label,M,NOSH,scene,PI}=C;
  const BELT_V=330;                       /* mm/s — SMEMA transfer speed */
  const PASTE_GEO=KIT.pasteGeo();
  const pasteMat=std(0x8f9296,.82,.35);   /* wet solder paste */
  const solderMat=std(0xd9dee2,.18,1);    /* reflowed joints */
  const redMat=new THREE.MeshBasicMaterial({color:0xff2030,toneMapped:false});
  let serial=4200;
  const events=[];                        /* global event feed: {t, m, text, cls} */
  function event(m,text,cls){events.unshift({t:C.T.sim,m,text,cls:cls||''});if(events.length>80)events.pop();}

  /* ---------- board stages ----------
     bare -> printed -> placing -> placed -> reflowed -> inspected   */
  class Board{
    constructor(lane,x,ln){
      this.line=ln||C.line;this.sn=++serial;this.lane=lane;this.x=x||0;this.stage='bare';this.defects=[];this.history=[];this.result=null;this.spi=null;
      this.g=new THREE.Group();this.g.position.set(this.x,CONV_Y,LANE_Z[lane-1]);this.line.root.add(this.g);
      this.base=KIT.inst(KIT.board);this.g.add(this.base);
      this.paste=new THREE.Mesh(PASTE_GEO,pasteMat);this.paste.visible=false;this.paste.receiveShadow=true;this.g.add(this.paste);
      this.parts=null;this.comps=null;this.cands=[];this.tOut=0;this.tIn=C.T.sim;this.proxy=null;this.far=false;
      allBoards.add(this);this.log('created');
    }
    setX(x){this.x=x;this.g.position.x=x;}
    setLane(l,snap){this.lane=l;if(snap!==false)this.g.position.z=LANE_Z[l-1];}
    setZ(z){this.g.position.z=z;}
    log(ev){this.history.push({t:C.T.sim,ev});}
    /* visual stage changes */
    setStage(s){
      if(s==='printed'){this.paste.visible=true;}
      if(s==='placing'){if(!this.parts){this.parts=new THREE.Group();this.g.add(this.parts);}}
      if(s==='placed'){this.showAssembled();}
      if(s==='reflowed'){this.paste.material=solderMat;}
      this.stage=s;this.log(s);
    }
    /* parts representation: a merged template (KIT.compsAll, or a subset merged by a placement machine) */
    setComps(tpl){
      if(this.parts){this.g.remove(this.parts);this.parts=null;}
      if(this.comps)this.g.remove(this.comps);
      this.cands.forEach(o=>this.g.remove(o));this.cands=[];this.split=false;
      this.comps=KIT.inst(tpl);this.g.add(this.comps);this.partsTpl=tpl;
    }
    /* full assembly; split=true keeps the defect-candidate parts as separate groups (needed to show defects) */
    showAssembled(split){
      if(split){if(this.split)return;if(this.parts){this.g.remove(this.parts);this.parts=null;}if(this.comps)this.g.remove(this.comps);
        this.comps=KIT.inst(KIT.compsNoCand);this.g.add(this.comps);this.cands=KIT.cands.map(c=>{const o=c.group.clone();this.g.add(o);return o;});this.split=true;}
      else{if(this.split||this.partsTpl===KIT.compsAll)return;this.setComps(KIT.compsAll);}
    }
    /* defect on candidate part k (0..KIT.cands.length-1), type from DEF list; visual as in the AOI */
    addDefect(k,type,source){
      this.showAssembled(true);
      const c=KIT.cands[k],o=this.cands[k];if(!o||this.defects.some(d=>d.k===k))return null;
      if(type==='MISSING'){o.visible=false;o.userData._lodHidden=false;}
      else if(type==='SHIFT'){const s=Math.min(1.6,Math.max(.45,.3*Math.min(c.w,c.d)));o.position.x+=s*(Math.random()<.5?-1:1);o.position.z+=s*.7;o.rotation.y+=.2;}
      else if(type==='TOMBSTONE'){o.rotation.z=1.05;o.position.y+=c.len/2*Math.sin(1.05)-.05;}
      else if(type==='ROTATED')o.rotation.y+=.62;
      else if(type==='POLARITY')o.rotation.y+=PI;
      else if(type==='LIFTED LEAD'){o.rotation.x=.1;o.position.y+=.32;}
      else if(type==='BRIDGE'||type==='INSUFFICIENT'||type==='OPEN'){ /* solder-level defects: no component motion */ }
      const d={k,name:c.name,kind:c.kind,type,x:c.x,z:c.z,s:Math.max(c.w,c.d)+2.2,h:c.h,found:false,source:source||'?'};
      this.defects.push(d);this.log('defect '+c.name+' '+type);return d;
    }
    /* red frame around a found defect (layer 1 = analysis overlays) */
    mark(d){const s=d.s,t=Math.max(.35,s*.06),y=BT+Math.min(d.h,3)+.6,g=new THREE.Group();
      [[0,-s/2,s+t,t],[0,s/2,s+t,t],[-s/2,0,t,s],[s/2,0,t,s]].forEach(a=>{const m=new THREE.Mesh(new THREE.BoxGeometry(a[2],.25,a[3]),redMat);m.position.set(a[0],0,a[1]);m.layers.set(1);g.add(m);});
      g.position.set(d.x,y,d.z);this.g.add(g);d.marker=g;}
    dispose(){if(this.g.parent)this.g.parent.remove(this.g);this.disposed=true;allBoards.delete(this);}
  }
  /* board level of detail: far boards show one textured box instead of ~35 meshes */
  const allBoards=new Set(),_bp=new THREE.Vector3(),BOARD_LOD=13000;
  const proxyGeo=new THREE.BoxGeometry(BW,BT,BD);proxyGeo.translate(0,BT/2,0);
  const proxyMats=[KIT.PM.fr4,KIT.PM.fr4,KIT.boardTop,KIT.PM.fr4,KIT.PM.fr4,KIT.PM.fr4];
  C.onFrame(()=>{const c=C.camera.position,l2=BOARD_LOD*BOARD_LOD;
    allBoards.forEach(b=>{b.g.getWorldPosition(_bp);const far=c.distanceToSquared(_bp)>l2;
      if(far){if(!b.proxy){b.proxy=new THREE.Mesh(proxyGeo,proxyMats);b.proxy.userData.isProxy=true;b.g.add(b.proxy);}b.proxy.visible=true;
        for(const ch of b.g.children){if(ch!==b.proxy&&ch.visible){ch.visible=false;ch.userData._lodHidden=true;}}}
      else if(b.far){if(b.proxy)b.proxy.visible=false;for(const ch of b.g.children){if(ch.userData._lodHidden){ch.visible=true;ch.userData._lodHidden=false;}}}
      b.far=far;});});
  const DEF={chip:['MISSING','SHIFT','TOMBSTONE','ROTATED'],ic:['SHIFT','MISSING','LIFTED LEAD'],ecap:['POLARITY','MISSING'],tant:['POLARITY','SHIFT'],led:['MISSING','POLARITY']};
  /* random defects for a board (used by the AOI stand-alone page and as the default placement/reflow fault model) */
  function randomDefects(b,nMax,source){const R=Math.random,r=R(),nd=r<.6?0:(r<.9?1:Math.min(2,nMax||2)),idx=[];
    while(idx.length<nd){const k=Math.floor(R()*KIT.cands.length);if(!idx.includes(k))idx.push(k);}
    idx.forEach(k=>{const dl=DEF[KIT.cands[k].kind];b.addDefect(k,dl[Math.floor(R()*dl.length)],source);});}

  /* ---------- motion helpers ---------- */
  function* conveyTo(b,x,belt,v){v=v||BELT_V;if(belt)belt.moving++;
    while(Math.abs(b.x-x)>1e-6){const dt=yield FRAME;const s=Math.sign(x-b.x);b.setX(s>0?Math.min(x,b.x+v*dt):Math.max(x,b.x-v*dt));}
    if(belt)belt.moving--;}
  /* conveyor rails for one lane, local coords.  Returns {belt:{tex,moving,mat}} for the belt animation */
  function railSeg(parent,x0,x1,z,o={}){
    const len=x1-x0,cx=(x0+x1)/2,belt=o.belt||makeBelt();
    [-1,1].forEach(s=>{const rz=z+s*(BD/2+7);
      box(parent,len,46,12,M.alu,cx,CONV_Y-17,rz);box(parent,len,6,5,M.aluD,cx,CONV_Y+9,rz-s*3.5,NOSH);
      box(parent,len,3,6,belt.mat,cx,CONV_Y-1.5,z+s*(BD/2-2.5),NOSH);});
    return belt;
  }
  const beltTexBase=C.canvasTex(64,16,(g)=>{g.fillStyle='#1c1e21';g.fillRect(0,0,64,16);g.fillStyle='#2c3035';for(let x=0;x<64;x+=16)g.fillRect(x,0,6,16);},{repeat:true});
  function makeBelt(rep){const tex=beltTexBase.clone();tex.needsUpdate=true;tex.repeat.set(rep||40,1);return{tex,moving:0,mat:std(0xffffff,.9,0,{map:tex})};}
  const belts=[];
  function belt(rep){const b=makeBelt(rep);belts.push(b);return b;}
  C.onFrame(dt=>{if(dt>0)belts.forEach(b=>{if(b.moving>0)b.tex.offset.x-=dt*BELT_V/20;});});
  /* retractable board stopper (pin) */
  function stopper(parent,x,z){const p=cyl(parent,5,5,16,M.steel,x,CONV_Y-12,z,{seg:12});p.userData.up=false;stoppers.push(p);return p;}
  const stoppers=[];
  C.onFrame((dt,rdt)=>{stoppers.forEach(p=>{const ty=p.userData.up?CONV_Y+3:CONV_Y-12;p.position.y+=(ty-p.position.y)*Math.min(1,Math.max(dt,rdt)*14);});});

  /* ---------- machine base ---------- */
  const machines=[];
  const STATES=['RUN','IDLE','STARVED','BLOCKED','DOWN','SETUP'];
  function machine(def){
    const ln=def.line||C.line;
    const m=Object.assign({line:ln,lanes:[1],state:'IDLE',step:'—',detail:'',ct:0,cts:[],counters:{in:0,out:0,ng:0},down:false,
      stateSince:0,stateTime:{RUN:0,IDLE:0,STARVED:0,BLOCKED:0,DOWN:0,SETUP:0},gantt:[],boards:[],outQ:{},log:[]},def);
    m.line=ln;m.lanesIn=m.lanesIn||m.lanes;m.lanesOut=m.lanesOut||m.lanes;
    if(m.inX===undefined)m.inX=-m.length/2;if(m.outX===undefined)m.outX=m.length/2;
    m.world=lx=>m.x+lx;                                   /* machine-local X -> line-local X */
    m.origin=()=>new THREE.Vector3(m.x,0,0).add(m.line.root.position); /* world position of the machine origin */
    m.setState=(s,step,detail)=>{if(step!==undefined)m.step=step;if(detail!==undefined)m.detail=detail;if(s===m.state)return;
      const now=C.T.sim;m.stateTime[m.state]+=now-m.stateSince;
      const g=m.gantt;if(!g.length){if(now>m.stateSince)g.push({s:m.state,t0:m.stateSince,t1:now});}else g[g.length-1].t1=now;   /* close the running segment */
      g.push({s,t0:now,t1:now});if(g.length>800)g.shift();
      m.state=s;m.stateSince=now;};
    m.addLog=(text,cls)=>{m.log.unshift({t:C.T.sim,text,cls:cls||''});if(m.log.length>40)m.log.pop();event(m.id,text,cls);};
    /* SMEMA-like protocol, per lane */
    m.canAccept=lane=>!m.down&&!m.boards.some(b=>b.lane===lane);
    m.accept=(b,lane)=>{m.boards.push(b);m.counters.in++;b.tIn=C.T.sim;b.log('in '+m.id);if(m.onAccept)m.onAccept(b,lane);};
    m.ready=lane=>m.outQ[lane]||null;
    m.setReady=(b,lane)=>{m.outQ[lane||b.lane]=b;};
    m.release=(b,lane)=>{lane=lane||b.lane;if(m.outQ[lane]===b)delete m.outQ[lane];const i=m.boards.indexOf(b);if(i>=0)m.boards.splice(i,1);m.counters.out++;b.tOut=C.T.sim;if(m.onRelease)m.onRelease(b,lane);};
    m.endCycle=(b,t0)=>{m.ct=C.T.sim-t0;m.cts.push(m.ct);if(m.cts.length>50)m.cts.shift();};
    m.avgCt=()=>{const c=m.cts.slice(-10);return c.length?c.reduce((a,b)=>a+b,0)/c.length:0;};
    m.util=()=>{const t=Object.values(m.stateTime).reduce((a,b)=>a+b,0)+(C.T.sim-m.stateSince);return t?(m.stateTime.RUN+(m.state==='RUN'?C.T.sim-m.stateSince:0))/t:0;};
    /* alarm: yield* m.fault('WIPER PAPER END', 90) inside the machine's own process coroutine */
    m.fault=function*(text,dur){m.down=true;const prev=[m.state,m.step,m.detail];m.faults=(m.faults||0)+1;m.lastFault=text;
      m.setState('DOWN','ALARM',text);m.addLog('ALARM  '+text,'ng');yield dur;m.down=false;m.addLog('Recovered  '+text,'ok');m.setState(prev[0],prev[1],prev[2]);};
    /* camera distance (updated per frame) — skip expensive cosmetic work when far away */
    m.near=true;m.camDist=0;
    m.update=m.update||(()=>{});
    machines.push(m);ln.machines.push(m);return m;
  }

  /* ---------- link conveyor between two machines (one board per lane) ---------- */
  function linkConveyor(o){
    const g=new THREE.Group();g.position.x=o.x;(o.line||C.line).root.add(g);
    const len=o.length||500,lanes=o.lanes||[1];
    const m=machine({id:o.id||'link',name:o.name||'CONVEYOR',group:g,x:o.x,length:len,lanes,kind:'link',stopX:len/2-BW/2-15,line:o.line});
    const beltsL={},pins={},sens={};
    lanes.forEach(l=>{const z=LANE_Z[l-1];beltsL[l]=railSeg(g,-len/2,len/2,z,{belt:belt(Math.round(len/12))});
      [-len/2+60,len/2-60].forEach(x=>{box(g,30,30,14,M.aluD,x,CONV_Y-24,z+BD/2+7);box(g,30,30,14,M.aluD,x,CONV_Y-24,z-BD/2-7);});
      pins[l]=stopper(g,m.stopX+BW/2+7,z);
      sens[l]=box(g,14,10,10,M.orange,m.stopX+BW/2+30,CONV_Y-22,z+BD/2-6,NOSH);           /* board-present sensor */
      box(g,60,34,16,M.black,-len/2+40,CONV_Y-17,z+BD/2+21,NOSH);                           /* belt motor */
    });
    /* frame: legs + cross members */
    const lz=lanes.length>1?[LANE_Z[0]+BD/2+7,LANE_Z[1]-BD/2-7]:[LANE_Z[lanes[0]-1]+BD/2+7,LANE_Z[lanes[0]-1]-BD/2-7];
    [-len/2+70,len/2-70].forEach(x=>{lz.forEach(z=>{box(g,40,CONV_Y-60,40,M.dark,x,(CONV_Y-60)/2+10,z);cyl(g,30,30,16,M.steel,x,8,z);});box(g,30,30,Math.abs(lz[0]-lz[1]),M.dark,x,300,(lz[0]+lz[1])/2);});
    box(g,len-160,30,30,M.dark,0,300,lz[0]);box(g,len-160,30,30,M.dark,0,300,lz[1]);
    /* SMEMA cable + control box */
    box(g,120,90,60,M.white,0,520,lz[0]+40);cyl(g,8,8,30,emis(0x30ff70),0,575,lz[0]+40,{cast:false});
    m.onAccept=(b,lane)=>{pins[lane].userData.up=true;m.setState('RUN','TRANSFER','board #'+b.sn);
      run((function*(){yield* conveyTo(b,m.world(m.stopX),beltsL[lane]);m.setReady(b,lane);m.setState('BLOCKED','HOLD','waiting downstream');})());};
    m.onRelease=(b,lane)=>{pins[lane].userData.up=false;beltsL[lane].moving++;run((function*(){yield (BW+60)/BELT_V;beltsL[lane].moving--;if(!m.boards.length)m.setState('IDLE','—','');})());};
    return m;
  }
  function emis(c){return C.emissive(c,2);}

  /* ---------- stubs for single-machine pages ---------- */
  /* upstream source: looks like the neighbouring machine, spawns boards at the given stage */
  function source(o){
    const g=new THREE.Group();g.position.x=o.x;(o.line||C.line).root.add(g);
    const len=o.length||700,lanes=o.lanes||[1],stage=o.stage||'bare';
    box(g,len,1000,o.depth||800,C.stubMat,0,500,0,NOSH);
    label(g,o.label||'FROM UPSTREAM  ▶',Math.min(560,len-60),78,0,1001,(o.depth||800)/2-90,{rx:-PI/2,bg:'#1e6fd9',fg:'#ffffff',pw:900,size:.46});
    const m=machine({id:o.id||'source',name:o.name||'UPSTREAM',group:g,x:o.x,length:len,lanes,kind:'stub',line:o.line});
    lanes.forEach(l=>{const z=LANE_Z[l-1];box(g,4,100,330,M.black,len/2-1,916,z,NOSH);railSeg(g,len/2-180,len/2+4,z,{belt:belt(12)});});
    m.canAccept=()=>false;
    const interval=o.interval||2;
    lanes.forEach(l=>{run((function*(){yield (o.delay||.3)+(l-1)*(o.laneDelay||4);
      while(true){while(m.outQ[l])yield FRAME;const b=new Board(l,m.world(len/2-BW/2-20),m.line);
        if(stage!=='bare')b.setStage('printed');if(stage==='placed'||stage==='reflowed'){b.setStage('placed');}
        if(stage==='reflowed'){b.setStage('reflowed');if(o.defects!==false)randomDefects(b,2,'upstream');}
        if(o.prepare)o.prepare(b);
        m.boards.push(b);m.setReady(b,l);yield interval;}})());});
    m.onRelease=()=>{};
    return m;
  }
  /* downstream sink: accepts everything, conveys the board away and removes it */
  function sink(o){
    const g=new THREE.Group();g.position.x=o.x;(o.line||C.line).root.add(g);
    const len=o.length||700,lanes=o.lanes||[1];
    box(g,len,1000,o.depth||800,C.stubMat,0,500,0,NOSH);
    label(g,o.label||'▶  TO DOWNSTREAM',Math.min(560,len-60),78,0,1001,(o.depth||800)/2-90,{rx:-PI/2,bg:'#1e6fd9',fg:'#ffffff',pw:900,size:.46});
    const m=machine({id:o.id||'sink',name:o.name||'DOWNSTREAM',group:g,x:o.x,length:len,lanes,kind:'stub',line:o.line});
    const bl={};lanes.forEach(l=>{const z=LANE_Z[l-1];box(g,4,100,330,M.black,-len/2+1,916,z,NOSH);bl[l]=railSeg(g,-len/2-4,-len/2+180,z,{belt:belt(12)});});
    m.canAccept=lane=>!m.boards.some(b=>b.lane===lane);
    m.onAccept=(b,lane)=>{run((function*(){yield* conveyTo(b,m.world(0),bl[lane]);m.release(b,lane);m.line.finished(b);if(o.onBoard)o.onBoard(b);b.dispose();})());};
    return m;
  }

  /* ---------- lines: a line owns a root group (line-local coords), its machines and statistics ---------- */
  const lines=[];
  function newLine(o){
    o=o||{};
    const root=new THREE.Group();root.position.set(o.x||0,0,o.z||0);if(o.ry)root.rotation.y=o.ry;scene.add(root);
    const ln={id:o.id||('L'+(lines.length+1)),name:o.name||('LINE '+(lines.length+1)),root,machines:[],order:[],out:0,ng:0,outTimes:[],started:0,events:[],
      /* chain machines by X order; downstream of A is the next machine that takes this lane */
      connect(){ln.order=ln.machines.slice().sort((a,b)=>a.x-b.x);ln.started=C.T.sim;},
      tick(){const o=ln.order;
        for(let i=0;i<o.length;i++){const A=o[i];
          for(const lane of A.lanesOut){const b=A.ready(lane);if(!b)continue;
            let B=null;for(let j=i+1;j<o.length;j++){if(o[j].lanesIn.includes(lane)){B=o[j];break;}}
            if(!B)continue;
            if(B.canAccept(lane,b)){A.release(b,lane);B.accept(b,lane);}
          }}},
      wip(){return ln.machines.reduce((n,m)=>n+(m.kind==='stub'?0:m.boards.length),0);},
      finished(b){ln.out++;if(b&&(b.result==='NG'))ln.ng++;ln.outTimes.push(C.T.sim);if(ln.outTimes.length>400)ln.outTimes.shift();},
      rate(){const t=ln.outTimes;if(t.length<2)return 0;const w=Math.min(t.length,30),span=t[t.length-1]-t[t.length-w];return span>0?(w-1)/span*3600:0;},
      /* bottleneck = the machine that is busiest (largest share of RUN + DOWN + SETUP: it is never waiting for others) */
      busy(m){const st=Object.assign({},m.stateTime);st[m.state]+=C.T.sim-m.stateSince;const T=Math.max(1e-6,C.T.sim-ln.started);return{run:st.RUN/T,down:(st.DOWN+st.SETUP)/T,busy:(st.RUN+st.DOWN+st.SETUP)/T,st,T};},
      bottleneck(){let best=null,bt=-1;ln.machines.forEach(m=>{if(m.kind==='stub'||m.kind==='link'||m.placeholder)return;const b=ln.busy(m).busy;if(b>bt){bt=b;best=m;}});return best;}};
    lines.push(ln);return ln;
  }
  const line=newLine({id:'L1',name:'LINE 1'});
  C.line=line;
  /* machine group parent for a module: opts.line.root or the default line */
  const parentFor=opts=>((opts&&opts.line)||C.line).root;
  C.onTick(()=>{for(const ln of lines)ln.tick();});
  const _wp=new THREE.Vector3();
  C.onFrame(()=>{const c=C.camera.position;machines.forEach(m=>{if(!m.group)return;m.group.getWorldPosition(_wp);m.camDist=c.distanceTo(_wp);m.near=m.camDist<(m.nearDist||7000);});});
  /* signal tower convention: green = running, amber steady = waiting (starved / blocked / idle),
     amber blinking = warning (cleaning, consumable low, paused), red = alarm (DOWN) */
  function tower(m,tw,warn){const blink=(performance.now()%700)<350,s=m.state,P=C.T.paused;
    tw.g.emissiveIntensity=(!P&&s==='RUN')?1.8:.05;
    tw.y.emissiveIntensity=((warn||P)&&blink)||(!P&&!warn&&(s==='STARVED'||s==='BLOCKED'||s==='IDLE'||s==='SETUP'))?1.8:.05;
    tw.r.emissiveIntensity=s==='DOWN'?(blink?2.2:.6):.05;}
  C.onFrame((dt,rdt)=>machines.forEach(m=>m.update(dt,rdt)));
  C.expose({line,lines,machines,events,Board,boards:allBoards});
  Object.assign(C,{allBoards,newLine,lines,parentFor,machines,tower,Board,DEF,randomDefects,conveyTo,railSeg,belt,stopper,machine,linkConveyor,source,sink,events,event,BELT_V,pasteMat,solderMat,redMat,STATES});
  return line;
}
return {install};
})();
