import React, { useEffect, useRef } from 'react';

import { matchPath, useBlocker, useLocation } from 'react-router-dom';

import useNavBlocker from '@/hooks/useNavBlocker';
import { BLOCK_NAV_PATTERNS } from '@/routes';

import AlertDialog from './AlertDialog';

export default function UnsavedDialog() {
  const location = useLocation();
  const {
    isBlockNav,
    isStreaming,
    warningMessage,
    isResetApiState,
    setBlockNav,
    setStreamingBlockNav,
    setIsResetApiState,
    resetApiState,
  } = useNavBlocker();

  const isBlockablePath = React.useMemo(
    () => BLOCK_NAV_PATTERNS.some(pattern => matchPath(pattern, location.pathname)),
    [location.pathname],
  );
  const state = useRef({ isBlockNav, isStreaming, isBlockablePath });

  useEffect(() => {
    state.current = { isBlockNav, isStreaming, isBlockablePath };
  }, [isBlockNav, isStreaming, isBlockablePath]);

  const blockerFn = React.useCallback(({ currentLocation, nextLocation }) => {
    return (
      state.current.isBlockablePath &&
      (state.current.isBlockNav || state.current.isStreaming) &&
      currentLocation.pathname !== nextLocation.pathname
    );
  }, []);
  const blocker = useBlocker(blockerFn);

  const isBlocked = React.useMemo(() => blocker.state === 'blocked', [blocker]);

  const cancelNavigate = React.useCallback(() => {
    blocker.reset?.();
  }, [blocker]);

  const confirmNavigate = React.useCallback(() => {
    blocker.proceed();
    if (isResetApiState && resetApiState) {
      resetApiState();
      setIsResetApiState(false);
    }
    setBlockNav(false);
    setStreamingBlockNav(false, 'prompt');
  }, [blocker, isResetApiState, resetApiState, setBlockNav, setIsResetApiState, setStreamingBlockNav]);

  React.useEffect(() => {
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
    <AlertDialog
      title="Warning"
      alertContent={warningMessage}
      open={isBlocked}
      alarm
      onClose={cancelNavigate}
      onCancel={cancelNavigate}
      onConfirm={confirmNavigate}
    />
  );
}
