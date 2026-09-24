(() => {
  const header = document.querySelector('.site-header');
  if (header) {
    header.querySelector('.back-home')?.remove();
    let nav = header.querySelector('nav[aria-label="主导航"]');
    if (!nav) {
      nav = document.createElement('nav');
      nav.setAttribute('aria-label', '主导航');
      header.append(nav);
    }
    nav.innerHTML = '<a href="index.html">首页</a><a href="tools.html">工具与资源</a><button type="button" data-contact>联系我</button>';
    const contactScript = document.createElement('script');
    contactScript.src = 'contact.js?v=20260924-1';
    document.head.append(contactScript);
  }

  // Personal LWS mark: embed the image directly so GitHub Pages cannot serve a broken asset.
  const brandMark = document.createElement('img');
  brandMark.className = 'juno-brandmark';
  brandMark.src = 'data:image/webp;base64,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';
  brandMark.alt = 'Liu Wansuo Simulation';
  brandMark.decoding = 'async';
  document.body.append(brandMark);
  const brandStyle = document.createElement('style');
  brandStyle.textContent = `
    .juno-brandmark{
      position:fixed;right:28px;bottom:66px;z-index:11;
      width:clamp(180px,16vw,250px);height:auto;
      opacity:.78;pointer-events:none;user-select:none;
      filter:drop-shadow(0 4px 14px rgba(33,67,103,.08));
    }
    @media(max-width:900px){
      .juno-brandmark{right:12px;bottom:64px;width:150px;opacity:.72}
    }
    @media(max-width:560px){
      .juno-brandmark{right:8px;bottom:58px;width:118px;opacity:.66}
    }
  `;
  document.head.append(brandStyle);

  const story = document.querySelector('.story');
  const chapters = [...story.querySelectorAll('.chapter')];
  const dots = [...document.querySelectorAll('.chapter-nav a')];
  const previous = document.querySelector('#previous-chapter');
  const next = document.querySelector('#next-chapter');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  function go(index) {
    index = Math.max(0, Math.min(index, chapters.length - 1));
    const target = chapters[index];
    story.scrollTo({top: target.offsetTop - story.offsetTop, behavior: reduced.matches ? 'instant' : 'smooth'});
    history.replaceState(null, '', '#' + target.id);
  }
  function update() {
    const center = story.scrollTop + story.clientHeight * .5;
    current = chapters.findIndex(section => section.offsetTop - story.offsetTop + section.offsetHeight > center);
    if (current < 0) current = chapters.length - 1;
    document.querySelector('#chapter-count').textContent = String(current + 1).padStart(2, '0');
    document.querySelector('#chapter-name').textContent = chapters[current].dataset.title;
    previous.disabled = current === 0;
    next.disabled = current === chapters.length - 1;
    dots.forEach((dot, i) => i === current ? dot.setAttribute('aria-current', 'step') : dot.removeAttribute('aria-current'));
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('is-visible', entry.isIntersecting)), {root:story,threshold:0.05});
    chapters.forEach(chapter => observer.observe(chapter));
    chapters[0].classList.add('is-visible');
    story.classList.add('is-enhanced');
  }
  let frame;
  story.addEventListener('scroll', () => {cancelAnimationFrame(frame);frame=requestAnimationFrame(update);}, {passive:true});
  window.addEventListener('resize', update);
  previous.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  document.querySelectorAll('[data-go]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();go(chapters.findIndex(chapter => chapter.id === link.dataset.go));
  }));
  document.addEventListener('keydown', event => {
    if (document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT|BUTTON|A/.test(event.target.tagName)) return;
    const direction = {PageDown:1,PageUp:-1}[event.key];
    if (direction) {event.preventDefault();go(current + direction);}
    else if (event.key === 'Home') {event.preventDefault();go(0);}
    else if (event.key === 'End') {event.preventDefault();go(chapters.length - 1);}
  });
  function openHash() {const i=chapters.findIndex(chapter => '#' + chapter.id === location.hash);if(i>=0)go(i);}
  window.addEventListener('hashchange', openHash);
  openHash();update();

  const fields={flow:'从输运过程出发，识别流动与温度、反应之间的相互影响。',heat:'追踪温度反馈，将热过程与相关输运和结构响应关联。',structure:'关注结构反馈，将几何与物理过程的相互作用纳入必要耦合。',reaction:'分析化学反应与输运过程的相互影响，明确模型假设与适用范围。',plasma:'分析放电、反应与输运之间的反馈，用基准与试验检查结论可靠性。'};
  function select(group, chosen) {document.querySelectorAll('[' + group + ']').forEach(button => button.setAttribute('aria-pressed',String(button.getAttribute(group) === chosen)));}
  document.querySelector('[data-field-node="flow"]').classList.add('active');
  document.querySelectorAll('[data-field]').forEach(button => button.addEventListener('click', () => {
    select('data-field',button.dataset.field);
    document.querySelectorAll('[data-field-node]').forEach(node => node.classList.toggle('active',node.dataset.fieldNode === button.dataset.field));
    document.querySelector('#field-description').textContent=fields[button.dataset.field];
  }));
  document.querySelectorAll('[data-pvd]').forEach(button => button.addEventListener('click', () => {
    const tangent=button.dataset.pvd === 'tangent';select('data-pvd',button.dataset.pvd);
    document.querySelector('#radial-flow').toggleAttribute('hidden',tangent);
    document.querySelector('#tangent-flow').toggleAttribute('hidden',!tangent);
    document.querySelector('.inlet').setAttribute('d',tangent?'M337 25V86L320 111':'M310 25V106');
    document.querySelector('#pipe-caption').textContent=tangent?'旋转与轴向输运':'中部压力积聚';
    document.querySelector('#pvd-detail-title').textContent=tangent?'促进压力能向动能转化':'中部与两端压力不一致';
    document.querySelector('#pvd-detail').textContent=tangent?'以偏置切向进气组织旋转与轴向输运，缓解中部压力积聚，改善轴向压力分布。':'中部供气、两端排气的布局下，需要控制管内压力差对沉积环境的影响。';
  }));
  const outlets={
    uniform:{top:'M70 90H550',bottom:'M70 190H550',caption:'作为对照基准',title:'从对照基准出发',description:'对比不同口型在跨流态条件下的出口速度、射流形态与工况敏感性。'},
    expanded:{top:'M70 115 550 40',bottom:'M70 165 550 240',caption:'识别条件性优势',title:'识别扩张出口的适用条件',description:'将出口几何与输运特征关联，明确扩张结构发挥作用的条件，而非假设同一构型在所有流态下都占优。'},
    combined:{top:'M70 105H370L550 40',bottom:'M70 175H370L550 240',caption:'引入局部扩张段',title:'迁移为组合出口设计',description:'将有效出口特征引入其他口型，通过扩张角度与长度等参数调节出口响应。'}
  };
  document.querySelectorAll('[data-outlet]').forEach(button => button.addEventListener('click', () => {
    const value=outlets[button.dataset.outlet];select('data-outlet',button.dataset.outlet);
    document.querySelector('#outlet-top').setAttribute('d',value.top);document.querySelector('#outlet-bottom').setAttribute('d',value.bottom);
    document.querySelector('#outlet-caption').textContent=value.caption;
    document.querySelector('#outlet-detail-title').textContent=value.title;document.querySelector('#outlet-detail').textContent=value.description;
  }));
})();
