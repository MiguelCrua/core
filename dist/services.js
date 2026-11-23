(() => {
  const items = [...document.querySelectorAll('.service-accordion, .founder-accordion')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!window.gsap) return;
  const states = new WeakMap();
  const animate = (item, opening) => {
    const content = item.querySelector('.service-content');
    const previous = states.get(item);
    if (previous?.opening === opening) return;
    previous?.tween.kill();
    const start = item.getBoundingClientRect().height;
    // Control the exclusive group ourselves so its previous panel can animate closed.
    if (item.classList.contains('founder-accordion')) item.querySelector('summary > span').textContent = opening ? 'Mostrar menos' : 'Ler mais';
    if (opening) {
      items.filter(other => other !== item && other.open && item.classList.contains('service-accordion') && other.classList.contains('service-accordion')).forEach(other => animate(other, false));
      item.open = true;
    }
    const summaryHeight = item.querySelector('summary').getBoundingClientRect().height;
    item.style.height = 'auto';
    const expanded = item.getBoundingClientRect().height;
    item.style.height = `${start}px`;
    item.style.overflow = 'hidden';
    if (opening && !previous) gsap.set(content, { opacity: 0 });
    const finish = () => {
      item.open = opening;
      item.style.removeProperty('height');
      item.style.removeProperty('overflow');
      gsap.set(content, { clearProps: 'opacity' });
      states.delete(item);
      if (item.classList.contains('founder-accordion')) {
        item.querySelector('summary').focus({ preventScroll: true });
      }
      window.ScrollTrigger?.refresh();
    };
    if (reduced.matches) { finish(); return; }
    const tween = gsap.timeline({ onComplete: finish });
    states.set(item, { opening, tween });
    tween.to(item, { height: opening ? expanded : summaryHeight, duration: .45, ease: 'power2.inOut' }, 0)
      .to(content, { opacity: opening ? 1 : 0, duration: opening ? .3 : .18, ease: 'power1.out' }, opening ? .1 : 0);
  };
  items.forEach(item => {
    item.removeAttribute('name');
    item.querySelector('summary').addEventListener('click', event => {
      event.preventDefault();
      animate(item, !(states.get(item)?.opening ?? item.open));
    });
  });
})();
