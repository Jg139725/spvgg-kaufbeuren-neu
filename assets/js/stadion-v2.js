(() => {
  const lightbox = document.querySelector('.stadium-lightbox');
  if (!lightbox) return;

  const image = lightbox.querySelector('img');
  const closeButton = lightbox.querySelector('.stadium-lightbox-close');
  const triggers = document.querySelectorAll('.lightbox-trigger');

  const close = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    image.removeAttribute('src');
    document.body.style.overflow = '';
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const source = trigger.dataset.full;
      const thumb = trigger.querySelector('img');
      if (!source) return;

      image.src = source;
      image.alt = thumb ? thumb.alt : 'Parkstadion Kaufbeuren';
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeButton.focus();
    });
  });

  closeButton.addEventListener('click', close);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox.classList.contains('open')) close();
  });
})();
