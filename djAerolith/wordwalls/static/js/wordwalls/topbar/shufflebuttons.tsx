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
      <div className="d-none d-md-block col-md-3 col-lg-3">
        <button
          className="btn btn-info btn-sm"
          style={{
            width: 105,
          }}
          type="button"
          onClick={trigger}
        >
          <span
            className="badge bg-light text-dark"
          >
            {hotKey}
          </span>
          {' '}
          {buttonText}
        </button>
      </div>
      <div className="d-inline-block d-md-none">
        <button
          className="btn btn-info btn-sm"
          type="button"
          style={{
            marginLeft: '0.5em',
          }}
          onClick={trigger}
        >
          <span
            className="badge bg-light text-dark"
          >
            {hotKey}
          </span>
          <i
            className={glyphIcon}
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
        glyphIcon="bi bi-shuffle"
      />
      <ShuffleButton
        trigger={alphagram}
        hotKey="2"
        buttonText="Alphagram"
        glyphIcon="bi bi-sort-alpha-down"
      />
      <ShuffleButton
        trigger={customOrder}
        hotKey="3"
        buttonText="Custom"
        glyphIcon="bi bi-sort-down"
      />
    </div>
  );
}

export default ShuffleButtons;
