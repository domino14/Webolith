/**
 * @fileOverview A helper library for dealing with custom styling.
 */

import Immutable from 'immutable';

class Styling {
  /**
   * Initialize the style.
   * @param {string} blob A JSON blob that contains styling information.
   */
  constructor(blob) {
    let style;
    if (blob != null) {
      style = JSON.parse(blob);
      // Add default options that may not have been there.
      // For the first two of these options, we explicitly compare that
      // they haven't been set to false.
      if (style.tc.showChips !== false) {
        style.tc.showChips = true;
      }

      if (!style.tc.selection) {
        style.tc.selection = '1';
      }
      if (!style.tc.customOrder) {
        style.tc.customOrder = '';
      }
      if (!style.tc.blankCharacter) {
        style.tc.blankCharacter = '?';
      }
      style.bc.hideLexiconSymbols = style.bc.hideLexiconSymbols || false;
      style.bc.background = style.bc.background || '';
      style.bc.bodyBackground = style.bc.bodyBackground || '';
    } else {
      // Default style.
      style = {
        tc: {
          on: true,
          selection: '1',
          customOrder: '',
          blankCharacter: '?',
          font: 'mono',
          showChips: true,
          bold: false,
        },
        bc: {
          background: '',
          bodyBackground: '',
          showBorders: false,
          hideLexiconSymbols: false,
        },
      };
    }
    this.style = Immutable.fromJS(style);
  }

  /**
   * Used for serialization to the backend. Just serialize as an object.
   */
  toJSON() {
    return this.style.toJSON();
  }
  /**
   * Getters are provided here so that the underlying users of this
   * class don't need to know the structure of the `style` object.
   */

  get customOrder() {
    return this.style.getIn(['tc', 'customOrder']);
  }

  get tilesOn() {
    return this.style.getIn(['tc', 'on']);
  }

  get tileStyle() {
    return this.style.getIn(['tc', 'selection']);
  }

  get blankCharacter() {
    return this.style.getIn(['tc', 'blankCharacter']);
  }

  get font() {
    return this.style.getIn(['tc', 'font']);
  }

  get showChips() {
    return this.style.getIn(['tc', 'showChips']);
  }

  get showBold() {
    return this.style.getIn(['tc', 'bold']);
  }

  get hideLexiconSymbols() {
    return this.style.getIn(['bc', 'hideLexiconSymbols']);
  }

  get showBorders() {
    return this.style.getIn(['bc', 'showBorders']);
  }

  get background() {
    return this.style.getIn(['bc', 'background']);
  }

  get bodyBackground() {
    return this.style.getIn(['bc', 'bodyBackground']);
  }


  /**
   * Set the style key to the given value. This function takes care of
   * parsing where in the tree the key is stored.
   * @param {string} key A key such as 'showBorders'.
   * @param {any} value A value for this key, usually a string or a bool.
   */
  setStyleKey(key, value) {
    const treeKeys = {
      customTileOrder: ['tc', 'customOrder'],
      tilesOn: ['tc', 'on'],
      tileStyle: ['tc', 'selection'],
      blankCharacter: ['tc', 'blankCharacter'],
      font: ['tc', 'font'],
      showChips: ['tc', 'showChips'],
      showBold: ['tc', 'bold'],
      hideLexiconSymbols: ['bc', 'hideLexiconSymbols'],
      showBorders: ['bc', 'showBorders'],
      background: ['bc', 'background'],
      bodyBackground: ['bc', 'bodyBackground'],
    };
    if (!treeKeys[key]) {
      throw new Error(`The key ${key} was not found in the tree.`);
    }
    this.style = this.style.setIn(treeKeys[key], value);
  }

  copy() {
    const n = new Styling();
    n.style = Immutable.fromJS(this.toJSON());
    return n;
  }

}

export default Styling;
