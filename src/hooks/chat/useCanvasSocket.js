import { useCallback, useEffect, useRef } from 'react';

import { sioEvents } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { useManualSocket } from '@/hooks/useSocket';

export const useJoinCanvasSocket = () => {
  const project_id = useSelectedProjectId();
  const handleSocketEvent = useCallback(async () => {
    // Socket event handler
  }, []);

  const { emit } = useManualSocket(sioEvents.chat_canvas_join, handleSocketEvent);

  const joinTheCanvasRoom = useCallback(
    canvas_uuid => {
      emit({ project_id, canvas_uuid });
    },
    [emit, project_id],
  );

  return { joinTheCanvasRoom };
};

export const useLeaveCanvasRoomSocket = () => {
  const { emit } = useManualSocket(sioEvents.chat_canvas_leave_rooms);
  const leaveTheCanvasRoom = useCallback(
    ({ canvas_uuid, project_id, canvas_content, code_language }) => {
      emit({ canvas_uuid, project_id, canvas_content, code_language });
    },
    [emit],
  );

  return { leaveTheCanvasRoom };
};

export const useCanvasEditSocket = () => {
  const project_id = useSelectedProjectId();
  const { emit } = useManualSocket(sioEvents.chat_canvas_edit);

  const sendChangeToRemote = useCallback(
    (canvas_uuid, content) => {
      emit({ project_id, canvas_uuid, content });
    },
    [emit, project_id],
  );

  return { sendChangeToRemote };
};

export const useCanvasSyncSocket = ({ onCanvasSync }) => {
  const onCanvasSyncRef = useRef(onCanvasSync);

  useEffect(() => {
    onCanvasSyncRef.current = onCanvasSync;
  }, [onCanvasSync]);

  const handleSocketEvent = useCallback(async message => {
    const { content } = message;
    onCanvasSyncRef.current(content);
  }, []);

  const { subscribe, unsubscribe } = useManualSocket(sioEvents.chat_canvas_sync, handleSocketEvent);

  useEffect(() => {
    subscribe();
    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return {
    listenCanvasSyncEvent: subscribe,
    stopListenCanvasSyncEvent: unsubscribe,
  };
};

export const useCanvasErrorSocket = ({ onCanvasError }) => {
  const onCanvasErrorRef = useRef(onCanvasError);
  useEffect(() => {
    onCanvasErrorRef.current = onCanvasError;
  }, [onCanvasError]);

  const handleSocketEvent = useCallback(async message => {
    onCanvasErrorRef.current(message);
  }, []);

  const { subscribe, unsubscribe } = useManualSocket(sioEvents.chat_canvas_error, handleSocketEvent);

  useEffect(() => {
    subscribe();
    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return {
    listenCanvasErrorEvent: subscribe,
    stopListenCanvasErrorEvent: unsubscribe,
  };
};

export const useCanvasDetailSocket = ({ onCanvasDetail }) => {
  const onCanvasDetailRef = useRef(onCanvasDetail);

  useEffect(() => {
    onCanvasDetailRef.current = onCanvasDetail;
  }, [onCanvasDetail]);

  const handleSocketEvent = useCallback(async message => {
    const { content } = message;
    onCanvasDetailRef.current(content);
  }, []);

  const { subscribe, unsubscribe } = useManualSocket(sioEvents.chat_canvas_detail, handleSocketEvent);

  useEffect(() => {
    subscribe();
    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return {
    listenCanvasDetailEvent: subscribe,
    stopListenCanvasDetailEvent: unsubscribe,
  };
};

export const useCanvasEditorJoinedSocket = ({ onCanvasEditorJoined }) => {
  const onCanvasEditorJoinedRef = useRef(onCanvasEditorJoined);

  useEffect(() => {
    onCanvasEditorJoinedRef.current = onCanvasEditorJoined;
  }, [onCanvasEditorJoined]);

  const handleSocketEvent = useCallback(async message => {
    onCanvasEditorJoinedRef.current(message);
  }, []);

  const { subscribe, unsubscribe } = useManualSocket(sioEvents.chat_canvas_editor_joined, handleSocketEvent);

  useEffect(() => {
    subscribe();
    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return {
    listenCanvasEditorJoinedEvent: subscribe,
    stopListenCanvasEditorJoinedEvent: unsubscribe,
  };
};

export const useCanvasEditorsChangeSocket = ({ onCanvasEditorsChange }) => {
  const onCanvasEditorsChangedRef = useRef(onCanvasEditorsChange);

  useEffect(() => {
    onCanvasEditorsChangedRef.current = onCanvasEditorsChange;
  }, [onCanvasEditorsChange]);

  const handleSocketEvent = useCallback(async message => {
    onCanvasEditorsChangedRef.current(message);
  }, []);

  const { subscribe, unsubscribe } = useManualSocket(sioEvents.chat_canvas_editors_change, handleSocketEvent);

  useEffect(() => {
    subscribe();
    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return {
    listenCanvasEditorsChangeEvent: subscribe,
    stopListenCanvasEditorsChangeEvent: unsubscribe,
  };
};

export const useCanvasContentChangeSocket = ({ onCanvasContentChange }) => {
  const onCanvasContentChangeRef = useRef(onCanvasContentChange);

  useEffect(() => {
    onCanvasContentChangeRef.current = onCanvasContentChange;
  }, [onCanvasContentChange]);

  const handleSocketEvent = useCallback(async message => {
    onCanvasContentChangeRef.current(message);
  }, []);

  const { subscribe, unsubscribe } = useManualSocket(sioEvents.chat_canvas_content_change, handleSocketEvent);

  useEffect(() => {
    subscribe();
    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return {
    listenCanvasContentChangeEvent: subscribe,
    stopListenCanvasContentChangeEvent: unsubscribe,
  };
};
