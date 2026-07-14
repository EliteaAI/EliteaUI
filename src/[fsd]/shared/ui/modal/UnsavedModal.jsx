import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { matchPath, useBlocker, useLocation } from 'react-router-dom';

import { Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import useNavBlocker from '@/hooks/useNavBlocker';
import { BLOCK_NAV_PATTERNS } from '@/routes';

import BaseModal from './BaseModal';

const UnsavedModal = memo(() => {
  const location = useLocation();
  const {
    isBlockNav,
    isStreaming,
    isResetApiState,
    setBlockNav,
    setStreamingBlockNav,
    setIsResetApiState,
    resetApiState,
  } = useNavBlocker();

  const isBlockablePath = useMemo(
    () => BLOCK_NAV_PATTERNS.some(pattern => matchPath(pattern, location.pathname)),
    [location.pathname],
  );

  const blockerState = useRef({ isBlockNav, isStreaming, isBlockablePath });
  const wasStreamingOnBlock = useRef(false);

  useEffect(() => {
    blockerState.current = { isBlockNav, isStreaming, isBlockablePath };
  }, [isBlockNav, isStreaming, isBlockablePath]);

  const blocker = useBlocker(
    useCallback(({ currentLocation, nextLocation }) => {
      return (
        blockerState.current.isBlockablePath &&
        (blockerState.current.isBlockNav || blockerState.current.isStreaming) &&
        currentLocation.pathname !== nextLocation.pathname
      );
    }, []),
  );

  const isBlocked = blocker.state === 'blocked';

  if (isBlocked && !wasStreamingOnBlock.current && blockerState.current.isStreaming) {
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
    />
  );
});

UnsavedModal.displayName = 'UnsavedModal';

export default UnsavedModal;
