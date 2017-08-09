/**
 * @file buttonBar-button.js
 */

import videojs from 'video.js';
const Button = videojs.getComponent('ClickableComponent');
const dom = videojs.dom || videojs;

/**
 * Root button class for Debugger ButtonBar buttons
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class controlButton
 */
class togglePlaylistButton extends Button {

  constructor(player, options) {
    super(player, options);
    this.el_.className = 'vjs-toggle-playlist';

    // this.on(['tap','click'], this.handleClick);

  }
  createEl() {
    return super.createEl('div', {
      id: 'vjs-toggle-playlist',
      innerHTML: '<button class="vjs-control vjs-button"><span class="vjs-icon-playlist-toggle" style="font-size:22px; padding:auto;" aria-hidden="true" value="Playlist Toggle"></span></button>'
    });
  }

/**
   * Handle click to toggle between open and closed
   *
   * @method handleClick
   */
  handleClick(event) {}

}

videojs.registerComponent('togglePlaylistButton', togglePlaylistButton);
export default togglePlaylistButton;
