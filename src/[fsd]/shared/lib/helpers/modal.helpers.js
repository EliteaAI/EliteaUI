export const getContentPadding = (isFullscreen, isSimple) => {
  if (isFullscreen) return '0 !important';
  if (isSimple) return '0 1.5rem 0.25rem !important';
  return '1.5rem !important';
};

const MODAL_CLASS_NAMES = ['MuiDialog-root', 'MuiModal-root'];

/**
 * True when the element is inside a modal window. A modal is portaled out of the popper that opened it, so
 * a press inside it has to be told apart from a press outside the app.
 */
export const isInsideModal = element => {
  let current = element;

  while (current) {
    if (
      MODAL_CLASS_NAMES.some(className => current.classList?.contains(className)) ||
      current.getAttribute?.('role') === 'dialog'
    )
      return true;

    current = current.parentElement;
  }

  return false;
};
