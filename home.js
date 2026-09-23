// A abertura toca uma vez, sem som; controles continuam disponíveis.
const video = document.querySelector('#opening-video');
const toggle = document.querySelector('#video-toggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function updateVideoButton() {
  const label = video.ended ? 'Rever abertura' : video.paused ? 'Reproduzir abertura' : 'Pausar abertura';
  toggle.textContent = label + (video.paused ? ' ▷' : ' Ⅱ');
  toggle.setAttribute('aria-label', label);
}
async function playOpening() {
  const source = video.querySelector('source');
  if (!source.hasAttribute('src')) {
    source.src = source.dataset.src;
    video.load();
  }
  if (video.ended) video.currentTime = 0;
  try { await video.play(); } catch { /* Mantém o pôster se autoplay não for permitido. */ }
  updateVideoButton();
}
if (video && toggle) {
  video.muted = true;
  toggle.hidden = false;
  ['play', 'pause', 'ended', 'error'].forEach(event => video.addEventListener(event, updateVideoButton));
  toggle.addEventListener('click', () => video.paused ? playOpening() : video.pause());
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) video.pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
  if (!reducedMotion.matches && !navigator.connection?.saveData) playOpening();
  updateVideoButton();
}
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#main-nav');
if (menuButton && menu) {
  document.querySelector('.header').classList.add('menu-ready');
  const mobile = window.matchMedia('(max-width: 760px)');
  function closeMenu() {
    menu.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
  }
  function adaptMenu() { menuButton.hidden = !mobile.matches; closeMenu(); }
  menuButton.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) { closeMenu(); menuButton.focus(); }
  });
  mobile.addEventListener('change', adaptMenu);
  adaptMenu();
}
