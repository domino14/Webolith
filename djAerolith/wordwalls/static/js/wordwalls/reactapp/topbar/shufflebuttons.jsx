import React from 'react';

const ShuffleButtons = props =>
  <div className="row">
    <div className="col-xs-3 col-sm-3 col-md-3 col-lg-3">
      <button
        className="btn btn-info btn-xs"
        style={{
          width: 125,
        }}
        type="button"
        onClick={props.shuffle}
      >
        <span
          className="badge"
        >1</span> Shuffle
      </button>
    </div>
    <div className="col-xs-3 col-xs-offset-1 col-sm-3 col-sm-offset-0 col-md-3 col-lg-3">
      <button
        className="btn btn-info btn-xs"
        style={{
          width: 125,
        }}
        type="button"
        onClick={props.alphagram}
      >
        <span
          className="badge"
        >2</span> Alphagram
      </button>
    </div>
    <div className="col-xs-3 col-xs-offset-1 col-sm-3 col-sm-offset-0 col-md-3 col-lg-3">
      <button
        className="btn btn-info btn-xs"
        style={{
          width: 125,
        }}
        type="button"
        onClick={props.customOrder}
      >
        <span
          className="badge"
        >3</span> Custom
      </button>
    </div>
  </div>;

ShuffleButtons.propTypes = {
  shuffle: React.PropTypes.func,
  alphagram: React.PropTypes.func,
  customOrder: React.PropTypes.func,
};

export default ShuffleButtons;
