const viewport = document.querySelector('#viewport');
const loading = document.querySelector('#loading');
const errorPanel = document.querySelector('#render-error');
document.querySelector('#reload').addEventListener('click', () => location.reload());

try {
  const THREE = await import('three');
  const { OrbitControls } = await import('./assets/vendor/OrbitControls.js');
  start(THREE, OrbitControls);
} catch (error) {
  loading.hidden = true;
  errorPanel.hidden = false;
  document.querySelectorAll('.field-dock button,.view-actions button').forEach(el => el.disabled = true);
  console.error('Research chamber could not start:', error);
}

function start(T, OrbitControls) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.setClearColor(0xf3f7fb, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  viewport.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(38, 1, 0.1, 70);
  const controls = new OrbitControls(camera, viewport);
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
    const distance = camera.aspect < 1 ? 13.6 : camera.aspect < 1.45 ? 12.4 : 11.5;
    camera.position.copy(homeDirection).multiplyScalar(distance);
    controls.target.set(0, -0.1, 0);
    controls.update();
  }

  const resize = new ResizeObserver(() => {
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
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

  // Fixed showerhead geometry: 42 pores. Structure mode highlights their transport influence rather than changing the design itself.
  const holes = [];
  for (const [radius, count] of [[0.42, 8], [0.94, 14], [1.48, 20]]) {
    for (let i = 0; i < count; i++) {
      const angle = i / count * Math.PI * 2;
      holes.push({ radius, angle, x: radius * Math.cos(angle), z: radius * Math.sin(angle) });
    }
  }
  const plateShape = new T.Shape();
  plateShape.absarc(0, 0, 1.84, 0, Math.PI * 2, false);
  for (const hole of holes) {
    const path = new T.Path();
    path.absarc(hole.x, -hole.z, 0.066, 0, Math.PI * 2, true);
    plateShape.holes.push(path);
  }
  const plateGeometry = new T.ExtrudeGeometry(plateShape, { depth: 0.10, bevelEnabled: false, curveSegments: 7 });
  plateGeometry.rotateX(-Math.PI / 2);
  const plateMaterial = new T.MeshStandardMaterial({ color: 0x7898b2, metalness: 0.48, roughness: 0.40, transparent: true, opacity: 0.76 });
  mesh(plateGeometry, plateMaterial, 1.10);
  ring(1.84, 1.15, 0.04, metal);

  // Pore markers used only when the structure field is switched on.
  const poreGroup = new T.Group();
  scene.add(poreGroup);
  const poreMaterial = new T.MeshBasicMaterial({ color: 0x4f81b2, transparent: true, opacity: 0.82, depthWrite: false });
  for (const hole of holes) {
    const glow = new T.Mesh(new T.TorusGeometry(0.081, 0.009, 5, 18), poreMaterial);
    glow.position.set(hole.x, 1.165, hole.z);
    glow.rotation.x = Math.PI / 2;
    poreGroup.add(glow);
  }
  poreGroup.visible = false;

  // Substrate.
  const wafer = new T.Group(); wafer.position.y = -1.05; scene.add(wafer);
  const waferMaterial = new T.MeshStandardMaterial({ color: 0x4b6d8b, metalness: 0.55, roughness: 0.27, emissive: 0x000000 });
  mesh(new T.CylinderGeometry(1.35, 1.35, 0.12, 96), waferMaterial, 0, wafer);
  ring(1.35, 0.06, 0.025, wire, wafer);
  const traceMaterial = new T.MeshBasicMaterial({ color: 0x6c9abf, transparent: true, opacity: 0.24 });
  for (const radius of [0.45, 0.9, 1.21]) ring(radius, 0.065, 0.006, traceMaterial, wafer);
  for (const angle of [Math.PI * 1.15, Math.PI * 1.85]) {
    const support = mesh(new T.CylinderGeometry(0.045, 0.045, 0.75, 12), metal, -1.48);
    support.position.x = 1.15 * Math.cos(angle);
    support.position.z = 1.15 * Math.sin(angle);
  }

  // Temperature field: restrained near-wall heat signature.
  const thermalMaterial = new T.MeshBasicMaterial({ color: 0xd18047, transparent: true, opacity: 0.44, depthWrite: false });
  const thermalHalo = ring(1.48, -1.04, 0.055, thermalMaterial);
  const thermalHalo2 = ring(1.10, -0.92, 0.018, new T.MeshBasicMaterial({ color: 0xe5a66d, transparent: true, opacity: 0.28, depthWrite: false }));
  thermalHalo.visible = thermalHalo2.visible = false;

  // Plasma field: field lines only. It does not directly force the neutral-gas streamlines in this concept model.
  const plasmaGroup = new T.Group(); scene.add(plasmaGroup); plasmaGroup.visible = false;
  const plasmaLineMaterial = new T.LineBasicMaterial({ color: 0x7569b4, transparent: true, opacity: 0.42, depthWrite: false });
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2;
    const r = 0.45 + (i % 3) * 0.42;
    const points = [new T.Vector3(r * Math.cos(a), 0.62, r * Math.sin(a)), new T.Vector3(r * 0.82 * Math.cos(a), -0.72, r * 0.82 * Math.sin(a))];
    const geometry = new T.BufferGeometry().setFromPoints(points);
    plasmaGroup.add(new T.Line(geometry, plasmaLineMaterial));
  }
  const plasmaRing = ring(1.48, -0.72, 0.025, new T.MeshBasicMaterial({ color: 0x7569b4, transparent: true, opacity: 0.30, depthWrite: false }), plasmaGroup);
  plasmaRing.rotation.x = Math.PI / 2;

  // Chemical-reaction field: reaction zone and species markers above the substrate.
  const chemistryGroup = new T.Group(); scene.add(chemistryGroup); chemistryGroup.visible = false;
  const reactionMaterial = new T.MeshBasicMaterial({ color: 0xb88748, transparent: true, opacity: 0.28, depthWrite: false, side: T.DoubleSide });
  mesh(new T.CylinderGeometry(1.42, 1.20, 0.48, 72, 1, true), reactionMaterial, -0.72, chemistryGroup);
  ring(1.34, -0.92, 0.035, new T.MeshBasicMaterial({ color: 0xc7965a, transparent: true, opacity: 0.45, depthWrite: false }), chemistryGroup);
  const reactionPositions = [];
  for (let i = 0; i < 150; i++) {
    const a = i * 2.399963229728653;
    const f = ((i * 37) % 149) / 149;
    const r = 0.16 + 1.15 * Math.sqrt(f);
    const y = -0.92 + 0.45 * (((i * 53) % 151) / 151);
    reactionPositions.push(r * Math.cos(a), y, r * Math.sin(a));
  }
  const reactionGeometry = new T.BufferGeometry();
  reactionGeometry.setAttribute('position', new T.Float32BufferAttribute(reactionPositions, 3));
  const reactionPointsMaterial = new T.PointsMaterial({ color: 0xc99454, size: 0.055, transparent: true, opacity: 0.55, depthWrite: false });
  const reactionPoints = new T.Points(reactionGeometry, reactionPointsMaterial);
  chemistryGroup.add(reactionPoints);

  const floorGrid = new T.PolarGridHelper(2.9, 12, 4, 96, 0xb9c8d7, 0xd4dee8); floorGrid.position.y = -3.45; scene.add(floorGrid);

  const fields = { thermal: false, structure: false, plasma: false, chemistry: false };
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = 180;
  const PARTICLES_PER_PATH = 6;
  const smooth = x => x * x * (3 - 2 * x);
  const mix = (a, b, t) => a + (b - a) * t;
  const flowStops = [0x4774b8, 0x58a7c8, 0x88bfa7, 0xe4c273, 0xd98967].map(c => new T.Color(c));
  const chemistryColor = new T.Color(0xc58b4a);

  function speedColor(speed, target = new T.Color()) {
    const t = T.MathUtils.clamp((speed - 0.10) / 2.15, 0, 1) * 4;
    const i = Math.min(3, Math.floor(t));
    return target.copy(flowStops[i]).lerp(flowStops[i + 1], t - i);
  }

  function sample(t, hole) {
    let r, y, speed;
    const a = hole.angle, h = hole.radius;
    if (t < 0.14) {
      const u = t / 0.14; r = 0.13 * h / 1.48; y = mix(3.15, 2.0, u); speed = 0.72;
    } else if (t < 0.30) {
      const u = (t - 0.14) / 0.16; r = mix(0.13 * h / 1.48, h, smooth(u)); y = mix(2.0, 1.30, u); speed = mix(0.30, 0.58, u);
    } else if (t < 0.35) {
      const u = (t - 0.30) / 0.05; r = h; y = mix(1.30, 1.02, u); speed = mix(0.58, 1.45, u);
    } else if (t < 0.64) {
      const u = (t - 0.35) / 0.29; r = h + 0.045 * smooth(u); y = mix(1.02, -0.65, u); speed = mix(1.45, 0.48, smooth(u));
    } else if (t < 0.76) {
      const u = (t - 0.64) / 0.12; r = mix(h + 0.045, 1.65, smooth(Math.min(1, u / 0.62))); y = mix(-0.65, -1.50, smooth(u)); speed = 0.48;
    } else if (t < 0.93) {
      const u = (t - 0.76) / 0.17; r = mix(1.65, 0.16, smooth(u)); y = mix(-1.50, -2.65, u); speed = mix(0.50, 1.25, u);
    } else {
      const u = (t - 0.93) / 0.07; r = 0.16; y = mix(-2.65, -3.30, u); speed = 1.25;
    }

    const jet = t > 0.35 && t < 0.64 ? Math.sin((t - 0.35) / 0.29 * Math.PI) ** 2 : 0;
    const nearWafer = Math.exp(-Math.pow((y + 0.72) / 0.48, 2));

    if (fields.structure) {
      // Qualitative visualization of pore-driven discrete jets: stronger local acceleration and less immediate smoothing below each pore.
      const radialWeight = 0.82 + 0.18 * (h / 1.48);
      speed *= 1 + 0.24 * jet * radialWeight;
      r += 0.055 * jet * Math.sin(a * 3 + h * 2.2);
    }
    if (fields.thermal) {
      r += jet * (0.13 + 0.04 * Math.sin(3 * a + t * 20));
      speed *= 1 - 0.15 * jet + 0.05 * nearWafer;
    }

    const reaction = fields.chemistry ? nearWafer * (t > 0.50 && t < 0.82 ? 1 : 0) : 0;
    return { p: new T.Vector3(r * Math.cos(a), y, r * Math.sin(a)), speed, reaction };
  }

  const paths = [];
  let streamlines = null;
  let particles = null;
  const dummy = new T.Object3D();
  const color = new T.Color();

  function buildFlow() {
    paths.length = 0;
    const positions = [], colors = [];

    for (const hole of holes) {
      const points = [], speeds = [], reactions = [], times = [0];
      for (let i = 0; i <= N; i++) {
        const value = sample(i / N, hole);
        points.push(value.p); speeds.push(value.speed); reactions.push(value.reaction);
        if (i) times.push(times[i - 1] + value.p.distanceTo(points[i - 1]) / Math.max(0.08, (speeds[i - 1] + value.speed) * 0.5));
      }
      paths.push({ points, speeds, reactions, times, duration: times[N] });
      for (let i = 0; i < N; i++) {
        for (const j of [i, i + 1]) {
          positions.push(...points[j]);
          speedColor(speeds[j], color);
          if (fields.chemistry && reactions[j] > 0) color.lerp(chemistryColor, reactions[j] * 0.72);
          colors.push(color.r, color.g, color.b);
        }
      }
    }

    if (streamlines) disposeObject(streamlines);
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    streamlines = new T.LineSegments(geometry, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: fields.structure ? 0.58 : 0.42, depthWrite: false }));
    scene.add(streamlines);

    if (particles) disposeObject(particles);
    particles = new T.InstancedMesh(new T.SphereGeometry(0.027, 6, 5), new T.MeshBasicMaterial({ color: 0xffffff }), holes.length * PARTICLES_PER_PATH);
    particles.instanceMatrix.setUsage(T.DynamicDrawUsage);
    particles.frustumCulled = false;
    scene.add(particles);

    poreGroup.visible = fields.structure;
    thermalHalo.visible = thermalHalo2.visible = fields.thermal;
    plasmaGroup.visible = fields.plasma;
    chemistryGroup.visible = fields.chemistry;
    waferMaterial.emissive.set(fields.thermal ? 0x2f1609 : fields.chemistry ? 0x24170a : 0x000000);
    reactionPointsMaterial.opacity = fields.plasma && fields.chemistry ? 0.78 : 0.55;
    reactionMaterial.opacity = fields.plasma && fields.chemistry ? 0.38 : 0.28;
    viewport.dataset.fields = Object.keys(fields).filter(k => fields[k]).join(',');
  }
  buildFlow();

  document.querySelectorAll('[data-field]').forEach(button => {
    button.addEventListener('click', () => {
      const name = button.dataset.field;
      fields[name] = !fields[name];
      button.setAttribute('aria-pressed', String(fields[name]));
      buildFlow();
    });
  });

  const pauseButton = document.querySelector('#pause');
  function updatePause() {
    pauseButton.textContent = paused ? '继续' : '暂停';
    pauseButton.setAttribute('aria-pressed', String(paused));
  }
  pauseButton.addEventListener('click', () => { paused = !paused; updatePause(); });
  updatePause();
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
    camera.position.setFromSpherical(spherical).add(controls.target);
    controls.update();
  });

  let time = 0;
  let last = performance.now();
  let running = true;
  const particlePoint = new T.Vector3();

  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!paused && !document.hidden) time += dt;
    controls.update();

    let instance = 0;
    for (const path of paths) {
      for (let j = 0; j < PARTICLES_PER_PATH; j++) {
        const travel = (time + j / PARTICLES_PER_PATH * path.duration) % path.duration;
        let lo = 0, hi = N;
        while (hi - lo > 1) {
          const mid = (lo + hi) >> 1;
          if (path.times[mid] > travel) hi = mid; else lo = mid;
        }
        const denominator = Math.max(1e-6, path.times[hi] - path.times[lo]);
        const fraction = (travel - path.times[lo]) / denominator;
        particlePoint.copy(path.points[lo]).lerp(path.points[hi], fraction);
        dummy.position.copy(particlePoint);
        dummy.updateMatrix();
        particles.setMatrixAt(instance, dummy.matrix);

        const speed = mix(path.speeds[lo], path.speeds[hi], fraction);
        const reaction = mix(path.reactions[lo], path.reactions[hi], fraction);
        speedColor(speed, color);
        if (fields.chemistry && reaction > 0) color.lerp(chemistryColor, reaction * 0.86);
        particles.setColorAt(instance, color);
        instance++;
      }
    }
    particles.instanceMatrix.needsUpdate = true;
    if (particles.instanceColor) particles.instanceColor.needsUpdate = true;

    if (fields.chemistry) {
      reactionPoints.rotation.y += dt * 0.08;
      const pulse = 0.46 + 0.12 * Math.sin(time * 1.8);
      reactionPointsMaterial.opacity = (fields.plasma ? 0.72 : 0.52) + 0.08 * Math.sin(time * 1.6);
      reactionMaterial.opacity = pulse * (fields.plasma ? 0.75 : 0.55);
    }
    if (fields.plasma) plasmaLineMaterial.opacity = 0.34 + 0.10 * Math.sin(time * 1.4);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    running = false;
    errorPanel.hidden = false;
  });

  loading.hidden = true;
  viewport.dataset.ready = 'true';
  resetView();
  requestAnimationFrame(frame);
}
