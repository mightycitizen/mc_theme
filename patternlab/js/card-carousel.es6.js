/**
 * @file
 * Behaviors for the Filter Accordion.
 */

/* eslint-disable max-len */
!function (document, Drupal, $) {
  'use strict';
  /**
   * Setup and attach the Card Carousel behaviors.
   *
   * @type {Drupal~behavior}
   */

  Drupal.behaviors.cardCarousel = {
    attach: function attach() {
      this.colorboxCardCarousel();
      this.slickCardCarousel();
    },
    slickCardCarousel: function slickCardCarousel() {
      $('.card-carousel__slick').slick({
        dots: true,
        infinite: false,
        speed: 300,
        slidesToShow: 3,
        slidesToScroll: 3,
        responsive: [{
          breakpoint: 1024,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 2,
            infinite: true,
            dots: true
          }
        }, {
          breakpoint: 600,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1
          }
        }]
      });
    },
    colorboxCardCarousel: function colorboxCardCarousel(context) {
      $('.card-carousel-item__media', context).colorbox({
        opacity: 0.9,
        rel: 'card-carousel'
      }); // Customize colorbox dimensions

      var colorboxResize = function colorboxResize(resize) {
        var width = '90%';
        var height = '90%';

        if ($(window).width() > 960) {
          width = '860';
        }

        if ($(window).height() > 700) {
          height = '630';
        }

        $.colorbox.settings.height = height;
        $.colorbox.settings.width = width; //if window is resized while lightbox open

        if (resize) {
          $.colorbox.resize({
            'height': height,
            'width': width
          });
        }
      }; // Make colorbox overlay responsive.


      $.colorbox.settings.onLoad = function () {
        colorboxResize();
      }; //In case of window being resized


      $(window).resize(function () {
        colorboxResize(true);
      });
    }
  };
}(document, Drupal, jQuery);
//# sourceMappingURL=card-carousel.es6.js.map
