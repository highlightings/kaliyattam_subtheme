/**
 * @file
 * Vanilla JavaScript behaviors for Kaliyattam Node Forms (Event, Theyyam, Location).
 * Zero jQuery, pure modern ES6+.
 */

(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.kaliyattamNodeForms = {
    attach: function (context) {
      // Resolve form element whether context is document, wrapper, or form itself
      let formElements = [];
      if (context instanceof Element && context.matches('.node-form--styled')) {
        formElements = [context];
      } else {
        formElements = (context || document).querySelectorAll('.node-form--styled');
      }

      const forms = once('kaliyattam-node-forms', formElements);

      forms.forEach(function (form) {
        const advancedToggle = form.querySelector('.node-form-advanced-toggle');
        const advancedDrawer = form.querySelector('.node-form-advanced');

        if (advancedToggle && advancedDrawer) {
          advancedToggle.addEventListener('click', function (e) {
            e.preventDefault();
            const isCurrentlyCollapsed = advancedDrawer.classList.contains('is-collapsed');

            if (isCurrentlyCollapsed) {
              advancedDrawer.classList.remove('is-collapsed');
              advancedToggle.setAttribute('aria-expanded', 'true');
              advancedToggle.classList.add('is-active');

              // Focus first focusable element inside advanced drawer
              const firstInput = advancedDrawer.querySelector('input, select, textarea');
              if (firstInput) {
                firstInput.focus();
              }
            } else {
              advancedDrawer.classList.add('is-collapsed');
              advancedToggle.setAttribute('aria-expanded', 'false');
              advancedToggle.classList.remove('is-active');
            }
          });
        }
      });
    }
  };
})(Drupal, once);
