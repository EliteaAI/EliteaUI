import { memo, useCallback, useMemo } from 'react';

import { Box, Divider, useTheme } from '@mui/material';

import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import { Banner, Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import Markdown from '@/[fsd]/shared/ui/markdown';
import { useDeleteProjectContextMutation, useUpdateProjectContextMutation } from '@/api/projectContext';
import DotMenu from '@/components/DotMenu';
import CopyIcon from '@/components/Icons/CopyIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import useToast from '@/hooks/useToast';

import EnableToggleCard from './EnableToggleCard';
import AIEditProjectContextButton from './ai-edit/AIEditProjectContextButton';

const ProjectContextSavedView = memo(props => {
  const { serverData, projectId, canEdit, onNavigate } = props;
  const { toastSuccess, toastInfo, toastError } = useToast();
  const theme = useTheme();

  const [updateProjectContext, { isLoading: isSavingToggle }] = useUpdateProjectContextMutation();
  const [deleteProjectContext] = useDeleteProjectContextMutation();

  const content = serverData?.content ?? '';
  const enabled = serverData?.enabled ?? true;
  const styles = getStyles(enabled || !canEdit);

  const handleToggle = useCallback(
    async e => {
      if (!canEdit) return;
      try {
        await updateProjectContext({ projectId, content, enabled: e.target.checked }).unwrap();
      } catch {
        toastError('Failed to update Project Context');
      }
    },
    [canEdit, updateProjectContext, projectId, content, toastError],
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(
      () => toastInfo('The content has been copied to the clipboard.'),
      () => toastError('Failed to copy to clipboard'),
    );
  }, [content, toastInfo, toastError]);

  const handleApplySave = useCallback(
    async suggested => {
      await updateProjectContext({ projectId, content: suggested, enabled }).unwrap();
      toastSuccess('Project Context saved');
    },
    [updateProjectContext, projectId, enabled, toastSuccess],
  );

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await deleteProjectContext({ projectId }).unwrap();
      onNavigate('empty');
      toastSuccess('Project Context deleted');
    } catch {
      toastError('Failed to delete Project Context');
    }
  }, [deleteProjectContext, projectId, onNavigate, toastSuccess, toastError]);

  const dotMenuItems = useMemo(
    () => [
      {
        key: 'copy',
        label: 'Copy',
        icon: <CopyIcon sx={{ fontSize: '1rem' }} />,
        onClick: handleCopy,
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: <DeleteIcon sx={{ fontSize: '1rem' }} />,
        entityName: 'Project Context',
        textContent: 'Are you sure you want to delete ',
        onConfirm: handleDeleteConfirm,
        shouldRequestInputName: false,
        alarm: true,
      },
    ],
    [handleCopy, handleDeleteConfirm],
  );

  const headerActions = useMemo(
    () => (
      <Box sx={styles.headerActions}>
        {canEdit && (
          <>
            <AIEditProjectContextButton
              currentContent={content}
              onApplySave={handleApplySave}
              disabled={!enabled}
            />
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.secondary}
              onClick={() => onNavigate('edit')}
              disabled={!enabled}
            >
              Edit
            </Button.BaseBtn>
            <Divider
              orientation="vertical"
              flexItem
            />
            <DotMenu
              id="project-context-actions"
              slotProps={{
                ListItemText: {
                  sx: { color: theme.palette.text.secondary },
                  primaryTypographyProps: { variant: 'bodyMedium' },
                },
                ListItemIcon: {
                  sx: {
                    minWidth: '16px !important',
                    marginRight: '12px',
                  },
                },
              }}
            >
              {dotMenuItems}
            </DotMenu>
          </>
        )}
      </Box>
    ),
    [
      styles.headerActions,
      canEdit,
      enabled,
      content,
      handleApplySave,
      theme.palette.text.secondary,
      dotMenuItems,
      onNavigate,
    ],
  );

  return (
    <Box sx={styles.root}>
      <DrawerPageHeader
        title="Project Context"
        showBorder
        extraContent={headerActions}
      />
      <Box sx={styles.body}>
        {!canEdit && (
          <Banner.BannerMessage
            message="You don't have permission to edit this setting."
            variant="info"
          />
        )}
        <EnableToggleCard
          enabled={enabled}
          onToggle={handleToggle}
          disabled={!canEdit || isSavingToggle}
        />
        {!enabled && (
          <Banner.BannerMessage
            message="Project Context is turned off. The project background is not applied to AI responses or workflows."
            variant="info"
          />
        )}
        <Box sx={styles.contentArea}>
          <Markdown renderHtml={false}>{content}</Markdown>
        </Box>
      </Box>
    </Box>
  );
});

ProjectContextSavedView.displayName = 'ProjectContextSavedView';
export default ProjectContextSavedView;

/** @type {(active: boolean) => MuiSx} */
const getStyles = active => ({
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  body: {
    flex: 1,
    overflow: 'auto',
    minHeight: 0,
    padding: '1rem 1.5rem',
    paddingBottom: '2.375rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
    maxWidth: '46.875rem',
    alignSelf: 'center',
    boxSizing: 'border-box',
  },
  contentArea: ({ palette }) => ({
    flex: 1,
    overflow: 'auto',
    minHeight: 0,
    padding: '0.75rem',
    borderTop: `0.0625rem solid ${palette.border.table}`,
    fontSize: '0.875rem',
    color: active ? palette.text.secondary : palette.text.primary,
    '& *': {
      color: 'inherit',
    },
  }),
});
