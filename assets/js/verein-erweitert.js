(() => {
  const menuButton = document.querySelector('.svk-v-menu-button');
  const navigation = document.querySelector('#svk-v-nav');
  const dropdown = document.querySelector('.svk-v-dropdown');
  const dropdownButton = document.querySelector('.svk-v-dropdown-button');

  menuButton?.addEventListener('click', () => {
    const open = navigation?.classList.toggle('is-open') ?? false;
    menuButton.setAttribute('aria-expanded', String(open));
  });

  dropdownButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = dropdown?.classList.toggle('is-open') ?? false;
    dropdownButton.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', (event) => {
    if (dropdown && !dropdown.contains(event.target)) {
      dropdown.classList.remove('is-open');
      dropdownButton?.setAttribute('aria-expanded', 'false');
    }
  });
})();
