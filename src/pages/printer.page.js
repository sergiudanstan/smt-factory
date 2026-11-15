/* PRINTER — stand-alone page: loader stub -> printer -> SPI stub */
'use strict';
(function(){
const C=SMT3D.init({camPos:[-2450,1950,3600],camTgt:[0,880,120]});
SMT_LINE.install(C);
C.source({id:'loader',name:'LOADER',x:-1150,length:600,depth:800,lanes:[1],label:'FROM LOADER  ▶',stage:'bare',interval:1});
C.build('printer',{x:0,standalone:true});
C.sink({id:'spi',name:'SPI',x:1150,length:600,depth:800,lanes:[1],label:'▶  TO SPI'});
C.line.connect();
C.start();
})();
