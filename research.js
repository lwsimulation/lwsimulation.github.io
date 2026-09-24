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
  document.querySelectorAll('.research-controls button,.research-controls input,.view-actions button').forEach(el => el.disabled = true);
  console.error('Research chamber could not start:', error);
}

function start(T, OrbitControls) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor(0xf1f6fb, 0);
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

  const homeDirection = new T.Vector3(7, 4.2, 9).normalize();
  function resetView() {
    camera.position.copy(homeDirection).multiplyScalar(Math.max(11.8, 8.8 / camera.aspect));
    controls.target.set(0, 0, 0);
    controls.update();
  }

  const resize = new ResizeObserver(() => {
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  });
  resize.observe(viewport);

  scene.add(new T.HemisphereLight(0xffffff, 0xb8c7d8, 2.8));
  const key = new T.DirectionalLight(0xffffff, 3.2); key.position.set(5, 8, 6); scene.add(key);
  const rim = new T.DirectionalLight(0xb8d6ef, 1.8); rim.position.set(-5, 2, -4); scene.add(rim);

  const metal = new T.MeshStandardMaterial({ color: 0x6687a5, metalness: 0.55, roughness: 0.34 });
  const glass = new T.MeshPhysicalMaterial({ color: 0xb8d5e8, transparent: true, opacity: 0.10, roughness: 0.16, metalness: 0.05, side: T.DoubleSide, depthWrite: false });
  const wire = new T.MeshBasicMaterial({ color: 0x6f93b4, transparent: true, opacity: 0.60 });

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

  // Chamber shell and exhaust geometry.
  mesh(new T.CylinderGeometry(2, 2, 3.8, 96, 1, true), glass);
  mesh(new T.CylinderGeometry(2, 0.32, 0.7, 96, 1, true), glass, -2.25);
  mesh(new T.CylinderGeometry(0.29, 0.29, 1.2, 48, 1, true), glass, 2.5);
  mesh(new T.CylinderGeometry(0.32, 0.32, 0.65, 48, 1, true), glass, -2.925);
  for (const y of [-1.9, 1.9]) { ring(2, y, 0.075, metal); ring(2.08, y, 0.018); }
  for (const y of [1.9, 3.1]) ring(0.29, y, 0.035, metal);
  for (const y of [-2.6, -3.25]) ring(0.32, y, 0.035, metal);
  mesh(new T.CylinderGeometry(2, 2, 0.045, 96), glass, 1.9);

  // Wafer remains stationary. Rotation is intentionally not used as a research variable.
  const wafer = new T.Group(); wafer.position.y = -1.05; scene.add(wafer);
  const waferMaterial = new T.MeshStandardMaterial({ color: 0x4b6d8b, metalness: 0.55, roughness: 0.27, emissive: 0x000000 });
  mesh(new T.CylinderGeometry(1.35, 1.35, 0.12, 96), waferMaterial, 0, wafer);
  ring(1.35, 0.06, 0.025, wire, wafer);
  const traceMaterial = new T.MeshBasicMaterial({ color: 0x6c9abf, transparent: true, opacity: 0.25 });
  for (const radius of [0.45, 0.9, 1.21]) ring(radius, 0.065, 0.006, traceMaterial, wafer);

  for (const angle of [Math.PI * 1.15, Math.PI * 1.85]) {
    const support = mesh(new T.CylinderGeometry(0.045, 0.045, 0.75, 12), metal, -1.48);
    support.position.x = 1.15 * Math.cos(angle);
    support.position.z = 1.15 * Math.sin(angle);
  }

  const thermalHalo = ring(1.48, -1.04, 0.055, new T.MeshBasicMaterial({ color: 0xd58a50, transparent: true, opacity: 0.50 }));
  thermalHalo.visible = false;

  const plasmaGroup = new T.Group(); scene.add(plasmaGroup); plasmaGroup.visible = false;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    plasmaGroup.add(new T.ArrowHelper(new T.Vector3(0, -1, 0), new T.Vector3(1.72 * Math.cos(a), 0.65, 1.72 * Math.sin(a)), 1.0, 0x7a70b8, 0.12, 0.06));
  }
  const floorGrid = new T.PolarGridHelper(2.9, 12, 4, 96, 0xb9c8d7, 0xd4dee8); floorGrid.position.y = -3.45; scene.add(floorGrid);

  const densityConfigs = [
    { label: '稀疏 · 30 孔', rings: [[0.55, 6], [1.15, 10], [1.60, 14]] },
    { label: '基准 · 42 孔', rings: [[0.42, 8], [0.94, 14], [1.48, 20]] },
    { label: '高密 · 76 孔', rings: [[0.30, 10], [0.72, 16], [1.15, 22], [1.58, 28]] }
  ];

  let densityIndex = 1;
  let holes = [];
  let plateGroup = null;
  function makeHoles(config) {
    const result = [];
    for (const [radius, count] of config.rings) {
      for (let i = 0; i < count; i++) {
        const angle = i / count * Math.PI * 2;
        result.push({ radius, angle, x: radius * Math.cos(angle), z: radius * Math.sin(angle) });
      }
    }
    return result;
  }
  function buildShowerhead() {
    if (plateGroup) disposeObject(plateGroup);
    plateGroup = new T.Group(); scene.add(plateGroup);
    holes = makeHoles(densityConfigs[densityIndex]);
    const plateShape = new T.Shape(); plateShape.absarc(0, 0, 1.84, 0, Math.PI * 2, false);
    for (const hole of holes) {
      const path = new T.Path();
      path.absarc(hole.x, -hole.z, 0.066, 0, Math.PI * 2, true);
      plateShape.holes.push(path);
    }
    const geometry = new T.ExtrudeGeometry(plateShape, { depth: 0.10, bevelEnabled: false, curveSegments: 7 });
    geometry.rotateX(-Math.PI / 2);
    const material = new T.MeshStandardMaterial({ color: 0x7898b2, metalness: 0.48, roughness: 0.4, transparent: true, opacity: 0.76 });
    mesh(geometry, material, 1.1, plateGroup);
    ring(1.84, 1.15, 0.04, metal, plateGroup);
  }
  buildShowerhead();

  const fields = { thermal: false, plasma: false };
  let rate = 1;
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = 180;
  const PARTICLES_PER_PATH = 6;
  const smooth = x => x * x * (3 - 2 * x);
  const mix = (a, b, t) => a + (b - a) * t;
  const stops = [0x4774b8, 0x58a7c8, 0x88bfa7, 0xe4c273, 0xd98967].map(c => new T.Color(c));
  function speedColor(speed, target = new T.Color()) {
    const t = T.MathUtils.clamp((speed - 0.10) / 2.15, 0, 1) * 4;
    const i = Math.min(3, Math.floor(t));
    return target.copy(stops[i]).lerp(stops[i + 1], t - i);
  }

  function sample(t, hole) {
    let r, y, speed;
    const a = hole.angle, h = hole.radius;
    const perHoleScale = Math.sqrt(42 / holes.length); // qualitative fixed-total-flow normalization
    if (t < 0.14) {
      const u = t / 0.14; r = 0.13 * h / 1.58; y = mix(3.15, 2.0, u); speed = 0.72;
    } else if (t < 0.30) {
      const u = (t - 0.14) / 0.16; r = mix(0.13 * h / 1.58, h, smooth(u)); y = mix(2.0, 1.30, u); speed = mix(0.30, 0.58, u);
    } else if (t < 0.35) {
      const u = (t - 0.30) / 0.05; r = h; y = mix(1.30, 1.02, u); speed = mix(0.58, 1.45 * perHoleScale, u);
    } else if (t < 0.64) {
      const u = (t - 0.35) / 0.29; r = h + 0.045 * smooth(u); y = mix(1.02, -0.65, u); speed = mix(1.45 * perHoleScale, 0.48, smooth(u));
    } else if (t < 0.76) {
      const u = (t - 0.64) / 0.12; r = mix(h + 0.045, 1.65, smooth(Math.min(1, u / 0.62))); y = mix(-0.65, -1.50, smooth(u)); speed = 0.48;
    } else if (t < 0.93) {
      const u = (t - 0.76) / 0.17; r = mix(1.65, 0.16, smooth(u)); y = mix(-1.50, -2.65, u); speed = mix(0.50, 1.25, u);
    } else {
      const u = (t - 0.93) / 0.07; r = 0.16; y = mix(-2.65, -3.30, u); speed = 1.25;
    }
    const jet = t > 0.35 && t < 0.64 ? Math.sin((t - 0.35) / 0.29 * Math.PI) ** 2 : 0;
    const chamber = t > 0.35 && t < 0.93 ? Math.sin((t - 0.35) / 0.58 * Math.PI) ** 2 : 0;
    if (fields.thermal) {
      r += jet * (0.14 + 0.045 * Math.sin(3 * a + t * 22));
      speed *= 1 - 0.16 * jet + 0.06 * chamber;
    }
    return { p: new T.Vector3(r * Math.cos(a), y, r * Math.sin(a)), speed: speed * rate };
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
      const points = [], speeds = [], times = [0];
      for (let i = 0; i <= N; i++) {
        const value = sample(i / N, hole);
        points.push(value.p); speeds.push(value.speed);
        if (i) times.push(times[i - 1] + value.p.distanceTo(points[i - 1]) / Math.max(0.08, (speeds[i - 1] + value.speed) * 0.5));
      }
      paths.push({ points, speeds, times, duration: times[N] });
      for (let i = 0; i < N; i++) {
        for (const j of [i, i + 1]) {
          positions.push(...points[j]); speedColor(speeds[j], color); colors.push(color.r, color.g, color.b);
        }
      }
    }
    if (streamlines) disposeObject(streamlines);
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    streamlines = new T.LineSegments(geometry, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.50, depthWrite: false }));
    scene.add(streamlines);

    if (particles) disposeObject(particles);
    const particleCount = holes.length * PARTICLES_PER_PATH;
    particles = new T.InstancedMesh(new T.SphereGeometry(0.027, 6, 5), new T.MeshBasicMaterial({ color: 0xffffff }), particleCount);
    particles.instanceMatrix.setUsage(T.DynamicDrawUsage);
    particles.frustumCulled = false;
    scene.add(particles);

    thermalHalo.visible = fields.thermal;
    plasmaGroup.visible = fields.plasma;
    waferMaterial.emissive.set(fields.thermal ? 0x3d1b0d : 0x000000);
    viewport.dataset.fields = Object.keys(fields).filter(k => fields[k]).join(',');
    viewport.dataset.holeCount = String(holes.length);
    viewport.dataset.flowRate = String(rate);
  }
  buildFlow();

  function updateDescription() {
    const densityText = densityIndex === 0
      ? '稀疏孔分布使单孔承担的流量比例更高，射流间距更大。'
      : densityIndex === 2
        ? '高孔密度增加射流覆盖数量；在总入口流量固定的展示假设下，单孔射流强度相对降低。'
        : '基准孔分布用于展示喷淋板分流后的多股射流。';
    const additions = [];
    if (fields.thermal) additions.push('温度边界通过气体性质和近壁输运改变射流扩散，这里仅展示展宽趋势。');
    if (fields.plasma) additions.push('等离子体选项仅显示带电粒子受电场作用的方向，不把电场等效为中性气体整体加速。');
    document.querySelector('#field-description').textContent = densityText + (additions.length ? ' ' + additions.join(' ') : '');
  }

  document.querySelectorAll('[data-field]').forEach(button => button.addEventListener('click', () => {
    const name = button.dataset.field;
    fields[name] = !fields[name];
    button.setAttribute('aria-pressed', String(fields[name]));
    button.querySelector('.toggle-mark').textContent = fields[name] ? '−' : '+';
    document.querySelector('#field-count').textContent = `${Object.values(fields).filter(Boolean).length} / 2`;
    updateDescription();
    buildFlow();
  }));

  document.querySelector('#hole-density').addEventListener('input', event => {
    densityIndex = Number(event.target.value);
    document.querySelector('#density-value').textContent = densityConfigs[densityIndex].label;
    buildShowerhead();
    buildFlow();
    updateDescription();
  });

  document.querySelector('#flow-rate').addEventListener('input', event => {
    rate = Number(event.target.value);
    document.querySelector('#flow-value').textContent = `${rate.toFixed(1)}×`;
    buildFlow();
  });

  const pauseButton = document.querySelector('#pause');
  function updatePause() {
    pauseButton.textContent = paused ? '继续流动' : '暂停流动';
    pauseButton.setAttribute('aria-pressed', String(paused));
    document.querySelector('#flow-status').textContent = paused ? '流动已暂停' : '流动演示';
  }
  pauseButton.addEventListener('click', () => { paused = !paused; updatePause(); });
  updatePause();
  document.querySelector('#reset').addEventListener('click', resetView);

  viewport.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(event.key)) return;
    event.preventDefault();
    const spherical = new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if (event.key === 'ArrowLeft') spherical.theta -= 0.12;
    if (event.key === 'ArrowRight') spherical.theta += 0.12;
    if (event.key === 'ArrowUp') spherical.phi -= 0.12;
    if (event.key === 'ArrowDown') spherical.phi += 0.12;
    if (['+','='].includes(event.key)) spherical.radius *= 0.9;
    if (event.key === '-') spherical.radius *= 1.1;
    spherical.phi = T.MathUtils.clamp(spherical.phi, controls.minPolarAngle, controls.maxPolarAngle);
    spherical.radius = T.MathUtils.clamp(spherical.radius, controls.minDistance, controls.maxDistance);
    camera.position.setFromSpherical(spherical).add(controls.target);
    controls.update();
  });

  const labels = [
    ['inlet', new T.Vector3(0.4, 2.95, 0)],
    ['shower', new T.Vector3(1.95, 1.15, 0)],
    ['wafer', new T.Vector3(1.48, -1.05, 0)],
    ['outlet', new T.Vector3(0.45, -3.05, 0)]
  ].map(([name, point]) => ({ element: document.querySelector(`[data-label="${name}"]`), point }));

  let time = 0;
  let last = performance.now();
  let running = true;
  const projected = new T.Vector3();
  const particlePoint = new T.Vector3();

  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
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
        const denom = Math.max(1e-6, path.times[hi] - path.times[lo]);
        const fraction = (travel - path.times[lo]) / denom;
        particlePoint.copy(path.points[lo]).lerp(path.points[hi], fraction);
        dummy.position.copy(particlePoint); dummy.updateMatrix();
        particles.setMatrixAt(instance, dummy.matrix);
        particles.setColorAt(instance, speedColor(mix(path.speeds[lo], path.speeds[hi], fraction), color));
        instance++;
      }
    }
    particles.instanceMatrix.needsUpdate = true;
    if (particles.instanceColor) particles.instanceColor.needsUpdate = true;

    for (const label of labels) {
      projected.copy(label.point).project(camera);
      const x = (projected.x * 0.5 + 0.5) * viewport.clientWidth + 8;
      const y = (-projected.y * 0.5 + 0.5) * viewport.clientHeight - 12;
      label.element.style.transform = `translate(${Math.max(5, Math.min(viewport.clientWidth - label.element.offsetWidth - 5, x))}px,${y}px)`;
      label.element.style.visibility = projected.z < 1 && y > 0 && y < viewport.clientHeight - 40 ? 'visible' : 'hidden';
    }

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
  updateDescription();
  resetView();
  requestAnimationFrame(frame);
}
