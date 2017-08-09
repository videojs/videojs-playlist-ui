/**
 * @file buttonBar-button.js
 */

import videojs from 'video.js';
const Button = videojs.getComponent('Component');
const dom = videojs.dom || videojs;

/**
 * Root button class for Debugger ButtonBar buttons
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Component
 * @class nextButton
 */
class nextButton extends Button {

  constructor(player, options) {
    super(player, options);
    this.el().className = 'vjs-next-video-button vjs-menu-button vjs-menu-button-popup vjs-button';

    // this.on(['tap','click'], this.handleClick);

  }
  createEl() {
    return super.createEl('div', {
      id: 'nextButton',
      innerHTML: '<button class="vjs-control vjs-menu-button-popup vjs-button" role="button"><span class="vjs-icon-next" style="font-size:18px;" aria-hidden="true"></span><span class="vjs-control-text">Next Video</span></button><div id="vjs-playlist-up-next" name="vjs-playlist-up-next" class="vjs-menu"></div>'
    });
  }
/**
   * Handle click to toggle between open and closed
   *
   * @method handleClick
   */
  handleClick(event) {}

}

videojs.registerComponent('nextButton', nextButton);
export default controlButton;
