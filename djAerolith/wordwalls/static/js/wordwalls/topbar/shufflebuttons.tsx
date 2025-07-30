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
    <>
      {/* Desktop version */}
      <div className="d-none d-md-block">
        <button
          className="btn btn-info btn-sm me-2"
          style={{
            minWidth: 105,
          }}
          type="button"
          onClick={trigger}
        >
          <span
            className="badge bg-light text-dark me-1"
          >
            {hotKey}
          </span>
          {buttonText}
        </button>
      </div>
      {/* Mobile version */}
      <div className="d-block d-md-none">
        <button
          className="btn btn-info btn-sm me-2"
          type="button"
          onClick={trigger}
        >
          <span
            className="badge bg-light text-dark me-1"
          >
            {hotKey}
          </span>
          <i className={glyphIcon} />
        </button>
      </div>
    </>
  );
}

interface ShuffleButtonsProps {
  shuffle: () => void;
  alphagram: () => void;
  customOrder: () => void;
}

function ShuffleButtons({ shuffle, alphagram, customOrder }: ShuffleButtonsProps) {
  return (
    <div className="d-flex flex-wrap align-items-center">
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
