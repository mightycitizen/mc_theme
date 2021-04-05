import "babel-polyfill"; // ie 11 polyfill - can exclude if not in scope
import $ from 'jquery';
import './lib/foundation-explicit-pieces'; // @foundation pick and choose Foundation plugins
import 'slick-carousel'; // @slick carousel/slider
import 'lity'; // @lity modal
import tippy from 'tippy.js'; // @tippy tooltip
import LazyLoad from 'vanilla-lazyload'; // @lazy lazy image and iframe loading
import Litepicker from 'litepicker'; // @litepicker date picker
import selectize from 'selectize'; // @selectize custom select dropdowns
import Twig from 'twig'; // @twig used with @ajax
import resultsTemplate from '../../_patterns/components/misc/_event.twig'; // used with @ajax
import paginationTemplate from '../../_patterns/components/listing/pagination.twig'; // used with @ajax
import loaderTemplate from '../../_patterns/components/misc/loader.twig'; // used with @ajax

import { mediumBreakpoint, largeBreakpoint, xxlargeBreakpoint } from '../../_patterns/global/base/breakpoints.json'; // Foundation breakpoints

// @foundation init
$(document).foundation();

// @foundation breakpoint event trigger
$(window).on('changed.zf.mediaquery', function(event, newSize, oldSize) {
   // @lity breakpoint trigger
  lityCheck();
});

 // @lity breakpoint trigger
const lityCheck = () => {
  $('.lity-mobile').toggleClass('lity-hide',Foundation.MediaQuery.only('small'));
}

function buildPagination(
  totalItems,
  currentPage = 1,
  pageSize = 10,
  maxPages = 10
) {
  // calculate total pages
  let totalPages = Math.ceil(totalItems / pageSize);

  // ensure current page isn't out of range
  if (currentPage < 1) {
      currentPage = 1;
  } else if (currentPage > totalPages) {
      currentPage = totalPages;
  }

  let startPage, endPage;
  if (totalPages <= maxPages) {
      // total pages less than max so show all pages
      startPage = 1;
      endPage = totalPages;
  } else {
      // total pages more than max so calculate start and end pages
      let maxPagesBeforeCurrentPage = Math.floor(maxPages / 2);
      let maxPagesAfterCurrentPage = Math.ceil(maxPages / 2) - 1;
      if (currentPage <= maxPagesBeforeCurrentPage) {
          // current page near the start
          startPage = 1;
          endPage = maxPages;
      } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
          // current page near the end
          startPage = totalPages - maxPages + 1;
          endPage = totalPages;
      } else {
          // current page somewhere in the middle
          startPage = currentPage - maxPagesBeforeCurrentPage;
          endPage = currentPage + maxPagesAfterCurrentPage;
      }
  }

  // calculate start and end item indexes
  let startIndex = (currentPage - 1) * pageSize;
  let endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

  // create an array of pages to ng-repeat in the pager control
  let pages = Array.from(Array((endPage + 1) - startPage).keys()).map(i => startPage + i);

  // return object with all pager properties required by the view
  return {
      totalItems: totalItems,
      currentPage: currentPage,
      pageSize: pageSize,
      totalPages: totalPages,
      startPage: startPage,
      endPage: endPage,
      startIndex: startIndex,
      endIndex: endIndex,
      pages: pages
  };
}


$.fn.isInViewport = function() {
  var elementTop = $(this).offset().top;
  var elementBottom = $(this).offset().top + $(this).outerHeight();
  var viewportTop = $(window).scrollTop();
  let offsetFactor = 1;
  const dataOffset = $(this).data('offset');
  if (dataOffset) offsetFactor = eval(dataOffset);
  return viewportTop + offsetFactor*$(window).outerHeight() > elementTop && viewportTop < elementBottom;
};

const randomId = () => {
  return Math.random().toString(36).substr(2, 9);
}

class Ajax {
  constructor(endpoint, $results, key, filterRefresh, numPerPage){
    this.options = {
      endpoint,
      key,
      filterRefresh,
      numPerPage
    }

    this.$results = $results;

    this.id = $results.attr('id');
    this.$filters = $('[data-ajaxify-form=' + this.id + ']')
    this.$noResults = $('[data-ajaxify-no-results=' + this.id + ']');
    this.$numResults = $('[data-ajaxify-num-results=' + this.id + ']');
    this.$toggles = $('[data-ajaxify-toggles=' + this.id + ']');
    this.$pagination = $('[data-ajaxify-pagination=' + this.id + ']');
    this.currentPage = 1;
  }
  init(){
    this.bindEvents();
    this.loadData();
  }
  updatePagination(){
    const self = this;
    const template = Twig.twig({ data: paginationTemplate });
    let links = {}
    let pageBase;
    let paginationObject;
    if (self.options.filterRefresh){
      // @craft pagination
      const paginationData = self.meta.pagination;
      links = paginationData.links;
      pageBase = links.next || links.previous;
      paginationObject = buildPagination(paginationData.total,paginationData.current_page, self.options.numPerPage)
      // need @drupal pagination
    }else{
      paginationObject = buildPagination(self.total,self.currentPage, self.options.numPerPage);
      if (paginationObject.currentPage !== 1) links.previous = paginationObject.currentPage - 1;
      if (paginationObject.currentPage < paginationObject.totalPages) links.next = paginationObject.currentPage + 1;

    }

    if (paginationObject.totalPages > 1){

      links.pages = [];
      paginationObject.pages.map(page => {
        let url = page;

        if (self.options.filterRefresh && pageBase) url = pageBase.replace(/page=(\d)+/,'page=' + page);

        links.pages.push({
          url,
          pageIndex: page,
          current: paginationObject.currentPage === page
        });
      })
      self.$pagination.html(template.render({ links }));
    }
  }
  clearPagination(){
    this.$pagination.html('');
  }
  updateResults(){
    const self = this;
    self.clearPagination();

    setTimeout(() => {
      window.enableSubmit(self.$filters.find('button[type="submit"][disabled]'));
    }, (50));
    let data = self.data;
    if (self.dataFiltered) data = self.dataFiltered;
    if (!self.options.endpointRefresh && self.options.numPerPage){
      data = data.slice((self.currentPage - 1) * self.options.numPerPage, self.currentPage * self.options.numPerPage);
    }
    const template = Twig.twig({ data: resultsTemplate });
    self.$results.html(template.render({ [self.options.key]: data }));
    this.$noResults.toggleClass('hide', data.length > 0);
    this.$numResults.find('.value').text(self.total);
    this.$numResults.toggleClass('hide', data.length === 0);
    if (self.options.numPerPage) self.updatePagination();
  }
  filterResults(){
    const self = this;
    let dataFiltered = self.data;
    if (self.options.filterRefresh){
      self.loadData();
    }else{
      self.$filters.find('input[data-filter]:checked').each(function(){
        const value = $(this).attr('value');
        const name = $(this).attr('name');
        if (value !== ''){
          dataFiltered = dataFiltered.filter(item => {
            let currValue = item[name];
            if (!currValue) return false;
            //console.log(currValue);
            if (Array.isArray(currValue)){

              return currValue.length > 0 && currValue.some(arrayItem => {
                const checkVal = arrayItem.id || arrayItem;
                return checkVal.toString() === value })
            }else{
              const checkVal = currValue.id || currValue;
              return checkVal.toString() === value
            }
          });
        }
      });
      self.$filters.find('[data-filter-checkbox]').each(function(){
        const name = $(this).data('filter-checkbox');
        let values = [];

        $(this).find('input[type="checkbox"]:checked').each(function(){
          values.push($(this).val());
        });

        if (values.length > 0){

          dataFiltered = dataFiltered.filter(item => {
            let currValue = item[name];
            if (!currValue) return false;
            if (Array.isArray(currValue)){
              if (currValue.length === 0) return false;
              let intersection = currValue.filter(arrayItem => values.some(value => arrayItem.id.toString() === value));
              return intersection.length > 0
            }else{
              return values.includes(currValue.id.toString())
            }
          });
        }
      });
      self.$filters.find('[data-filter-keywords]').each(function(){
        const value = $(this).val();
        const fields = $(this).data('filter-keywords').split(',');
        if (value !== ''){
          dataFiltered = dataFiltered.filter(item => {
            return fields.some(field => {
              return item[field].toLowerCase().includes(value.toLowerCase())
            })
          });
        }
      });
      self.dataFiltered = dataFiltered;
      self.total = dataFiltered.length;
      self.updateResults();
    }

  }
  loadData(url){
    const self = this;
    if (!url){
      url = self.options.endpoint
      if (self.options.numPerPage){
        url = url + '?limit=' + self.options.numPerPage
      }
    }

    let ajaxOptions = {
      url,
      method: 'GET'
    };


    if (self.options.filterRefresh){
      ajaxOptions.data = self.$filters.serialize();
    }

    $.ajax( ajaxOptions).done(function( response ) {
      if (self.options.numPerPage && response.meta) self.meta = response.meta;
      response = response.data || response;
      self.total = response.length;
      // @craft pagination
      if (self.meta && self.meta.pagination) self.total = self.meta.pagination.total;
      self.data = response;
      self.updateResults();
      self.$results.addClass('is-loaded');
    });
  }
  getLabel(field){
    const id = field.attr('id');
    const $label = $('label[for='+ id +']');
    if (!$label) return false;
    return $label.text();
  }
  clearToggles(){
    this.$toggles.html('');
  }
  updateToggles(elem, checked){

    const label = this.getLabel(elem);
    const type = elem.attr('type');
    const name = elem.attr('name');
    const value = elem.attr('value');
    const id = elem.attr('id');
    if (type === 'radio') this.$toggles.find('[data-ajaxify-radio="' + name + '"]').remove();
    if (label && value !== '' && checked) this.$toggles.append('<button class="button" type="button" data-ajaxify-' + type + '="' + name + '" data-ajaxify-toggle="'+ id +'">'+label+'<span class="icon-cross"></span></button>');
    if (!checked && type === 'checkbox') this.$toggles.find('[data-ajaxify-toggle="' + id + '"]').remove();
  }

  bindEvents(){
    const self = this;

    this.$pagination.on('click', 'a', function(e){
      e.preventDefault();
      const page = $(e.target).data('ajax-page');
      if (self.options.filterRefresh){
        self.loadData(page);
      }else{
        self.currentPage = page;
        self.updateResults();
      }
    })
    $(document).on('click', '[data-ajaxify-toggle]', function(e){
      const { currentTarget } = e;
      const fieldId = $(this).data('ajax-toggle');
      if (fieldId){
        $('#'+fieldId).prop('checked', false).trigger('change');
      }
      $(currentTarget).remove();
    })
    self.$filters.on('reset', function(e){
      delete self.dataFiltered;
      self.total = self.data.length;
      self.clearToggles();
      self.$filters.find('.is-active').removeClass('is-active'); // don't love this for removing the input-clear Xes
      setTimeout(() => {
        self.$filters.trigger('submit');
      }, (50));

    })
    self.$filters.find('[data-filter-keywords]').on('change', function(){
      self.filterResults();
      //self.updateResults();
    });
    self.$filters.on('submit', function(e){
      e.preventDefault();
      self.filterResults();
    })
    self.$filters.find('[data-filter], [data-filter-checkbox] input[type="checkbox"]').on('change', function(e){
      const { checked } = e.target;
      self.updateToggles($(this), checked);
      if (self.$filters.find('[type="submit"]:visible').length === 0) self.$filters.trigger('submit');
    })
  }
}

// @form helpers init
const initFormHelpers = () => {
  $('[data-clear]').each(function(){
    const $field = $('#'+$(this).data('clear'));
    $field.on('change', function(){
      $(this).toggleClass('is-active', $field.val() !== '');
    })
    $(this).on('click', function(){
      if ($field) $field.val('').trigger('change');
    })
  });

  const disableSubmit = (elem) => {
    elem.prop('disabled', true).append(loaderTemplate);
  }

  window.enableSubmit = (elem) => {
    elem.prop('disabled', false).find('.loader').remove();
  }

  $('form:not([data-abide]):not([data-freeform])').on('submit', function(){
    disableSubmit($(this).find('[type="submit"]'));
  })
  $('[data-abide]').on('formvalid.zf.abide', function(){
    disableSubmit($(this).find('[type="submit"]'));
  });
}

// @ajax init
const initAjax = () => {
  const events = new Ajax('/js/data/events.json', $('[data-ajaxify]'), 'events', false, 1);
  events.init();
}

// @selectize init
const initSelectize = () => {
  $('.js-selectize').selectize();
}

// @smooth-scroll init
const initSmoothScroll = () => {
  // In-page smooth scroll, exclude from modal windows
  $(document).on('click', 'a[href^="#"]:not([href="#"]):not([data-lity])',
  function(event) {
    // On-page links
    event.preventDefault();

    if (
      location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') &&
      location.hostname == this.hostname
    ) {
      // Figure out element to scroll to
      var target = $(this.hash);
      //var targetHash = this.hash.substring(1);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      // Does a scroll target exist?
      if (target.length) {
        // Only prevent default if animation is actually gonna happen

        $('html, body').animate({
          scrollTop: target.offset().top
        }, 500);

      }
    }
  });
}


// @video init
const initVideo = () => {
  const
    initializedClass = 'is-initialized',
    playingClass = 'is-playing';

  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  // 3. This function creates an <iframe> (and YouTube player)
  //    after the API code downloads.

  window.onYouTubeIframeAPIReady = function(){

    $('.video-wrapper').each(function(){
          var holder = $(this),
              vid = holder.find('.youtube-player'),
              player,
              playing = false,
              trigger = holder.data('video-trigger'),
              firstPlay = true;

          vid.attr('tabindex', -1);
          const youtubeId = vid.data('youtube-id');
          player = new YT.Player(vid[0], {
              playerVars: { 'enablejsapi': 1, 'fs': 1, 'playlist': youtubeId, 'loop': 1, 'modestbranding': 1, 'autoplay': 1, 'controls': 0 , 'showInfo': 0, 'mute': 1,'rel': 0},
              videoId: youtubeId,
              events: {
                  'onReady': onPlayerReady,
                  'onStateChange': onPlayerStateChange
              }
          });

          function onPlayerReady() {
            player.playVideo();
            setVideoSize();
            holder.bind('play', function(){
              if (!playing) {
                  player.playVideo();
              }
            })

            holder.bind('pause', function(){
              if (playing) {
                player.pauseVideo();
              }
            })

          }

          function onPlayerStateChange(event) {
            if (firstPlay){
              if (trigger !== 'background'){
                setTimeout(() => {
                  player.pauseVideo();
                }, 50);
              }
              holder.addClass(initializedClass);
            }

            if ( event.data == 1 ) {
              playing = true;
              holder.addClass(playingClass);
            }else{
              playing = false;
              holder.removeClass(playingClass)
            }

            firstPlay = false;

          }
          function setVideoSize(){
            var w = holder.width(),
                h = holder.height();

            if (w/h > 1){
                player.setSize(w, 200 + w/16*9);
                vid.css({'left': '0px'});
            } else {
                player.setSize(h/9*16, h + 200);
                vid.css({'left': ( -(h/9*16) / 2 ) + holder.width() / 2 });
                vid.css({'top': -(h - holder.height()) / 2 });
            }
          }

          player.clickHandler = (e) => {
              e.preventDefault();
              if (!playing) {
                  player.playVideo();
              } else {
                  player.pauseVideo();
              }
          }
        $(window).on('resize', Foundation.util.throttle(
          function(){
            setVideoSize();
          }, 50));


    });
  }

  $('[data-video-trigger="click"]').on('click', function(){
    if ($(this).hasClass(playingClass)){
      $(this).trigger('pause').removeClass(playingClass);
    }else{
      $(this).trigger('play');
    }
  });

  $(window).on('scroll', Foundation.util.throttle(
    function(){
      $('[data-video-trigger="scroll"]').each(function(){
        if ($(this).find('.youtube-player').isInViewport()){
          $(this).trigger('play');
        }else{
          $(this).trigger('pause');
        }

      });
    }, 50));
}


// #table-scroll init
const initTableScroll = () => {
  $('table').each(function(){
    $(this).wrap('<div class="table-scroll-wrapper"></div>');
    $(this).wrap('<div class="table-scroll"></div>');
  })
  $('.table-scroll').scroll(function() {
    const $wrapper = $(this).parent();
    if($(this).scrollLeft() + $(this).innerWidth() >= $(this)[0].scrollWidth) {
      $wrapper.addClass('is-end')
    }else{
      $wrapper.removeClass('is-end')
    }
  });

}


// @litepicker init
const initDatepicker = () => {
  $('.js-date').each(function(){
    new Litepicker({
      element: $(this)[0]
    });
  })
}


// @foundation accessibility init
const initFoundationAccessibility = () => {
  // accordion accessibility
  $(document).on('click', '.accordion-trigger', function(event){
    $(this).parents('.accordion-item').find('.accordion-title').trigger('click');
  })
}

// @lity accessibility init
const initLityAccessibility = () => {
  const dataAttr = 'trigger';
  $(document).on('click', '[data-lity]', function(event) {
    const $trigger = $(this);
    let triggerId = $trigger.attr('id');
    if (!triggerId){
      triggerId = 'lity-' + randomId();
      $trigger.attr('id', triggerId);

    }
    $('.lity').attr('data-' + dataAttr,triggerId);
  });

  $(document).on('lity:close', function(event, instance) {
    const $lity = instance.element();
    const $trigger = $('#'+$lity.data(dataAttr));
    $trigger.focus();
  });
}

// @slick pagination helper function
const slickPagination = (slick) => {
  if (slick.$dots){
    const numSlides = slick.$dots.find('>li').length;
    slick.$slider.toggleClass('has-pagers', numSlides > 1);
    slick.$slider.toggleClass('has-pagination', numSlides > 3);
  }
}

const initTippy = () => {
  var tippies = document.querySelectorAll("[data-tippy-content]");
  tippy(tippies, {
    hideOnClick: false,
    animation: "shift-away",
    arrow: true,
    //trigger: "click",
    interactive: true,
    offset: [0,-5],
    maxWidth: 600,
    placement: "bottom",
    onShow: function(tippyElem){
      var tempDom = $('<div>').append($.parseHTML(tippyElem.reference.dataset.tippyContent))[0];
      tippyElem.setContent(tempDom);
    },
    onShown: function (tippyElem) {
      tippyElem.reference.classList.add("tippy-active");
    },
    onHidden: function (tippyElem) {
      tippyElem.reference.classList.remove("tippy-active");
    },
    onMount: function (tippyElem) {
      var elem = tippyElem;


      if (!elem.reference.classList.contains("tippy-initialized")) {
        $(elem.popper)
          .find(".tippy-tooltip")
          .prepend(
            "<button class='tippy-close'><span class='show-for-sr'>Close tooltip</span></button>"
          );
        $(elem.popper)
          .find(".tippy-close")
          .on("click", function (event) {
            elem.hide();
            return false;
          });

        elem.reference.addEventListener(
          "touchstart",
          function (event) {
            //console.log(elem);
            if (elem.state.isVisible) {
              elem.setProps({
                trigger: "manual",
              });
              elem.hide();
            } else {
              elem.setProps({
                trigger: "focus mouseenter",
              });
              elem.show();
            }
          },
          false
        );
      }
      elem.reference.classList.add("tippy-initialized");
    },
  });
}


// @lazy init
const initLazy = () => {
  new LazyLoad({
    elements_selector: ".js-lazy"
    // ... more custom settings?
  });
}


// @slick init
const initSlick = () => {

  const $slick = $('.js-slick');

  $slick.each(function(){
    const $this = $(this);

    $this.on('init', function (event, slick, breakpoint){
      slickPagination(slick);
    })

    $this.on('breakpoint', function (event, slick, breakpoint){
      slickPagination(slick);
    })

    $this.slick({
      slidesToScroll: 1,
      rows: 0,
      prevArrow: '<button class="slick-prev">Previous</button>',
      nextArrow: '<button class="slick-next">Next</button>',
      dots: true,
      dotsClass: 'slick-dots',
      appendArrows: $this.next('.slick-nav'),
      appendDots: $this.next('.slick-nav'),
      adaptiveHeight: true,
      waitForAnimate: false
    });

  })

  const $slickCards = $('.js-slick--cards');

  $slickCards.each(function(){
    const $this = $(this);

    $this.on('init', function (event, slick, breakpoint){
      slickPagination(slick);
    })

    $this.on('breakpoint', function (event, slick, breakpoint){
      slickPagination(slick);
    })

    $this.slick({
      slidesToScroll: 3,
      slidesToShow: 3,
      rows: 0,
      prevArrow: '<button class="slick-prev">Previous</button>',
      nextArrow: '<button class="slick-next">Next</button>',
      dots: true,
      infinite: false,
      dotsClass: 'slick-dots',
      appendArrows: $this.next('.slick-nav'),
      appendDots: $this.next('.slick-nav'),
      adaptiveHeight: true,
      waitForAnimate: false,
      responsive: [
        {
        breakpoint: largeBreakpoint,
        settings: {
          slidesToScroll: 2,
          slidesToShow: 2
        }
      },
        {
        breakpoint: mediumBreakpoint,
        settings: {
          slidesToScroll: 1,
          slidesToShow: 1

        }

      }
      ]
    });

  });

  const $slickCenter = $('.js-slick--center');
  $slickCenter.each(function(){
    const $this = $(this);

    $this.on('init', function (event, slick, breakpoint){
      slickPagination(slick);
    })

    $this.on('breakpoint', function (event, slick, breakpoint){
      slickPagination(slick);
    })

    $this.slick({
      centerMode: true,
      centerPadding: '50px',
      prevArrow: '<button class="slick-prev">Previous</button>',
      nextArrow: '<button class="slick-next">Next</button>',
      dots: true,
      infinite: false,
      dotsClass: 'slick-dots',
      appendArrows: $this.next('.slick-nav'),
      appendDots: $this.next('.slick-nav'),
      variableWidth: true,
      waitForAnimate: true,
      responsive: [
        {
        breakpoint: '500',
        settings: {
          adaptiveHeight: true
        }
        }
      ]
    });

  });

}

$(document).ready(function(){

  // ↑ True for "medium" or larger (by default)
  //Foundation.MediaQuery.is('medium up');
  //Foundation.MediaQuery.atLeast('medium');

  // → True for "medium" only
  //Foundation.MediaQuery.is('medium only');
  //Foundation.MediaQuery.only('medium');

  // ↓ True for "medium" or larger
  //Foundation.MediaQuery.is('medium down');
  //Foundation.MediaQuery.upTo('medium');

  lityCheck(); // @lity breakpoint trigger

  initTippy(); // @tippy init call
  initLazy(); // @lazy init call
  initSlick(); // @slick init call
  initLityAccessibility(); // @lity init accessibility call
  initFoundationAccessibility();  // @foundation init accessibility call
  initDatepicker(); // @litepicker init call
  initSelectize(); // @selectize init call
  initTableScroll(); // #table-scroll init call
  initVideo(); // @video init call
  initSmoothScroll(); // @smooth-scroll init
  initAjax(); // @ajax init
  initFormHelpers(); // @form helpers init
})

