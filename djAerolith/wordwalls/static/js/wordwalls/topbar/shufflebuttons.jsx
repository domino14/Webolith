import React from 'react';
import PropTypes from 'prop-types';

const ShuffleButton = (props) => (
  <>
    <div className="d-none d-md-block col-md-3 col-lg-3">
      <button
        className="btn btn-info btn-sm"
        style={{
          width: 105,
        }}
        type="button"
        onClick={props.trigger}
      >
        <span
          className="badge rounded-pill bg-secondary"
        >
          {props.hotKey}
        </span>
        {' '}
        {props.buttonText}
      </button>
    </div>
    <div className="d-md-none col-sm-3 col-3">
      <button
        className="btn btn-info btn-sm"
        type="button"
        style={{
          marginLeft: '0.5em',
        }}
        onClick={props.trigger}
      >
        <span
          className="badge rounded-pill bg-secondary"
        >
          {props.hotKey}
        </span>
        <i
          className={`bi ${props.icon}`}
          style={{ marginLeft: '0.5em' }}
        />
      </button>
    </div>
  </>
);

ShuffleButton.propTypes = {
  trigger: PropTypes.func.isRequired,
  hotKey: PropTypes.string.isRequired,
  buttonText: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
};

const ShuffleButtons = (props) => (
  <div
    className="row"
    style={{ whiteSpace: 'nowrap' }}
  >
    <ShuffleButton
      trigger={props.shuffle}
      hotKey="1"
      buttonText="Shuffle"
      icon="bi-shuffle"
    />
    <ShuffleButton
      trigger={props.alphagram}
      hotKey="2"
      buttonText="Alphagram"
      icon="bi-sort-alpha-down"
    />
    <ShuffleButton
      trigger={props.customOrder}
      hotKey="3"
      buttonText="Custom"
      icon="bi-sort-up-alt"
    />
  </div>
);

ShuffleButtons.propTypes = {
  shuffle: PropTypes.func.isRequired,
  alphagram: PropTypes.func.isRequired,
  customOrder: PropTypes.func.isRequired,
};

export default ShuffleButtons;
