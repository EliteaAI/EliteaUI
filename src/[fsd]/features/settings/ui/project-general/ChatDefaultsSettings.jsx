import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import AiParticipantSearchSelect from '@/[fsd]/features/chat/conversation-list/ui/conversations/AiParticipantSearchSelect';
import {
  useProjectInfoQuery,
  useUpdateProjectChatConfigMutation,
} from '@/[fsd]/features/settings/api/projectInfoApi';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { ChatParticipantType, PERMISSIONS } from '@/common/constants';
import useParticipants from '@/hooks/chat/useParticipants';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const ChatDefaultsSettings = memo(() => {
  const styles = chatDefaultsSettingsStyles();
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const { toastError, toastSuccess } = useToast();

  const canEdit = checkPermission(PERMISSIONS.configuration.update);

  const { data: projectInfo } = useProjectInfoQuery({ projectId }, { skip: !projectId });
  const [updateChatConfig, { isLoading: isSaving }] = useUpdateProjectChatConfigMutation();

  const savedParticipants = useMemo(
    () => projectInfo?.chat_config?.participants ?? [],
    [projectInfo?.chat_config?.participants],
  );

  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const hasInitializedRef = useRef(false);

  // Fetch all participants to resolve names for saved data that may lack names
  const { participants: allParticipants } = useParticipants({
    sortBy: 'name',
    sortOrder: 'asc',
    query: '',
    pageSize: 200,
    types: [ChatParticipantType.Applications],
    forceSkip: !projectId,
  });

  // Enriched saved participants with names resolved from allParticipants
  const savedSelectedParticipants = useMemo(() => {
    const apiByKey = new Map(
      allParticipants.map(p => {
        const entityName =
          p.agent_type === 'pipeline' ? ChatParticipantType.Pipelines : ChatParticipantType.Applications;
        return [`${p.id}:${entityName}`, p];
      }),
    );
    return savedParticipants.map(p => {
      const apiP = apiByKey.get(`${p.entity_id}:${p.entity_name}`);
      return {
        id: p.entity_id,
        name: apiP?.name ?? p.name ?? '',
        project_id: p.project_id ?? apiP?.project_id,
        entity_name: p.entity_name,
      };
    });
  }, [savedParticipants, allParticipants]);

  // Initialize from saved config as soon as projectInfo is available
  useEffect(() => {
    if (projectInfo === undefined) return;
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    setSelectedParticipants(
      savedParticipants.map(p => ({
        id: p.entity_id,
        name: p.name ?? '',
        project_id: p.project_id,
        entity_name: p.entity_name,
        agent_type: p.agent_type,
      })),
    );
  }, [projectInfo, savedParticipants]);

  // Enrich any missing names or project_ids from allParticipants once loaded
  useEffect(() => {
    if (allParticipants.length === 0) return;
    setSelectedParticipants(prev => {
      if (prev.every(p => p.name && p.project_id)) return prev;
      const apiByKey = new Map(
        allParticipants.map(p => {
          const entityName =
            p.agent_type === 'pipeline' ? ChatParticipantType.Pipelines : ChatParticipantType.Applications;
          return [`${p.id}:${entityName}`, p];
        }),
      );
      return prev.map(p => {
        if (p.name && p.project_id) return p;
        const apiP = apiByKey.get(`${p.id}:${p.entity_name}`);
        if (!apiP) return p;
        return {
          ...p,
          name: p.name || apiP.name,
          project_id: p.project_id ?? apiP.project_id,
        };
      });
    });
  }, [allParticipants]);

  const isDirty = useMemo(() => {
    if (selectedParticipants.length !== savedParticipants.length) return true;
    const savedKeys = new Set(savedParticipants.map(p => `${p.entity_name}:${p.entity_id}`));
    return selectedParticipants.some(p => !savedKeys.has(`${p.entity_name}:${p.id}`));
  }, [selectedParticipants, savedParticipants]);

  const handleChangeParticipants = useCallback(newSelected => {
    setSelectedParticipants(newSelected);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await updateChatConfig({
        projectId,
        chat_config: {
          participants: selectedParticipants.map(p => ({
            entity_name: p.entity_name,
            entity_id: p.id,
            name: p.name,
            project_id: p.project_id,
            agent_type: p.agent_type,
          })),
        },
      }).unwrap();
      toastSuccess('Chat configuration saved');
    } catch {
      toastError('Failed to save chat configuration');
    }
  }, [projectId, selectedParticipants, updateChatConfig, toastSuccess, toastError]);

  const handleCancel = useCallback(() => {
    setSelectedParticipants(savedSelectedParticipants);
  }, [savedSelectedParticipants]);

  return (
    <Box sx={styles.root}>
      <Typography
        variant="labelSmall"
        color="text.secondary"
      >
        Pre-configured participants
      </Typography>
      <Typography
        variant="bodySmall"
        color="text.primary"
      >
        These participants are automatically added when a new chat is created. If exactly one is configured,
        it becomes the active participant.
      </Typography>
      <AiParticipantSearchSelect
        selectedParticipants={selectedParticipants}
        onChangeParticipants={handleChangeParticipants}
        disabled={!canEdit || isSaving}
        slotProps={{
          listBox: { style: { maxHeight: '14rem', overflowY: 'auto' } },
        }}
      />
      {canEdit && (
        <Box sx={styles.actions}>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            onClick={handleCancel}
            disabled={!isDirty || isSaving}
          >
            Cancel
          </Button.BaseBtn>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            loading={isSaving}
          >
            Save
          </Button.BaseBtn>
        </Box>
      )}
    </Box>
  );
});

ChatDefaultsSettings.displayName = 'ChatDefaultsSettings';

/** @type {MuiSx} */
const chatDefaultsSettingsStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem',
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    paddingTop: '0.25rem',
  },
});

export default ChatDefaultsSettings;
