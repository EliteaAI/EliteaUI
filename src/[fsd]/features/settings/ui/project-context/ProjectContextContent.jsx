import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import { Banner, Button, Field } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import Markdown from '@/[fsd]/shared/ui/markdown';
import TabGroupButton from '@/[fsd]/shared/ui/tab-group-button/TabGroupButton';
import { useProjectContextQuery, useUpdateProjectContextMutation } from '@/api/projectContext';
import CodeIcon from '@/assets/code-icon.svg?react';
import ImportIcon from '@/assets/import-icon.svg?react';
import OpenEyeIcon from '@/assets/open-eye-icon.svg?react';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import { markdown } from '@codemirror/lang-markdown';

import EnableToggleCard from './EnableToggleCard';

const MAX_CHARS = 2500;

const ProjectContextContent = memo(() => {
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const { toastSuccess, toastError } = useToast();
  const canViewProjectContext = checkPermission(PERMISSIONS.projectContext.view);
  const canEditProjectContext = checkPermission(PERMISSIONS.projectContext.edit);

  const { data: serverData, isLoading } = useProjectContextQuery(projectId, {
    skip: !projectId || !canViewProjectContext,
  });
  const [updateProjectContext, { isLoading: isSaving }] = useUpdateProjectContextMutation();

  const [content, setContent] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState('edit');
  const [isDirty, setIsDirty] = useState(false);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (serverData) {
      setContent(serverData.content ?? '');
      setEnabled(serverData.enabled ?? true);
      setIsDirty(false);
    }
  }, [serverData]);

  const charError = content.length >= MAX_CHARS;
  const hasContextContent = Boolean(content.trim());
  const showReadOnlyBanner = canViewProjectContext && !canEditProjectContext;
  const showDisabledBanner = canViewProjectContext && !enabled && hasContextContent;
  const showEditorContent = canViewProjectContext && (enabled || hasContextContent || !canEditProjectContext);
  const showEditorControls = enabled && canEditProjectContext;

  const markdownExtensions = useMemo(() => [markdown()], []);
  const modeButtons = useMemo(
    () => [
      {
        value: 'edit',
        icon: theme => <CodeIcon fill={theme.palette.icon.fill.secondary} />,
        tooltip: 'Edit mode',
      },
      {
        value: 'preview',
        icon: theme => <OpenEyeIcon fill={theme.palette.icon.fill.secondary} />,
        tooltip: 'Preview mode',
      },
    ],
    [],
  );

  const handleContentChange = useCallback(val => {
    setContent(val);
    setIsDirty(true);
  }, []);

  const handleImportClick = useCallback(() => {
    if (!canEditProjectContext) return;
    fileInputRef.current?.click();
  }, [canEditProjectContext]);

  const handleModeChange = useCallback((e, newMode) => {
    setMode(newMode);
  }, []);

  const handleToggle = useCallback(
    e => {
      if (!canEditProjectContext) return;
      setEnabled(e.target.checked);
      setIsDirty(true);
    },
    [canEditProjectContext],
  );

  const handleFileUpload = useCallback(
    e => {
      if (!canEditProjectContext) return;
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const text = ev.target.result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        if (text.length > MAX_CHARS) {
          toastError(`File content exceeds ${MAX_CHARS} characters`);
          return;
        }
        setContent(text);
        setIsDirty(true);
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [canEditProjectContext, toastError],
  );

  const handleSave = useCallback(async () => {
    if (!canEditProjectContext) return;

    try {
      await updateProjectContext({ projectId, content, enabled }).unwrap();
      toastSuccess('Project Context saved');
      setIsDirty(false);
    } catch {
      toastError('Failed to save Project Context');
    }
  }, [canEditProjectContext, updateProjectContext, projectId, content, enabled, toastSuccess, toastError]);

  const handleDiscard = useCallback(() => {
    if (!canEditProjectContext) return;

    if (serverData) {
      setContent(serverData.content ?? '');
      setEnabled(serverData.enabled ?? true);
      setIsDirty(false);
    }
  }, [canEditProjectContext, serverData]);

  const handleEditorFocus = () => setIsEditorFocused(true);
  const handleEditorBlur = e => {
    if (!e.currentTarget.contains(e.relatedTarget)) setIsEditorFocused(false);
  };

  const styles = componentStyles(charError, isEditorFocused, !enabled || !canEditProjectContext);

  if (isLoading) {
    return (
      <Box sx={styles.loader}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!canViewProjectContext) {
    return null;
  }

  return (
    <Box sx={styles.root}>
      <DrawerPageHeader
        title="Project Context"
        showBorder
      />

      <Box sx={styles.body}>
        {showReadOnlyBanner && (
          <Banner.BannerMessage
            message="You don't have permission to edit this setting."
            variant="info"
          />
        )}
        <EnableToggleCard
          enabled={enabled}
          onToggle={handleToggle}
          disabled={!canEditProjectContext}
        />

        {showDisabledBanner && (
          <Banner.BannerMessage
            message="Project Context is turned off. The project background is not applied to AI responses or workflows."
            variant="info"
          />
        )}

        {showEditorContent && (
          <Box sx={styles.editorSection}>
            <Box sx={styles.editorHeader}>
              <Box sx={styles.editorText}>
                <Typography
                  variant="labelMedium"
                  color="text.secondary"
                >
                  Project Background
                </Typography>
                <Typography variant="bodySmall">
                  Include goals, terminology, workflows, or constraints relevant to the project.
                </Typography>
              </Box>
              <Box sx={styles.toolbar}>
                {showEditorControls && (
                  <>
                    <Button.BaseBtn
                      variant={BUTTON_VARIANTS.secondary}
                      startIcon={<ImportIcon />}
                      onClick={handleImportClick}
                      title="Import markdown file"
                    />
                    <Box
                      hidden
                      component="input"
                      ref={fileInputRef}
                      type="file"
                      accept=".md,text/markdown"
                      onChange={handleFileUpload}
                    />
                  </>
                )}
                <TabGroupButton
                  value={mode}
                  onChange={handleModeChange}
                  size="small"
                  arrayBtn={modeButtons}
                />
              </Box>
            </Box>

            {mode === 'edit' ? (
              <Box
                sx={styles.editorWrapper}
                onFocus={handleEditorFocus}
                onBlur={handleEditorBlur}
              >
                <Field.CodeMirrorEditor
                  value={content}
                  notifyChange={handleContentChange}
                  extensions={markdownExtensions}
                  height="100%"
                  minHeight="0"
                  maxLength={MAX_CHARS}
                  readOnly={!canEditProjectContext}
                />
              </Box>
            ) : (
              <Box sx={styles.preview}>
                <Markdown renderHtml={false}>{content}</Markdown>
              </Box>
            )}

            {showEditorControls && (
              <Box sx={styles.charCounterWrapper}>
                <Typography
                  variant="bodySmall"
                  sx={styles.charCounter}
                >
                  {MAX_CHARS - content.length} characters left.{' '}
                  {charError && 'You have reached the maximum character limit.'}
                </Typography>
              </Box>
            )}

            {canEditProjectContext && (
              <Box sx={styles.actions}>
                <Button.BaseBtn
                  variant={BUTTON_VARIANTS.contained}
                  color="primary"
                  disabled={!isDirty || charError || isSaving}
                  onClick={handleSave}
                >
                  Save
                </Button.BaseBtn>
                <Button.BaseBtn
                  variant={BUTTON_VARIANTS.secondary}
                  color="secondary"
                  disabled={!isDirty}
                  onClick={handleDiscard}
                >
                  Discard
                </Button.BaseBtn>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
});

ProjectContextContent.displayName = 'ProjectContextContent';
export default ProjectContextContent;

/** @type {MuiSx} */
const componentStyles = (charError, isEditorFocused, isMuted) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    alignItems: 'center',
  },
  loader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    maxWidth: '43.75rem',
  },
  editorSection: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    marginTop: '0.5rem',
  },
  editorHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem',
    paddingBottom: '0.75rem',
  },
  editorText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexShrink: 0,
    alignSelf: 'center',
  },
  editorWrapper: ({ palette }) => ({
    display: 'flex',
    flex: 1,
    minHeight: 0,
    borderRadius: '0.375rem',
    border: `0.0625rem solid ${palette.border.table}`,
    overflow: 'hidden',
    opacity: isMuted ? 0.55 : 1,
    '& .cm-editor': {
      backgroundColor: palette.background.codeMirrorEditor,
    },
    '&:focus-within': {
      borderColor: palette.primary.main,
    },
    '& .cm-theme': {
      width: '100%',
    },
    '& .cm-gutters': {
      backgroundColor: 'transparent',
      borderRight: `0.0625rem solid ${palette.border.table}`,
    },
  }),
  preview: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    padding: '0.75rem',
    borderRadius: '0.375rem',
    border: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: palette.background.userInputBackground,
    overflow: 'auto',
    opacity: isMuted ? 0.55 : 1,
  }),
  emptyPreview: ({ palette }) => ({
    color: palette.text.metrics,
    fontStyle: 'italic',
  }),
  charCounterWrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: '0.25rem',
  },
  charCounter: ({ palette }) => ({
    color: charError ? palette.text.error : palette.text.primary,
    visibility: isEditorFocused ? 'visible' : 'hidden',
  }),
  actions: {
    display: 'flex',
    gap: '0.75rem',
    paddingLeft: 0,
    paddingTop: '0.25rem',
    width: '100%',
  },
});
