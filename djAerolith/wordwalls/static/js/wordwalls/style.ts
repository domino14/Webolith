/**
 * @fileOverview A helper library for dealing with custom styling.
 */

interface TileConfig {
  on: boolean;
  selection: string;
  customOrder: string;
  blankCharacter: string;
  fontMultiplier: number;
  font: string;
  showChips: boolean;
  bold: boolean;
}

interface BoardConfig {
  background: string;
  bodyBackground: string;
  showBorders: boolean;
  hideLexiconSymbols: boolean;
  upscaleWithWindowSize: string;
  requireOctothorp: boolean;
  hideErrors: boolean;
  darkMode: boolean;
}

interface StyleConfig {
  tc: TileConfig;
  bc: BoardConfig;
}

type StyleKey =
  | 'customTileOrder'
  | 'tilesOn'
  | 'tileStyle'
  | 'blankCharacter'
  | 'fontMultiplier'
  | 'font'
  | 'showChips'
  | 'showBold'
  | 'hideLexiconSymbols'
  | 'showBorders'
  | 'background'
  | 'bodyBackground'
  | 'upscaleWithWindowSize'
  | 'requireOctothorp'
  | 'hideErrors'
  | 'darkMode';

class Styling {
  private styleConfig: StyleConfig;

  /**
   * Initialize the style.
   */
  constructor(blob?: string) {
    let style: StyleConfig;
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
      if (!style.tc.fontMultiplier) {
        style.tc.fontMultiplier = 1;
      }
      // style.tc.randomTileOrientation = style.tc.randomTileOrientation || false;
      style.bc.hideLexiconSymbols = style.bc.hideLexiconSymbols || false;
      style.bc.background = style.bc.background || '';
      style.bc.bodyBackground = style.bc.bodyBackground || '';
      if (!style.bc.upscaleWithWindowSize) {
        style.bc.upscaleWithWindowSize = 'small';
      }
      style.bc.requireOctothorp = style.bc.requireOctothorp || false;
      style.bc.hideErrors = style.bc.hideErrors || false;
      style.bc.darkMode = style.bc.darkMode || false;
    } else {
      // Default style.
      style = {
        tc: {
          on: true,
          selection: '1',
          customOrder: '',
          blankCharacter: '?',
          fontMultiplier: 1,
          font: 'mono',
          showChips: true,
          bold: false,
          // randomTileOrientation: false,
        },
        bc: {
          background: 'pool_table',
          bodyBackground: 'hexellence',
          showBorders: false,
          hideLexiconSymbols: false,
          upscaleWithWindowSize: 'small',
          requireOctothorp: false,
          hideErrors: false,
          darkMode: false,
        },
      };
    }
    this.styleConfig = { ...style };
  }

  /**
   * Used for serialization to the backend. Just serialize as an object.
   */
  toJSON(): StyleConfig {
    return { ...this.styleConfig };
  }

  /**
   * Getters are provided here so that the underlying users of this
   * class don't need to know the structure of the `styleConfig` object.
   */
  get fontMultiplier(): number {
    return this.styleConfig.tc.fontMultiplier;
  }

  get customTileOrder(): string {
    return this.styleConfig.tc.customOrder;
  }

  get tilesOn(): boolean {
    return this.styleConfig.tc.on;
  }

  get tileStyle(): string {
    return this.styleConfig.tc.selection;
  }

  get blankCharacter(): string {
    return this.styleConfig.tc.blankCharacter;
  }

  get font(): string {
    return this.styleConfig.tc.font;
  }

  get showChips(): boolean {
    return this.styleConfig.tc.showChips;
  }

  get showBold(): boolean {
    return this.styleConfig.tc.bold;
  }

  get hideLexiconSymbols(): boolean {
    return this.styleConfig.bc.hideLexiconSymbols;
  }

  get showBorders(): boolean {
    return this.styleConfig.bc.showBorders;
  }

  get background(): string {
    return this.styleConfig.bc.background;
  }

  get bodyBackground(): string {
    return this.styleConfig.bc.bodyBackground;
  }

  get upscaleWithWindowSize(): string {
    return this.styleConfig.bc.upscaleWithWindowSize;
  }

  get requireOctothorp(): boolean {
    return this.styleConfig.bc.requireOctothorp;
  }

  get hideErrors(): boolean {
    return this.styleConfig.bc.hideErrors;
  }

  get darkMode(): boolean {
    return this.styleConfig.bc.darkMode;
  }

  // get randomTileOrientation(): boolean {
  //   return this.styleConfig.tc.randomTileOrientation;
  // }

  /**
   * Set the style key to the given value. This function takes care of
   * parsing where in the tree the key is stored.
   */
  setStyleKey(key: StyleKey, value: string | number | boolean): void {
    const keyMappings: Record<StyleKey, () => void> = {
      customTileOrder: () => { this.styleConfig.tc.customOrder = value as string; },
      tilesOn: () => { this.styleConfig.tc.on = value as boolean; },
      tileStyle: () => { this.styleConfig.tc.selection = value as string; },
      blankCharacter: () => { this.styleConfig.tc.blankCharacter = value as string; },
      fontMultiplier: () => { this.styleConfig.tc.fontMultiplier = value as number; },
      font: () => { this.styleConfig.tc.font = value as string; },
      showChips: () => { this.styleConfig.tc.showChips = value as boolean; },
      showBold: () => { this.styleConfig.tc.bold = value as boolean; },

      hideLexiconSymbols: () => { this.styleConfig.bc.hideLexiconSymbols = value as boolean; },
      showBorders: () => { this.styleConfig.bc.showBorders = value as boolean; },
      background: () => { this.styleConfig.bc.background = value as string; },
      bodyBackground: () => { this.styleConfig.bc.bodyBackground = value as string; },
      upscaleWithWindowSize: () => { this.styleConfig.bc.upscaleWithWindowSize = value as string; },
      requireOctothorp: () => { this.styleConfig.bc.requireOctothorp = value as boolean; },
      hideErrors: () => { this.styleConfig.bc.hideErrors = value as boolean; },
      darkMode: () => { this.styleConfig.bc.darkMode = value as boolean; },
    };

    const setter = keyMappings[key];
    if (!setter) {
      throw new Error(`The key ${key} was not found in the mappings.`);
    }
    setter();
  }

  copy(): Styling {
    return new Styling(JSON.stringify(this.toJSON()));
  }
}

export default Styling;
