/**
 * @file
 * Dark / Light Theme switcher for Kaliyattam Arts Theme.
 * Zero jQuery, pure vanilla ES6+ with Drupal.behaviors.
 */

(function (Drupal) {
  'use strict';

  Drupal.behaviors.kaliyattamThemeToggle = {
    attach: function (context) {
      const toggleBtn = context.querySelector('#theme-toggle') || document.querySelector('#theme-toggle');
      if (!toggleBtn || toggleBtn.dataset.themeInit) {
        return;
      }
      toggleBtn.dataset.themeInit = 'true';

      const html = document.documentElement;

      const updateButtonState = (theme) => {
        const isDark = theme === 'dark';
        toggleBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        toggleBtn.setAttribute('data-current-theme', theme);
        const label = toggleBtn.querySelector('.theme-toggle-label');
        if (label) {
          label.textContent = isDark
            ? (Drupal.t ? Drupal.t('Light') : 'Light')
            : (Drupal.t ? Drupal.t('Dark') : 'Dark');
        }
      };

      const setTheme = (theme) => {
        html.setAttribute('data-theme', theme);
        if (theme === 'dark') {
          html.classList.add('dark');
        } else {
          html.classList.remove('dark');
        }
        try {
          localStorage.setItem('kaliyattam_theme', theme);
        } catch (e) {}
        updateButtonState(theme);
      };

      // Initialize button state from current html attribute
      const currentTheme = html.getAttribute('data-theme') || 'light';
      updateButtonState(currentTheme);

      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const activeTheme = html.getAttribute('data-theme') || 'light';
        const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
      });

      // Listen for OS system theme changes if user hasn't explicitly set preference
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          if (!localStorage.getItem('kaliyattam_theme')) {
            setTheme(e.matches ? 'dark' : 'light');
          }
        });
      }
    }
  };
})(Drupal);
