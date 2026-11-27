(() => {
  const dialog = document.querySelector('#workbook-dialog');
  const opener = document.querySelector('.workbook-download');
  if (!dialog || !opener) return;
  const form = dialog.querySelector('form');
  const status = dialog.querySelector('.workbook-status');
  opener.addEventListener('click', () => {
    status.textContent = '';
    dialog.showModal();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && window.gsap) {
      gsap.fromTo(dialog.querySelector('.workbook-dialog-inner'), { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: .5, ease: 'expo.out' });
    }
  });
  dialog.querySelector('.workbook-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  // Native form navigation receives the attachment directly, retaining the user gesture.
  // No asynchronous blob download or second download control is involved.
  form.addEventListener('submit', () => {
    status.textContent = 'A preparar o PDF. O download será iniciado pelo teu navegador.';
  });
})();
