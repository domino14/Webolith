/**
 * Utility functions to ensure dark mode is applied to dynamically created modals
 */

/**
 * Apply dark mode to a modal element
 * @param {HTMLElement} modalElement The modal element to apply dark mode to
 */
function applyDarkModeToModal(modalElement) {
  if (!modalElement || !document.body.classList.contains('dark-mode')) return;

  // Add dark-mode class to the modal
  modalElement.classList.add('dark-mode-modal');

  // Apply dark mode to modal content
  const modalContent = modalElement.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.backgroundColor = '#2d2d2d';
    modalContent.style.color = '#e0e0e0';
    modalContent.style.borderColor = '#444';
  }

  // Apply dark mode to modal header
  const modalHeader = modalElement.querySelector('.modal-header');
  if (modalHeader) {
    modalHeader.style.backgroundColor = '#333';
    modalHeader.style.borderBottomColor = '#444';
  }

  // Apply dark mode to modal body
  const modalBody = modalElement.querySelector('.modal-body');
  if (modalBody) {
    modalBody.style.backgroundColor = '#2d2d2d';
    modalBody.style.color = '#e0e0e0';

    // Ensure text elements are visible
    const textElements = modalBody.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, li, td, th');
    textElements.forEach(el => {
      if (el.classList && !el.classList.contains('btn')) {
        el.style.color = '#e0e0e0';
      }
    });

    // Make headings stand out
    const headings = modalBody.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      heading.style.color = '#ffffff';
      heading.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.5)';
    });
  }

  // Apply dark mode to modal footer
  const modalFooter = modalElement.querySelector('.modal-footer');
  if (modalFooter) {
    modalFooter.style.backgroundColor = '#333';
    modalFooter.style.borderTopColor = '#444';
  }
}

/**
 * Remove dark mode from a modal element
 * @param {HTMLElement} modalElement The modal element to remove dark mode from
 */
function removeDarkModeFromModal(modalElement) {
  if (!modalElement) return;

  // Remove dark-mode class from the modal
  modalElement.classList.remove('dark-mode-modal');

  // Reset modal content styles
  const modalContent = modalElement.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.backgroundColor = '';
    modalContent.style.color = '';
    modalContent.style.borderColor = '';
  }

  // Reset modal header
  const modalHeader = modalElement.querySelector('.modal-header');
  if (modalHeader) {
    modalHeader.style.backgroundColor = '';
    modalHeader.style.borderBottomColor = '';
  }

  // Reset modal body
  const modalBody = modalElement.querySelector('.modal-body');
  if (modalBody) {
    modalBody.style.backgroundColor = '';
    modalBody.style.color = '';

    // Reset text elements
    const textElements = modalBody.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, li, td, th');
    textElements.forEach(el => {
      if (el.classList && !el.classList.contains('btn')) {
        el.style.color = '';
      }
    });

    // Reset headings
    const headings = modalBody.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      heading.style.color = '';
      heading.style.textShadow = '';
    });
  }

  // Reset modal footer
  const modalFooter = modalElement.querySelector('.modal-footer');
  if (modalFooter) {
    modalFooter.style.backgroundColor = '';
    modalFooter.style.borderTopColor = '';
  }
}

/**
 * Set up mutation observer to detect new modals and apply dark mode to them
 */
function setupDarkModeModalObserver() {
  if (!document.body.classList.contains('dark-mode')) return;

  // Create an observer instance
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];

          // Check if the added node is a modal or contains a modal
          if (node.nodeType === 1) { // Element node
            if (node.classList && (
              node.classList.contains('modal') ||
              node.classList.contains('solutions-modal')
            )) {
              applyDarkModeToModal(node);
            } else {
              // Check for modals inside the added node
              const modals = node.querySelectorAll('.modal, .solutions-modal');
              modals.forEach(modal => applyDarkModeToModal(modal));
            }
          }
        }
      }
    });
  });

  // Start observing
  observer.observe(document.body, { childList: true, subtree: true });

  return observer;
}

// Apply dark mode to any existing modals
function applyDarkModeToExistingModals() {
  if (!document.body.classList.contains('dark-mode')) return;

  const modals = document.querySelectorAll('.modal, .solutions-modal');
  modals.forEach(modal => applyDarkModeToModal(modal));
}

/**
 * Remove dark mode from all existing modals
 */
function removeDarkModeFromExistingModals() {
  const modals = document.querySelectorAll('.modal, .solutions-modal');
  modals.forEach(modal => removeDarkModeFromModal(modal));
}

export { applyDarkModeToModal, setupDarkModeModalObserver, applyDarkModeToExistingModals, removeDarkModeFromModal, removeDarkModeFromExistingModals };
