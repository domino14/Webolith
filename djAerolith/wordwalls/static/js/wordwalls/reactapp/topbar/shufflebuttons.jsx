import React from 'react';

const ShuffleButton = props =>
  <div style={{ display: 'inline-block' }}>
    <div className="hidden-xs col-sm-3 col-md-3 col-lg-3">
      <button
        className="btn btn-info btn-xs"
        style={{
          width: 125,
        }}
        type="button"
        onClick={props.trigger}
      >
        <span
          className="badge"
        >{props.hotKey}</span> {props.buttonText}
      </button>
    </div>
    <div className="visible-xs-inline-block">
      <button
        className="btn btn-info btn-xs"
        type="button"
        onClick={props.trigger}
      >
        <span
          className="badge"
        >{props.hotKey} </span><i
          className={`glyphicon ${props.glyphIcon}`}
          style={{ marginLeft: '0.5em' }}
        />
      </button>
    </div>
  </div>;

ShuffleButton.propTypes = {
  trigger: React.PropTypes.func,
  hotKey: React.PropTypes.string,
  buttonText: React.PropTypes.string,
  glyphIcon: React.PropTypes.string,
};

const ShuffleButtons = props =>
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
  </div>;

ShuffleButtons.propTypes = {
  shuffle: React.PropTypes.func,
  alphagram: React.PropTypes.func,
  customOrder: React.PropTypes.func,
};

export default ShuffleButtons;
