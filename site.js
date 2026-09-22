// Respeita a preferência por menos movimento e permite pausar o GIF.
const motion = document.querySelector('[data-gp-motion]');
if (motion) {
  const button = document.querySelector('[data-motion-toggle]');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userChoice = null;
  function update() {
    const playing = userChoice === null ? !preference.matches : userChoice;
    motion.src = playing ? 'assets/corrida-ideias.gif' : 'assets/corrida-ideias.png';
    button.textContent = playing ? 'Pausar animação' : 'Reproduzir animação';
    button.setAttribute('aria-label',button.textContent + ': corrida de ideias');
  }
  button.hidden = false;
  button.addEventListener('click',() => {
    userChoice = !(userChoice === null ? !preference.matches : userChoice);
    update();
  });
  preference.addEventListener('change',update);
  update();
}
