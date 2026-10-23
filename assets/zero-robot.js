
/* ZERO — isolated progressive enhancement for GEN5ROM. No libraries or eager 3D runtime. */
(() => {
  const section = document.createElement('section');
  section.id='zero-experience';
  section.setAttribute('aria-label','ZERO interactive robot experiment');
  section.innerHTML = `
    <div class="zero-shell">
      <div class="zero-topline"><span class="zero-kicker">GEN5ROM / EXPERIMENT 001 — INTERACTIVE ROBOTICS</span><span class="zero-status"><i class="zero-dot"></i> ZERO OS v1.0 / ONLINE</span></div>
      <div class="zero-heading"><h2>MEET <em>ZERO.</em></h2><p>One giant personality. Zero ordinary interactions. Wake him up, explore his engineering, and make some beautiful chaos.</p></div>
      <div class="zero-stage" id="zero-stage">
        <canvas class="zero-canvas" aria-label="Interactive ZERO robot, drag to orbit and tap facial or chest components"></canvas>
        <div class="zero-hud" hidden><div class="zero-hud-top"><div class="zero-hud-tag"><strong>ZERO / 01</strong> FRIENDLY // FORMIDABLE</div><div class="zero-hud-tag">NEURAL LINK: ACTIVE<br>EMOTION ENGINE: <span data-zero-mood>CYAN</span></div></div><div class="zero-hud-bottom"><div class="zero-scroll"><div class="zero-scroll-label"><span data-zero-phase>ASSEMBLED</span><span data-zero-percent>00%</span></div><div class="zero-track"><div class="zero-fill" data-zero-fill></div></div></div><div class="zero-stage-note">DRAG TO ORBIT · TAP EYES & CORE<br>SCROLL INSIDE STAGE TO TRANSFORM</div></div></div>
        <div class="zero-cover"><div class="zero-mark">0</div><h3>Meet your new creative companion.</h3><p>Interactive character study · expressive face · moving mechanics · cinematic neon hangar.</p><button class="zero-button" type="button">WAKE UP ZERO ↗</button><p class="zero-load-message" role="status">Loads only when you choose.</p></div>
      </div>
      <div class="zero-controls"><button class="zero-control" type="button" data-zero-action="eyes">◉ CHANGE MOOD</button><button class="zero-control" type="button" data-zero-action="core">⚡ CORE OVERLOAD</button><button class="zero-control" type="button" data-zero-action="head">⌘ OPEN HELMET</button><button class="zero-control" type="button" data-zero-action="dance">♫ DANCE / SPACE</button><button class="zero-control" type="button" data-zero-action="reset">↺ RESET</button><span class="zero-hint">DRAG • SCROLL • CLICK • SPACE</span></div>
      <p class="zero-footnote">An interactive WebGL-style concept experience. Loads only on request. Built to preserve the original portfolio layout and its existing Spline playground.</p>
    </div>`;
  let mounted=false, running=false, raf=0;
  function mount(){
    if(mounted) return;
    const anchor=document.getElementById('interactive');
    if(!anchor) return;
    anchor.after(section); mounted=true;
    start();
  }
  function start(){
    const stage=section.querySelector('.zero-stage'),canvas=section.querySelector('canvas'),cover=section.querySelector('.zero-cover'),wake=section.querySelector('.zero-button'),hud=section.querySelector('.zero-hud'),ctx=canvas.getContext('2d',{alpha:true});
    if(!ctx){wake.disabled=true;section.querySelector('.zero-load-message').textContent='Canvas not available on this device.';return;}
    let width=1,height=1,dpr=1,phase=0,orbit=0,tilt=0,mode=0,dance=false,headOpen=0,coreOpen=0,shock=0,blink=0,lastMove=performance.now(),last=performance.now(),tick=0,drag=null,mx=0,my=0,held=false;
    const modes=['CYAN','RED','GREEN','PINK'],colors=['#6cf8fa','#fa4d60','#83ffa4','#ff87dd'];
    const lerp=(a,b,t)=>a+(b-a)*t,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
    const fit=()=>{const b=canvas.getBoundingClientRect();width=Math.max(1,b.width);height=Math.max(1,b.height);dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);};
    const onResize=()=>fit();window.addEventListener('resize',onResize,{passive:true});
    const rr=(x,y,w,h,r,fill,stroke=null,sw=1)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r); if(fill){ctx.fillStyle=fill;ctx.fill();} if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=sw;ctx.stroke();}};
    const ellipse=(x,y,rx,ry,fill,stroke=null,sw=1)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=sw;ctx.stroke();}};
    const line=(a,b,c,d,color,sw=1)=>{ctx.strokeStyle=color;ctx.lineWidth=sw;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke();};
    function face(x,y,s,t){
      const color=colors[mode];ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*.002)*.025+(dance?Math.sin(t*.012)*.11:0)+(performance.now()-lastMove>4000?.07:0));ctx.scale(s,s);
      // antenna and helmet
      line(0,-134,0,-160,'#8d9cae',10);ellipse(0,-164,8,8,color);rr(-105,-120,210,185,64,'#e8f3fa','#708da5',5);rr(-112,-56,224,128,48,'#d5e3ec','#5d7a8e',5);
      rr(-90,-73,180,105,36,'#071522','#385a71',5);ctx.shadowColor=color;ctx.shadowBlur=18;
      const eyeX=clamp(mx*.13,-12,12),eyeY=clamp(my*.11,-8,8),closing=blink>0?1-Math.abs(blink-.5)*2:0;
      if(mode===2){
        ctx.strokeStyle=color;ctx.lineWidth=13;ctx.beginPath();ctx.arc(-42+eyeX,-15+eyeY,19,Math.PI*.14,Math.PI*.86);ctx.stroke();ctx.beginPath();ctx.arc(42+eyeX,-15+eyeY,19,Math.PI*.14,Math.PI*.86);ctx.stroke();
      } else {
        rr(-68+eyeX,-39+eyeY+closing*19,53,Math.max(3,49-closing*38),mode===1?9:20,color);rr(15+eyeX,-39+eyeY+closing*19,53,Math.max(3,49-closing*38),mode===1?9:20,color);
      }
      ctx.shadowBlur=0;
      if(mode===1){line(-82,-56,-13,-39,'#fc6d6d',8);line(13,-39,82,-56,'#fc6d6d',8);}
      if(mode===3){ctx.font='24px sans-serif';ctx.fillStyle='#ff8bdd';ctx.fillText('♥',-10,-80);}
      rr(-41,53,82,8,5,'#f69b45');rr(-92,-116,185,19,12,'#f8fbff');
      if(headOpen>.01){ctx.save();ctx.translate(0,-116-headOpen*45);rr(-96,-25,192,34,14,'#f1f6fa','#7697a9',4);ctx.restore();ellipse(0,-119,37*headOpen,21*headOpen,'#ad58ff');}
      ctx.restore();
    }
    function arm(side,x,y,scale,t){
      ctx.save();ctx.translate(x,y);ctx.rotate(side*(.12+Math.sin(t*.0015)*.025)+(dance?Math.sin(t*.011+side)*.5:0)+(drag===side?my*.45:0));
      rr(-31,0,62,90,23,'#d7e6f1','#638093',4);rr(-25,76,50,76,17,'#f8fcff','#8cabc0',4);rr(-23,150,46,37,12,'#213545','#849caf',3);rr(-27,13,54,13,7,'#fb9644');ctx.restore();
    }
    function frame(now){
      if(!running)return;
      const dt=Math.min(.05,(now-last)/1000);last=now;tick+=dt;
      const t=now,cc=colors[mode],cx=width/2,cy=height*.51;
      ctx.clearRect(0,0,width,height);
      const unit=Math.min(width/690,height/670)*1.08, breathe=Math.sin(t*.0018)*2;
      ctx.save();ctx.translate(cx,cy+height*.11);ctx.scale(unit,unit);
      // hangar lights + floor
      for(let i=-4;i<=4;i++){const x=i*110;line(x,-420,x*.68,220,'#8fe3ef09',1);}
      for(let i=0;i<3;i++){const grad=ctx.createRadialGradient(i*160-150,-150,0,i*160-150,-150,350);grad.addColorStop(0,'#66e5fe18');grad.addColorStop(1,'#66e5fe00');ctx.fillStyle=grad;ctx.fillRect(-450,-420,900,710);}
      ellipse(0,249,272,58,'#04101c','#25576c',4);
      for(let i=0;i<4;i++){ctx.shadowBlur=i===2?18:0;ctx.shadowColor='#3cedff';ellipse(0,244-i*6,246-i*35,51-i*8,null,i===2?cc:'#2c7187',i===2?5:2);}ctx.shadowBlur=0;
      const explode=clamp((phase-.25)/.23,0,1)*(1-clamp((phase-.65)/.23,0,1));
      const coreFlight=clamp((phase-.5)/.25,0,1);
      const theme=clamp((phase-.75)/.22,0,1);
      const zoom=1+phase*.12+coreFlight*.75;
      ctx.translate(0,coreFlight*130);ctx.scale(zoom,zoom);
      ctx.translate(Math.sin(orbit)*38,-breathe+(dance?Math.sin(t*.014)*8:0));ctx.transform(Math.cos(orbit)*.24+1-.24,0,Math.sin(orbit)*.13,1,0,0);
      // legs
      for(const side of [-1,1]){ctx.save();ctx.translate(side*58,92);ctx.rotate(side*explode*.1);rr(-32,0,64,114,17,'#e6f2f9','#7791a2',5);rr(-44,101,88,41,14,'#e5f6fb','#64849b',4);rr(-25,27,50,14,6,'#f99141');ctx.restore();}
      // mechanical spine
      rr(-65,-143,130,240,27,'#1b303e','#5c8496',6);
      for(let i=0;i<6;i++)rr(-40,-112+i*30,80,11,4,i%2?'#21495a':'#50778c');
      // shoulder and arms
      for(const side of [-1,1]){ctx.save();ctx.translate(side*explode*64,-explode*25);rr(side*96-45,-141,90,60,24,'#f2f7fa','#7591a5',5);rr(side*96-34,-130,68,13,5,'#fb9848');arm(side,side*128,-99,1,t);ctx.restore();}
      // torso shell
      for(const side of [-1,1]){ctx.save();ctx.translate(side*explode*92,-explode*22);rr(side*54-54,-138,104,143,28,'#e8f3f9','#8aa4b6',4);rr(side*57-38,-121,77,10,5,'#ff9a4b');ctx.restore();}
      rr(-84,10,168,82,20,'#ddebf3','#7794a9',5);rr(-75,30,150,11,7,'#324e60');
      // reactor + opening doors
      ellipse(0,-78,58,58,'#122d3a','#7db6c4',8);
      ctx.save();ctx.shadowColor=cc;ctx.shadowBlur=42+Math.sin(t*.006)*12+coreOpen*35;ellipse(0,-78,35+coreOpen*14,35+coreOpen*14,cc);ellipse(0,-78,18+coreOpen*6,18+coreOpen*6,'#fff');ctx.restore();
      for(const side of [-1,1]){ctx.save();ctx.translate(side*coreOpen*42,0);rr(side*42-38,-117,72,79,19,'#e8f2f6','#83a6b8',4);rr(side*45-17,-109,32,8,4,'#fb9945');ctx.restore();}
      face(0,-202,1,t);
      // tiny drones
      for(let i=0;i<4;i++){const a=t*.0005+i*Math.PI/2;const px=Math.cos(a)* (250+i%2*40),py=-152+Math.sin(a*2)*24+i%2*50;ellipse(px,py,22,12,'#182e42','#448da5',2);ellipse(px,py,8,7,cc);}
      if(coreOpen>.05){const p=1-shock;ellipse(0,250,280*shock,60*shock,null,cc,5*p);for(let i=0;i<20;i++){const a=i*2.399+t*.0003;const r=50+shock*220;ellipse(Math.cos(a)*r,-78+Math.sin(a)*r*.5,Math.max(1,p*4),Math.max(1,p*4),i%2?cc:'#ffb96c');}}
      if(mode===3){for(let i=0;i<7;i++){ctx.fillStyle='#ff90d6';ctx.font='19px sans-serif';ctx.fillText('♥',Math.sin(t*.001+i)*90,-250-((t*.03+i*31)%140));}}
      ctx.restore();
      for(let i=0;i<36;i++){const x=(Math.sin(i*18.7)*.5+.5)*width,y=(Math.cos(i*7.13+t*.00015)*.5+.5)*height;ellipse(x,y,i%4===0?1.3:.65,i%4===0?1.3:.65,'#89dbed65');}
      if(blink>0)blink=Math.min(1,blink+dt*5);if(blink>=1)blink=0;
      if(coreOpen>0){coreOpen=Math.max(0,coreOpen-dt*.46);shock=clamp(shock+dt*.9,0,1);}
      if(headOpen>0)headOpen=Math.max(0,headOpen-dt*.35);
      if(now-lastMove>4200 && Math.sin(now*.0013)>.998){blink=.01;lastMove=now-3600;}
      raf=requestAnimationFrame(frame);
    }
    const updatePhase=()=>{const pct=Math.round(phase*100);section.querySelector('[data-zero-percent]').textContent=String(pct).padStart(2,'0')+'%';section.querySelector('[data-zero-fill]').style.width=pct+'%';section.querySelector('[data-zero-phase]').textContent=phase<.25?'ASSEMBLED':phase<.5?'EXPLODED VIEW':phase<.75?'CORE FLYTHROUGH':'REASSEMBLY';};
    wake.addEventListener('click',()=>{cover.hidden=true;hud.hidden=false;running=true;fit();last=performance.now();raf=requestAnimationFrame(frame);});
    const changeMood=()=>{mode=(mode+1)%4;section.querySelector('[data-zero-mood]').textContent=modes[mode];};
    const actions={eyes:changeMood,core:()=>{coreOpen=1;shock=0;},head:()=>headOpen=1,dance:()=>dance=!dance,reset:()=>{phase=0;orbit=0;tilt=0;mode=0;dance=false;coreOpen=0;headOpen=0;section.querySelector('[data-zero-mood]').textContent='CYAN';updatePhase();}};
    section.querySelectorAll('[data-zero-action]').forEach(button=>button.addEventListener('click',()=>{if(!running){wake.click();}actions[button.dataset.zeroAction]();}));
    canvas.addEventListener('pointerdown',e=>{if(!running)return;held=true;canvas.setPointerCapture(e.pointerId);const rect=canvas.getBoundingClientRect(),px=(e.clientX-rect.left)/rect.width,py=(e.clientY-rect.top)/rect.height;drag={x:e.clientX,y:e.clientY,px,py};});
    canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();mx=(e.clientX-r.left)/r.width*2-1;my=(e.clientY-r.top)/r.height*2-1;lastMove=performance.now();if(held&&drag){orbit=clamp(orbit+(e.clientX-drag.x)*.007,-100,100);drag.x=e.clientX;drag.y=e.clientY;}});
    const release=e=>{if(!held||!drag)return;const r=canvas.getBoundingClientRect();const px=drag.px,py=drag.py;const moved=Math.abs(e.clientX-(drag.x||e.clientX))>5 || Math.abs(e.clientY-(drag.y||e.clientY))>5;held=false;drag=null;if(!running)return;if(moved)return; if(py>.27&&py<.48&&px>.34&&px<.66)changeMood();else if(py>.49&&py<.7&&px>.38&&px<.62)actions.core();else if(py<.27&&px>.35&&px<.65)actions.head();};
    canvas.addEventListener('pointerup',release);
    canvas.addEventListener('pointercancel',()=>{held=false;drag=null;});
    canvas.addEventListener('wheel',e=>{if(!running)return;e.preventDefault();phase=clamp(phase+e.deltaY*.00055,0,1);updatePhase();},{passive:false});
    window.addEventListener('keydown',e=>{if(!running||!section.isConnected||!document.activeElement)return;const t=document.activeElement.tagName;if((t==='INPUT'||t==='TEXTAREA'||t==='BUTTON')||e.code!=='Space')return;const bounds=stage.getBoundingClientRect();if(bounds.bottom<0||bounds.top>innerHeight)return;e.preventDefault();actions.dance();});
    document.addEventListener('visibilitychange',()=>{if(!running)return;if(document.hidden)cancelAnimationFrame(raf);else{last=performance.now();raf=requestAnimationFrame(frame);}});
    updatePhase();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  const observer=new MutationObserver(()=>{if(mounted){observer.disconnect();return;}mount();});
  if(!mounted)observer.observe(document.documentElement,{subtree:true,childList:true});
})();
