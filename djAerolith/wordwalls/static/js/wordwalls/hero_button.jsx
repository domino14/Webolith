import React from 'react';
import PropTypes from 'prop-types';

const HeroButton = (props) => (
  <div className="col-md-6 col-sm-12" style={{ marginTop: 6 }}>
    <button
      type="button"
      className={`btn btn-lg ${props.addlButtonClass}`}
      onClick={props.onClick} // () => $(props.modalSelector).modal()}
      data-toggle="modal"
      data-target={props.modalSelector}
    >
      {props.buttonText}
    </button>
  </div>
);

HeroButton.defaultProps = {
  modalSelector: null,
  onClick: () => {},
};

HeroButton.propTypes = {
  addlButtonClass: PropTypes.string.isRequired,
  modalSelector: PropTypes.string,
  buttonText: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

export default HeroButton;
