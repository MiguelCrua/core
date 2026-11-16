(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mouse = matchMedia('(hover: hover) and (pointer: fine)');
  const loader = document.querySelector('.preloader');
  const hero = document.querySelector('.hero');
  const photos = [...document.querySelectorAll('.hero .photo')];
  const letters = document.querySelectorAll('.wordmark .loader-letter');
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const showStatic = () => {
    document.body.classList.add('ready');
    loader.hidden = true;
  };
  if (!gsap || !ScrollTrigger || reduced.matches) { showStatic(); return; }
  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add('gsap-motion');
  let closed = false;
  // Keep the complete text accessible; split only its decorative visual copy.
  const textTargets = document.querySelectorAll('h2[data-reveal], .service h3[data-reveal], .service-note, .copy p, .contact-label, .contact-value, .hero-caption p');
  textTargets.forEach(target => {
    const text = target.innerText;
    const visual = document.createElement('span');
    visual.className = 'text-visual';
    visual.setAttribute('aria-hidden', 'true');
    while (target.firstChild) visual.append(target.firstChild);
    const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let index = 0;
    const count = Array.from(text).filter(char => !/\s/.test(char)).length;
    const isTitle = (target.tagName === 'H2' || target.tagName === 'H3') || target.closest('.hero-caption');
    if (isTitle) target.classList.add('title-motion');
    const step = Math.min(isTitle ? 28 : 5, 800 / Math.max(count, 1));
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (/^\s*$/.test(part)) { fragment.append(document.createTextNode(part)); return; }
        const word = document.createElement('span');
        word.className = 'motion-word';
        Array.from(part).forEach(char => {
          const letter = document.createElement('span');
          letter.className = 'motion-char';
          letter.textContent = char;
          letter.style.setProperty('--delay', `${Math.round(index++ * step)}ms`);
          word.append(letter);
        });
        fragment.append(word);
      });
      node.replaceWith(fragment);
    });
    const accessible = document.createElement('span');
    accessible.className = 'sr-only';
    accessible.textContent = text;
    target.append(accessible, visual);
    target.classList.add('text-motion');
    target.dataset.motionStep = step / 1000;
  });

  const revealText = target => {
    const chars = target.querySelectorAll('.motion-char');
    return gsap.to(chars, { yPercent: 0, opacity: 1, duration: .75,
      ease: 'expo.out', stagger: Number(target.dataset.motionStep), overwrite: 'auto' });
  };
  textTargets.forEach(target => {
    gsap.set(target.querySelectorAll('.motion-char'), {
      yPercent: target.classList.contains('title-motion') ? 110 : 65, opacity: 0
    });
    if (!target.closest('.hero-caption')) ScrollTrigger.create({ trigger: target,
      start: 'top 94%', once: true, onEnter: () => revealText(target) });
  });
  document.querySelectorAll('.placeholder[data-reveal]').forEach(target => {
    gsap.fromTo(target, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out',
      scrollTrigger: { trigger: target, start: 'top 95%', once: true }
    });
  });
  gsap.fromTo('.workbook-cover', { y: 32, opacity: 0 }, {
    y: 0, opacity: 1, duration: 1.4, ease: 'expo.out',
    scrollTrigger: { trigger: '.workbook-cover', start: 'top 94%', once: true }
  });
  const footer = document.querySelector('.footer-inner');
  const footerMono = footer.querySelector('.footer-rise');
  const footerLetters = footer.querySelectorAll('.footer-glyph');
  gsap.set([footerMono, ...footerLetters], { yPercent: 110, opacity: 0 });
  gsap.timeline({ scrollTrigger: { trigger: footer, start: 'top 94%', once: true } })
    .to(footerMono, { yPercent: 0, opacity: 1, duration: .75, ease: 'expo.out' }, 0)
    .to(footerLetters, { yPercent: 0, opacity: 1, duration: .75, stagger: .08, ease: 'expo.out' }, .12);

  gsap.set(letters, { yPercent: 115 });
  gsap.set(photos, { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set('.photo-inner', { yPercent: 25 });
  const intro = gsap.timeline();
  intro.to(letters, { yPercent: 0, duration: .9, ease: 'expo.out', stagger: .06 })
    .addLabel('second', '+=.35');
  [...letters].forEach((letter, i) => {
    const start = 1.43 + i * .06;
    intro.to(letter, { yPercent: -115, duration: .6, ease: 'expo.in' }, start)
      .set(letter, { yPercent: 115 }, start + .6)
      .to(letter, { yPercent: 0, duration: .9, ease: 'expo.out' }, start + .6);
  });
  intro.to(loader, { yPercent: -100, duration: 1.3, ease: 'expo.inOut' }, 2.575)
    .call(() => { closed = true; document.body.classList.add('ready'); }, [], 3.025)
    .call(() => { loader.hidden = true; }, [], 3.875);
  const order = ['a','d','c','b','e'];
  order.forEach((slot, i) => {
    const photo = document.querySelector('.photo.' + slot);
    intro.to(photo, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out' }, 3.025 + i * .1)
      .to(photo.querySelector('.photo-inner'), { yPercent: 0, duration: 1.4, ease: 'expo.out' }, 3.025 + i * .1);
  });
  document.querySelectorAll('.hero-caption p').forEach(target => {
    intro.to(target.querySelectorAll('.motion-char'), { yPercent: 0, opacity: 1,
      duration: .75, ease: 'expo.out', stagger: Number(target.dataset.motionStep) }, 3.025);
  });

  const depths = [10, -14, 12, -8, 16];
  const follow = photos.map(photo => ({
    x: gsap.quickTo(photo, 'x', { duration: .7, ease: 'power3.out' }),
    y: gsap.quickTo(photo, 'y', { duration: .7, ease: 'power3.out' })
  }));
  const reset = () => follow.forEach(f => { f.x(0); f.y(0); });
  hero.addEventListener('pointermove', event => {
    if (!closed || reduced.matches || !mouse.matches || event.pointerType !== 'mouse') return;
    const b = hero.getBoundingClientRect();
    const x = gsap.utils.clamp(-1, 1, (event.clientX - b.left) / b.width * 2 - 1);
    const y = gsap.utils.clamp(-1, 1, (event.clientY - b.top) / b.height * 2 - 1);
    follow.forEach((f, i) => { f.x(x * depths[i]); f.y(y * depths[i] * .65); });
  }, { passive: true });
  hero.addEventListener('pointerleave', reset);
  window.addEventListener('blur', reset);
  mouse.addEventListener('change', reset);
  reduced.addEventListener('change', event => {
    if (!event.matches) return;
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    gsap.globalTimeline.getChildren().forEach(animation => animation.kill());
    gsap.set(letters, { yPercent: 0 });
    gsap.set(photos, { x: 0, y: 0, clipPath: 'inset(0% 0% 0% 0%)' });
    gsap.set('.photo-inner', { yPercent: 0 });
    gsap.set('.motion-char,.footer-rise,.footer-glyph', { yPercent: 0, opacity: 1 });
    gsap.set('.placeholder', { clipPath: 'inset(0% 0% 0% 0%)' });
    gsap.set('.workbook-cover', { y: 0, opacity: 1 });
    showStatic();
  });
  footer.addEventListener('focusin', () => {
    gsap.to([footerMono, ...footerLetters], { yPercent: 0, opacity: 1, duration: .3, overwrite: true });
  });
})();
