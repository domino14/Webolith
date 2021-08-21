/**
 * @fileOverview A skeleton for a modal, so we avoid repeating modal
 * code.
 */
import React from 'react';
import { Modal } from 'bootstrap';
import PropTypes from 'prop-types';

class ModalSkeleton extends React.Component {
  dismiss() {
    const modal = new Modal(this.modal);
    modal.hide();
  }

  show() {
    const modal = new Modal(this.modal);
    modal.show();
  }

  render() {
    return (
      <div
        className={`modal fade ${this.props.modalClass}`}
        role="dialog"
        tabIndex="-1"
        ref={(domNode) => {
          this.modal = domNode;
        }}
      >
        <div
          className={`modal-dialog ${this.props.size}`}
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h4
                className="modal-title"
              >
                {this.props.title}
              </h4>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            {this.props.children /* the body and footer, if any. */}
          </div>
        </div>
      </div>
    );
  }
}

ModalSkeleton.propTypes = {
  title: PropTypes.string.isRequired,
  size: PropTypes.string.isRequired,
  modalClass: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default ModalSkeleton;
