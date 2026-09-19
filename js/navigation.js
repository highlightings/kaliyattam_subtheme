/**
 * @file
 * Accessible Mobile Navigation for Kaliyattam Arts Theme.
 * Zero jQuery, pure vanilla ES6+ with Drupal.behaviors.
 */

(function (Drupal) {
  'use strict';

  Drupal.behaviors.kaliyattamNavigation = {
    attach: function (context) {
      const navToggle = context.querySelector('.nav-toggle');
      const navContainer = context.querySelector('.nav-container');

      if (!navToggle || !navContainer || navToggle.dataset.kaliyattamNavInit) {
        return;
      }

      navToggle.dataset.kaliyattamNavInit = 'true';

      const toggleMenu = (open) => {
        const isOpen = open !== undefined ? open : navToggle.getAttribute('aria-expanded') !== 'true';
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        navContainer.classList.toggle('is-open', isOpen);
      };

      navToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
      });

      // Close on clicking outside
      document.addEventListener('click', (e) => {
        if (navContainer.classList.contains('is-open') && !navContainer.contains(e.target) && !navToggle.contains(e.target)) {
          toggleMenu(false);
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navContainer.classList.contains('is-open')) {
          toggleMenu(false);
          navToggle.focus();
        }
      });

      // Close mobile menu on resizing past mobile breakpoint
      window.addEventListener('resize', () => {
        if (window.innerWidth >= 992 && navContainer.classList.contains('is-open')) {
          toggleMenu(false);
        }
      });
    }
  };

})(Drupal);
