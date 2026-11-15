/* AOI — stand-alone page: reflow/buffer stub -> AOI -> unloader stub */
'use strict';
(function(){
const C=SMT3D.init({camPos:[2450,1950,3300],camTgt:[0,880,0]});
SMT_LINE.install(C);
C.source({id:'reflow',name:'REFLOW',x:-1185,length:640,depth:800,lanes:[1,2],label:'FROM REFLOW / BUFFER  ▶',stage:'reflowed',interval:1,
  defects:false,
  prepare:b=>{if(Math.random()<.045){const n=Math.random()<.8?1:2,used=[];while(used.length<n){const k=Math.floor(Math.random()*C.KIT.cands.length);if(used.includes(k))continue;used.push(k);
    const dl=C.DEF[C.KIT.cands[k].kind];b.addDefect(k,dl[Math.floor(Math.random()*dl.length)],'reflow');}}}});
C.build('aoi',{x:0,standalone:true});
C.sink({id:'unloader',name:'UNLOADER',x:1185,length:640,depth:800,lanes:[1,2],label:'▶  TO UNLOADER'});
C.line.connect();
C.start();
})();
