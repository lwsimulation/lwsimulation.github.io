(() => {
  // A dismissal lasts for this tab's visit, including navigation between pages.
  const key = 'site-signature-dismissed';
  try { if (sessionStorage.getItem(key) === '1') return; } catch {}
  const badge = document.createElement('aside');
  badge.className = 'site-signature';
  badge.setAttribute('aria-label', 'Liu Wansuo Simulation 签名');
  // Gamma darkens pale lettering while keeping white white for background blending.
  badge.innerHTML = `<svg class="signature-filter" aria-hidden="true"><defs><filter id="signature-ink" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="gamma" amplitude="1" exponent="1.65" offset="0"/><feFuncG type="gamma" amplitude="1" exponent="1.65" offset="0"/><feFuncB type="gamma" amplitude="1" exponent="1.65" offset="0"/></feComponentTransfer></filter></defs></svg><img src="assets/signature.webp" width="300" height="154" alt="LWS · Liu Wansuo Simulation" decoding="async" fetchpriority="low"><button type="button" class="signature-close" aria-label="关闭签名">×</button>`;
  badge.querySelector('button').addEventListener('click', () => {
    badge.remove();
    try { sessionStorage.setItem(key, '1'); } catch {}
  });
  document.body.append(badge);
})();
