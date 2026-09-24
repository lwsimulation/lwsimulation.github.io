const viewport = document.querySelector('#viewport');
const loading = document.querySelector('#loading');
const errorPanel = document.querySelector('#render-error');
document.querySelector('#reload').addEventListener('click', () => location.reload());

// Dynamic imports keep a useful fallback visible even when a module fails to load.
try {
  const THREE = await import('three');
  const { OrbitControls } = await import('./assets/vendor/OrbitControls.js');
  start(THREE, OrbitControls);
} catch (error) {
  loading.hidden = true;
  errorPanel.hidden = false;
  document.querySelectorAll('.controls button,.controls input,.view-actions button').forEach(el => el.disabled = true);
  console.error('Deposition chamber could not start:', error);
}

function start(T, OrbitControls) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0x09131e, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  viewport.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(40, 1, 0.1, 70);
  const controls = new OrbitControls(camera, viewport);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 6;
  controls.maxDistance = 24;
  controls.minPolarAngle = 0.18;
  controls.maxPolarAngle = Math.PI - 0.18;
  controls.target.set(0, 0, 0);
  const homeDirection = new T.Vector3(7, 4, 9).normalize();
  function resetView() {
    camera.position.copy(homeDirection).multiplyScalar(Math.max(11.8, 8.8 / camera.aspect));
    controls.target.set(0, 0, 0);
    controls.update();
  }
  const resize = new ResizeObserver(() => {
    const width = viewport.clientWidth, height = viewport.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    resetView();
  });
  resize.observe(viewport);
  scene.add(new T.HemisphereLight(0xb8e8ff, 0x1a2636, 2.5));
  const key = new T.DirectionalLight(0xe5f5ff, 3); key.position.set(5, 7, 5); scene.add(key);
  const rim = new T.DirectionalLight(0x5adbcf, 2); rim.position.set(-5, 1, -4); scene.add(rim);
  const metal = new T.MeshStandardMaterial({ color: 0x598296, metalness: 0.65, roughness: 0.33 });
  const glass = new T.MeshPhysicalMaterial({ color: 0x8bc7db, transparent: true, opacity: 0.075, roughness: 0.15, metalness: 0.1, side: T.DoubleSide, depthWrite: false });
  const wire = new T.MeshBasicMaterial({ color: 0x7fb4c7, transparent: true, opacity: 0.6 });
  function mesh(geometry, material, y = 0, parent = scene) {
    const object = new T.Mesh(geometry, material); object.position.y = y; parent.add(object); return object;
  }
  function ring(radius, y, thickness = 0.022, material = wire, parent = scene) {
    const object = mesh(new T.TorusGeometry(radius, thickness, 8, 96), material, y, parent);
    object.rotation.x = Math.PI / 2; return object;
  }
  // Transparent shell, inlet, conical collection volume, and exhaust.
  mesh(new T.CylinderGeometry(2, 2, 3.8, 96, 1, true), glass);
  mesh(new T.CylinderGeometry(2, 0.32, 0.7, 96, 1, true), glass, -2.25);
  mesh(new T.CylinderGeometry(0.29, 0.29, 1.2, 48, 1, true), glass, 2.5);
  mesh(new T.CylinderGeometry(0.32, 0.32, 0.65, 48, 1, true), glass, -2.925);
  for (const y of [-1.9, 1.9]) {
    ring(2, y, 0.075, metal); ring(2.08, y, 0.018);
  }
  for (const y of [1.9, 3.1]) ring(0.29, y, 0.035, metal);
  for (const y of [-2.6, -3.25]) ring(0.32, y, 0.035, metal);
  mesh(new T.CylinderGeometry(2, 2, 0.045, 96), glass, 1.9);
  // Real holes in the showerhead geometry, aligned with the streamline seeds.
  const holes = [];
  for (const [radius, count] of [[0.42, 8], [0.94, 14], [1.48, 20]]) {
    for (let i = 0; i < count; i++) {
      const angle = i / count * Math.PI * 2;
      holes.push({ radius, angle, x: radius * Math.cos(angle), z: radius * Math.sin(angle) });
    }
  }
  const plateShape = new T.Shape(); plateShape.absarc(0, 0, 1.84, 0, Math.PI * 2, false);
  for (const hole of holes) {
    const path = new T.Path(); path.absarc(hole.x, -hole.z, 0.072, 0, Math.PI * 2, true); plateShape.holes.push(path);
  }
  const plateGeometry = new T.ExtrudeGeometry(plateShape, { depth: 0.10, bevelEnabled: false, curveSegments: 8 });
  plateGeometry.rotateX(-Math.PI / 2);
  const plateMaterial = new T.MeshStandardMaterial({ color: 0x7299ab, metalness: 0.5, roughness: 0.4, transparent: true, opacity: 0.72 });
  mesh(plateGeometry, plateMaterial, 1.1); ring(1.84, 1.15, 0.04, metal);
  const wafer = new T.Group(); wafer.position.y = -1.05; scene.add(wafer);
  const waferMaterial = new T.MeshStandardMaterial({ color: 0x294856, metalness: 0.65, roughness: 0.26, emissive: 0x000000 });
  mesh(new T.CylinderGeometry(1.35, 1.35, 0.12, 96), waferMaterial, 0, wafer);
  ring(1.35, 0.06, 0.025, wire, wafer);
  const traceMaterial = new T.MeshBasicMaterial({ color: 0x70d9d3, transparent: true, opacity: 0.24 });
  for (const radius of [0.45, 0.9, 1.21]) ring(radius, 0.065, 0.006, traceMaterial, wafer);
  for (let i = 0; i < 12; i++) {
    const tick = mesh(new T.BoxGeometry(0.16, 0.005, 0.012), traceMaterial, 0.066, wafer);
    const a = i * Math.PI / 6; tick.position.x = 1.15 * Math.cos(a); tick.position.z = 1.15 * Math.sin(a); tick.rotation.y = -a;
  }
  // Two thin rear supports leave the centre exhaust clear.
  for (const angle of [Math.PI * 1.15, Math.PI * 1.85]) {
    const support = mesh(new T.CylinderGeometry(0.045, 0.045, 0.75, 12), metal, -1.48);
    support.position.x = 1.15 * Math.cos(angle); support.position.z = 1.15 * Math.sin(angle);
  }
  const thermalHalo = ring(1.48, -1.04, 0.06, new T.MeshBasicMaterial({ color: 0xff9952, transparent: true, opacity: 0.55 }));
  thermalHalo.visible = false;
  const electricGroup = new T.Group(); scene.add(electricGroup); electricGroup.visible = false;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    electricGroup.add(new T.ArrowHelper(new T.Vector3(0, -1, 0), new T.Vector3(1.75 * Math.cos(a), 0.65, 1.75 * Math.sin(a)), 1.1, 0xb3a0ff, 0.12, 0.065));
  }
  const floorGrid = new T.PolarGridHelper(2.9, 12, 4, 96, 0x1b3846, 0x18313e); floorGrid.position.y = -3.45; scene.add(floorGrid);

  // Keep the same field buttons beside the model on touch-size screens.
  const mobileLayout = matchMedia('(max-width: 850px)');
  const fieldButtons = document.querySelector('.field-buttons');
  function positionFields() {
    if (mobileLayout.matches) document.querySelector('.mobile-fields').append(fieldButtons);
    else document.querySelector('.control-note').after(fieldButtons);
  }
  mobileLayout.addEventListener('change', positionFields); positionFields();

  const fields = { thermal: false, rotation: false, electric: false };
  let rate = 1, paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = 250, PARTICLES_PER_PATH = 12;
  const smooth = x => x * x * (3 - 2 * x);
  const mix = (a, b, t) => a + (b - a) * t;
  const stops = [0x3c7ee8, 0x33ccd9, 0xb2e278, 0xffad51, 0xfa6558].map(c => new T.Color(c));
  function speedColor(speed, target = new T.Color()) {
    const t = T.MathUtils.clamp((speed - 0.12) / 2.5, 0, 1) * 4;
    const i = Math.min(3, Math.floor(t)); return target.copy(stops[i]).lerp(stops[i + 1], t - i);
  }
  // A bounded, piecewise parametric flow model, NOT a numerical PDE solver.
  // The plate interval is fixed at the physical hole coordinates for all fields.
  // Near the wafer the paths turn outwards before crossing its solid surface.
  function sample(t, hole) {
    let r, y, speed;
    const a = hole.angle, h = hole.radius;
    if (t < 0.14) {
      const u = t / 0.14; r = 0.13 * h / 1.48; y = mix(3.15, 2, u); speed = 0.72;
    } else if (t < 0.30) {
      const u = (t - 0.14) / 0.16; r = mix(0.13 * h / 1.48, h, smooth(u)); y = mix(2, 1.3, u); speed = mix(0.28, 0.6, u);
    } else if (t < 0.35) {
      const u = (t - 0.30) / 0.05; r = h; y = mix(1.3, 1.02, u); speed = mix(0.65, 1.5, u);
    } else if (t < 0.64) {
      const u = (t - 0.35) / 0.29; r = h + 0.045 * smooth(u); y = mix(1.02, -0.65, u); speed = mix(1.5, 0.48, smooth(u));
    } else if (t < 0.76) {
      const u = (t - 0.64) / 0.12; r = mix(h + 0.045, 1.65, smooth(Math.min(1, u / 0.62))); y = mix(-0.65, -1.5, smooth(u)); speed = 0.48;
    } else if (t < 0.93) {
      const u = (t - 0.76) / 0.17; r = mix(1.65, 0.16, smooth(u)); y = mix(-1.5, -2.65, u); speed = mix(0.5, 1.3, u);
    } else {
      const u = (t - 0.93) / 0.07; r = 0.16; y = mix(-2.65, -3.3, u); speed = 1.3;
    }
    const jet = t > 0.35 && t < 0.64 ? Math.sin((t - 0.35) / 0.29 * Math.PI) ** 2 : 0;
    const chamber = t > 0.35 && t < 0.93 ? Math.sin((t - 0.35) / 0.58 * Math.PI) ** 2 : 0;
    if (fields.thermal) { r += jet * (0.16 + 0.06 * Math.sin(3 * a + t * 25)); speed *= 1 - 0.22 * jet + 0.1 * chamber; }
    let angle = a;
    if (fields.rotation) { angle += 2.4 * chamber * (0.6 + h * 0.2); speed *= 1 + 0.30 * chamber; }
    if (fields.electric) { r -= 0.14 * jet; speed *= 1 + 0.48 * jet; }
    return { p: new T.Vector3(r * Math.cos(angle), y, r * Math.sin(angle)), speed: speed * rate };
  }
  const paths = [];
  let streamlines;
  const particleCount = holes.length * PARTICLES_PER_PATH;
  const particles = new T.InstancedMesh(new T.SphereGeometry(0.028, 6, 5), new T.MeshBasicMaterial({ color: 0xffffff }), particleCount);
  particles.instanceMatrix.setUsage(T.DynamicDrawUsage); particles.frustumCulled = false; scene.add(particles);
  const dummy = new T.Object3D(), color = new T.Color();
  function rebuild() {
    paths.length = 0;
    const positions = [], colors = [];
    for (const hole of holes) {
      const points = [], speeds = [], times = [0];
      for (let i = 0; i <= N; i++) {
        const value = sample(i / N, hole); points.push(value.p); speeds.push(value.speed);
        if (i) times.push(times[i - 1] + value.p.distanceTo(points[i - 1]) / ((speeds[i - 1] + value.speed) * 0.5));
      }
      paths.push({ points, speeds, times, duration: times[N] });
      for (let i = 0; i < N; i++) for (const j of [i, i + 1]) {
        positions.push(...points[j]); speedColor(speeds[j], color); colors.push(color.r, color.g, color.b);
      }
    }
    if (streamlines) { scene.remove(streamlines); streamlines.geometry.dispose(); streamlines.material.dispose(); }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    streamlines = new T.LineSegments(geometry, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.40, depthWrite: false })); scene.add(streamlines);
    thermalHalo.visible = fields.thermal; electricGroup.visible = fields.electric;
    waferMaterial.emissive.set(fields.thermal ? 0x612511 : 0x000000);
    // A small read-only diagnostic supports geometry and interaction verification.
    viewport.dataset.fields = Object.keys(fields).filter(k => fields[k]).join(',');
    viewport.dataset.flowRate = String(rate);
    viewport.dataset.pathSignature = paths[10].points[140].toArray().map(n => n.toFixed(4)).join(',');
  }
  rebuild();
  const descriptions = {
    thermal: '温度场使射流展宽并出现局部扰动，改变近基片区域的相对速度。',
    rotation: '旋转基片带来切向拖曳，流线在下腔形成螺旋。',
    electric: '等离子体的有效电场作用使射流收束，并提高局部相对速度。'
  };
  document.querySelectorAll('[data-field]').forEach(button => button.addEventListener('click', () => {
    const name = button.dataset.field; fields[name] = !fields[name];
    button.setAttribute('aria-pressed', String(fields[name]));
    button.querySelector('.toggle-mark').textContent = fields[name] ? '−' : '+';
    const active = Object.keys(fields).filter(k => fields[k]);
    document.querySelector('#field-count').textContent = `${active.length} / 3`;
    document.querySelector('#field-description').textContent = active.length ? active.map(k => descriptions[k]).join('') : '基础压差驱动：气体自顶部进入，经喷淋板分流，加速成束，绕过基片后从底部排出。';
    rebuild();
  }));
  document.querySelector('#flow-rate').addEventListener('input', event => {
    rate = Number(event.target.value); document.querySelector('#flow-value').textContent = `${rate.toFixed(1)}×`; rebuild();
  });
  const pauseButton = document.querySelector('#pause');
  function updatePause() { pauseButton.textContent = paused ? '继续流动' : '暂停流动'; pauseButton.setAttribute('aria-pressed', String(paused)); document.querySelector('#flow-status').textContent = paused ? '流动已暂停' : '流动演示'; }
  pauseButton.addEventListener('click', () => { paused = !paused; updatePause(); }); updatePause();
  document.querySelector('#reset').addEventListener('click', resetView);
  viewport.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-'].includes(event.key)) return;
    event.preventDefault();
    const spherical = new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if (event.key === 'ArrowLeft') spherical.theta -= 0.12;
    if (event.key === 'ArrowRight') spherical.theta += 0.12;
    if (event.key === 'ArrowUp') spherical.phi -= 0.12;
    if (event.key === 'ArrowDown') spherical.phi += 0.12;
    if (['+', '='].includes(event.key)) spherical.radius *= 0.9;
    if (event.key === '-') spherical.radius *= 1.1;
    spherical.phi = T.MathUtils.clamp(spherical.phi, controls.minPolarAngle, controls.maxPolarAngle);
    spherical.radius = T.MathUtils.clamp(spherical.radius, controls.minDistance, controls.maxDistance);
    camera.position.setFromSpherical(spherical).add(controls.target); controls.update();
  });
  const labels = [
    ['inlet', new T.Vector3(0.4, 2.95, 0)], ['shower', new T.Vector3(1.95, 1.15, 0)],
    ['wafer', new T.Vector3(1.48, -1.05, 0)], ['outlet', new T.Vector3(0.45, -3.05, 0)]
  ].map(([name, point]) => ({ element: document.querySelector(`[data-label="${name}"]`), point }));
  let time = 0, last = performance.now(), running = true;
  const projected = new T.Vector3(), particlePoint = new T.Vector3();
  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (!paused && !document.hidden) { time += dt; if (fields.rotation) wafer.rotation.y += dt * 0.7; }
    controls.update();
    let instance = 0;
    for (const path of paths) {
      for (let j = 0; j < PARTICLES_PER_PATH; j++) {
        const travel = (time + j / PARTICLES_PER_PATH * path.duration) % path.duration;
        let lo = 0, hi = N;
        while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (path.times[mid] > travel) hi = mid; else lo = mid; }
        const fraction = (travel - path.times[lo]) / (path.times[hi] - path.times[lo]);
        particlePoint.copy(path.points[lo]).lerp(path.points[hi], fraction);
        dummy.position.copy(particlePoint); dummy.updateMatrix(); particles.setMatrixAt(instance, dummy.matrix);
        particles.setColorAt(instance, speedColor(mix(path.speeds[lo], path.speeds[hi], fraction), color)); instance++;
      }
    }
    particles.instanceMatrix.needsUpdate = true; particles.instanceColor.needsUpdate = true;
    for (const label of labels) {
      projected.copy(label.point).project(camera);
      const x = (projected.x * 0.5 + 0.5) * viewport.clientWidth + 8;
      const y = (-projected.y * 0.5 + 0.5) * viewport.clientHeight - 12;
      label.element.style.transform = `translate(${Math.max(5, Math.min(viewport.clientWidth - label.element.offsetWidth - 5, x))}px,${y}px)`;
      label.element.style.visibility = projected.z < 1 && y > 0 && y < viewport.clientHeight - 40 ? 'visible' : 'hidden';
    }
    renderer.render(scene, camera);
    viewport.dataset.camera = camera.position.toArray().map(n => n.toFixed(3)).join(',');
    viewport.dataset.time = time.toFixed(3);
    requestAnimationFrame(frame);
  }
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); running = false; errorPanel.hidden = false;
  });
  loading.hidden = true;
  viewport.dataset.ready = 'true';
  resetView(); requestAnimationFrame(frame);
}
