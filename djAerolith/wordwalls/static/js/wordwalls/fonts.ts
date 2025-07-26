interface FontConfig {
  fontFamily: string;
  dy: string;
}

interface Fonts {
  mono: FontConfig;
  sans: FontConfig;
  sansmono: FontConfig;
  [key: string]: FontConfig;
}

const fonts: Fonts = {
  mono: {
    fontFamily: '"Nimbus Mono L","Nimbus Mono","Courier New",monospace',
    dy: '0.25em',
  },
  sans: {
    fontFamily: 'Arial,Verdana,Ubuntu,Geneva,sans-serif',
    dy: '0.35em',
  },
  sansmono: {
    fontFamily: 'Monaco,Consolas,"Ubuntu Mono",monospace',
    dy: '0.35em',
  },
};

export default fonts;
export type { FontConfig, Fonts };
