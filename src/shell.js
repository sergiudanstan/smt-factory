(function(){
  const root=document.documentElement,$=id=>document.getElementById(id);
  const ls={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}}};
  const themeCbs=[],ovState={},ovCbs={};
  const SMT=window.SMT={
    theme:ls.get('smt-theme')||'dark',
    isDark:()=>SMT.theme==='dark',
    onTheme(cb){themeCbs.push(cb);cb(SMT.isDark());},
    setTheme(t){SMT.theme=t;root.dataset.theme=t;ls.set('smt-theme',t);
      document.querySelectorAll('[data-theme-btn]').forEach(b=>b.classList.toggle('on',b.dataset.themeBtn===t));
      $('themeIco').innerHTML=t==='dark'?'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>':'<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
      themeCbs.forEach(cb=>cb(t==='dark'));},
    /* overlays: checkbox in the side panel <-> element(s) on the stage */
    ov(id,on){if(on===undefined)return ovState[id]!==false;ovState[id]=on;ls.set('smt-ov-'+id,on?'1':'0');
      document.querySelectorAll('[data-ov="'+id+'"]').forEach(e=>e.classList.toggle('ov-off',!on));
      const c=$('ovc-'+id);if(c)c.checked=on;(ovCbs[id]||[]).forEach(f=>f(on));},
    onOv(id,f){(ovCbs[id]=ovCbs[id]||[]).push(f);f(SMT.ov(id));},
    /* stage geometry for the renderer */
    stage:()=>$('stage'),
    size(){const s=$('stage');return[s.clientWidth,s.clientHeight];},
    ndc(e,v){const r=$('c').getBoundingClientRect();v.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);return v;},
    /* viewport rect (WebGL coords, y from bottom) of a stage element's content area below its 24 px header */
    rect(id,head=24){const el=$(id);if(!el||el.classList.contains('ov-off')||getComputedStyle(el).display==='none')return null;
      const s=$('stage').getBoundingClientRect(),r=el.getBoundingClientRect();const x=r.left-s.left+1,y=s.bottom-r.bottom+1,w=r.width-2,h=r.height-head-2;return w>10&&h>10?[x,y,w,h]:null;},
    /* cycle-time badge */
    cycle(v,sub,label){$('cyV').textContent=v;$('cyS').textContent=sub||'';if(label)$('cyK').textContent=label;}
  };
  root.dataset.theme=SMT.theme;
  document.addEventListener('DOMContentLoaded',()=>{});
  // side panel collapse
  const side=$('side');if(ls.get('smt-side')==='min')side.classList.add('min');
  $('sideTgl').onclick=()=>{side.classList.toggle('min');ls.set('smt-side',side.classList.contains('min')?'min':'open');};
  $('themeTgl').onclick=()=>SMT.setTheme(SMT.theme==='dark'?'light':'dark');
  document.querySelectorAll('[data-theme-btn]').forEach(b=>b.onclick=()=>SMT.setTheme(b.dataset.themeBtn));
  document.querySelectorAll('.chk input[data-ovc]').forEach(c=>{const id=c.dataset.ovc,sv=ls.get('smt-ov-'+id);
    SMT.ov(id,sv===null?c.checked:sv==='1');c.onchange=()=>SMT.ov(id,c.checked);});
  SMT.setTheme(SMT.theme);
  // keep overlays above the persistent tool bar, whatever its height
  const bar=$('bar');if(bar)new ResizeObserver(()=>root.style.setProperty('--barH',bar.offsetHeight+'px')).observe(bar);
})();
