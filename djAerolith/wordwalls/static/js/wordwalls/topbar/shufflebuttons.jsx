import React from 'react';
import PropTypes from 'prop-types';

const ShuffleButton = (props) => (
  <div style={{ display: 'inline-block' }}>
    <div className="hidden-xs hidden-sm col-md-3 col-lg-3">
      <button
        className="btn btn-info btn-xs"
        style={{
          width: 105,
        }}
        type="button"
        onClick={props.trigger}
      >
        <span
          className="badge"
        >
          {props.hotKey}
        </span>
        {' '}
        {props.buttonText}
      </button>
    </div>
    <div className="visible-xs-inline-block visible-sm-inline-block">
      <button
        className="btn btn-info btn-xs"
        type="button"
        style={{
          marginLeft: '0.5em',
        }}
        onClick={props.trigger}
      >
        <span
          className="badge"
        >
          {props.hotKey}
        </span>
        <i
          className={`glyphicon ${props.glyphIcon}`}
          style={{ marginLeft: '0.5em' }}
        />
      </button>
    </div>
  </div>
);

ShuffleButton.propTypes = {
  trigger: PropTypes.func.isRequired,
  hotKey: PropTypes.string.isRequired,
  buttonText: PropTypes.string.isRequired,
  glyphIcon: PropTypes.string.isRequired,
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
      glyphIcon="glyphicon-random"
    />
    <ShuffleButton
      trigger={props.alphagram}
      hotKey="2"
      buttonText="Alphagram"
      glyphIcon="glyphicon-sort-by-alphabet"
    />
    <ShuffleButton
      trigger={props.customOrder}
      hotKey="3"
      buttonText="Custom"
      glyphIcon="glyphicon-sort"
    />
  </div>
);

ShuffleButtons.propTypes = {
  shuffle: PropTypes.func.isRequired,
  alphagram: PropTypes.func.isRequired,
  customOrder: PropTypes.func.isRequired,
};

export default ShuffleButtons;
