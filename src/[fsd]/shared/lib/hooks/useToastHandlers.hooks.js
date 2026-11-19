import { useContext } from 'react';

import { ToastContext } from '@/[fsd]/shared/lib/context/ToastContext';

// The toast functions only. Unlike useToast, it does not set the toast position, which belongs to the
// page: use it in parts that are mounted on every page (the menu), so they do not move the page's toasts.
export const useToastHandlers = () => {
  const { toastHandlers } = useContext(ToastContext);
  return toastHandlers;
};
