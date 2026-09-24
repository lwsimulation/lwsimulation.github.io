(() => {
  const EMAIL = 'loerwalson@sina.com';

  function ensureDialog() {
    let dialog = document.querySelector('#contact-dialog');
    if (dialog) return dialog;

    dialog = document.createElement('dialog');
    dialog.id = 'contact-dialog';
    dialog.setAttribute('aria-labelledby', 'contact-title');
    dialog.setAttribute('aria-describedby', 'contact-note');
    dialog.innerHTML = `
      <button class="dialog-close" aria-label="关闭" type="button">×</button>
      <span class="contact-label" lang="en">CONTACT</span>
      <h2 id="contact-title">联系我</h2>
      <p id="contact-note">欢迎通过邮箱与我联系。</p>
      <label class="email-label" for="contact-email">电子邮箱</label>
      <input id="contact-email" type="text" value="${EMAIL}" readonly spellcheck="false" aria-label="电子邮箱地址">
      <div class="contact-actions">
        <button class="button primary" id="copy-email" type="button">复制邮箱地址</button>
        <a class="email-link" href="mailto:${EMAIL}">发送邮件 ↗</a>
      </div>
      <p id="copy-status" role="status" aria-live="polite"></p>`;
    document.body.append(dialog);

    const emailField = dialog.querySelector('#contact-email');
    const copyButton = dialog.querySelector('#copy-email');
    const copyStatus = dialog.querySelector('#copy-status');

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
    return dialog;
  }

  function openContactDialog(options = {}) {
    const dialog = ensureDialog();
    const title = dialog.querySelector('#contact-title');
    const note = dialog.querySelector('#contact-note');
    const copyButton = dialog.querySelector('#copy-email');
    const copyStatus = dialog.querySelector('#copy-status');
    const emailLink = dialog.querySelector('.email-link');

    title.textContent = options.title || '联系我';
    note.textContent = options.note || '欢迎通过邮箱与我联系。';
    copyButton.textContent = '复制邮箱地址';
    copyStatus.textContent = '';
    const subject = options.subject ? `?subject=${encodeURIComponent(options.subject)}` : '';
    emailLink.href = `mailto:${EMAIL}${subject}`;
    dialog.showModal();
    copyButton.focus();
  }

  window.openContactDialog = openContactDialog;

  document.querySelectorAll('[data-contact]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      event.preventDefault();
      openContactDialog({
        title: trigger.dataset.contactTitle,
        note: trigger.dataset.contactNote,
        subject: trigger.dataset.contactSubject
      });
    });
  });
})();
