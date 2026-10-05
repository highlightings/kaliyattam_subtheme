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
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('near') === '1' || (urlParams.has('lat') && urlParams.has('lon'))) {
          button.classList.add('is-active');
          if (statusSpan) {
            statusSpan.textContent = Drupal.t('Location set!');
            statusSpan.style.display = 'inline-block';
          }
        }

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

      // 5. Grid / List View Switcher
      function getPreferredLayout() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('layout')) {
          const l = urlParams.get('layout');
          if (l === 'grid' || l === 'list') return l;
        }
        const saved = localStorage.getItem('kaliyattam_timeline_layout');
        if (saved === 'grid' || saved === 'list') return saved;
        return 'grid'; // Default to grid view
      }

      function applyTimelineLayout(layout) {
        // Set body attribute for clean CSS targeting across entire page
        document.body.setAttribute('data-feed-layout', layout);

        const feedWrappers = document.querySelectorAll(
          '.views-infinite-scroll-content-wrapper, .view-events .view-content, .view-timeline-site .view-content, .timeline-feed-content, [class*="js-view-dom-id"] > .view-content, .view-content:has(.timeline-feed-item), .view-content:has(.timeline-card)'
        );
        feedWrappers.forEach(function (wrapper) {
          if (layout === 'grid') {
            wrapper.classList.add('timeline-feed--grid');
            wrapper.classList.remove('timeline-feed--list');
          } else {
            wrapper.classList.remove('timeline-feed--grid');
            wrapper.classList.add('timeline-feed--list');
          }
        });

        // Set state class on the view containers so CSS can consistently style pinned attachments and list mode
        const timelineViews = document.querySelectorAll(
          '.view-timeline-site, .view-timeline-events, .view-timeline-theyyam, .view-timeline-location, .view-timeline-locations, .view-timeline-type, .view-theyyam-views, .view-events, .view:has(.timeline-card)'
        );
        timelineViews.forEach(function (view) {
          if (layout === 'grid') {
            view.classList.add('is-grid-layout');
            view.classList.remove('is-list-layout');
          } else {
            view.classList.remove('is-grid-layout');
            view.classList.add('is-list-layout');
          }
        });

        const switchButtons = document.querySelectorAll('.view-switch-btn');
        switchButtons.forEach(function (btn) {
          const btnLayout = btn.getAttribute('data-layout');
          if (btnLayout === layout) {
            btn.classList.add('is-active');
            btn.setAttribute('aria-pressed', 'true');
          } else {
            btn.classList.remove('is-active');
            btn.setAttribute('aria-pressed', 'false');
          }
        });
      }

      // Initial application on attach (covers page load and AJAX loads)
      const currentLayout = getPreferredLayout();
      applyTimelineLayout(currentLayout);

      const switcherButtons = once('timeline-view-switch', '.view-switch-btn', context);
      switcherButtons.forEach(function (button) {
        button.addEventListener('click', function (e) {
          e.preventDefault();
          const targetLayout = button.getAttribute('data-layout') || 'grid';
          localStorage.setItem('kaliyattam_timeline_layout', targetLayout);
          applyTimelineLayout(targetLayout);
        });
      });

      // 6. Search Tab Toggle for Exposed Forms
      const searchTabButtons = once('timeline-search-toggle', '.timeline-nav-tab--search', context);
      searchTabButtons.forEach(function (searchBtn) {
        const container = searchBtn.closest('.views-element-container') || searchBtn.closest('[class*="js-view-dom-id"]') || searchBtn.closest('.view') || document;
        const exposedForm = container.querySelector('.views-exposed-form') || document.querySelector('.views-exposed-form');
        if (!exposedForm) return;

        // Check if query params indicate search or filters are active
        const urlParams = new URLSearchParams(window.location.search);
        const hasFilterActive = urlParams.has('search') || urlParams.has('place') || (urlParams.has('type') && urlParams.get('type') !== 'All');
        if (hasFilterActive) {
          exposedForm.classList.add('is-open');
          searchBtn.classList.add('is-active');
          searchBtn.setAttribute('aria-expanded', 'true');
        }

        searchBtn.addEventListener('click', function (e) {
          e.preventDefault();
          const willOpen = !exposedForm.classList.contains('is-open');
          exposedForm.classList.toggle('is-open', willOpen);
          searchBtn.classList.toggle('is-active', willOpen);
          searchBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');

          if (willOpen) {
            const firstInput = exposedForm.querySelector('input[type="text"]:not([type="hidden"]), select');
            if (firstInput) {
              setTimeout(function () {
                firstInput.focus();
              }, 100);
            }
          }
        });
      });

      // 6b. Comments Collapsible Toggle
      const commentsButtons = once('comments-scroll-toggle', '.comments-scroll-btn', context);
      commentsButtons.forEach(function (btn) {
        const commentsSection = document.querySelector('.node-comments-section');
        if (!commentsSection) return;

        btn.addEventListener('click', function (e) {
          e.preventDefault();
          const willOpen = !commentsSection.classList.contains('is-open');
          commentsSection.classList.toggle('is-open', willOpen);
          btn.classList.toggle('is-active', willOpen);
          btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');

          if (willOpen) {
            setTimeout(function () {
              const formWrapper = commentsSection.querySelector('.comment-form-wrapper') || commentsSection;
              formWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
              const firstInput = commentsSection.querySelector('textarea, input[type="text"]:not([type="hidden"])');
              if (firstInput) {
                setTimeout(function () {
                  firstInput.focus();
                }, 350);
              }
            }, 60);
          }
        });
      });

      // Automatically open comments if page has #comments or #comment in URL hash
      if (window.location.hash && (window.location.hash === '#comments' || window.location.hash.startsWith('#comment'))) {
        const commentsSection = document.querySelector('.node-comments-section');
        if (commentsSection) {
          commentsSection.classList.add('is-open');
          const btn = document.querySelector('.comments-scroll-btn');
          if (btn) {
            btn.classList.add('is-active');
            btn.setAttribute('aria-expanded', 'true');
          }
          setTimeout(function () {
            const target = document.querySelector(window.location.hash) || commentsSection;
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
        }
      }

      // 7. Multi-image Slider (Flickity style matching released.in)
      const mediaGrids = once('timeline-media-slider', '.timeline-card-media-grid', context);
      mediaGrids.forEach(function (grid) {
        let items = [];
        if (grid.children.length > 1) {
          items = Array.from(grid.children);
        } else if (grid.children.length === 1 && grid.firstElementChild.children.length > 1) {
          items = Array.from(grid.firstElementChild.children);
        } else {
          const directFieldItems = grid.querySelectorAll(':scope > .field__item, :scope > .media, :scope > article, :scope > a');
          if (directFieldItems.length > 1) {
            items = Array.from(directFieldItems);
          } else {
            const allFieldItems = grid.querySelectorAll('.field__item');
            if (allFieldItems.length > 1) {
              items = Array.from(allFieldItems);
            }
          }
        }

        if (items.length <= 1) {
          return; // Single image: keep as static image
        }

        const slider = document.createElement('div');
        slider.className = 'timeline-media-slider flickity-enabled is-draggable';
        slider.setAttribute('tabindex', '0');
        slider.setAttribute('role', 'region');
        slider.setAttribute('aria-label', Drupal.t('Image slider'));

        const viewport = document.createElement('div');
        viewport.className = 'flickity-viewport';

        const track = document.createElement('div');
        track.className = 'flickity-slider';

        const cells = [];
        items.forEach(function (item, index) {
          const cell = document.createElement('div');
          cell.className = 'flickity-cell' + (index === 0 ? ' is-selected' : '');
          cell.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');
          cell.appendChild(item);
          track.appendChild(cell);
          cells.push(cell);
        });

        viewport.appendChild(track);
        slider.appendChild(viewport);

        // Previous button (matching released.in)
        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'flickity-button flickity-prev-next-button previous';
        prevBtn.setAttribute('aria-label', Drupal.t('Previous slide'));
        prevBtn.innerHTML = '<svg class="flickity-button-icon" viewBox="0 0 100 100" aria-hidden="true"><title>Previous</title><path d="M 10,50 L 60,100 L 70,90 L 30,50 L 70,10 L 60,0 Z" class="arrow"></path></svg>';
        slider.appendChild(prevBtn);

        // Next button (matching released.in)
        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'flickity-button flickity-prev-next-button next';
        nextBtn.setAttribute('aria-label', Drupal.t('Next slide'));
        nextBtn.innerHTML = '<svg class="flickity-button-icon" viewBox="0 0 100 100" aria-hidden="true"><title>Next</title><path d="M 10,50 L 60,100 L 70,90 L 30,50 L 70,10 L 60,0 Z" class="arrow" transform="translate(100, 100) rotate(180)"></path></svg>';
        slider.appendChild(nextBtn);

        // Page dots
        const dotsList = document.createElement('ol');
        dotsList.className = 'flickity-page-dots';
        dotsList.setAttribute('role', 'tablist');

        const dots = [];
        cells.forEach(function (c, idx) {
          const dot = document.createElement('li');
          dot.className = 'flickity-page-dot' + (idx === 0 ? ' is-selected' : '');
          dot.setAttribute('role', 'tab');
          dot.setAttribute('aria-label', Drupal.t('Slide @num of @total', { '@num': idx + 1, '@total': cells.length }));
          dot.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
          dotsList.appendChild(dot);
          dots.push(dot);

          dot.addEventListener('click', function (e) {
            e.preventDefault();
            goToSlide(idx);
          });
        });
        slider.appendChild(dotsList);

        // Replace grid content with slider
        grid.innerHTML = '';
        grid.appendChild(slider);

        let currentIndex = 0;
        const total = cells.length;

        function goToSlide(idx) {
          if (idx < 0) {
            currentIndex = total - 1;
          } else if (idx >= total) {
            currentIndex = 0;
          } else {
            currentIndex = idx;
          }

          track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';

          cells.forEach(function (cell, i) {
            const isCur = i === currentIndex;
            cell.classList.toggle('is-selected', isCur);
            cell.setAttribute('aria-hidden', isCur ? 'false' : 'true');
          });

          dots.forEach(function (dot, i) {
            const isCur = i === currentIndex;
            dot.classList.toggle('is-selected', isCur);
            dot.setAttribute('aria-selected', isCur ? 'true' : 'false');
          });
        }

        prevBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          goToSlide(currentIndex - 1);
        });

        nextBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          goToSlide(currentIndex + 1);
        });

        // Pointer / touch swipe support
        let startX = 0;
        let isPointerDown = false;
        let hasMoved = false;

        viewport.addEventListener('pointerdown', function (e) {
          startX = e.clientX;
          isPointerDown = true;
          hasMoved = false;
        });

        viewport.addEventListener('pointermove', function (e) {
          if (isPointerDown && Math.abs(e.clientX - startX) > 5) {
            hasMoved = true;
          }
        });

        viewport.addEventListener('pointerup', function (e) {
          if (!isPointerDown) return;
          isPointerDown = false;
          const diff = e.clientX - startX;
          if (diff > 40) {
            goToSlide(currentIndex - 1);
          } else if (diff < -40) {
            goToSlide(currentIndex + 1);
          }
        });

        viewport.addEventListener('click', function (e) {
          if (hasMoved) {
            e.preventDefault();
            e.stopPropagation();
          }
        }, true);

        // Keyboard arrow navigation
        slider.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowLeft') {
            goToSlide(currentIndex - 1);
          } else if (e.key === 'ArrowRight') {
            goToSlide(currentIndex + 1);
          }
        });
      });
    }
  };

  /**
   * Behavior for Wikipedia-style Vector page toolbar:
   * - Interactive Map tab smooth-scrolling & Leaflet map recalculation
   * - More dropdown visibility management and click-outside dismissal
   */
  Drupal.behaviors.kaliyattamVectorToolbar = {
    attach: function (context) {
      // 1. More Dropdown visibility and outside click handler
      const dropdowns = once('vector-tools-dropdown', '.vector-tools-dropdown', context);
      dropdowns.forEach(function (dropdown) {
        const rightNav = dropdown.closest('#right-navigation');
        const container = dropdown.closest('.vector-page-toolbar-container');

        dropdown.addEventListener('toggle', function () {
          if (dropdown.open) {
            if (rightNav) rightNav.classList.add('has-dropdown-open');
            if (container) container.classList.add('has-dropdown-open');
          } else {
            if (rightNav) rightNav.classList.remove('has-dropdown-open');
            if (container) container.classList.remove('has-dropdown-open');
          }
        });

        // Close dropdown when any link inside is clicked
        dropdown.querySelectorAll('.vector-tools-menu a').forEach(function (link) {
          link.addEventListener('click', function () {
            dropdown.removeAttribute('open');
            if (rightNav) rightNav.classList.remove('has-dropdown-open');
            if (container) container.classList.remove('has-dropdown-open');
          });
        });
      });

      // Global document listener to close open dropdowns when clicking outside
      if (!window._kaliyattamDropdownListenerAttached) {
        window._kaliyattamDropdownListenerAttached = true;
        document.addEventListener('click', function (e) {
          const openDropdowns = document.querySelectorAll('.vector-tools-dropdown[open]');
          openDropdowns.forEach(function (dropdown) {
            if (!dropdown.contains(e.target)) {
              dropdown.removeAttribute('open');
              const rightNav = dropdown.closest('#right-navigation');
              const container = dropdown.closest('.vector-page-toolbar-container');
              if (rightNav) rightNav.classList.remove('has-dropdown-open');
              if (container) container.classList.remove('has-dropdown-open');
            }
          });
        });

        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') {
            const openDropdowns = document.querySelectorAll('.vector-tools-dropdown[open]');
            openDropdowns.forEach(function (dropdown) {
              dropdown.removeAttribute('open');
              const rightNav = dropdown.closest('#right-navigation');
              const container = dropdown.closest('.vector-page-toolbar-container');
              if (rightNav) rightNav.classList.remove('has-dropdown-open');
              if (container) container.classList.remove('has-dropdown-open');
            });
          }
        });
      }

      // 2. Temple Map Tab interaction
      const mapTabs = once('vector-map-tab', '#ca-map a', context);
      mapTabs.forEach(function (mapLink) {
        mapLink.addEventListener('click', function (e) {
          const mapSection = document.getElementById('temple-map');
          if (mapSection) {
            e.preventDefault();
            mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Activate Map tab and deactivate other tabs in toolbar
            const toolbarTabs = mapLink.closest('#right-navigation');
            if (toolbarTabs) {
              toolbarTabs.querySelectorAll('li').forEach(function (li) {
                li.classList.remove('selected', 'is-active');
                const a = li.querySelector('a');
                if (a) a.classList.remove('is-active');
              });
              const caMap = document.getElementById('ca-map');
              if (caMap) {
                caMap.classList.add('selected', 'is-active');
                mapLink.classList.add('is-active');
              }
            }

            // Update URL hash without harsh jumping
            if (window.history && window.history.pushState) {
              window.history.pushState(null, '', '#temple-map');
            }

            // Trigger Leaflet map invalidateSize to prevent rendering glitches
            setTimeout(function () {
              window.dispatchEvent(new Event('resize'));
              if (window.Drupal && Drupal.Leaflet && Drupal.Leaflet.maps) {
                Object.values(Drupal.Leaflet.maps).forEach(function (map) {
                  if (map && typeof map.invalidateSize === 'function') {
                    map.invalidateSize();
                  }
                });
              }
            }, 300);
          }
        });
      });

      // 3. If View tab clicked while on hash #temple-map, return to top cleanly
      const viewTabs = once('vector-view-tab', '#ca-view a', context);
      viewTabs.forEach(function (viewLink) {
        viewLink.addEventListener('click', function (e) {
          if (window.location.hash === '#temple-map') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (window.history && window.history.pushState) {
              window.history.pushState(null, '', window.location.pathname);
            }
            const toolbarTabs = viewLink.closest('#right-navigation');
            if (toolbarTabs) {
              toolbarTabs.querySelectorAll('li').forEach(function (li) {
                li.classList.remove('selected', 'is-active');
                const a = li.querySelector('a');
                if (a) a.classList.remove('is-active');
              });
              const caView = document.getElementById('ca-view');
              if (caView) {
                caView.classList.add('selected', 'is-active');
                viewLink.classList.add('is-active');
              }
            }
          }
        });
      });

      // 4. Initial URL Hash handler for #temple-map on page load
      if (window.location.hash === '#temple-map') {
        const caMap = document.getElementById('ca-map');
        const caView = document.getElementById('ca-view');
        if (caMap) {
          if (caView) {
            caView.classList.remove('selected', 'is-active');
            const a = caView.querySelector('a');
            if (a) a.classList.remove('is-active');
          }
          caMap.classList.add('selected', 'is-active');
          const aMap = caMap.querySelector('a');
          if (aMap) aMap.classList.add('is-active');

          setTimeout(function () {
            window.dispatchEvent(new Event('resize'));
            if (window.Drupal && Drupal.Leaflet && Drupal.Leaflet.maps) {
              Object.values(Drupal.Leaflet.maps).forEach(function (map) {
                if (map && typeof map.invalidateSize === 'function') {
                  map.invalidateSize();
                }
              });
            }
          }, 350);
        }
      }
    }
  };
})(Drupal, once);

