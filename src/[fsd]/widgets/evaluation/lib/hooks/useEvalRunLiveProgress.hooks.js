import { useCallback, useEffect, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import useSocket, { useManualSocket } from '@/hooks/useSocket';

import { TAG_EVAL_RUN, evaluationApi } from '../../api';
import { EVAL_SIO_EVENTS } from '../constants';

/**
 * Subscribe to one evaluation run's progress room and patch the `evalRun` cache
 * from pushed frames instead of polling for them.
 *
 * The room is joined by run id, so a reload re-joins the same room and keeps
 * following a run that is already in flight. `GET eval_run` stays the source of
 * truth: it seeds the cache on mount and is re-read on reconnect, because frames
 * emitted while the socket was down are gone rather than queued.
 *
 * `isLive` waits for the server's join ack rather than trusting `socketConnected`: a socket that is
 * connected to a server without these handlers, or whose join was refused for project membership,
 * receives nothing while looking identical to a live feed — and the caller would switch its
 * fallback poll off on the strength of that.
 */
export const useEvalRunLiveProgress = ({ projectId, runId, enabled = true }) => {
  const dispatch = useDispatch();
  const { socketConnected } = useSelector(state => state.settings);

  const active = !!enabled && projectId != null && runId != null;
  const [joinedRunId, setJoinedRunId] = useState(null);

  const { emit: emitEnter } = useManualSocket(EVAL_SIO_EVENTS.eval_run_enter_room);
  const { emit: emitLeave } = useManualSocket(EVAL_SIO_EVENTS.eval_run_leave_room);

  const onProgress = useCallback(
    frame => {
      if (!active || String(frame?.run_id) !== String(runId)) return;
      dispatch(
        evaluationApi.util.updateQueryData('evalRun', { projectId, runId }, draft => {
          if (frame.status !== undefined) draft.status = frame.status;
          if (frame.progress !== undefined) draft.progress = frame.progress;
          if (frame.headline_score !== undefined) draft.headline_score = frame.headline_score;
          if (frame.error !== undefined) draft.error = frame.error;
        }),
      );
    },
    [active, runId, dispatch, projectId],
  );

  useSocket(EVAL_SIO_EVENTS.eval_run_progress, onProgress);

  const onRoomJoined = useCallback(
    ack => {
      if (String(ack?.run_id) !== String(runId)) return;
      setJoinedRunId(String(runId));
    },
    [runId],
  );

  useSocket(EVAL_SIO_EVENTS.eval_run_room_joined, onRoomJoined);

  // Re-run on every reconnect, not just on mount: a new socket id is not in any
  // room, and the run may have advanced or finished while it was gone.
  // null until the socket has been seen down at least once, so the initial join
  // does not refetch what the query just fetched.
  const wasDisconnectedRef = useRef(null);

  useEffect(() => {
    if (!active || !socketConnected) {
      if (active) wasDisconnectedRef.current = true;
      setJoinedRunId(null);
      return undefined;
    }
    emitEnter({ project_id: projectId, run_id: runId });
    if (wasDisconnectedRef.current) {
      dispatch(evaluationApi.util.invalidateTags([TAG_EVAL_RUN]));
    }
    wasDisconnectedRef.current = false;
    return () => {
      emitLeave({ project_id: projectId, run_id: runId });
      setJoinedRunId(null);
    };
  }, [active, socketConnected, emitEnter, emitLeave, projectId, runId, dispatch]);

  return { isLive: active && socketConnected && joinedRunId === String(runId) };
};
