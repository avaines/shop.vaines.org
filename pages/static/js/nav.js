// Navigation dropdown handling
document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navWrapper = document.querySelector('.site-nav-wrapper');

  if (mobileMenuToggle && navWrapper) {
    mobileMenuToggle.addEventListener('click', () => {
      const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
      mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
      navWrapper.classList.toggle('active');
      document.body.style.overflow = !isExpanded ? 'hidden' : '';
    });

    // Close mobile menu when clicking nav links
    navWrapper.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        navWrapper.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    // Close mobile menu on window resize if open
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        navWrapper.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // Dropdown handling
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
