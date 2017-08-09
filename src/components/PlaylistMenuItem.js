/**
 * @file PlaylistMenu.js
 */

import videojs from 'video.js';
const Component = videojs.getComponent('Component');
import createThumbnail from '../functions/createThumbnail.js';
import indexOf from '../functions/indexOf.js';

const dom = videojs.dom || videojs;

/**
 * Root button class for Debugger ButtonBar buttons
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class PlaylistMenuItem
 */
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

videojs.registerComponent('PlaylistMenuItem', PlaylistMenuItem);
export default PlaylistMenuItem;
