(function ($, Drupal) {

  Drupal.behaviors.foundation = {
    attach: function (context, settings) {
      $('body').once('foundation').each(function (e) {
        $(document).foundation();
      });
    }
  };

})(jQuery, Drupal);
