/* REFLOW — stand-alone page: placement stub -> reflow oven -> AOI stub */
'use strict';
(function(){
const C=SMT3D.init({camPos:[-2400,3800,11800],camTgt:[450,900,0],maxDist:16000,shadow:3500,shadowFar:12000,contactShadow:false});
SMT_LINE.install(C);
C.source({id:'placement',x:-3650,length:700,depth:800,lanes:[1,2],label:'FROM PLACEMENT  ▶',stage:'placed',interval:30,laneDelay:12});
C.build('reflow',{x:0,standalone:true});
C.sink({id:'aoi',x:3650,length:700,depth:800,lanes:[1,2],label:'▶  TO AOI'});
C.line.connect();
__sim.ff(540);          /* the oven is already filled when the page opens (a board needs ~8 min to cross it) */
C.start();
})();
