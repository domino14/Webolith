/**
 * @fileOverview A skeleton for a modal, so we avoid repeating modal
 * code.
 */
import React from 'react';

const ModalSkeleton = props => (
  <div
    className={`modal fade ${props.modalClass}`}
    role="dialog"
    tabIndex="-1"
  >
    <div
      className="modal-dialog modal-lg"
      role="document"
    >
      <div className="modal-content">
        <div className="modal-header">
          <button
            type="button"
            className="close"
            data-dismiss="modal"
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
          <h4
            className="modal-title"
          >{props.title}</h4>
        </div>
        {props.children /* the body and footer, if any.*/}
      </div>
    </div>
  </div>);

ModalSkeleton.propTypes = {
  title: React.PropTypes.string,
  modalClass: React.PropTypes.string,
  children: React.PropTypes.node,
};

export default ModalSkeleton;
