require('./styles/pure-min.css');
require('./styles/material.min.css');
require('./styles/index.scss');

const thumbnailTemplate = require('./templates/thumbnail.ejs');
const slideshowTemplate = require('./templates/slideshow.ejs');
const sidebarTemplate = require('./templates/sidebar.ejs');
const videoThumbnailTemplate = require('./templates/videoThumbnail.ejs');
const videoTemplate = require('./templates/video.ejs');

require('script-loader!./js/modernizr.min');
require('./js/jquery.cbpFWSlider');

const json = require('./contentMetaData.json');
const loadedDecks = require('./assets/decks/index.json');

const $loading = $('#loadingCover').hide();

// slides cache for presentations
const cache = {};

for (let key in json.content) {
  const id = json.content[key].vaultId;
  cache[id] = [];
}

// load sidebar
const sidebarHtml = sidebarTemplate({ categories: json.categories });
$('.main').prepend(sidebarHtml);

// hide sidebar until we populate slides
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
      const slides = $(this).data('content');
      if (slides.includes(json.content[i].vaultId)) {
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
    const slides = $(this).data('content');
    $('.large-thumb').each(function() {
      if (!slides.includes($(this).data('slide'))) {
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
  const id = $(this).data('slide');
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
      slide.imageUrl = require(`file-loader!./assets/decks/${id}/${i}.PNG`); // we're using file-loader because the url-loader errors out on a special character
    }
    slides.push(slide);
    if (i === data.slides.length) {
      $loading.hide();
    }
  }
  const html = slideshowTemplate({
    id,
    slides
  });
  prepareSlideshow(html);
}
