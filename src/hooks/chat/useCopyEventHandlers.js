import { useCallback, useEffect, useRef, useState } from 'react';

import { v4 as uuidv4 } from 'uuid';

export const useInteractionUUID = () => {
  const firstRender = useRef(true);
  const [interaction_uuid, setInteractionUUID] = useState('');

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      if (!interaction_uuid) {
        setInteractionUUID(uuidv4());
      }
    }
  }, [interaction_uuid]);
  return {
    interaction_uuid,
  };
};

export const useCopyDownloadHandlers = ({ onCopy, onDownload }) => {
  const onClickCopy = useCallback(() => {
    onCopy && onCopy();
  }, [onCopy]);

  const onClickDownload = useCallback(
    params => {
      onDownload && onDownload(params);
    },
    [onDownload],
  );

  return {
    onClickCopy,
    onClickDownload,
  };
};

export default useCopyDownloadHandlers;
