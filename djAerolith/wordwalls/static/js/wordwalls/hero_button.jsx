import React from 'react';

const HeroButton = props => (
  <div className="col-md-6 col-sm-12" style={{ marginTop: 6 }}>
    <button
      className={`btn btn-lg ${props.addlButtonClass}`}
      role="button"
      onClick={props.onClick} // () => $(props.modalSelector).modal()}
      data-toggle="modal"
      data-target={props.modalSelector}
    >{props.buttonText}</button>
  </div>
);

HeroButton.propTypes = {
  addlButtonClass: React.PropTypes.string,
  modalSelector: React.PropTypes.string,
  buttonText: React.PropTypes.string,
  onClick: React.PropTypes.func,
};

export default HeroButton;

