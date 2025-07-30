import { Modal } from 'bootstrap';

type AlertSize = 'small' | 'large' | 'extra-large';

class Notifications {
  private static createModal(title: string, message: string, buttons: string, size?: AlertSize): HTMLElement {
    const modalSize = size === 'small' ? 'modal-sm' : size === 'extra-large' ? 'modal-xl' : 'modal-lg';
    
    const modalHTML = `
      <div class="modal fade" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog ${modalSize}">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>${message}</p>
            </div>
            <div class="modal-footer">
              ${buttons}
            </div>
          </div>
        </div>
      </div>
    `;
    
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    const modal = modalElement.firstElementChild as HTMLElement;
    document.body.appendChild(modal);
    
    return modal;
  }

  static alert(title: string, message: string, size?: AlertSize): void {
    const buttons = '<button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>';
    const modalElement = this.createModal(title, message, buttons, size);
    
    const modal = new Modal(modalElement);
    modal.show();
    
    // Clean up after modal is hidden
    modalElement.addEventListener('hidden.bs.modal', () => {
      modal.dispose();
      modalElement.remove();
    });
  }

  static confirm(title: string, message: string, callback: () => void): void {
    const buttons = `
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
      <button type="button" class="btn btn-primary confirm-btn">OK</button>
    `;
    const modalElement = this.createModal(title, message, buttons);
    
    const modal = new Modal(modalElement);
    modal.show();
    
    // Handle confirm button click
    const confirmBtn = modalElement.querySelector('.confirm-btn') as HTMLButtonElement;
    confirmBtn.addEventListener('click', () => {
      callback();
      modal.hide();
    });
    
    // Clean up after modal is hidden
    modalElement.addEventListener('hidden.bs.modal', () => {
      modal.dispose();
      modalElement.remove();
    });
  }
}

export default Notifications;
