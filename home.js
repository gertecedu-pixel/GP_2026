// O vídeo do GP roda em loop, sem som, enquanto está visível; o botão permite pausar.
const video = document.querySelector('#gp-video');
const toggle = document.querySelector('#video-toggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let userPaused = reducedMotion.matches || Boolean(navigator.connection?.saveData);
let visible = false;
function updateVideoButton() {
  const label = video.paused ? 'Reproduzir vídeo' : 'Pausar vídeo';
  toggle.textContent = label + (video.paused ? ' ▷' : ' Ⅱ');
  toggle.setAttribute('aria-label', label);
}
async function playVideo() {
  const source = video.querySelector('source');
  if (!source.hasAttribute('src')) {
    source.src = source.dataset.src;
    video.load();
  }
  try { await video.play(); } catch { /* Mantém o pôster se autoplay não for permitido. */ }
  updateVideoButton();
}
if (video && toggle) {
  video.muted = true;
  video.loop = true;
  toggle.hidden = false;
  ['play', 'pause', 'error'].forEach(event => video.addEventListener(event, updateVideoButton));
  toggle.addEventListener('click', () => {
    userPaused = !video.paused;
    userPaused ? video.pause() : playVideo();
  });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) { userPaused = true; video.pause(); } });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause(); else if (visible && !userPaused) playVideo();
  });
  // Só carrega e reproduz quando o vídeo aparece na tela.
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !userPaused) playVideo(); else if (!visible) video.pause();
  }, {threshold: .25}).observe(video);
  updateVideoButton();
}
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#main-nav');
if (menuButton && menu) {
  document.querySelector('.header').classList.add('menu-ready');
  const mobile = window.matchMedia('(max-width: 900px)');
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
