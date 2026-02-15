// Navigation dropdown handling
document.addEventListener('DOMContentLoaded', () => {
  const dropdownToggle = document.querySelector('.site-nav__dropdown-toggle');
  const dropdown = document.querySelector('.site-nav__dropdown');

  if (!dropdownToggle || !dropdown) {
    return;
  }

  // Toggle dropdown on button click
  dropdownToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = dropdownToggle.getAttribute('aria-expanded') === 'true';
    dropdownToggle.setAttribute('aria-expanded', !isExpanded);
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdownToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close dropdown on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdownToggle.setAttribute('aria-expanded', 'false');
      dropdownToggle.focus();
    }
  });

  // Handle arrow key navigation within dropdown
  const dropdownLinks = dropdown.querySelectorAll('.site-nav__dropdown-menu a');
  dropdownLinks.forEach((link, index) => {
    link.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextLink = dropdownLinks[index + 1] || dropdownLinks[0];
        nextLink.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevLink = dropdownLinks[index - 1] || dropdownLinks[dropdownLinks.length - 1];
        prevLink.focus();
      }
    });
  });
});
