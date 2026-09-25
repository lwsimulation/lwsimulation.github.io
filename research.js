import { createGallery } from './research-gallery.js?v=20260925-3';
const viewport = document.querySelector('#viewport');
const gallery = createGallery();
try {
  const [THREE, { OrbitControls }] = await Promise.all([import('./assets/vendor/three.module.min.js'), import('./assets/vendor/OrbitControls.js')]);
  start(THREE, OrbitControls);
} catch (error) { window.researchFailed?.(); console.error('Research chamber could not start:', error); }

function start(T, OrbitControls) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0xf3f7fb, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  viewport.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(38, 1, 0.1, 70);
  let renderDirty = true;
  const controls = new OrbitControls(camera, viewport);
  controls.addEventListener('change', () => { renderDirty = true; });
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.minDistance = 6;
  controls.maxDistance = 22;
  controls.minPolarAngle = 0.18;
  controls.maxPolarAngle = Math.PI - 0.18;
  controls.target.set(0, -0.1, 0);

  const homeDirection = new T.Vector3(7.2, 4.4, 9.4).normalize();
  function resetView() {
    const distance = Math.max(11.5, 7.4 / camera.aspect);
    camera.position.copy(homeDirection).multiplyScalar(distance);
    controls.target.set(0, -0.1, 0);
    controls.update();
  }

  let initialSize = true, previousFit = 11.5;
  const resize = new ResizeObserver(() => {
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5, Math.sqrt(2600000 / (width * height))));
    renderer.setSize(width, height, false);
    const fit = Math.max(11.5, 7.4 / camera.aspect);
    if (initialSize) { resetView(); initialSize = false; }
    else camera.position.sub(controls.target).multiplyScalar(fit / previousFit).add(controls.target);
    controls.maxDistance = Math.max(22, fit * 1.7);
    previousFit = fit; renderDirty = true; controls.update();
  });
  resize.observe(viewport);

  scene.add(new T.HemisphereLight(0xffffff, 0xb4c4d4, 2.8));
  const key = new T.DirectionalLight(0xffffff, 3.2); key.position.set(5, 8, 6); scene.add(key);
  const rim = new T.DirectionalLight(0xb7d7ef, 1.7); rim.position.set(-5, 2, -4); scene.add(rim);

  const metal = new T.MeshStandardMaterial({ color: 0x6c8eaa, metalness: 0.56, roughness: 0.34 });
  const glass = new T.MeshPhysicalMaterial({ color: 0xb9d6e9, transparent: true, opacity: 0.095, roughness: 0.14, metalness: 0.04, side: T.DoubleSide, depthWrite: false });
  const wire = new T.MeshBasicMaterial({ color: 0x7899b6, transparent: true, opacity: 0.58 });

  function mesh(geometry, material, y = 0, parent = scene) {
    const object = new T.Mesh(geometry, material);
    object.position.y = y;
    parent.add(object);
    return object;
  }
  function ring(radius, y, thickness = 0.022, material = wire, parent = scene) {
    const object = mesh(new T.TorusGeometry(radius, thickness, 8, 96), material, y, parent);
    object.rotation.x = Math.PI / 2;
    return object;
  }
  function disposeObject(object) {
    object.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    });
    if (object.parent) object.parent.remove(object);
  }

  // Chamber shell.
  mesh(new T.CylinderGeometry(2, 2, 3.8, 96, 1, true), glass);
  mesh(new T.CylinderGeometry(2, 0.32, 0.7, 96, 1, true), glass, -2.25);
  mesh(new T.CylinderGeometry(0.29, 0.29, 1.2, 48, 1, true), glass, 2.5);
  mesh(new T.CylinderGeometry(0.32, 0.32, 0.65, 48, 1, true), glass, -2.925);
  for (const y of [-1.9, 1.9]) { ring(2, y, 0.075, metal); ring(2.08, y, 0.018); }
  for (const y of [1.9, 3.1]) ring(0.29, y, 0.035, metal);
  for (const y of [-2.6, -3.25]) ring(0.32, y, 0.035, metal);
  mesh(new T.CylinderGeometry(2, 2, 0.045, 96), glass, 1.9);

  // Morph a qualitative pore pattern; no numeric design presets or performance claims.
  const fields = { thermal:false, structure:false, plasma:false, chemistry:false };
  const strength = { thermal:0, structure:0, plasma:0, chemistry:0 };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let paused = reduced, comparing = false;
  const seeds=[];
  for(const [r,n]of [[.42,8],[.94,14],[1.48,20]])for(let i=0;i<n;i++)seeds.push({r,a:i/n*Math.PI*2});
  const mix=(a,b,t)=>a+(b-a)*t, smooth=x=>x*x*(3-2*x);
  // Shared qualitative cross-field response. The same response drives neutral flow,
  // charged-species transport, reaction conversion and the deposited footprint.
  function response(hole) {
    const {structure:S,thermal:H,plasma:P,chemistry:C}=strength;
    const a=hole.angle;
    const transport=1 + .28*S*H*Math.cos(2*a) + .25*P*H + .13*S*P*Math.sin(3*a) - .10*H*C;
    const spreading=.18*H + .12*S*H + .09*P*H;
    const conversion=T.MathUtils.clamp(.24 + .23*H + .26*P + .22*H*P + .12*S*P*Math.cos(a) + .13*S*C*(.5+.5*Math.sin(3*a)), .12, 1);
    const flux=Math.max(.18,hole.weight*transport*(.65+.6*conversion)*(1+.22*P*C*Math.cos(2*a)));
    return {transport,spreading,conversion,flux};
  }
  function pore(seed){const s=strength.structure,a=seed.a+s*.27*Math.sin(2*seed.a),r=seed.r*(1+s*.10*Math.cos(2*seed.a));return {radius:r,angle:a,x:r*Math.cos(a),z:r*Math.sin(a),size:.066*(1+s*.42*Math.sin(3*seed.a+.8)),weight:1+s*.55*Math.sin(3*seed.a+.8)};}
  const plateMaterial=new T.MeshStandardMaterial({color:0x87a4ba,metalness:.4,roughness:.42,transparent:true,opacity:.68,side:T.DoubleSide});
  let plate=null,holes=[];
  function buildPlate(){holes=seeds.map(pore);const shape=new T.Shape();shape.absarc(0,0,1.84,0,Math.PI*2,false);for(const h of holes){const path=new T.Path();path.absarc(h.x,-h.z,h.size,0,Math.PI*2,true);shape.holes.push(path);}const geometry=new T.ExtrudeGeometry(shape,{depth:.10,bevelEnabled:false,curveSegments:5});geometry.rotateX(-Math.PI/2);if(plate){plate.geometry.dispose();plate.geometry=geometry;}else plate=mesh(geometry,plateMaterial,1.10);}
  ring(1.84,1.15,.04,metal);
  const waferMaterial=new T.MeshStandardMaterial({color:0x53748f,metalness:.48,roughness:.32});
  mesh(new T.CylinderGeometry(1.35,1.35,.12,80),waferMaterial,-1.05);ring(1.35,-.985,.023,wire);
  for(const angle of [Math.PI*1.15,Math.PI*1.85]){const support=mesh(new T.CylinderGeometry(.045,.045,.75,10),metal,-1.48);support.position.x=1.15*Math.cos(angle);support.position.z=1.15*Math.sin(angle);}
  const floorGrid=new T.PolarGridHelper(2.9,12,4,72,0xb9c8d7,0xd4dee8);floorGrid.position.y=-3.45;scene.add(floorGrid);

  // Separate overlays carry temperature, charge, and species semantics. Flow colors stay speed-only.
  const thermalGroup=new T.Group();scene.add(thermalGroup);
  const heatMaterials=[];
  for(let i=0;i<5;i++){const material=new T.MeshBasicMaterial({color:0xe4a263,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide});heatMaterials.push(material);const heat=mesh(new T.CylinderGeometry(1.18+i*.11,1.06+i*.10,.16,64,1,true),material,-.88+i*.19,thermalGroup);}
  const thermalRing=ring(1.47,-1.035,.055,new T.MeshBasicMaterial({color:0xda985a,transparent:true,opacity:0}),thermalGroup);
  const plasmaGroup=new T.Group();scene.add(plasmaGroup);
  const plasmaMist=new T.MeshBasicMaterial({color:0x9b8ccb,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false});const plasmaVolume=mesh(new T.CylinderGeometry(1.50,1.30,1.52,64,1,true),plasmaMist,.08,plasmaGroup);
  const sheath=ring(1.38,-.73,.035,new T.MeshBasicMaterial({color:0x9981ca,transparent:true,opacity:0}),plasmaGroup);
  const arcs=new T.Group();plasmaGroup.add(arcs);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,r=.38+(i%3)*.4,points=[];for(let j=0;j<=24;j++){const u=j/24;points.push(new T.Vector3(r*Math.cos(a)+.06*Math.sin(u*15+i),.87-u*1.57,r*Math.sin(a)+.05*Math.cos(u*17+i)));}arcs.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0x9e88c7,transparent:true,opacity:0,depthWrite:false})));}
  const charges=new T.InstancedMesh(new T.SphereGeometry(.033,6,5),new T.MeshBasicMaterial({color:0x8c64bd,transparent:true,opacity:0}),100);charges.frustumCulled=false;plasmaGroup.add(charges);
  const chargeTrails=new T.LineSegments(new T.BufferGeometry(),new T.LineBasicMaterial({color:0xb3a2d4,transparent:true,opacity:0}));const chargeTrailArray=new Float32Array(100*6);chargeTrails.geometry.setAttribute('position',new T.BufferAttribute(chargeTrailArray,3));plasmaGroup.add(chargeTrails);
  const species=new T.InstancedMesh(new T.SphereGeometry(.042,6,5),new T.MeshBasicMaterial({transparent:true,opacity:0}),80);species.frustumCulled=false;scene.add(species);
  const deposits=new T.InstancedMesh(new T.SphereGeometry(.055,6,5),new T.MeshBasicMaterial({color:0xc48d4c,transparent:true,opacity:0}),110);deposits.frustumCulled=false;scene.add(deposits);
  const footprintCanvas=document.createElement('canvas');footprintCanvas.width=footprintCanvas.height=256;const footprintCtx=footprintCanvas.getContext('2d'),footprintTexture=new T.CanvasTexture(footprintCanvas);footprintTexture.colorSpace=T.SRGBColorSpace;
  const footprintMaterial=new T.MeshBasicMaterial({map:footprintTexture,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide});const footprint=mesh(new T.CircleGeometry(1.33,80),footprintMaterial,-.982);footprint.rotation.x=-Math.PI/2;
  function drawFootprint(){
    const c=footprintCtx;c.clearRect(0,0,256,256);
    for(let i=0;i<holes.length;i++){
      const h=holes[i],effect=response(h),arrival=sample(.61,h).p;
      const x=128+arrival.x/1.9*108,y=128-arrival.z/1.9*108;
      const size=12+11*(1-strength.structure)+35*effect.spreading;
      const weight=Math.min(.84,(.22+strength.structure*.32)*effect.flux*(1+strength.chemistry*effect.conversion));
      const g=c.createRadialGradient(x,y,0,x,y,size),rgb=strength.chemistry>.05?'199,148,75':'97,155,187';
      g.addColorStop(0,`rgba(${rgb},${weight})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(x-size,y-size,size*2,size*2);
    }footprintTexture.needsUpdate=true;
  }

  const N=150,PARTICLES_PER_PATH=9,paths=[];
  const flowStops=[0x4774b8,0x58a7c8,0x88bfa7,0xe4c273,0xd98967].map(c=>new T.Color(c));
  function speedColor(speed,target){const t=T.MathUtils.clamp((speed-.10)/2.15,0,1)*4,i=Math.min(3,Math.floor(t));return target.copy(flowStops[i]).lerp(flowStops[i+1],t-i);}
  function sample(t,hole){let r,y,speed;const a=hole.angle,h=hole.radius;
    if(t<.14){const u=t/.14;r=.13*h/1.65;y=mix(3.15,2,u);speed=.72;}
    else if(t<.30){const u=(t-.14)/.16;r=mix(.13*h/1.65,h,smooth(u));y=mix(2,1.3,u);speed=mix(.3,.58,u);}
    else if(t<.35){const u=(t-.30)/.05;r=h;y=mix(1.3,1.02,u);speed=mix(.58,1.45,u);}
    else if(t<.64){const u=(t-.35)/.29;r=h+.045*smooth(u);y=mix(1.02,-.65,u);speed=mix(1.45,.48,smooth(u));}
    else if(t<.76){const u=(t-.64)/.12;r=mix(h+.045,1.73,smooth(Math.min(1,u/.58)));y=mix(-.65,-1.5,smooth(u));speed=.48;}
    else if(t<.93){const u=(t-.76)/.17;r=mix(1.73,.16,smooth(u));y=mix(-1.5,-2.65,u);speed=mix(.5,1.25,u);}
    else {const u=(t-.93)/.07;r=.16;y=mix(-2.65,-3.3,u);speed=1.25;}
    const jet=t>.35&&t<.64?Math.sin((t-.35)/.29*Math.PI)**2:0;
    const effect=response(hole);
    r+=jet*(effect.spreading+.07*strength.thermal*Math.sin(a*3+t*20));
    r+=strength.structure*jet*.065*Math.sin(a*2);
    speed*=1+strength.structure*jet*(hole.weight-.7)+strength.thermal*jet*(-.22+.14*Math.cos(a));
    speed*=1+(effect.transport-1)*jet;
    r=Math.min(r,1.93);
    const direction=a+jet*(.11*strength.structure*strength.thermal*Math.sin(2*a)+.08*strength.plasma*strength.thermal*Math.cos(3*a));
    return {p:new T.Vector3(r*Math.cos(direction),y,r*Math.sin(direction)),speed};
  }
  const lineGeometry=new T.BufferGeometry(),linePositions=new Float32Array(seeds.length*N*6),lineColors=new Float32Array(seeds.length*N*6);
  lineGeometry.setAttribute('position',new T.BufferAttribute(linePositions,3));lineGeometry.setAttribute('color',new T.BufferAttribute(lineColors,3));
  const lineMaterial=new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.58,depthWrite:false});scene.add(new T.LineSegments(lineGeometry,lineMaterial));
  const particles=new T.InstancedMesh(new T.SphereGeometry(.031,6,5),new T.MeshBasicMaterial({color:0xffffff}),seeds.length*PARTICLES_PER_PATH);particles.instanceMatrix.setUsage(T.DynamicDrawUsage);particles.frustumCulled=false;scene.add(particles);
  const dummy=new T.Object3D(),color=new T.Color(),particlePoint=new T.Vector3();
  function buildFlow(){paths.length=0;let at=0;for(const hole of holes){const points=[],speeds=[],times=[0];for(let i=0;i<=N;i++){const value=sample(i/N,hole);points.push(value.p);speeds.push(value.speed);if(i)times.push(times[i-1]+value.p.distanceTo(points[i-1])/Math.max(.08,(speeds[i-1]+value.speed)*.5));}paths.push({points,speeds,times,duration:times[N]});for(let i=0;i<N;i++)for(const j of [i,i+1]){linePositions[at]=points[j].x;linePositions[at+1]=points[j].y;linePositions[at+2]=points[j].z;speedColor(speeds[j],color);lineColors[at]=color.r;lineColors[at+1]=color.g;lineColors[at+2]=color.b;at+=3;}}
    lineGeometry.attributes.position.needsUpdate=true;lineGeometry.attributes.color.needsUpdate=true;lineGeometry.computeBoundingSphere();drawFootprint();
    viewport.dataset.pathSignature=paths[10].points[85].toArray().map(n=>n.toFixed(3)).join(',');
    // Useful domain checks are independent of the visual field exaggeration.
    let violations=0;for(const path of paths)for(const p of path.points){const r=Math.hypot(p.x,p.z),bound=p.y>1.9?.29:p.y>=-1.9?2:p.y>=-2.6?.32+(p.y+2.6)/.7*1.68:.32;if(r>bound+.01||(p.y>=-1.11&&p.y<=-.99&&r<1.35))violations++;}viewport.dataset.boundaryViolations=String(violations);
  }
  buildPlate();buildFlow();
  const fieldNames={thermal:['热影响区','#db985b'],structure:['孔口与覆盖重分配','#638fb7'],plasma:['带电粒子 / 鞘层','#9980c5'],chemistry:['活性物种 / 沉积','#bd8c49']};
  function syncUI(){document.querySelectorAll('[data-field]').forEach(b=>b.setAttribute('aria-pressed',String(fields[b.dataset.field])));document.querySelector('#field-key').innerHTML=Object.keys(fields).filter(k=>fields[k]&&!comparing).map(k=>`<span style="--key-color:${fieldNames[k][1]}">${fieldNames[k][0]}</span>`).join('');viewport.dataset.fields=Object.keys(fields).filter(k=>fields[k]).join(',');}
  document.querySelectorAll('[data-field]').forEach(button=>button.addEventListener('click',()=>{fields[button.dataset.field]=!fields[button.dataset.field];syncUI();}));
  const compare=document.querySelector('#compare');
  function comparison(value){comparing=value;compare.setAttribute('aria-pressed',String(value));compare.textContent=value?'基础状态':'对比基础';viewport.dataset.comparing=String(value);syncUI();}
  compare.addEventListener('pointerdown',e=>{compare.setPointerCapture(e.pointerId);comparison(true);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])compare.addEventListener(event,()=>comparison(false));
  compare.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();comparison(true);}});compare.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')comparison(false);});compare.addEventListener('blur',()=>comparison(false));
  document.querySelector('#pause').addEventListener('click',()=>{paused=!paused;updatePause();});
  function updatePause(){const b=document.querySelector('#pause');b.textContent=paused?'继续':'暂停';b.setAttribute('aria-pressed',String(paused));gallery.setPaused(paused);}updatePause();
  document.querySelector('#reset').addEventListener('click',resetView);
  viewport.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key))return;e.preventDefault();const s=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));if(e.key==='ArrowLeft')s.theta-=.12;if(e.key==='ArrowRight')s.theta+=.12;if(e.key==='ArrowUp')s.phi-=.12;if(e.key==='ArrowDown')s.phi+=.12;if(['+','='].includes(e.key))s.radius*=.9;if(e.key==='-')s.radius*=1.1;s.phi=T.MathUtils.clamp(s.phi,.18,Math.PI-.18);s.radius=T.MathUtils.clamp(s.radius,6,22);camera.position.setFromSpherical(s).add(controls.target);controls.update();});
  let time=0,last=performance.now(),running=true,lastBuild=0,lastPlate=-1,transition=false,wasTransition=false,chemAge=0;
  function updateEffects(dt){
    const H=strength.thermal,S=strength.structure,P=strength.plasma,C=strength.chemistry;
    thermalGroup.visible=H>.002;thermalRing.material.opacity=H*.65;
    heatMaterials.forEach((m,i)=>m.opacity=H*(.07+.03*Math.sin(time*1.5-i))*(1+.30*P));
    thermalRing.scale.setScalar(1+.025*Math.sin(time));
    plasmaGroup.visible=P>.002;plasmaMist.opacity=P*(.07+.04*H);plasmaVolume.scale.set(1+H*.06,1,1+H*.06);
    sheath.material.opacity=P*(.48+.1*Math.sin(time*2));sheath.scale.set(1+.07*S,1+.07*S,1);
    arcs.children.forEach((line,i)=>{
      const path=paths[(i*3)%paths.length],positions=line.geometry.attributes.position;
      for(let j=0;j<positions.count;j++){const u=j/(positions.count-1),base=path.points[Math.floor((.36+.27*u)*N)],wiggle=.035*(1+H);
        positions.setXYZ(j,base.x+wiggle*Math.sin(u*15+i+time),base.y,base.z+wiggle*Math.cos(u*17+i+time));
      }positions.needsUpdate=true;line.geometry.computeBoundingSphere();line.material.opacity=P*(.23+.16*Math.sin(time*2+i));
    });
    charges.material.opacity=P;chargeTrails.material.opacity=P*.45;
    for(let i=0;i<100;i++){
      const path=paths[(i*13)%paths.length],effect=response(holes[(i*13)%holes.length]);
      const u=(time*.34*(1+.25*H)*effect.transport+i/100)%1;
      const base=path.points[Math.floor((.36+.27*u)*N)],spread=.025+.04*H;
      dummy.position.set(base.x+spread*Math.sin(time*3+i),base.y,base.z+spread*Math.cos(time*3+i));
      dummy.scale.setScalar(1);dummy.updateMatrix();charges.setMatrixAt(i,dummy.matrix);
      chargeTrailArray.set([dummy.position.x,dummy.position.y,dummy.position.z,dummy.position.x,dummy.position.y+.12,dummy.position.z],i*6);
    }charges.instanceMatrix.needsUpdate=true;chargeTrails.geometry.attributes.position.needsUpdate=true;chargeTrails.geometry.computeBoundingSphere();
    if(!paused)chemAge=fields.chemistry?Math.min(chemAge+dt,12):0;
    species.material.opacity=C*.9;deposits.material.opacity=C*.85;
    for(let i=0;i<80;i++){
      const hi=(i*17)%holes.length,hiPath=paths[hi],effect=response(holes[hi]);
      const u=(time*.25*(.8+.5*effect.conversion)+i/80)%1;
      const t=.44+.20*Math.min(1,u/.72),base=hiPath.points[Math.floor(t*N)];
      let x=base.x,z=base.z,y=base.y;
      if(u>.72){const f=(u-.72)/.28,r=Math.hypot(x,z),factor=Math.min(1,1.26/Math.max(r,.01));x=mix(x,x*factor,f);z=mix(z,z*factor,f);y=mix(y,-.976,f);}
      dummy.position.set(x,y,z);dummy.scale.setScalar(.65+.4*u);dummy.updateMatrix();species.setMatrixAt(i,dummy.matrix);
      const threshold=.84-.57*effect.conversion;color.set(u<threshold?0x8479bb:0xc48d4c);species.setColorAt(i,color);
    }species.instanceMatrix.needsUpdate=true;species.instanceColor.needsUpdate=true;
    for(let i=0;i<110;i++){
      const hi=(i*19)%holes.length,h=holes[hi],effect=response(h),arrival=sample(.61,h).p;
      const jitter=.04+.12*effect.spreading,a=i*2.39996;
      let x=arrival.x*.76+jitter*Math.cos(a),z=arrival.z*.76+jitter*Math.sin(a),r=Math.hypot(x,z);if(r>1.26){x*=1.26/r;z*=1.26/r;}
      const volume=Math.min(1.8,.3+effect.flux*(.3+effect.conversion*.5)*(1+chemAge*.035));
      dummy.position.set(x,-.973,z);dummy.scale.set(volume,.15+volume*.35,volume);dummy.updateMatrix();deposits.setMatrixAt(i,dummy.matrix);
    }deposits.instanceMatrix.needsUpdate=true;
    footprintMaterial.opacity=S*.6+C*.32;
    viewport.dataset.couplingSignature=JSON.stringify(response(holes[10]));
  }
  function frame(now){if(!running)return;requestAnimationFrame(frame);
    const pending=Object.keys(strength).some(k=>strength[k] !== (comparing?0:Number(fields[k])));
    if(document.hidden || (paused&&!renderDirty&&!pending&&!wasTransition)){last=now;return;}
    if(now-last<32&&!renderDirty&&!pending)return;
    const dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden)return;if(!paused)time+=dt;controls.update();
    transition=false;for(const k of Object.keys(strength)){const target=comparing?0:Number(fields[k]),difference=target-strength[k];if(Math.abs(difference)>.001){strength[k]=reduced||paused?target:strength[k]+difference*Math.min(1,dt*6);transition=true;}else strength[k]=target;}
    if((transition||lastBuild===0)&&(now-lastBuild>70||reduced||paused)){const plateStep=Math.round(strength.structure*16);if(plateStep!==lastPlate){buildPlate();lastPlate=plateStep;}else holes=seeds.map(pore);buildFlow();lastBuild=now;}
    if(!transition&&wasTransition){buildPlate();buildFlow();}wasTransition=transition;
    let instance=0;dummy.scale.setScalar(1);for(const path of paths)for(let j=0;j<PARTICLES_PER_PATH;j++){const travel=(time+j/PARTICLES_PER_PATH*path.duration)%path.duration;let lo=0,hi=N;while(hi-lo>1){const mid=(lo+hi)>>1;if(path.times[mid]>travel)hi=mid;else lo=mid;}const f=(travel-path.times[lo])/Math.max(1e-6,path.times[hi]-path.times[lo]);particlePoint.copy(path.points[lo]).lerp(path.points[hi],f);dummy.position.copy(particlePoint);dummy.updateMatrix();particles.setMatrixAt(instance,dummy.matrix);particles.setColorAt(instance,speedColor(mix(path.speeds[lo],path.speeds[hi],f),color));instance++;}particles.instanceMatrix.needsUpdate=true;particles.instanceColor.needsUpdate=true;
    updateEffects(dt);gallery.update(camera,T,comparing?{}:fields);renderer.render(scene,camera);renderDirty=false;
    viewport.dataset.time=time.toFixed(3);viewport.dataset.camera=camera.position.toArray().map(n=>n.toFixed(3)).join(',');viewport.dataset.strength=JSON.stringify(Object.fromEntries(Object.entries(strength).map(([k,v])=>[k,+v.toFixed(3)])));
  }
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();running=false;window.researchFailed?.();});
  syncUI();viewport.dataset.ready='true';window.researchReady?.();resetView();requestAnimationFrame(frame);
}
