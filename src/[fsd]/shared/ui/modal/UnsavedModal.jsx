import { memo, useCallback, useEffect, useRef } from 'react';

import { useStore } from 'react-redux';
import { matchPath, useBlocker } from 'react-router-dom';

import { Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import useNavBlocker from '@/hooks/useNavBlocker';
import { BLOCK_NAV_PATTERNS } from '@/routes';

import BaseModal from './BaseModal';

const UnsavedModal = memo(() => {
  const store = useStore();
  const {
    isBlockNav,
    isStreaming,
    isResetApiState,
    setBlockNav,
    setStreamingBlockNav,
    setIsResetApiState,
    resetApiState,
  } = useNavBlocker();

  const wasStreamingOnBlock = useRef(false);

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) => {
        const { isBlockNav: blockNav, isStreaming: streaming } = store.getState().settings.navBlocker;
        const isBlockablePath = BLOCK_NAV_PATTERNS.some(pattern =>
          matchPath(pattern, currentLocation.pathname),
        );
        return (
          isBlockablePath && (blockNav || streaming) && currentLocation.pathname !== nextLocation.pathname
        );
      },
      [store],
    ),
  );

  const isBlocked = blocker.state === 'blocked';

  if (isBlocked && !wasStreamingOnBlock.current && isStreaming) {
    wasStreamingOnBlock.current = true;
  }
  if (!isBlocked) {
    wasStreamingOnBlock.current = false;
  }

  const message = wasStreamingOnBlock.current
    ? ModalConstants.WARNING_MESSAGES.GENERATION_INTERRUPTION
    : ModalConstants.WARNING_MESSAGES.UNSAVED_CHANGES;

  const confirmButton = wasStreamingOnBlock.current
    ? ModalConstants.WARNING_BUTTONS.SWITCH
    : ModalConstants.WARNING_BUTTONS.LEAVE;

  const handleCancel = useCallback(() => {
    blocker.reset?.();
  }, [blocker]);

  const handleConfirm = useCallback(() => {
    blocker.proceed();
    if (isResetApiState && resetApiState) {
      resetApiState();
      setIsResetApiState(false);
    }
    setBlockNav(false);
    setStreamingBlockNav(false, 'prompt');
  }, [blocker, isResetApiState, resetApiState, setBlockNav, setIsResetApiState, setStreamingBlockNav]);

  useEffect(() => {
    function alertLeave(e) {
      if (!isBlockNav && !isStreaming) {
        return;
      }
      e.preventDefault();
      return true;
    }
    window.addEventListener('beforeunload', alertLeave);
    return () => {
      window.removeEventListener('beforeunload', alertLeave);
    };
  }, [isBlockNav, isStreaming]);

  return (
    <BaseModal
      variant={ModalConstants.MODAL_VARIANT.simple}
      titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
      title="Warning"
      content={<Typography variant="bodyMedium">{message}</Typography>}
      open={isBlocked}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      confirmButtonText={confirmButton}
      // Stable test hook for the nav-blocker's confirm action (e.g. "Leave").
      // Preserves the testid the older AlertDialog-based unsaved-changes
      // dialog used to carry, so existing page-object callers keep working.
      confirmButtonTestId="alert-dialog-confirm-button"
    />
  );
});

UnsavedModal.displayName = 'UnsavedModal';

export default UnsavedModal;
