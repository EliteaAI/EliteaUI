import { useCallback, useEffect } from 'react';

import { useTrackEvent } from '@/GA';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useFolderCreateMutation } from '@/api';
import { PERMISSIONS, dummyConversation, dummyFolder } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useResetCreateFlag from '@/hooks/chat/useResetCreateFlag';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useCreateFolder = props => {
  const { folders, setActiveFolder, setFolders, toastError, setActiveParticipant } = props;
  const projectId = useSelectedProjectId();
  const trackEvent = useTrackEvent();

  const { checkPermission } = useCheckPermission();
  const { resetCreateFlag } = useResetCreateFlag();

  const [createFolder, { isError: isCreateError, error: createError }] = useFolderCreateMutation();

  const onCreateFolder = useCallback(
    async (newFolder, onCreatedCallback) => {
      setActiveFolder({
        ...newFolder,
      });

      const result = await createFolder(
        {
          name: newFolder.name,
          projectId,
        },
        { skip: !projectId || !checkPermission(PERMISSIONS.chat.folders.create) },
      );

      if (result.data) {
        trackEvent(GA_EVENT_NAMES.CONVERSATION_FOLDER_CREATED, {
          [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString().split('T')[0],
        });

        setActiveFolder({
          ...result.data,
        });
        setFolders([result.data, ...folders.filter(item => !item.isNew)]);
        onCreatedCallback && onCreatedCallback(result.data);

        return;
      }

      setActiveFolder(dummyConversation);
      setFolders(prev => prev.filter(item => !item.isNew));
      onCreatedCallback && onCreatedCallback();
    },
    [setActiveFolder, createFolder, projectId, checkPermission, folders, setFolders, trackEvent],
  );

  const onCancelCreateFolder = useCallback(
    folder => {
      setActiveFolder(dummyFolder);

      if (folder?.id) setFolders(prev => prev.filter(item => item.id !== folder.id));
      else setFolders(prev => prev.filter(item => !item.isNew));

      setActiveParticipant();
      resetCreateFlag();
    },
    [resetCreateFlag, setActiveFolder, setActiveParticipant, setFolders],
  );

  useEffect(() => {
    if (isCreateError) toastError(buildErrorMessage(createError));
  }, [createError, isCreateError, toastError]);

  return {
    onCreateFolder,
    onCancelCreateFolder,
  };
};
