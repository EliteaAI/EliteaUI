import { useCallback, useState } from 'react';

/**
 * Generic modal state management hook
 * Replaces the common pattern: const [isModalOpen, setIsModalOpen] = useState(false)
 */
export const useModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    handleOpen,
    handleClose,
    toggle,
  };
};
