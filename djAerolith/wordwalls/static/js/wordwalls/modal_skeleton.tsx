/**
 * @fileOverview A skeleton for a modal, so we avoid repeating modal
 * code.
 */
import React, { useRef, useImperativeHandle, forwardRef } from 'react';

import $ from 'jquery';

interface ModalSkeletonProps {
  title: string;
  size: string;
  modalClass: string;
  children: React.ReactNode;
}

export interface ModalSkeletonRef {
  dismiss: () => void;
  show: () => void;
}

const ModalSkeleton = forwardRef<ModalSkeletonRef, ModalSkeletonProps>(
  ({
    title, size, modalClass, children,
  }, ref) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      dismiss() {
        if (modalRef.current) {
          $(modalRef.current).modal('hide');
        }
      },
      show() {
        if (modalRef.current) {
          $(modalRef.current).modal('show');
        }
      },
    }));

    return (
      <div
        className={`modal fade ${modalClass}`}
        role="dialog"
        tabIndex={-1}
        ref={modalRef}
      >
        <div className={`modal-dialog ${size}`} role="document">
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
              <h4 className="modal-title">{title}</h4>
            </div>
            {children /* the body and footer, if any. */}
          </div>
        </div>
      </div>
    );
  },
);

ModalSkeleton.displayName = 'ModalSkeleton';

export default ModalSkeleton;
