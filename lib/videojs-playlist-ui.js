/*! videojs-playlist-ui - v0.0.0 - 2015-3-12
 * Copyright (c) 2015 Brightcove
 * Licensed under the Apache-2.0 license. */

import videojs from 'video.js';

// Array#indexOf analog for IE8
const indexOf = function(array, target) {
  for (let i = 0, length = array.length; i < length; i++) {
    if (array[i] === target) {
      return i;
    }
  }
  return -1;
};

// see https://github.com/Modernizr/Modernizr/blob/master/feature-detects/css/pointerevents.js
const supportsCssPointerEvents = (() => {
  let element = document.createElement('x');
  element.style.cssText = 'pointer-events:auto';
  return element.style.pointerEvents === 'auto';
})();

// Throttle with an additional call at the tail of each period
// where calls were throttled.
const tailThrottle = (callback, ms) => {
  let last = 0;
  let another = false;
  let start = new Date().getTime();

  return function trigger() {
    if (new Date().getTime() > last + ms) {
      last = new Date().getTime();
      callback.call();
      another = false;
      setTimeout(() => {
        if (another) {
          another = false;
          trigger();
        }
      }, ms);
    } else {
      another = true;
    }
  };
};

const defaults = {
  className: 'vjs-playlist',
  playOnSelect: false,
  supportsCssPointerEvents
};

// we don't add `vjs-playlist-now-playing` in addSelectedClass
// so it won't conflict with `vjs-icon-play
// since it'll get added when we mouse out
const addSelectedClass = function(el) {
  el.addClass('vjs-selected');
};
const removeSelectedClass = function(el) {
  el.removeClass('vjs-selected');

  if (el.thumbnail) {
    videojs.removeClass(el.thumbnail, 'vjs-playlist-now-playing');
  }
};

const upNext = function(el) {
  el.addClass('vjs-up-next');
};
const notUpNext = function(el) {
  el.removeClass('vjs-up-next');
};

const createThumbnail = function(thumbnail, index, playlistMenu) {
  if (!thumbnail) {
    let placeholder = document.createElement('div');
    placeholder.className = 'vjs-playlist-thumbnail vjs-playlist-thumbnail-placeholder';
    return placeholder;
  }

  let picture = document.createElement('picture');
  picture.className = 'vjs-playlist-thumbnail';

  if (typeof thumbnail === 'string') {
    // simple thumbnails

    let img = document.createElement('img');

    // Set height for unloaded images based on first loaded image
    if (index === 0) {
      videojs.on(img, 'load', () => {
        playlistMenu.thumbnailHeight_ = img.offsetHeight;
        playlistMenu.$$('.vjs-playlist-img-unloaded').forEach((el) => {
          el.style.height = playlistMenu.thumbnailHeight_ + 'px';
        });
      });
    }

    // Only set source for first 20 thumbnails. The rest will be
    // lazily loaded.
    if (index < 20) {
      img.src = thumbnail;
    } else {
      img.className = 'vjs-playlist-img-unloaded';
      img.setAttribute('data-src', thumbnail);

      // If thumbnail height is already known, set height for placeholder.
      // Otherwise it will be set later.
      if (playlistMenu.thumbnailHeight_) {
        img.style.height = playlistMenu.thumbnailHeight_ + 'px';
      }
    }

    picture.appendChild(img);
  } else {
    // responsive thumbnails

    // additional variations of a <picture> are specified as
    // <source> elements
    for (let i = 0; i < thumbnail.length - 1; i++) {
      let variant = thumbnail[i];
      let source = document.createElement('source');
      // transfer the properties of each variant onto a <source>
      for (let prop in variant) {
        source[prop] = variant[prop];
      }
      picture.appendChild(source);
    }

    // the default version of a <picture> is specified by an <img>
    let variant = thumbnail[thumbnail.length - 1];
    let img = document.createElement('img');
    for (let prop in variant) {
      img[prop] = variant[prop];
    }
    picture.appendChild(img);
  }
  return picture;
};

const Component = videojs.getComponent('Component');

class PlaylistMenuItem extends Component {

  constructor(player, playlistMenu, playlistItem, settings, index) {
    if (!playlistItem.item) {
      throw new Error('Cannot construct a PlaylistMenuItem without an item option');
    }

    this.playlistMenu = playlistMenu;
    this.index = index;

    super(player, playlistItem);
    this.item = playlistItem.item;

    this.playOnSelect = settings.playOnSelect;

    this.emitTapEvents();

    this.on(['click', 'tap'], this.switchPlaylistItem_);
    this.on('keydown', this.handleKeyDown_);

  }

  handleKeyDown_(event) {
    // keycode 13 is <Enter>
    // keycode 32 is <Space>
    if (event.which === 13 || event.which === 32) {
      this.switchPlaylistItem_();
    }
  }

  switchPlaylistItem_(event) {
    this.player_.playlist.currentItem(indexOf(this.player_.playlist(), this.item));
    if (this.playOnSelect) {
      this.player_.play();
    }
  }

  createEl() {
    let li = document.createElement('li');
    let item = this.options_.item;

    li.className = 'vjs-playlist-item';
    li.setAttribute('tabIndex', 0);

    // Thumbnail image
    this.thumbnail = createThumbnail(item.thumbnail, this.index, this.playlistMenu);
    li.appendChild(this.thumbnail);

    // Duration
    if (item.duration) {
      let duration = document.createElement('time');
      let time = videojs.formatTime(item.duration);
      duration.className = 'vjs-playlist-duration';
      duration.setAttribute('datetime', 'PT0H0M' + item.duration + 'S');
      duration.appendChild(document.createTextNode(time));
      li.appendChild(duration);
    }

    // Now playing
    let nowPlayingEl = document.createElement('span');
    let nowPlayingText = this.localize('Now Playing');
    nowPlayingEl.className = 'vjs-playlist-now-playing';
    nowPlayingEl.appendChild(document.createTextNode(nowPlayingText));
    nowPlayingEl.setAttribute('title', nowPlayingText);
    this.thumbnail.appendChild(nowPlayingEl);

    // Title container contains title and "up next"
    let titleContainerEl = document.createElement('div');
    titleContainerEl.className = 'vjs-playlist-title-container';
    this.thumbnail.appendChild(titleContainerEl);

    // Up next
    let upNextEl = document.createElement('span');
    let upNextText = this.localize('Up Next');
    upNextEl.className = 'vjs-up-next-text';
    upNextEl.appendChild(document.createTextNode(upNextText));
    upNextEl.setAttribute('title', upNextText);
    titleContainerEl.appendChild(upNextEl);

    // Video title
    let titleEl = document.createElement('cite');
    let titleText = item.name || this.localize('Untitled Video');
    titleEl.className = 'vjs-playlist-name';
    titleEl.appendChild(document.createTextNode(titleText));
    titleEl.setAttribute('title', titleText);
    titleContainerEl.appendChild(titleEl);

    return li;
  }
}

class PlaylistMenu extends Component {

  constructor(player, settings) {
    if (!player.playlist) {
      throw new Error('videojs-playlist is required for the playlist component');
    }

    super(player, settings);
    this.items = [];

    // If CSS pointer events aren't supported, we have to prevent
    // clicking on playlist items during ads with slightly more
    // invasive techniques. Details in the stylesheet.
    if (settings.supportsCssPointerEvents) {
      this.addClass('vjs-csspointerevents');
    }

    this.createPlaylist_();

    if (!videojs.browser.TOUCH_ENABLED) {
      this.addClass('vjs-mouse');
    }

    player.on(['loadstart', 'playlistchange'], (event) => {
      this.update();
    });

    // Keep track of whether an ad is playing so that the menu
    // appearance can be adapted appropriately
    player.on('adstart', () => {
      this.addClass('vjs-ad-playing');
    });
    player.on('adend', () => {
      if (player.ended()) {
        // player.ended() is true because the content is done, but the ended event doesn't
        // trigger until after the postroll is done and the ad implementation has finished
        // its cycle. We don't consider a postroll ad ended until the "ended" event.
        player.one('ended', () => {
          this.removeClass('vjs-ad-playing');
        });
      } else {
        this.removeClass('vjs-ad-playing');
      }
    });

    // Load thumbnails when scrolling
    this.on('scroll', tailThrottle((event) => {

      // Loop over all unloaded thumbnails
      this.$$('.vjs-playlist-img-unloaded').forEach((el) => {
        const thumbnailHeight = el.offsetHeight;
        const thumbnailTop = el.parentNode.parentNode.offsetTop;
        const scrollTop = this.el_.scrollTop;
        const offsetHeight = this.el_.offsetHeight;

        // A full playlist height behind the current scroll window
        const startOfRangeToLoad = scrollTop - offsetHeight - thumbnailHeight;

        // A full playlist height ahead of the current scroll window
        const endOfRangeToLoad = scrollTop + offsetHeight * 2;

        // Load thumbnail image if in range
        if (thumbnailTop > startOfRangeToLoad &&
            thumbnailTop < endOfRangeToLoad) {
          el.className = el.className.replace('vjs-playlist-img-unloaded', '');
          el.src = el.getAttribute('data-src');
        }

      });
      
    }, 100));
  }

  createEl() {
    const settings = this.options_;
    if (settings.el) {
      return settings.el;
    }

    const ol = document.createElement('ol');
    ol.className = settings.className;
    settings.el = ol;
    return ol;
  }

  createPlaylist_() {
    const playlist = this.player_.playlist() || [];
    let list = document.querySelector('.vjs-playlist-item-list');
    let overlay = this.el_.querySelector('.vjs-playlist-ad-overlay');

    if (!list) {
      list = document.createElement('ol');
      list.className = 'vjs-playlist-item-list';
      this.el_.appendChild(list);
    }

    // remove any existing items
    for (let i = 0; i < this.items.length; i++) {
      list.removeChild(this.items[i].el_);
    }
    this.items.length = 0;

    // create new items
    for (let i = 0; i < playlist.length; i++) {
      let item = new PlaylistMenuItem(this.player_, this, {
        item: playlist[i]
      }, this.options_, i);
      this.items.push(item);
      list.appendChild(item.el_);
    }

    // Inject the ad overlay. IE<11 doesn't support "pointer-events:
    // none" so we use this element to block clicks during ad
    // playback.
    if (!overlay) {
      let overlay = document.createElement('li');
      overlay.className = 'vjs-playlist-ad-overlay';
      list.appendChild(overlay);
    } else {
      // Move overlay to end of list
      list.appendChild(overlay);
    }

    // select the current playlist item
    let selectedIndex = this.player_.playlist.currentItem();
    if (this.items.length && selectedIndex >= 0) {
      addSelectedClass(this.items[selectedIndex]);

      let thumbnail = this.items[selectedIndex].$('.vjs-playlist-thumbnail');
      if (thumbnail) {
        videojs.addClass(thumbnail, 'vjs-playlist-now-playing');
      }
    }
  }

  update() {
    // replace the playlist items being displayed, if necessary
    const playlist = this.player_.playlist();
    if (this.items.length !== playlist.length) {
      // if the menu is currently empty or the state is obviously out
      // of date, rebuild everything.
      this.createPlaylist_();
      return;
    }
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].item !== playlist[i]) {
        // if any of the playlist items have changed, rebuild the
        // entire playlist
        this.createPlaylist_();
        return;
      }
    }

    // the playlist itself is unchanged so just update the selection
    const currentItem = this.player_.playlist.currentItem();
    for (let i = 0; i < this.items.length; i++) {
      let item = this.items[i];
      if (i === currentItem) {
        addSelectedClass(item);
        if (document.activeElement !== item.el()) {
          videojs.addClass(item.thumbnail, 'vjs-playlist-now-playing');
        }
        notUpNext(item);
      } else if (i === currentItem + 1) {
        removeSelectedClass(item);
        upNext(item);
      } else {
        removeSelectedClass(item);
        notUpNext(item);
      }
    }
  }
}

/**
 * Initialize the plugin.
 * @param options (optional) {object} configuration for the plugin
 */
const playlistUi = function(options) {
  const player = this;
  let settings, elem;

  if (!player.playlist) {
    throw new Error('videojs-playlist is required for the playlist component');
  }

  // if the first argument is a DOM element, use it to build the component
  if ((typeof HTMLElement !== 'undefined' && options instanceof HTMLElement) ||
      // IE8 does not define HTMLElement so use a hackier type check
      (options && options.nodeType === 1)) {
    elem = options;
    settings = videojs.mergeOptions(defaults);
  } else {
    // lookup the elements to use by class name
    settings = videojs.mergeOptions(defaults, options);
    elem = document.querySelector('.' + settings.className);
  }

  // build the playlist menu
  settings.el = elem;
  player.playlistMenu = new PlaylistMenu(player, settings);
};

// register components
videojs.registerComponent('PlaylistMenu', PlaylistMenu);
videojs.registerComponent('PlaylistMenuItem', PlaylistMenuItem);

// register the plugin
videojs.plugin('playlistUi', playlistUi);
