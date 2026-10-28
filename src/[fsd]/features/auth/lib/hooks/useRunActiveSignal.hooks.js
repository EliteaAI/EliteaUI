import { useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { actions as settingsActions } from '@/slices/settings';

/**
 * Tell the socket session guard that a run is working on the shared socket while `isActive` is true.
 *
 * The guard re-handshakes a socket when a tab comes back after a long time hidden, and a new handshake
 * changes the socket id and drops its rooms, so it must leave a socket alone while a run uses it. Chats
 * that already set `navBlocker.isStreaming` are covered by that flag; this is for the surfaces that do
 * not (it never blocks navigation).
 */
export const useRunActiveSignal = isActive => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isActive) return undefined;

    dispatch(settingsActions.runActiveStarted());
    return () => {
      dispatch(settingsActions.runActiveEnded());
    };
  }, [dispatch, isActive]);
};
