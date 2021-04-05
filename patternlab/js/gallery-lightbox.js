/**
 * @file
 * Behaviors for the Gallery using the Colorbox library.
 */

/* eslint-disable max-len */
!function (document, Drupal, $) {
  'use strict';
  /**
   * Setup and attach the Gallery behaviors.
   *
   * @type {Drupal~behavior}
   */

  Drupal.behaviors.gallery = {
    attach: function attach(context) {
      $('.gallery-lightbox-item a', context).colorbox({
        opacity: 0.9,
        rel: 'gallery-lightbox'
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
//# sourceMappingURL=gallery-lightbox.js.map
