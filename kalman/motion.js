import { animate } from './vendor.js';

const ease = [0.22, 1, 0.36, 1];

// Motion enhances already-readable content. Numerical state never waits for it.
export function createProjectMotion(onPreferenceChange) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Map(), pending = new Set();
  const clean = element => {
    element.style.removeProperty('opacity');
    element.style.removeProperty('transform');
    element.removeAttribute('data-reveal-pending');
  };
  function finish(element) {
    running.get(element)?.complete();
    running.delete(element); clean(element);
  }
  function play(element, frames, duration = 0.55, delay = 0) {
    finish(element);
    if (preference.matches) return;
    const control = animate(element, frames, { duration, delay, ease });
    running.set(element, control);
    Promise.resolve(control).then(() => {
      if (running.get(element) === control) { running.delete(element); clean(element); }
    });
  }
  const reveal = element => {
    if (!pending.delete(element)) return;
    observer.unobserve(element);
    play(element, { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0px)'] }, 0.65, Number(element.dataset.revealDelay || 0));
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) reveal(entry.target);
  }, { rootMargin: '0px 0px -24px 0px', threshold: 0.05 });
  const groups = [
    '.section-heading', '.chart-panel', '.result-story,.results-table-wrap',
    '.inputs>div', '.fusion-node', '.outputs>div', '.engineering-notes article', '.project-close',
  ];
  if (!preference.matches) {
    for (const selector of groups) {
      document.querySelectorAll(selector).forEach((element, i) => {
        if (element.getBoundingClientRect().top < innerHeight - 24) return;
        element.dataset.revealDelay = String(Math.min(i % 4, 3) * 0.055);
        element.dataset.revealPending = 'true';
        element.style.opacity = '0'; element.style.transform = 'translateY(18px)';
        pending.add(element); observer.observe(element);
      });
    }
    play(document.querySelector('.hero-copy'), { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0px)'] }, 0.75);
    play(document.querySelector('.hero-aside'), { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0px)'] }, 0.75, 0.12);
  }
  // Keyboard focus makes its containing section visible immediately.
  document.addEventListener('focusin', event => {
    for (const element of [...pending]) if (element.contains(event.target)) {
      pending.delete(element); observer.unobserve(element); finish(element);
    }
    for (const element of [...running.keys()]) if (element.contains(event.target)) finish(element);
  });

  const bar = document.querySelector('.scenario-bar');
  const indicator = document.createElement('span');
  indicator.className = 'scenario-indicator'; indicator.setAttribute('aria-hidden', 'true');
  bar.append(indicator); bar.dataset.enhanced = 'true';
  function moveIndicator(animateMove = false) {
    const selected = bar.querySelector('[aria-pressed="true"]');
    if (!selected) return;
    const left = selected.offsetLeft, width = selected.offsetWidth;
    const before = indicator.getBoundingClientRect();
    const previousLeft = before.left - bar.getBoundingClientRect().left;
    finish(indicator);
    indicator.style.width = width + 'px';
    indicator.style.transform = `translateX(${left}px)`;
    if (animateMove && !preference.matches) {
      const control = animate(indicator, { transform: [`translateX(${previousLeft}px)`, `translateX(${left}px)`], width: [before.width + 'px', width + 'px'] }, { duration: 0.32, ease });
      running.set(indicator, control);
      Promise.resolve(control).then(() => { if (running.get(indicator) === control) running.delete(indicator); });
    }
  }
  const resize = new ResizeObserver(() => moveIndicator()); resize.observe(bar);
  moveIndicator();

  const details = document.querySelector('.technical-details');
  const summary = details.querySelector('summary'), content = details.querySelector(':scope>div');
  let disclosure, wantedOpen = details.open;
  function settleDisclosure() {
    disclosure?.cancel(); disclosure = null;
    details.open = wantedOpen;
    content.style.removeProperty('height'); content.style.removeProperty('overflow');
    summary.setAttribute('aria-expanded', String(wantedOpen));
  }
  summary.setAttribute('aria-expanded', String(wantedOpen));
  summary.addEventListener('click', event => {
    event.preventDefault();
    const from = details.open ? content.getBoundingClientRect().height : 0;
    disclosure?.cancel();
    wantedOpen = !wantedOpen;
    summary.setAttribute('aria-expanded', String(wantedOpen));
    if (preference.matches) { settleDisclosure(); return; }
    details.open = true; content.style.height = 'auto'; content.style.overflow = 'hidden';
    const to = wantedOpen ? content.getBoundingClientRect().height : 0;
    content.style.height = from + 'px';
    const control = animate(content, { height: [from + 'px', to + 'px'] }, { duration: 0.28, ease });
    disclosure = control;
    Promise.resolve(control).then(() => { if (disclosure === control) settleDisclosure(); });
  });

  const links = [...document.querySelectorAll('.masthead a[href^="#"]')];
  const sections = links.map(link => document.querySelector(link.hash)).filter(Boolean);
  let scrollFrame = 0;
  const progress = document.createElement('span'); progress.className = 'reading-progress'; progress.setAttribute('aria-hidden', 'true');
  document.querySelector('.masthead').append(progress);
  function updateReading() {
    scrollFrame = 0;
    const available = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${available ? Math.min(1, Math.max(0, scrollY / available)) : 0})`;
    let current = null;
    for (const section of sections) if (section.getBoundingClientRect().top <= 160) current = section;
    links.forEach(link => {
      if (current && link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateReading); }, { passive: true });
  window.addEventListener('resize', updateReading); updateReading();
  preference.addEventListener('change', () => {
    for (const element of pending) clean(element);
    pending.clear(); observer.disconnect();
    for (const element of [...running.keys()]) finish(element);
    settleDisclosure(); moveIndicator();
    onPreferenceChange(preference.matches);
  });
  return {
    scenarioChanged() {
      moveIndicator(true);
      for (const element of document.querySelectorAll('.scene-wrap,.telemetry,.chart')) {
        play(element, { opacity: [0.58, 1] }, 0.32);
      }
      play(document.querySelector('.scene-top strong'), { opacity: [0, 1], transform: ['translateY(5px)', 'translateY(0px)'] }, 0.35);
    },
  };
}
