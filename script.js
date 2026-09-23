// 填写公开邮箱或完整联系页面网址；留空时明确显示暂未提供。
const CONTACT = '';
const dialog = document.querySelector('#contact-dialog');
document.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', () => {
  if (CONTACT) {
    location.href = CONTACT.includes('@') && !CONTACT.startsWith('http') ? 'mailto:' + CONTACT : CONTACT;
    return;
  }
  dialog.showModal();
}));
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
