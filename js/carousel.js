/**
 * @file
 * Touch-enabled Vanilla JS Media Carousel for Kaliyattam Arts Theme.
 * Zero jQuery, mobile-first swipe support, accessible.
 */

(function (Drupal) {
  'use strict';

  Drupal.behaviors.kaliyattamCarousel = {
    attach: function (context) {
      const carousels = context.querySelectorAll('.kaliyattam-carousel');

      carousels.forEach((carousel) => {
        if (carousel.dataset.carouselInit) {
          return;
        }
        carousel.dataset.carouselInit = 'true';

        const track = carousel.querySelector('.carousel-track');
        const slides = carousel.querySelectorAll('.carousel-slide');
        const dots = carousel.querySelectorAll('.carousel-dot');
        const prevBtn = carousel.querySelector('.carousel-btn-prev');
        const nextBtn = carousel.querySelector('.carousel-btn-next');

        if (!track || slides.length <= 1) {
          if (prevBtn) prevBtn.style.display = 'none';
          if (nextBtn) nextBtn.style.display = 'none';
          const indicators = carousel.querySelector('.carousel-indicators');
          if (indicators) indicators.style.display = 'none';
          return;
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
          prevBtn.addEventListener('click', () => updateCarousel(currentIndex - 1));
        }

        if (nextBtn) {
          nextBtn.addEventListener('click', () => updateCarousel(currentIndex + 1));
        }

        dots.forEach((dot, i) => {
          dot.addEventListener('click', () => updateCarousel(i));
        });

        // Touch Swipe Handling (Mobile-first)
        let touchStartX = 0;
        let touchEndX = 0;

        carousel.addEventListener('touchstart', (e) => {
          touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
          touchEndX = e.changedTouches[0].screenX;
          const diff = touchStartX - touchEndX;
          if (Math.abs(diff) > 40) {
            if (diff > 0) {
              updateCarousel(currentIndex + 1); // Swipe left -> next
            } else {
              updateCarousel(currentIndex - 1); // Swipe right -> prev
            }
          }
        }, { passive: true });

        // Keyboard navigation when focused
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
