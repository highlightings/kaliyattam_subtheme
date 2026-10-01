/**
 * @file
 * JavaScript behaviors for Kaliyattam Timelines & Feeds.
 * Provides copy link feedback, click-to-play video embeds, and geolocation Near Me helper.
 */

(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.kaliyattamTimelineFeeds = {
    attach: function (context) {
      // 1. Copy Link Action
      const copyButtons = once('timeline-copy-link', '.btn-copy-link', context);
      copyButtons.forEach(function (button) {
        button.addEventListener('click', function (e) {
          e.preventDefault();
          const relUrl = button.getAttribute('data-url') || window.location.href;
          const fullUrl = new URL(relUrl, window.location.origin).href;

          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(fullUrl).then(showToast).catch(function () {
              fallbackCopy(fullUrl);
            });
          } else {
            fallbackCopy(fullUrl);
          }

          function fallbackCopy(text) {
            const tempInput = document.createElement('input');
            tempInput.value = text;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            showToast();
          }

          function showToast() {
            let toast = document.querySelector('.timeline-toast');
            if (!toast) {
              toast = document.createElement('div');
              toast.className = 'timeline-toast';
              toast.setAttribute('role', 'status');
              toast.setAttribute('aria-live', 'polite');
              document.body.appendChild(toast);
            }
            toast.textContent = Drupal.t('Link copied to clipboard!');
            toast.classList.add('is-visible');
            setTimeout(function () {
              toast.classList.remove('is-visible');
            }, 2500);
          }
        });
      });

      // 2. Video Click-to-Play Embed
      const videoCards = once('timeline-video-play', '.timeline-video-card', context);
      videoCards.forEach(function (card) {
        card.addEventListener('click', function (e) {
          e.preventDefault();
          const embedUrl = card.getAttribute('data-embed-url');
          if (embedUrl) {
            const iframe = document.createElement('iframe');
            iframe.setAttribute('src', embedUrl + (embedUrl.includes('?') ? '&' : '?') + 'autoplay=1');
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            card.innerHTML = '';
            card.appendChild(iframe);
          }
        });
      });

      // 3. Geolocation "Near Me" Helper
      const nearMeButtons = once('timeline-near-me', '#btn-near-me', context);
      nearMeButtons.forEach(function (button) {
        const statusSpan = document.getElementById('near-me-status');
        button.addEventListener('click', function (e) {
          e.preventDefault();

          if (!navigator.geolocation) {
            if (statusSpan) statusSpan.textContent = Drupal.t('Geolocation is not supported by your browser.');
            return;
          }

          if (statusSpan) statusSpan.textContent = Drupal.t('Locating...');
          button.classList.add('is-loading');

          navigator.geolocation.getCurrentPosition(
            function (position) {
              button.classList.remove('is-loading');
              button.classList.add('is-active');
              if (statusSpan) statusSpan.textContent = Drupal.t('Location set!');

              // Locate exposed proximity fields in the view form
              const exposedForm = button.closest('.view').querySelector('form');
              if (exposedForm) {
                // Check for geofield proximity inputs or place input
                const latInput = exposedForm.querySelector('input[name*="lat"], input[name*="origin[lat]"]');
                const lonInput = exposedForm.querySelector('input[name*="lon"], input[name*="origin[lon]"]');
                if (latInput && lonInput) {
                  latInput.value = position.coords.latitude.toFixed(6);
                  lonInput.value = position.coords.longitude.toFixed(6);
                  exposedForm.dispatchEvent(new Event('submit', { bubbles: true }));
                } else {
                  // Fallback: reload with coordinates in query string
                  const url = new URL(window.location.href);
                  url.searchParams.set('lat', position.coords.latitude.toFixed(6));
                  url.searchParams.set('lon', position.coords.longitude.toFixed(6));
                  url.searchParams.set('near', '1');
                  window.location.href = url.toString();
                }
              }
            },
            function (error) {
              button.classList.remove('is-loading');
              let message = Drupal.t('Could not get location.');
              if (error.code === error.PERMISSION_DENIED) {
                message = Drupal.t('Location permission denied. Use place search below.');
              }
              if (statusSpan) statusSpan.textContent = message;
            },
            { timeout: 10000, enableHighAccuracy: true }
          );
        });
      });

      // 4. Accessibility helper for Flag Links (aria-pressed)
      const flagLinks = once('timeline-flag-aria', '.timeline-card-actions a.flag-link', context);
      flagLinks.forEach(function (link) {
        const isFlagged = link.classList.contains('action-unflag');
        link.setAttribute('role', 'button');
        link.setAttribute('aria-pressed', isFlagged ? 'true' : 'false');
      });
    }
  };
})(Drupal, once);
