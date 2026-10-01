/**
 * @file
 * JavaScript behaviors for Facebook / LinkedIn style Post Composer.
 */

(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.kaliyattamPostComposer = {
    attach: function (context) {
      const forms = [];
      if (context instanceof Element && context.matches('.post-composer-form')) {
        forms.push(...once('kaliyattam-post-composer', [context]));
      }
      forms.push(...once('kaliyattam-post-composer', '.post-composer-form', context));

      forms.forEach(function (form) {
        const photoBtn = form.querySelector('[data-action="photo"]');
        const videoBtn = form.querySelector('[data-action="video"]');
        const emojiBtn = form.querySelector('[data-action="emoji"]');
        const tagBtn = form.querySelector('[data-action="tag"]');
        const advancedBtn = form.querySelector('[data-action="advanced"]');
        const emojiTray = form.querySelector('.post-composer-emoji-tray');
        const emojiCloseBtn = form.querySelector('.emoji-tray-close');
        const advancedDrawer = form.querySelector('.post-composer-advanced');

        /**
         * Helper to retrieve active CKEditor 5 instance for the form.
         */
        function getCKEditorInstance() {
          if (typeof Drupal.CKEditor5Instances === 'undefined') {
            return null;
          }
          const textarea = form.querySelector('textarea[name^="field_content"]');
          if (!textarea || !textarea.id) {
            return null;
          }
          if (Drupal.CKEditor5Instances.has(textarea.id)) {
            return Drupal.CKEditor5Instances.get(textarea.id);
          }
          for (const [key, instance] of Drupal.CKEditor5Instances.entries()) {
            if (instance.sourceElement === textarea || key.includes(textarea.id) || textarea.id.includes(key)) {
              return instance;
            }
          }
          const values = Array.from(Drupal.CKEditor5Instances.values());
          return values.length > 0 ? values[0] : null;
        }

        // Helper to find and trigger the CKEditor Media button
        function triggerMediaLibrary() {
          let mediaBtn = form.querySelector('.ck-button[data-cke-tooltip-text="Insert Media"], .ck-button[data-cke-tooltip-text*="Media"]') ||
                         document.querySelector('.ck-button[data-cke-tooltip-text="Insert Media"], .ck-button[data-cke-tooltip-text*="Media"]');
          if (!mediaBtn) {
            // Check if collapsed into overflow toolbar button ("Show more items")
            const overflowBtn = form.querySelector('.ck-toolbar .ck-dropdown__button[data-cke-tooltip-text*="more"]') ||
                                document.querySelector('.ck-toolbar .ck-dropdown__button[data-cke-tooltip-text*="more"]');
            if (overflowBtn) {
              overflowBtn.click();
              mediaBtn = document.querySelector('.ck-button[data-cke-tooltip-text="Insert Media"], .ck-button[data-cke-tooltip-text*="Media"]');
            }
          }
          if (mediaBtn) {
            mediaBtn.click();
            return true;
          }
          return false;
        }

        // 1. Photo Action: trigger native Media Library modal
        if (photoBtn) {
          photoBtn.addEventListener('click', function (e) {
            e.preventDefault();
            triggerMediaLibrary();
          });
        }

        // 2. Video Action: trigger media dialog or link embed
        if (videoBtn) {
          videoBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (!triggerMediaLibrary()) {
              const editor = getCKEditorInstance();
              if (editor) {
                const linkCmd = editor.commands.get('link');
                if (linkCmd && linkCmd.isEnabled) {
                  editor.execute('link');
                }
              }
            }
          });
        }

        // 3. Emoji Action: toggle inline emoji tray & insert emoji
        if (emojiBtn && emojiTray) {
          emojiBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (emojiTray.hidden) {
              emojiTray.hidden = false;
              emojiBtn.classList.add('is-active');
            } else {
              emojiTray.hidden = true;
              emojiBtn.classList.remove('is-active');
            }
          });

          if (emojiCloseBtn) {
            emojiCloseBtn.addEventListener('click', function (e) {
              e.preventDefault();
              e.stopPropagation();
              emojiTray.hidden = true;
              emojiBtn.classList.remove('is-active');
            });
          }

          // Insert emoji on button click
          const emojiButtons = emojiTray.querySelectorAll('.emoji-btn');
          emojiButtons.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
              e.preventDefault();
              e.stopPropagation();
              const emoji = btn.getAttribute('data-emoji');
              if (!emoji) return;

              const editor = getCKEditorInstance();
              if (editor) {
                editor.model.change(function (writer) {
                  const insertPosition = editor.model.document.selection.getFirstPosition();
                  writer.insertText(emoji, insertPosition);
                });
                editor.editing.view.focus();
              } else {
                // Fallback for plain textarea
                const textarea = form.querySelector('textarea[name^="field_content"]');
                if (textarea) {
                  const start = textarea.selectionStart || textarea.value.length;
                  const end = textarea.selectionEnd || textarea.value.length;
                  const text = textarea.value;
                  textarea.value = text.substring(0, start) + emoji + text.substring(end);
                  textarea.focus();
                  textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
                }
              }
            });
          });

          // Close emoji tray when clicking outside
          document.addEventListener('click', function (e) {
            if (!emojiTray.hidden && !emojiTray.contains(e.target) && !emojiBtn.contains(e.target)) {
              emojiTray.hidden = true;
              emojiBtn.classList.remove('is-active');
            }
          });
        }

        // 4. Tag Action: toggle tag drawer and scroll/focus tagify input
        if (tagBtn) {
          tagBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const tagDrawer = form.querySelector('.post-composer-tag-details');
            if (tagDrawer) {
              tagDrawer.open = !tagDrawer.open;
            }
            if (advancedDrawer && advancedDrawer.classList.contains('is-collapsed')) {
              advancedDrawer.classList.remove('is-collapsed');
              if (advancedBtn) {
                advancedBtn.classList.add('is-active');
                advancedBtn.setAttribute('aria-expanded', 'true');
              }
            }
            const tagWrapper = form.querySelector('.field--name-field-tags, .field--name-field-theyyam');
            if (tagWrapper) {
              const tagInput = tagWrapper.querySelector('.tagify__input') || tagWrapper.querySelector('input');
              if (tagInput) {
                tagInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                tagInput.focus();
              }
            }
          });
        }

        // 5. Advanced Action: toggle advanced options drawer
        if (advancedBtn && advancedDrawer) {
          advancedBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const isCollapsed = advancedDrawer.classList.contains('is-collapsed');
            if (isCollapsed) {
              advancedDrawer.classList.remove('is-collapsed');
              advancedBtn.classList.add('is-active');
              advancedBtn.setAttribute('aria-expanded', 'true');
            } else {
              advancedDrawer.classList.add('is-collapsed');
              advancedBtn.classList.remove('is-active');
              advancedBtn.setAttribute('aria-expanded', 'false');
            }
          });
        }
      });
    }
  };
})(Drupal, once);
