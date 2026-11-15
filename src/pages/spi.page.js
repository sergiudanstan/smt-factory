/* SPI — stand-alone page: printer stub -> SPI -> placement stub */
'use strict';
(function(){
const C=SMT3D.init({camPos:[-1900,1900,3000],camTgt:[0,880,100]});
SMT_LINE.install(C);
C.source({id:'printer',name:'PRINTER',x:-1000,length:600,depth:800,lanes:[1],label:'FROM PRINTER  ▶',stage:'printed',interval:1,
  prepare:b=>{if(Math.random()<.02)b.spi={printerFlag:'INSUFFICIENT PASTE',region:'U2'};}});
C.build('spi',{x:0,standalone:true});
C.sink({id:'shuttle',name:'SHUTTLE',x:1000,length:600,depth:800,lanes:[1],label:'▶  TO PLACEMENT'});
C.line.connect();
C.start();
})();
