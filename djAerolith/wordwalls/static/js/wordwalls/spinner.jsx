import React from 'react';
import PropTypes from 'prop-types';

const SPINNER_LOC = '/static/img/aerolith/blue_spinner.gif';

const Spinner = (props) => (
  <img
    alt="Loading..."
    src={SPINNER_LOC}
    style={{
      display: props.visible ? 'block' : 'none',
      position: 'fixed',
      left: '50%',
      top: '20%',
      zIndex: 10000, // Default z-index for Bootstrap modal is 1050, need
      // this higher than that.
    }}
  />
);

Spinner.propTypes = {
  visible: PropTypes.bool.isRequired,
};

export default Spinner;
