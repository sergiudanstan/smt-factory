/* PROPS — gallery page: every factory prop in three rows, floor labels + tags */
'use strict';
(function(){
const C=SMT3D.init({camPos:[0,24000,27000],camTgt:[0,300,-6500],maxDist:40000,far:60000,shadow:12000,shadowFar:30000,esdLines:false,contactShadow:false});
SMT_LINE.install(C);

/* rows of props, 3500 mm spacing minimum (wide props take their own slot width) */
const ROWS=[
 {z:0,key:'row1',items:[
   ['palletRack',8600,{bays:3},5200],
   ['forklift',4300,{},2200],
   ['selectiveSolder',2700,{},1950],
   ['xray',2000,{},2500],
   ['testStation',2100,{},2250],
   ['amr',3500,{top:'magazine'},1150],
   ['reworkStation',2100,{},2150]]},
 {z:-6500,key:'row2',items:[
   ['reelShelf',2300,{},2100],
   ['reelTower',1400,{},2150],
   ['dryCabinet',1100,{},1900],
   ['pasteFridge',1100,{},1450],
   ['stencilRack',1600,{},1000],
   ['feederCart',1150,{},1150],
   ['magazine',3500,{fill:.6},700],
   ['lockers',2300,{n:6},1850],
   ['wasteBins',1750,{},560],
   ['trolley',1400,{},1100],
   ['palletJack',1500,{},1300],
   ['pallet',1700,{loaded:true,h:900},1100],
   ['person',1500,{},1950]]},
 {z:-13000,key:'row3',items:[
   ['esdBench',2100,{microscope:true},2050],
   ['turnstile',1100,{},1450],
   ['fireExtinguisher',1400,{},1750],
   ['firstAid',1400,{},1450],
   ['sign',1400,{text:'EXIT'},600,2400],
   ['andonBoard',1400,{hang:900},1150,2600],
   ['compressor',2000,{},1550],
   ['airReceiver',1600,{},3450],
   ['airDryer',1300,{},1150],
   ['n2Generator',2300,{},2050],
   ['desk',2100,{},1250],
   ['officeChair',1400,{},1050],
   ['whiteboard',2300,{},2100],
   ['meetingTable',5200,{seats:8},1150]]}
];
const anim={};
for(const row of ROWS){
  const tot=row.items.reduce((s,it)=>s+it[1],0);
  let x=-tot/2;
  for(const it of row.items){
    const gx=x+it[1]/2;x+=it[1];
    const g=SMT_PROPS[it[0]](C,it[2]||{});
    g.position.set(gx,it[4]||0,row.z);
    C.scene.add(g);
    C.label(C.scene,it[0].toUpperCase(),1600,180,gx,2,row.z+1300,{rx:-C.PI/2,bg:'#1e6fd9',fg:'#ffffff',pw:900,size:.5});
    C.tag(it[0],g,0,it[3],0);
    anim[it[0]]=anim[it[0]]||g;
  }
}
/* camera views */
C.addViews({
  all:{p:[0,24000,27000],t:[0,300,-6500]},
  row1:{p:[0,25000,16000],t:[0,500,0]},
  row2:{p:[0,23200,8800],t:[0,500,-6500]},
  row3:{p:[0,27000,3550],t:[0,500,-13000]}
});
/* prove the userData hooks: person walk swing, AMR LED pulse, forklift forks */
const P=anim.person?anim.person.userData:null,A=anim.amr?anim.amr.userData:null,F=anim.forklift?anim.forklift.userData:null;
C.onFrame((dt,rdt)=>{
  const t=C.T.sim;
  if(P){const sw=Math.sin(t*2.2)*.55;
    P.legs[0].rotation.x=sw;P.legs[1].rotation.x=-sw;
    P.arms[0].rotation.x=-sw*.7;P.arms[1].rotation.x=sw*.7;}
  if(A&&A.leds)A.leds.emissiveIntensity=1.6+Math.sin(t*7)*.9;
  if(F&&F.forks)F.forks.position.y=Math.max(0,600+Math.sin(t*.5)*560);
});
window.__P=C;
C.start();
})();
