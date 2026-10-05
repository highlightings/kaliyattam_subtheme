/**
 * @file
 * Single Directory Component: Media Carousel Controller.
 * Pure Vanilla JS, mobile touch-swipe enabled, zero jQuery.
 */

(function (Drupal) {
  'use strict';

  Drupal.behaviors.kaliyattamMediaCarouselSDC = {
    attach: function (context) {
      const carousels = context.querySelectorAll('.kaliyattam-carousel');

      carousels.forEach((carousel) => {
        if (carousel.dataset.sdcCarouselInit) {
          return;
        }
        carousel.dataset.sdcCarouselInit = 'true';

        const track = carousel.querySelector('.carousel-track');
        const slides = carousel.querySelectorAll('.carousel-slide');
        const prevBtn = carousel.querySelector('.carousel-btn-prev');
        const nextBtn = carousel.querySelector('.carousel-btn-next');
        const indicators = carousel.querySelector('.carousel-indicators');

        if (!track || slides.length <= 1) {
          if (prevBtn) prevBtn.style.display = 'none';
          if (nextBtn) nextBtn.style.display = 'none';
          if (indicators) indicators.style.display = 'none';
          return;
        }

        // Build dots dynamically if empty
        if (indicators && indicators.children.length === 0) {
          slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel-dot' + (i === 0 ? ' is-active' : '');
            dot.setAttribute('aria-label', `Slide ${i + 1}`);
            dot.setAttribute('aria-current', i === 0 ? 'true' : 'false');
            indicators.appendChild(dot);
          });
        }

        // Ensure inert and aria-hidden on inactive slides for accessibility.
        slides.forEach((slide, i) => {
          if (i === 0) {
            slide.removeAttribute('inert');
            slide.removeAttribute('aria-hidden');
          } else {
            slide.setAttribute('inert', '');
            slide.setAttribute('aria-hidden', 'true');
          }
        });

        const dots = carousel.querySelectorAll('.carousel-dot');
        let currentIndex = 0;
        const totalSlides = slides.length;

        const updateCarousel = (index) => {
          if (index < 0) {
            currentIndex = totalSlides - 1;
          } else if (index >= totalSlides) {
            currentIndex = 0;
          } else {
            currentIndex = index;
          }

          track.style.transform = `translateX(-${currentIndex * 100}%)`;

          slides.forEach((slide, i) => {
            if (i === currentIndex) {
              slide.removeAttribute('inert');
              slide.removeAttribute('aria-hidden');
            } else {
              slide.setAttribute('inert', '');
              slide.setAttribute('aria-hidden', 'true');
            }
          });

          dots.forEach((dot, i) => {
            dot.classList.toggle('is-active', i === currentIndex);
            dot.setAttribute('aria-current', i === currentIndex ? 'true' : 'false');
          });
        };

        if (prevBtn) {
          prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            updateCarousel(currentIndex - 1);
          });
        }

        if (nextBtn) {
          nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            updateCarousel(currentIndex + 1);
          });
        }

        dots.forEach((dot, i) => {
          dot.addEventListener('click', (e) => {
            e.preventDefault();
            updateCarousel(i);
          });
        });

        // Touch swipe handling for mobile
        let startX = 0;
        carousel.addEventListener('touchstart', (e) => {
          startX = e.changedTouches[0].screenX;
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
          const diff = startX - e.changedTouches[0].screenX;
          if (Math.abs(diff) > 40) {
            updateCarousel(diff > 0 ? currentIndex + 1 : currentIndex - 1);
          }
        }, { passive: true });

        // Keyboard navigation
        carousel.setAttribute('tabindex', '0');
        carousel.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowLeft') {
            updateCarousel(currentIndex - 1);
          } else if (e.key === 'ArrowRight') {
            updateCarousel(currentIndex + 1);
          }
        });
      });
    }
  };

})(Drupal);
