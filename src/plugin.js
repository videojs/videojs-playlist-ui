import document from 'global/document';
import window from 'global/window';
import videojs from 'video.js';

// support VJS5 & VJS6 at the same time
const dom = videojs.dom || videojs;
const registerPlugin = videojs.registerPlugin || videojs.plugin;

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
  const element = document.createElement('x');

  element.style.cssText = 'pointer-events:auto';
  return element.style.pointerEvents === 'auto';
})();

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
    dom.removeClass(el.thumbnail, 'vjs-playlist-now-playing');
  }
};

const upNext = function(el) {
  el.addClass('vjs-up-next');
};
const notUpNext = function(el) {
  el.removeClass('vjs-up-next');
};

const createThumbnail = function(thumbnail) {
  if (!thumbnail) {
    const placeholder = document.createElement('div');

    placeholder.className = 'vjs-playlist-thumbnail vjs-playlist-thumbnail-placeholder';
    return placeholder;
  }

  const picture = document.createElement('picture');

  picture.className = 'vjs-playlist-thumbnail';

  if (typeof thumbnail === 'string') {
    // simple thumbnails
    const img = document.createElement('img');

    img.src = thumbnail;
    img.alt = '';
    picture.appendChild(img);
  } else {
    // responsive thumbnails

    // additional variations of a <picture> are specified as
    // <source> elements
    for (let i = 0; i < thumbnail.length - 1; i++) {
      const variant = thumbnail[i];
      const source = document.createElement('source');

      // transfer the properties of each variant onto a <source>
      for (const prop in variant) {
        source[prop] = variant[prop];
      }
      picture.appendChild(source);
    }

    // the default version of a <picture> is specified by an <img>
    const variant = thumbnail[thumbnail.length - 1];
    const img = document.createElement('img');

    img.alt = '';
    for (const prop in variant) {
      img[prop] = variant[prop];
    }
    picture.appendChild(img);
  }
  return picture;
};

const Component = videojs.getComponent('Component');

class PlaylistMenuItem extends Component {

  constructor(player, playlistItem, settings) {
    if (!playlistItem.item) {
      throw new Error('Cannot construct a PlaylistMenuItem without an item option');
    }

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
    const li = document.createElement('li');
    const item = this.options_.item;

    li.className = 'vjs-playlist-item';
    li.setAttribute('tabIndex', 0);

    // Thumbnail image
    this.thumbnail = createThumbnail(item.thumbnail);
    li.appendChild(this.thumbnail);

    // Duration
    if (item.duration) {
      const duration = document.createElement('time');
      const time = videojs.formatTime(item.duration);

      duration.className = 'vjs-playlist-duration';
      duration.setAttribute('datetime', 'PT0H0M' + item.duration + 'S');
      duration.appendChild(document.createTextNode(time));
      li.appendChild(duration);
    }

    // Now playing
    const nowPlayingEl = document.createElement('span');
    const nowPlayingText = this.localize('Now Playing');

    nowPlayingEl.className = 'vjs-playlist-now-playing-text';
    nowPlayingEl.appendChild(document.createTextNode(nowPlayingText));
    nowPlayingEl.setAttribute('title', nowPlayingText);
    this.thumbnail.appendChild(nowPlayingEl);

    // Title container contains title and "up next"
    const titleContainerEl = document.createElement('div');

    titleContainerEl.className = 'vjs-playlist-title-container';
    this.thumbnail.appendChild(titleContainerEl);

    // Up next
    const upNextEl = document.createElement('span');
    const upNextText = this.localize('Up Next');

    upNextEl.className = 'vjs-up-next-text';
    upNextEl.appendChild(document.createTextNode(upNextText));
    upNextEl.setAttribute('title', upNextText);
    titleContainerEl.appendChild(upNextEl);

    // Video title
    const titleEl = document.createElement('cite');
    const titleText = item.name || this.localize('Untitled Video');

    titleEl.className = 'vjs-playlist-name';
    titleEl.appendChild(document.createTextNode(titleText));
    titleEl.setAttribute('title', titleText);
    titleContainerEl.appendChild(titleEl);

    return li;
  }
}

class TogglePlaylistButton extends Component {

  constructor(player, options) {
    super(player, options);
    this.el_.className = 'vjs-toggle-playlist';

    // this.on(['tap','click'], this.handleClick);

  }
  createEl() {
    return super.createEl('div', {
      id: 'vjs-toggle-playlist',
      innerHTML: '<button class="vjs-control vjs-button"><span class="vjs-icon-playlist-toggle" aria-hidden="true" value="Playlist Toggle"><svg enable-background="new 0 0 24 24" fill="#FFFFFF" height="24" id="Layer_1" version="1.1" viewBox="0 0 24 24" width="24" x="0px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" y="0px"><g id="XMLID_1_"><path d="M0,0h24v24H0V0z" fill="none"/><g id="XMLID_2_"><rect height="2" id="XMLID_3_" width="12" x="4" y="10"/><rect height="2" id="XMLID_4_" width="12" x="4" y="6"/><rect height="2" id="XMLID_5_" width="8" x="4" y="14"/><polygon id="XMLID_6_" points="14,14 14,20 19,17   "/></g></g></svg></span></button>'
    });
  }

/**
   * Handle click to toggle between open and closed
   *
   * @method handleClick
   */
  handleClick(event) {}

}

class NextButton extends Component {

  constructor(player, options) {
    super(player, options);
    this.el().className = 'vjs-next-video-button vjs-menu-button vjs-menu-button-popup vjs-button';

    // this.on(['tap','click'], this.handleClick);

  }
  createEl() {
    return super.createEl('div', {
      id: 'nextButton',
      innerHTML: '<button class="vjs-control vjs-menu-button-popup vjs-button" role="button"><span class="vjs-icon-next" aria-hidden="true"><svg width="35" height="25"><symbol id="sym01" viewBox="0 0 24 24" id="ic_fast_forward_24px"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" fill="white"/></symbol><use href="#sym01" x="0" y="0" width="35" height="25"/></svg></span><span class="vjs-control-text">Next Video</span></button><div id="vjs-playlist-up-next" name="vjs-playlist-up-next" class="vjs-menu"></div>'
    });
  }
/**
   * Handle click to toggle between open and closed
   *
   * @method handleClick
   */
  handleClick(event) {}

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
    let list = this.el_.querySelector('.vjs-playlist-item-list');
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
      const item = new PlaylistMenuItem(this.player_, {
        item: playlist[i]
      }, this.options_);

      this.items.push(item);
      list.appendChild(item.el_);
    }

    // Inject the ad overlay. IE<11 doesn't support "pointer-events:
    // none" so we use this element to block clicks during ad
    // playback.
    if (!overlay) {
      overlay = document.createElement('li');
      overlay.className = 'vjs-playlist-ad-overlay';
      list.appendChild(overlay);
    } else {
      // Move overlay to end of list
      list.appendChild(overlay);
    }

    // select the current playlist item
    const selectedIndex = this.player_.playlist.currentItem();

    if (this.items.length && selectedIndex >= 0) {
      addSelectedClass(this.items[selectedIndex]);

      const thumbnail = this.items[selectedIndex].$('.vjs-playlist-thumbnail');

      if (thumbnail) {
        dom.addClass(thumbnail, 'vjs-playlist-now-playing');
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
      const item = this.items[i];

      if (i === currentItem) {
        addSelectedClass(item);
        if (document.activeElement !== item.el()) {
          dom.addClass(item.thumbnail, 'vjs-playlist-now-playing');
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
  let settings;
  let buttonIndex;
  let elem;

  if (!player.playlist) {
    throw new Error('videojs-playlist is required for the playlist component');
  }

  // if the first argument is a DOM element, use it to build the component
  if ((typeof window.HTMLElement !== 'undefined' && options instanceof window.HTMLElement) ||
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
  if (!options.showPlaylist) {
    player.playlistMenu.addClass('vjs-hidden');
  }

  // build the toggle playlist button
  if (options.showToggle) {
    buttonIndex = player.controlBar.children().map(function(c) {
      return c.name();
    }).indexOf('FullscreenToggle') - 1;

    player.controlBar.playlistToggleButton = player.controlBar.addChild('TogglePlaylistButton', {}, buttonIndex);
    player.controlBar.playlistToggleButton.el().setAttribute('tabindex', 0);
    player.controlBar.playlistToggleButton.on('click', function(evt) {
      player.playlistMenu.toggleClass('vjs-hidden');
    });
  }

  // build the up next playlist button
  if (options.showUpNext) {
    buttonIndex = player.controlBar.children().map(function(c) {
      return c.name();
    }).indexOf('PlayToggle') + 1;
    player.controlBar.playlistNextButton = player.controlBar.addChild('NextButton', {}, buttonIndex);
    player.controlBar.playlistNextButton.el().setAttribute('tabindex', 0);
    const menuDiv = document.createElement('div');

    menuDiv.className = 'vjs-menu';
    player.controlBar.playlistNextButton.addChild(menuDiv);
    player.on('loadedmetadata', function() {
      const next = player.playlistMenu.items[player.playlist.currentItem() + 1].thumbnail;

      const nextnew = document.createElement('div');

      nextnew.className += 'vjs-menu-content';
      nextnew.id = 'vjs-playlist-up-next-item';
      nextnew.innerHTML = next.innerHTML;
      const menu = player.controlBar.$('#vjs-playlist-up-next');

      for (let i = 0; i < menu.children.length; i++) {
        if (menu.children[i].className === 'vjs-menu-content') {
          menu.removeChild(menu.children[i]);
        }
      }
      menu.appendChild(nextnew);
    });
    player.controlBar.playlistNextButton.on('click', function(evt) {
      player.playlist.next();
    });
  }

};

// register components
videojs.registerComponent('PlaylistMenu', PlaylistMenu);
videojs.registerComponent('PlaylistMenuItem', PlaylistMenuItem);
videojs.registerComponent('TogglePlaylistButton', TogglePlaylistButton);
videojs.registerComponent('NextButton', NextButton);

// register the plugin
registerPlugin('playlistUi', playlistUi);
