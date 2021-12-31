/* eslint-disable react/no-unused-class-component-methods */
/**
 * @fileOverview A skeleton for a modal, so we avoid repeating modal
 * code.
 */
import React from 'react';
import PropTypes from 'prop-types';

import $ from 'jquery';

class ModalSkeleton extends React.Component {
  dismiss() {
    $(this.modal).modal('hide');
  }

  show() {
    $(this.modal).modal('show');
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
              >
                {this.props.title}
              </h4>
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
