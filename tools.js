(() => {
  const kB = 1.380649e-23; // J/K

  const lengthFactor = { m: 1, mm: 1e-3, um: 1e-6, nm: 1e-9 };
  const pressureFactor = { Pa: 1, kPa: 1e3, mbar: 100, Torr: 133.3223684211 };
  const diameterFactor = { nm: 1e-9, A: 1e-10 };

  const gasDiametersNm = {
    air: 0.365,
    N2: 0.364,
    Ar: 0.340,
    He: 0.260,
    H2: 0.289
  };

  const regimes = [
    {
      test: kn => kn < 0.01,
      name: '连续流区',
      range: 'Kn < 0.01',
      desc: '分子平均自由程远小于特征尺度，连续介质假设通常成立。',
      method: '通常可采用 Navier–Stokes（NS）方程配合无滑移边界；常规 CFD 方法一般适用。'
    },
    {
      test: kn => kn < 0.1,
      name: '滑移流区',
      range: '0.01 ≤ Kn < 0.1',
      desc: '主体区域仍接近连续介质，但壁面附近的速度滑移和温度跳跃不可忽略。',
      method: '可采用带速度滑移/温度跳跃边界的 NS 模型；必要时用 DSMC 或实验结果校核边界模型。'
    },
    {
      test: kn => kn < 10,
      name: '过渡流区',
      range: '0.1 ≤ Kn < 10',
      desc: '连续介质模型与自由分子模型均可能失效，非平衡效应显著。',
      method: '优先考虑 DSMC；若系统同时存在连续区与稀薄区，可采用 NS–DSMC 混合/耦合方法降低计算成本。'
    },
    {
      test: () => true,
      name: '自由分子流区',
      range: 'Kn ≥ 10',
      desc: '分子间碰撞相对壁面碰撞已很少，流动主要受分子—壁面相互作用控制。',
      method: '可采用 DSMC；若分子间碰撞可以忽略，也可考虑自由分子模型或 Test-Particle Monte Carlo（TPMC）。'
    }
  ];

  const $ = id => document.getElementById(id);
  const tabs = document.querySelectorAll('.mode-tab');
  const modes = document.querySelectorAll('.calc-mode');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      modes.forEach(mode => mode.classList.toggle('active', mode.id === `mode-${tab.dataset.mode}`));
      $('calc-error').textContent = '';
      $('kn-result').classList.remove('show');
      $('transition-contact').classList.remove('show');
    });
  });

  $('gas-preset').addEventListener('change', e => {
    const value = e.target.value;
    if (gasDiametersNm[value]) {
      $('molecular-diameter').value = gasDiametersNm[value];
      $('diameter-unit').value = 'nm';
    }
  });

  function positiveNumber(id, label) {
    const value = Number($(id).value);
    if (!Number.isFinite(value) || value <= 0) throw new Error(`${label}必须为大于 0 的数值。`);
    return value;
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return '—';
    const abs = Math.abs(value);
    if (abs === 0) return '0';
    if (abs >= 1e4 || abs < 1e-3) return value.toExponential(4);
    return Number(value.toPrecision(6)).toString();
  }

  function formatLength(meters) {
    const a = Math.abs(meters);
    if (a >= 1) return `${formatNumber(meters)} m`;
    if (a >= 1e-3) return `${formatNumber(meters * 1e3)} mm`;
    if (a >= 1e-6) return `${formatNumber(meters * 1e6)} μm`;
    return `${formatNumber(meters * 1e9)} nm`;
  }

  function classify(kn) {
    return regimes.find(r => r.test(kn));
  }

  function boundaryWarning(kn) {
    const boundaries = [0.01, 0.1, 10];
    const near = boundaries.find(b => kn >= b / 1.5 && kn <= b * 1.5);
    if (!near) return '';
    return '当前 Kn 接近常用流态分区边界。实际工程中还应结合局部 Kn、几何尺度、壁面条件及非平衡程度判断模型适用性。';
  }

  function shouldShowTransitionContact(kn) {
    const inTransition = kn >= 0.1 && kn < 10;
    const nearTransitionBoundary = (kn >= 0.1 / 1.5 && kn < 0.1) || (kn >= 10 && kn <= 10 * 1.5);
    return inTransition || nearTransitionBoundary;
  }

  function render(kn, lambda, source) {
    const regime = classify(kn);
    $('result-kn').textContent = formatNumber(kn);
    $('result-lambda').innerHTML = lambda ? `${formatLength(lambda)}` : '由用户直接给定';
    $('result-regime').textContent = regime.name;
    $('result-range').textContent = regime.range;
    $('result-desc').textContent = regime.desc;
    $('result-method').textContent = regime.method;

    const contact = $('transition-contact');
    contact.classList.toggle('show', shouldShowTransitionContact(kn));

    const warning = boundaryWarning(kn);
    const warningEl = $('result-warning');
    const hardSphereNote = source === 'advanced'
      ? '复杂公式采用理想气体硬球模型估算平均自由程；分子有效直径的选择会直接影响计算结果。'
      : '';
    const combined = [warning, hardSphereNote].filter(Boolean).join(' ');
    warningEl.textContent = combined;
    warningEl.classList.toggle('show', Boolean(combined));
    $('kn-result').classList.add('show');
  }

  function calculateSimple() {
    const lambda = positiveNumber('simple-lambda', '平均自由程 λ') * lengthFactor[$('simple-lambda-unit').value];
    const L = positiveNumber('simple-length', '特征长度 L') * lengthFactor[$('simple-length-unit').value];
    render(lambda / L, lambda, 'simple');
  }

  function calculateAdvanced() {
    const p = positiveNumber('pressure', '压力 p') * pressureFactor[$('pressure-unit').value];
    const T = positiveNumber('temperature', '温度 T');
    const d = positiveNumber('molecular-diameter', '分子有效直径 d') * diameterFactor[$('diameter-unit').value];
    const L = positiveNumber('advanced-length', '特征长度 L') * lengthFactor[$('advanced-length-unit').value];
    const lambda = kB * T / (Math.sqrt(2) * Math.PI * d * d * p);
    render(lambda / L, lambda, 'advanced');
  }

  $('calculate-kn').addEventListener('click', () => {
    try {
      $('calc-error').textContent = '';
      const active = document.querySelector('.mode-tab.active').dataset.mode;
      active === 'simple' ? calculateSimple() : calculateAdvanced();
    } catch (err) {
      $('kn-result').classList.remove('show');
      $('transition-contact').classList.remove('show');
      $('calc-error').textContent = err.message;
    }
  });

  $('reset-kn').addEventListener('click', () => {
    $('simple-lambda').value = '65';
    $('simple-lambda-unit').value = 'nm';
    $('simple-length').value = '10';
    $('simple-length-unit').value = 'um';
    $('gas-preset').value = 'N2';
    $('pressure').value = '100';
    $('pressure-unit').value = 'Pa';
    $('temperature').value = '300';
    $('molecular-diameter').value = '0.364';
    $('diameter-unit').value = 'nm';
    $('advanced-length').value = '100';
    $('advanced-length-unit').value = 'um';
    $('calc-error').textContent = '';
    $('kn-result').classList.remove('show');
    $('transition-contact').classList.remove('show');
  });

  // Use the same contact interaction pattern as the homepage instead of opening mail directly.
  function setupResearchContactDialog() {
    const trigger = document.querySelector('.transition-contact a');
    if (!trigger) return;

    const dialog = document.createElement('dialog');
    dialog.id = 'contact-dialog';
    dialog.setAttribute('aria-labelledby', 'contact-title');
    dialog.setAttribute('aria-describedby', 'contact-note');
    dialog.innerHTML = `
      <button class="dialog-close" aria-label="关闭" type="button">×</button>
      <span class="contact-label" lang="en">CONTACT</span>
      <h2 id="contact-title">讨论研发需求</h2>
      <p id="contact-note">如果你的系统涉及过渡流、跨流态输运或 NS–DSMC 耦合，可以通过邮箱与我联系。</p>
      <label class="email-label" for="contact-email">电子邮箱</label>
      <input id="contact-email" type="text" value="loerwalson@sina.com" readonly spellcheck="false" aria-label="电子邮箱地址">
      <div class="contact-actions">
        <button class="button primary" id="copy-email" type="button">复制邮箱地址</button>
        <a class="email-link" href="mailto:loerwalson@sina.com?subject=%E8%B7%A8%E6%B5%81%E6%80%81%E4%BB%BF%E7%9C%9F%E7%A0%94%E5%8F%91%E9%9C%80%E6%B1%82%E5%92%A8%E8%AF%A2">发送邮件 ↗</a>
      </div>
      <p id="copy-status" role="status" aria-live="polite"></p>`;
    document.body.append(dialog);

    const emailField = dialog.querySelector('#contact-email');
    const copyButton = dialog.querySelector('#copy-email');
    const copyStatus = dialog.querySelector('#copy-status');

    trigger.addEventListener('click', event => {
      event.preventDefault();
      copyStatus.textContent = '';
      copyButton.textContent = '复制邮箱地址';
      dialog.showModal();
      copyButton.focus();
    });

    copyButton.addEventListener('click', async () => {
      let copied = false;
      try {
        await navigator.clipboard.writeText(emailField.value);
        copied = true;
      } catch {
        emailField.focus();
        emailField.select();
        try { copied = document.execCommand('copy'); } catch { copied = false; }
      }
      copyStatus.textContent = copied ? '邮箱地址已复制' : '请长按或按 Ctrl+C（Mac：⌘C）复制已选中的邮箱地址。';
      if (copied) copyButton.textContent = '已复制';
    });

    emailField.addEventListener('click', () => emailField.select());
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    });
  }

  setupResearchContactDialog();
})();
