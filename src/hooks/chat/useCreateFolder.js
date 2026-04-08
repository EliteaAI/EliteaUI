import { useCallback, useEffect } from 'react';

import { useTrackEvent } from '@/GA';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useFolderCreateMutation } from '@/api/chat';
import { PERMISSIONS, dummyConversation, dummyFolder } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import useResetCreateFlag from './useResetCreateFlag';

export default function useCreateFolder({
  folders,
  setActiveFolder,
  setFolders,
  toastError,
  setActiveParticipant,
}) {
  const { checkPermission } = useCheckPermission();
  const projectId = useSelectedProjectId();
  const trackEvent = useTrackEvent();
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
      } else {
        setActiveFolder(dummyConversation);
        setFolders(prev => {
          return prev.filter(item => !item.isNew);
        });
        onCreatedCallback && onCreatedCallback();
      }
    },
    [setActiveFolder, createFolder, projectId, checkPermission, folders, setFolders, trackEvent],
  );

  const onCancelCreateFolder = useCallback(
    folder => {
      setActiveFolder(dummyFolder);
      if (folder?.id) {
        setFolders(prev => prev.filter(item => item.id !== folder.id));
      } else {
        setFolders(prev => prev.filter(item => !item.isNew));
      }
      setActiveParticipant();
      resetCreateFlag();
    },
    [resetCreateFlag, setActiveFolder, setActiveParticipant, setFolders],
  );

  useEffect(() => {
    if (isCreateError) {
      toastError(buildErrorMessage(createError));
    }
  }, [createError, isCreateError, toastError]);

  return {
    onCreateFolder,
    onCancelCreateFolder,
  };
}
