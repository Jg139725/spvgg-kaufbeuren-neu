(() => {
  const menuButton = document.querySelector('.tg-menu-button');
  const navigation = document.querySelector('#tg-navigation');

  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => {
      const isOpen = navigation.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });
  }

  const dialog = document.querySelector('#tg-lightbox');
  const dialogImage = dialog?.querySelector('img');
  const closeButton = dialog?.querySelector('.tg-lightbox-close');

  document.querySelectorAll('[data-gallery-image]').forEach((button) => {
    const image = button.querySelector('img');

    image?.addEventListener('error', () => {
      button.hidden = true;
    });

    button.addEventListener('click', () => {
      if (!dialog || !dialogImage || !image?.complete || !image.naturalWidth) return;

      dialogImage.src = button.dataset.galleryImage ?? image.src;
      dialog.showModal();
    });
  });

  closeButton?.addEventListener('click', () => dialog?.close());

  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
})();
