import React from 'react';

interface HeroButtonProps {
  addlButtonClass: string;
  modalSelector?: string;
  buttonText: string;
  onClick?: () => void;
}

function HeroButton({
  addlButtonClass,
  modalSelector,
  buttonText,
  onClick = () => {},
}: HeroButtonProps) {
  return (
    <div className="col-md-6 col-sm-12" style={{ marginTop: 6 }}>
      <button
        type="button"
        className={`btn btn-lg ${addlButtonClass}`}
        onClick={onClick}
        data-bs-toggle="modal"
        {...(modalSelector && { 'data-bs-target': modalSelector })}
      >
        {buttonText}
      </button>
    </div>
  );
}

export default HeroButton;
