const dialog = document.querySelector('#contact-dialog');
const emailField = document.querySelector('#contact-email');
const copyButton = document.querySelector('#copy-email');
const copyStatus = document.querySelector('#copy-status');

document.querySelectorAll('[data-contact]').forEach(button => {
  button.addEventListener('click', () => {
    copyStatus.textContent = '';
    copyButton.textContent = '复制邮箱地址';
    dialog.showModal();
    copyButton.focus();
  });
});

copyButton.addEventListener('click', async () => {
  let copied = false;
  try {
    await navigator.clipboard.writeText(emailField.value);
    copied = true;
  } catch {
    // Offline files and browsers without clipboard permission use selected text.
    emailField.focus();
    emailField.select();
    try { copied = document.execCommand('copy'); } catch { copied = false; }
  }
  copyStatus.textContent = copied ? '邮箱地址已复制' : '请长按或按 Ctrl+C（Mac：⌘C）复制已选中的邮箱地址。';
  if (copied) {
    copyButton.textContent = '已复制';
    copyButton.focus();
  }
});
emailField.addEventListener('click', () => emailField.select());
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
});
