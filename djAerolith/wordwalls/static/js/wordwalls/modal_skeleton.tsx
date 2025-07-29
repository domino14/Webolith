/**
 * @fileOverview A skeleton for a modal, so we avoid repeating modal
 * code.
 */
import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Modal } from 'bootstrap';

interface ModalSkeletonProps {
  title: string;
  size: string;
  modalClass: string;
  children: React.ReactNode;
  onShown?: () => void;
}

export interface ModalSkeletonRef {
  dismiss: () => void;
  show: () => void;
}

const ModalSkeleton = forwardRef<ModalSkeletonRef, ModalSkeletonProps>(
  ({
    title, size, modalClass, children, onShown,
  }, ref) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const modalElement = modalRef.current;
      if (modalElement && onShown) {
        const handleShown = () => onShown();
        modalElement.addEventListener('shown.bs.modal', handleShown);
        return () => modalElement.removeEventListener('shown.bs.modal', handleShown);
      }
    }, [onShown]);

    useImperativeHandle(ref, () => ({
      dismiss() {
        if (modalRef.current) {
          const modal = Modal.getInstance(modalRef.current);
          if (modal) {
            modal.hide();
          } else {
            const bootstrapModal = new Modal(modalRef.current);
            bootstrapModal.hide();
          }
        }
      },
      show() {
        if (modalRef.current) {
          const modal = Modal.getInstance(modalRef.current);
          if (modal) {
            modal.show();
          } else {
            const bootstrapModal = new Modal(modalRef.current);
            bootstrapModal.show();
          }
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
              <h4 className="modal-title">{title}</h4>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
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
