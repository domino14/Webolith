import React from 'react';

interface ShuffleButtonProps {
  trigger: () => void;
  hotKey: string;
  buttonText: string;
  glyphIcon: string;
}

function ShuffleButton({
  trigger, hotKey, buttonText, glyphIcon,
}: ShuffleButtonProps) {
  return (
    <div style={{ display: 'inline-block' }}>
      <div className="hidden-xs hidden-sm col-md-3 col-lg-3">
        <button
          className="btn btn-info btn-xs"
          style={{
            width: 105,
          }}
          type="button"
          onClick={trigger}
        >
          <span
            className="badge"
          >
            {hotKey}
          </span>
          {' '}
          {buttonText}
        </button>
      </div>
      <div className="visible-xs-inline-block visible-sm-inline-block">
        <button
          className="btn btn-info btn-xs"
          type="button"
          style={{
            marginLeft: '0.5em',
          }}
          onClick={trigger}
        >
          <span
            className="badge"
          >
            {hotKey}
          </span>
          <i
            className={`glyphicon ${glyphIcon}`}
            style={{ marginLeft: '0.5em' }}
          />
        </button>
      </div>
    </div>
  );
}

interface ShuffleButtonsProps {
  shuffle: () => void;
  alphagram: () => void;
  customOrder: () => void;
}

function ShuffleButtons({ shuffle, alphagram, customOrder }: ShuffleButtonsProps) {
  return (
    <div
      className="row"
      style={{ whiteSpace: 'nowrap' }}
    >
      <ShuffleButton
        trigger={shuffle}
        hotKey="1"
        buttonText="Shuffle"
        glyphIcon="glyphicon-random"
      />
      <ShuffleButton
        trigger={alphagram}
        hotKey="2"
        buttonText="Alphagram"
        glyphIcon="glyphicon-sort-by-alphabet"
      />
      <ShuffleButton
        trigger={customOrder}
        hotKey="3"
        buttonText="Custom"
        glyphIcon="glyphicon-sort"
      />
    </div>
  );
}

export default ShuffleButtons;
