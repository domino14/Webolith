import React from 'react';

const SPINNER_LOC = '/static/img/aerolith/blue_spinner.gif';

interface SpinnerProps {
  visible: boolean;
}

function Spinner({ visible }: SpinnerProps) {
  return (
    <img
      alt="Loading..."
      src={SPINNER_LOC}
      style={{
        display: visible ? 'block' : 'none',
        position: 'fixed',
        left: '50%',
        top: '20%',
        zIndex: 10000, // Default z-index for Bootstrap modal is 1050, need
        // this higher than that.
      }}
    />
  );
}

export default Spinner;
