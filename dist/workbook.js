(() => {
  const dialog = document.querySelector('#workbook-dialog');
  const opener = document.querySelector('.workbook-download');
  const form = dialog.querySelector('form');
  const status = dialog.querySelector('.workbook-status');
  const submit = form.querySelector('[type="submit"]');
  const retry = dialog.querySelector('.workbook-retry');
  let downloadUrl;
  let busy = false;
  const beginDownload = () => {
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = 'Core - Workbook.pdf';
    anchor.click();
  };
  opener.addEventListener('click', () => {
    dialog.showModal();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && window.gsap) {
      gsap.fromTo(dialog.querySelector('.workbook-dialog-inner'), { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: .5, ease: 'expo.out' });
    }
  });
  dialog.querySelector('.workbook-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  retry.addEventListener('click', beginDownload);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    busy = true;
    submit.disabled = true;
    submit.textContent = 'A preparar…';
    status.textContent = '';
    try {
      const response = await fetch('/api/workbook', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.elements.name.value.trim(), email: form.elements.email.value.trim() })
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Não foi possível preparar o download. Tenta novamente.');
      }
      if (!response.headers.get('Content-Type')?.includes('application/pdf')) throw new Error('O download está temporariamente indisponível.');
      const blob = await response.blob();
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      downloadUrl = URL.createObjectURL(blob);
      beginDownload();
      status.textContent = 'Obrigado! O teu Workbook está pronto. Se o download não começou, usa o botão abaixo.';
      retry.hidden = false;
    } catch (error) {
      status.textContent = error.message || 'Não foi possível concluir o pedido. Tenta novamente.';
    } finally {
      busy = false;
      submit.disabled = false;
      submit.textContent = 'Download Workbook';
    }
  });
  window.addEventListener('pagehide', () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); });
})();
