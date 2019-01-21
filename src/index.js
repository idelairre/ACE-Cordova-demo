import { find } from 'lodash';

import './styles/pure-min.css';
import './styles/material.min.css';
import './styles/index.scss';

import thumbnailTemplate from './templates/thumbnail.ejs';
import searchDropdown from './templates/searchDropdown.ejs';
import slideshowTemplate from './templates/slideshow.ejs';
import sidebarTemplate from './templates/sidebar.ejs';
// import videoThumbnailTemplate from './templates/videoThumbnail.ejs';
// import videoTemplate from './templates/video.ejs';

import 'script-loader!./js/modernizr.min';
import './js/material.min';
import './js/jquery.cbpFWSlider';

import json from './contentMetaData.json';
import loadedDecks from './assets/decks/index.json';

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
  
  const $loading = $('#loadingCover');

  // slides cache for presentations
  const cache = {};

  for (let key in json.content) {
    const id = json.content[key].vaultId;
    cache[id] = [];
  }

  // load sidebar
  const sidebarHtml = sidebarTemplate({ categories: json.categories });
  $('.main').prepend(sidebarHtml);

  // hide sidebar until we populate decks
  $('label#category, li#category').each(function() {
    $(this).hide();
    if ($(this).prop('tagName') === 'LI') {
      $(this).parents('.category-content').siblings('label').hide();
    }
  });

  // fetch only the decks we've loaded
  for (let i = 0; json.content.length > i; i++) {
    if (loadedDecks.includes(json.content[i].vaultId)) {
      console.log('loading thumbnail ', json.content[i].vaultId);
      const html = thumbnailTemplate({ entry: json.content[i] });
      $('.content').append(html);
      $('label#category, li#category').each(function () {
        // compare loaded slide against the json data
        const decks = $(this).data('content');
        if (decks.includes(json.content[i].vaultId)) {
          $(this).show();
          if ($(this).prop('tagName') === 'LI') {
            $(this).parents('.category-content').siblings('label').show();
          }
        }
      });
    }
  }

  let $selected;

  // filter items
  $('label#category, li#category').each(function() {
    $(this).click(function() {
      if ($selected) $selected.removeClass('selected');
      $selected = $(this).addClass('selected');
      const decks = $(this).data('content');
      $('.large-thumb').each(function() {
        if (!decks.includes($(this).data('deck'))) {
          $(this).hide();
        } else {
          $(this).show();
        }
      });
    });
  });

  // undo filter
  $('.logo').click(function() {
    $('.large-thumb').show();
  });

  // delegate slide show function
  $(document).on('click', '.large-thumb:not(#video)', function() {
    const id = $(this).data('deck');
    playSlideshow(id);
    $('.slider-container').show();
  });

  // slide change handler
  const slideChanged = function() {
    // just for now...
    if ($('video')) {
      $('video').trigger('pause');
    }
  };

  // rendering for slideshow
  const prepareSlideshow = function(html) {
    $('.slider-container').html(html);
    $('#cbp-fwslider').cbpFWSlider({
      slideChangedCallback: slideChanged
    });

    $('#close-btn').click(function() {
      // fixes bug where video keeps playing after slideshow is hidden and destroyed
      if ($('video')) {
        $('video').trigger('pause');
      }
      $('.slider-container').hide();
      $('#cbp-fwslider').cbpFWSlider('destroy');
    });
  }

  const playSlideshow = function(id) {
    // show loading anim
    $loading.show();
    // retrieve # of slides for this deck
    const slides = [];
    const data = require(`./assets/decks/${id}/index.json`);
    for (let i = 1; i <= data.slides.length; i++) {
      const rawSlide = data.slides[i - 1];
      const slide = {};
      if (rawSlide.video) {
        slide.videoUrl = require(`./assets/video/${rawSlide.video.id}`);
      } else {
        slide.imageUrl = require(`./assets/decks/${id}/${i}.PNG`); // we're using file-loader because the url-loader errors out on a special character
      }
      slides.push(slide);
      if (i === data.slides.length) {
        $loading.hide();
      }
    }
    const html = slideshowTemplate({ id, slides });
    prepareSlideshow(html);
  }

  // search
  $('#search-expandable').on('input', function() {
      const found = [];
      const term = $(this).val().toLowerCase();
      $('[data-deck]').each(function() {
          const deck = $(this).data('deck-json');
          const res = find(deck, function (data) {
            return data.toString().toLowerCase().includes(term);
          });
          if (res) {
            if (!found.includes(deck)) {
              found.push(deck);
              $(this).show();
            }
          } else {
            $(this).hide();
          }
      });
      const html = searchDropdown({ decks: found });
      $('.search-results').html(html);
      $('.search-results').show();
      if ($('.search-results-category').not(':visible')) {
        $('.search-results-category').data('content', found);
        $('.search-results-category').show();
      }
      if ($selected) {
        $selected.removeClass('selected');
        $selected = $('.search-results-category').addClass('selected');
      } else {
        $selected = $('.search-results-category').addClass('selected');
      }
  });

  $('.search-results').hide();

  // closes menu when you click off
  $(document).click(function(event) {
      if (!$(event.target).closest('#search-expandable, .search-results').length) {
          if ($('.search-results').is(':visible')) {
              $('.search-results').hide();
          }
      }
  });

  $(document).on('click', '.mdl-list__item', function() {
    const deck = $(this).children('.mdl-list__item-primary-content').data('deck');
    $('#search-expandable').val(deck);
    $('.search-results-category').data('content', deck);
    $('div[data-deck]').each(function() {
      if ($(this).data('deck') !== deck) {
        $(this).hide();
      } else {
        $(this).show();
      }
    });
    $('.search-results').hide();
  });
}
