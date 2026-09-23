(() => {
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
