/* AURORA HEXFIELD / GEN5ROM
   Real, beveled, instanced 3D hexagons with cursor/touch proximity waves.
   Uses the original site's html.light switch; dark indigo/ice + light pearl/violet.
   Lazy Three.js, scroll/visibility pausing, reduced-motion and CSS fallback.
*/
(()=>{
"use strict";
let activeStage=null;
function setup(){
  const hero=document.querySelector("main > section.gen5-proximity-hero");
  const stage=document.getElementById("gen5-proximity-stage");
  if(!hero||!stage||stage===activeStage)return !!activeStage;
  activeStage=stage;
  const canvas=stage.querySelector("#gen5-proximity-canvas");
  const fallback=stage.querySelector("#gen5-proximity-fallback");
  const meter=stage.querySelector("#gen5-proximity-meter");
  const label=stage.querySelector("#gen5-proximity-status");
  if(!canvas||!fallback)return false;
  const coarse=matchMedia("(pointer:coarse)").matches;
  const reduced=matchMedia("(prefers-reduced-motion:reduce)").matches;
  const palette={
    dark:{surface:0x353251,light:0xe7dfff,secondary:0x83caff,rim:0x8e99ff,back:0x121329,emissive:0x19163e},
    light:{surface:0xc8c9ee,light:0xffffff,secondary:0x7899ff,rim:0x6757c8,back:0xdddffc,emissive:0x514a93}
  };
  let mode=document.documentElement.classList.contains("light")?"light":"dark";
  let T,renderer,scene,camera,group,tiles,edges,lights,geometry,rimGeometry,rimMaterial,tileMaterial;
  let initialized=false,loading=false,visible=false,raf=0,last=0,elapsed=0,energy=0,impulse=0;
  let hovered=false,dragging=false,observer=null,resizer=null;
  const pointer={x:.70,y:.48},smooth={x:.70,y:.48};
  const lerp=(a,b,t)=>a+(b-a)*t;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const radius=.46,dx=Math.sqrt(3)*radius+.08,dy=1.5*radius+.075;
  let rows=coarse?19:14,columns=20,count=0;
  let zValues=null,heat=null,baseX=null,baseY=null,shapeHelper=null;
  function dims(){
    const r=hero.getBoundingClientRect(),aspect=Math.max(.34,r.width/Math.max(1,r.height));
    rows=coarse?Math.max(17,Math.min(23,Math.round(r.height/35))):Math.max(12,Math.min(17,Math.round(r.height/56)));
    const worldHeight=(rows+1)*dy;
    columns=Math.max(9,Math.min(42,Math.ceil(worldHeight*aspect/dx)+4));
    count=columns*rows;
    return {worldHeight,aspect};
  }
  dims();
  fallback.style.setProperty("--hex-cols",columns);
  fallback.style.setProperty("--hex-rows",rows);
  const tilesFallbackCount=coarse?Math.min(count,235):Math.min(count,420);
  for(let i=0;i<tilesFallbackCount;i++){
    const el=document.createElement("i");
    el.style.setProperty("--tile-opacity",(.38+((i*29%19)/19)*.44).toFixed(2));
    el.style.setProperty("--tile-brightness",(.76+((i*13%17)/17)*.43).toFixed(2));
    fallback.appendChild(el);
  }

  function readPointer(x,y){
    const r=hero.getBoundingClientRect();
    if(!r.width||!r.height)return;
    pointer.x=clamp((x-r.left)/r.width,0,1);
    pointer.y=clamp((y-r.top)/r.height,0,1);
    hovered=true;
    if(!initialized){
      // CSS hexes are a working fallback, including while GPU scene downloads.
      const fx=pointer.x*columns,fy=pointer.y*rows;
      const nodes=fallback.children;
      for(let i=0;i<nodes.length;i++){
        const cx=(i%columns)+.5,cy=Math.floor(i/columns)+.5;
        const p=Math.exp(-((cx-fx)**2+(cy-fy)**2)*.22);
        nodes[i].style.setProperty("--lift",(p*33).toFixed(1)+"px");
        nodes[i].style.setProperty("--tile-brightness",(.85+((i*13%17)/17)*.36+p*.32).toFixed(2));
      }
    }
    requestFrame();
  }
  hero.addEventListener("pointermove",e=>{
    if(e.pointerType==="touch"&&!dragging)return;
    readPointer(e.clientX,e.clientY);
  },{passive:true});
  hero.addEventListener("pointerdown",e=>{
    dragging=e.pointerType==="touch";readPointer(e.clientX,e.clientY);
    impulse=1;requestFrame();
  },{passive:true});
  hero.addEventListener("pointerup",()=>{dragging=false;},{passive:true});
  hero.addEventListener("pointercancel",()=>{dragging=false;hovered=false;requestFrame();},{passive:true});
  hero.addEventListener("pointerleave",()=>{
    hovered=false;
    for(const cell of fallback.children)cell.style.setProperty("--lift","0px");
    requestFrame();
  },{passive:true});
  function setStatus(){
    const p=Math.round(energy*100);
    if(meter)meter.style.width=Math.max(3,p)+"%";
    if(label)label.textContent=p>70?"FULL PROXIMITY":p>24?"CURSOR REACTION ACTIVE":"MOVE CURSOR / TOUCH TO INTERACT";
  }
  function applyTheme(){
    mode=document.documentElement.classList.contains("light")?"light":"dark";
    const c=palette[mode];
    if(tileMaterial){tileMaterial.color.setHex(c.surface);tileMaterial.emissive.setHex(c.emissive);}
    if(rimMaterial)rimMaterial.color.setHex(c.rim);
    if(lights){lights.key.color.setHex(c.light);lights.fill.color.setHex(c.secondary);}
    if(tiles&&T){
      const col=new T.Color(c.surface);
      const other=new T.Color(c.secondary);
      for(let i=0;i<count;i++){
        const m=((i*37)%23)/23;
        const sh=col.clone().lerp(other,mode==="light"?.085*m:.10*m);
        sh.multiplyScalar(.89+.15*((i*17%19)/19));
        tiles.setColorAt(i,sh);
      }
      if(tiles.instanceColor)tiles.instanceColor.needsUpdate=true;
    }
    if(reduced&&renderer)renderer.render(scene,camera);
  }
  const themeObserver=new MutationObserver(applyTheme);
  themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:["class"]});
  function createHexGeometry(T){
    const hex=new T.Shape();
    for(let i=0;i<6;i++){
      const a=Math.PI/6+(i*Math.PI/3);
      const px=Math.cos(a)*radius,py=Math.sin(a)*radius;
      if(i===0)hex.moveTo(px,py);else hex.lineTo(px,py);
    }
    hex.closePath();
    const g=new T.ExtrudeGeometry(hex,{depth:.41,steps:1,bevelEnabled:true,bevelSize:.034,bevelThickness:.045,bevelSegments:2,curveSegments:1});
    g.translate(0,0,-.22);g.computeVertexNormals();
    return g;
  }
  async function initialize(){
    if(loading||initialized)return;
    loading=true;
    try{
      const gl=canvas.getContext("webgl2",{alpha:true,antialias:!coarse,powerPreference:coarse?"low-power":"high-performance"});
      if(!gl)throw Error("WebGL2 not available");
      T=await import("https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js");
      if(!hero.isConnected)return;
      const size=dims();
      scene=new T.Scene();
      camera=new T.OrthographicCamera(-1,1,1,-1,.1,100);
      camera.position.set(0,0,19);
      camera.lookAt(0,0,0);
      renderer=new T.WebGLRenderer({canvas,context:gl,alpha:true,antialias:!coarse,powerPreference:coarse?"low-power":"high-performance"});
      renderer.setClearColor(0x000000,0);
      renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.08:1.55));
      renderer.outputColorSpace=T.SRGBColorSpace;
      renderer.toneMapping=T.ACESFilmicToneMapping;
      renderer.toneMappingExposure=mode==="light"?1.1:1.35;
      scene.add(new T.AmbientLight(0xcbd0f1,mode==="light"?1.7:.83));
      scene.add(new T.HemisphereLight(0xdbd7ff,0x15182a,1.3));
      const key=new T.DirectionalLight(palette[mode].light,mode==="light"?3.1:3.5);
      key.position.set(-4,5,9);scene.add(key);
      const fill=new T.PointLight(palette[mode].secondary,28,24,1.25);
      fill.position.set(4,-1,6);scene.add(fill);
      lights={key,fill};
      group=new T.Group();group.position.set(0,0,0);scene.add(group);
      geometry=createHexGeometry(T);
      tileMaterial=new T.MeshPhysicalMaterial({
        color:palette[mode].surface,roughness:mode==="light"?.28:.31,metalness:.55,
        clearcoat:1,clearcoatRoughness:.13,
        iridescence:.6,iridescenceIOR:1.31,iridescenceThicknessRange:[150,610],
        emissive:palette[mode].emissive,emissiveIntensity:.14
      });
      tiles=new T.InstancedMesh(geometry,tileMaterial,count);
      tiles.instanceMatrix.setUsage(T.DynamicDrawUsage);
      tiles.frustumCulled=false;
      group.add(tiles);
      // Luminescent hex outlines sit on the surface of each solid tile.
      rimGeometry=new T.RingGeometry(radius*.85,radius*.93,6,1,Math.PI/6);
      rimMaterial=new T.MeshBasicMaterial({color:palette[mode].rim,transparent:true,opacity:.22,side:T.DoubleSide,depthWrite:false});
      edges=new T.InstancedMesh(rimGeometry,rimMaterial,count);
      edges.instanceMatrix.setUsage(T.DynamicDrawUsage);
      edges.frustumCulled=false;group.add(edges);
      zValues=new Float32Array(count);heat=new Float32Array(count);
      baseX=new Float32Array(count);baseY=new Float32Array(count);
      shapeHelper=new T.Object3D();
      const ringNode=new T.Object3D();
      for(let i=0;i<count;i++){
        const row=Math.floor(i/columns),col=i%columns;
        const x=(col-(columns-1)/2)*dx+(row%2?dx*.5:0);
        const y=((rows-1)/2-row)*dy;
        baseX[i]=x;baseY[i]=y;
        zValues[i]=((i*31)%23)/23*.40;
        shapeHelper.position.set(x,y,zValues[i]);shapeHelper.rotation.set(0,0,0);
        shapeHelper.updateMatrix();tiles.setMatrixAt(i,shapeHelper.matrix);
        ringNode.position.set(x,y,zValues[i]+.27);
        ringNode.updateMatrix();edges.setMatrixAt(i,ringNode.matrix);
      }
      tiles.instanceMatrix.needsUpdate=true;
      edges.instanceMatrix.needsUpdate=true;
      applyTheme();
      resize();
      if("ResizeObserver" in window){
        resizer=new ResizeObserver(resize);resizer.observe(hero);
      }else window.addEventListener("resize",resize,{passive:true});
      initialized=true;
      stage.classList.add("webgl-ready");
      if(reduced)renderer.render(scene,camera);else requestFrame();
    }catch(err){
      stage.classList.add("hex-fallback-mode");
      if(label)label.textContent="INTERACTIVE CSS MODE";
      console.warn("Aurora Hexfield fallback:",err.message);
    }
  }
  function resize(){
    if(!renderer||!camera)return;
    const w=Math.max(1,hero.clientWidth),h=Math.max(1,hero.clientHeight);
    const viewHeight=(rows-.3)*dy;
    const viewWidth=viewHeight*w/h;
    renderer.setSize(w,h,false);
    camera.left=-viewWidth/2;camera.right=viewWidth/2;
    camera.top=viewHeight/2;camera.bottom=-viewHeight/2;
    camera.updateProjectionMatrix();
    // Extend field to cover orientation changes without reinitializing GPU buffers.
    if(group)group.scale.x=Math.max(1,viewWidth/Math.max(1,columns*dx-.7));
    if(reduced)renderer.render(scene,camera);
  }
  function requestFrame(){
    if(!initialized)return;
    if(reduced){if(renderer)renderer.render(scene,camera);return;}
    if(visible&&!document.hidden&&!raf){last=0;raf=requestAnimationFrame(frame);}
  }
  const dummy={};
  function frame(now){
    raf=0;
    if(!renderer||!visible||document.hidden)return;
    const dt=last?clamp((now-last)/1000,.001,.045):.016;last=now;elapsed+=dt;
    const k=clamp(dt*5,0,1);
    smooth.x=lerp(smooth.x,hovered?pointer.x:.70,k);
    smooth.y=lerp(smooth.y,hovered?pointer.y:.48,k);
    const viewHeight=(rows-.3)*dy;
    const viewWidth=viewHeight*camera.aspect;
    const focusX=(smooth.x-.5)*viewWidth/Math.max(1,group.scale.x);
    const focusY=(.5-smooth.y)*viewHeight;
    const radial=Math.hypot((smooth.x-.68)*1.15,(smooth.y-.5)*1.3);
    const proximity=hovered?Math.pow(clamp(1-radial/.85,0,1),1.15):0;
    energy=lerp(energy,clamp(.08+proximity*.83+impulse*.4,0,1),clamp(dt*4.5,0,1));
    impulse=Math.max(0,impulse-dt*.9);
    if(!dummy.tile){dummy.tile=new T.Object3D();dummy.rim=new T.Object3D();}
    const tile=dummy.tile,rim=dummy.rim;
    for(let i=0;i<count;i++){
      const diffX=baseX[i]-focusX,diffY=baseY[i]-focusY;
      const d2=diffX*diffX+diffY*diffY;
      const field=hovered?Math.exp(-d2/(coarse?3.3:5.0)):0;
      const pulse=Math.exp(-d2/7.2)*impulse;
      heat[i]=lerp(heat[i],field+(.8*pulse),clamp(dt*7,0,1));
      const h=heat[i];
      const z=zValues[i]+h*(1.45+energy*.47)+Math.sin(elapsed*.38+i*.12)*.018;
      tile.position.set(baseX[i]+diffX*.022*h,baseY[i]+diffY*.02*h,z);
      tile.rotation.set(-diffY*.095*h,diffX*.105*h,Math.sin(elapsed*.2+i*.2)*.011);
      tile.scale.setScalar(1-h*.055);
      tile.updateMatrix();tiles.setMatrixAt(i,tile.matrix);
      rim.position.set(tile.position.x,tile.position.y,z+.27);
      rim.rotation.copy(tile.rotation);rim.scale.copy(tile.scale);
      rim.updateMatrix();edges.setMatrixAt(i,rim.matrix);
    }
    tiles.instanceMatrix.needsUpdate=true;
    edges.instanceMatrix.needsUpdate=true;
    group.rotation.y=lerp(group.rotation.y,(smooth.x-.5)*.025,clamp(dt*2,0,1));
    group.rotation.x=lerp(group.rotation.x,-(smooth.y-.5)*.022,clamp(dt*2,0,1));
    lights.fill.position.set(focusX*.72,focusY*.72,5);
    lights.fill.intensity=17+energy*31;
    rimMaterial.opacity=.13+energy*.20;
    renderer.render(scene,camera);
    if(Math.round(now/110)!==Math.round((now-dt*1000)/110))setStatus();
    raf=requestAnimationFrame(frame);
  }
  function setVisible(v){
    visible=v;
    if(v){if(!loading&&!initialized)initialize();else requestFrame();}
    else if(raf){cancelAnimationFrame(raf);raf=0;last=0;}
  }
  if("IntersectionObserver" in window){
    observer=new IntersectionObserver(es=>es.forEach(e=>setVisible(e.isIntersecting)),{rootMargin:"140px 0px",threshold:0});
    observer.observe(hero);
  }else setVisible(true);
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}
    else requestFrame();
  },{passive:true});
  setStatus();
  return true;
}
if(!setup()){
  const mountObserver=new MutationObserver(()=>{if(setup())mountObserver.disconnect();});
  mountObserver.observe(document.documentElement,{childList:true,subtree:true});
}
})();
