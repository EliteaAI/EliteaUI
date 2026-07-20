import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import DrawerPageHeader from '@/[fsd]/features/settings/ui/drawer-page/DrawerPageHeader';
import { Banner, Button, Field } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import Markdown from '@/[fsd]/shared/ui/markdown';
import TabGroupButton from '@/[fsd]/shared/ui/tab-group-button/TabGroupButton';
import { useUpdateProjectContextMutation } from '@/api/projectContext';
import CodeIcon from '@/assets/code-icon.svg?react';
import ImportIcon from '@/assets/import-icon.svg?react';
import OpenEyeIcon from '@/assets/open-eye-icon.svg?react';
import CopyIcon from '@/components/Icons/CopyIcon';
import useToast from '@/hooks/useToast';
import { markdown } from '@codemirror/lang-markdown';

import GenerateProjectContextButton from './GenerateProjectContextButton';
import GenerateProjectContextModal from './GenerateProjectContextModal';

const MAX_CHARS = 2500;

const ProjectContextEditor = memo(props => {
  const { serverData, projectId, isCreate, canEdit, openAiModal, onNavigate } = props;
  const { toastSuccess, toastError } = useToast();
  const fileInputRef = useRef(null);
  const [isDirty, setIsDirty] = useState(false);

  const [updateProjectContext, { isLoading: isSaving }] = useUpdateProjectContextMutation();

  const [content, setContent] = useState(serverData?.content ?? '');
  const [mode, setMode] = useState('edit');
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current && openAiModal) {
      setIsAiModalOpen(true);
    }
    isFirstRender.current = false;
  }, [openAiModal]);

  const limitReached = content.length >= MAX_CHARS;

  const markdownExtensions = useMemo(() => [markdown()], []);

  const styles = getStyles(limitReached, isEditorFocused);

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

  const handleModeChange = useCallback((_e, newMode) => {
    setMode(newMode);
  }, []);

  const handleAIGenerated = useCallback(generatedContent => {
    setContent(generatedContent);
    setIsAiModalOpen(false);
    setIsDirty(true);
  }, []);

  const handleImportClick = useCallback(() => {
    if (!canEdit) return;
    fileInputRef.current?.click();
  }, [canEdit]);

  const handleFileUpload = useCallback(
    e => {
      if (!canEdit) return;
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
    [canEdit, toastError],
  );

  const handleEditorFocus = useCallback(() => setIsEditorFocused(true), []);
  const handleEditorBlur = useCallback(e => {
    if (!e.currentTarget.contains(e.relatedTarget)) setIsEditorFocused(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!canEdit) return;
    const enabled = serverData?.enabled ?? true;
    try {
      await updateProjectContext({ projectId, content, enabled }).unwrap();
      toastSuccess('Project Context saved');
      onNavigate('saved');
    } catch {
      toastError('Failed to save Project Context');
    }
  }, [canEdit, updateProjectContext, projectId, content, serverData, toastSuccess, toastError, onNavigate]);

  const handleCopyToClipboard = useCallback(() => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(
      () => toastSuccess('The content has been copied.'),
      () => toastError('Failed to copy to clipboard'),
    );
  }, [content, toastSuccess, toastError]);

  const handleCancel = useCallback(() => {
    onNavigate('empty');
  }, [onNavigate]);

  const handleDiscard = useCallback(() => {
    onNavigate('saved');
  }, [onNavigate]);

  const handleBack = useCallback(() => {
    const hasServerContent = Boolean(serverData?.content?.trim());
    onNavigate(hasServerContent ? 'saved' : 'empty');
  }, [serverData, onNavigate]);

  const breadcrumbTitle = (
    <Box sx={styles.breadcrumb}>
      <Typography
        variant="headingSmall"
        color="text.primary"
        sx={styles.breadcrumbLink}
        onClick={handleBack}
      >
        Project Context
      </Typography>
      <Typography
        variant="headingSmall"
        color="text.primary"
      >
        /
      </Typography>
      <Typography
        variant="headingSmall"
        color="text.secondary"
      >
        {isCreate ? 'Create' : 'Edit'}
      </Typography>
    </Box>
  );

  const headerActions = (
    <Box sx={styles.headerActions}>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.contained}
        disabled={!isDirty || isSaving}
        onClick={handleSave}
      >
        Save
      </Button.BaseBtn>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.secondary}
        disabled={!isDirty || isSaving}
        onClick={isCreate ? handleCancel : handleDiscard}
      >
        {isCreate ? 'Cancel' : 'Discard'}
      </Button.BaseBtn>
    </Box>
  );

  return (
    <Box sx={styles.root}>
      <DrawerPageHeader
        title={breadcrumbTitle}
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
        <Box sx={styles.editorHeader}>
          <TabGroupButton
            value={mode}
            onChange={handleModeChange}
            size="small"
            arrayBtn={modeButtons}
          />
          <Box sx={styles.toolbar}>
            {canEdit && (
              <>
                <GenerateProjectContextButton
                  existingContent={content}
                  onApply={handleAIGenerated}
                />
                <Tooltip
                  title="Import from markdown file"
                  placement="top"
                >
                  <Button.BaseBtn
                    variant={BUTTON_VARIANTS.tertiary}
                    startIcon={<ImportIcon />}
                    onClick={handleImportClick}
                  />
                </Tooltip>
                <Box
                  hidden
                  component="input"
                  ref={fileInputRef}
                  type="file"
                  accept=".md,text/markdown"
                  onChange={handleFileUpload}
                />
                <Tooltip
                  title="Copy to clipboard"
                  placement="top"
                >
                  <Button.BaseBtn
                    variant={BUTTON_VARIANTS.tertiary}
                    onClick={handleCopyToClipboard}
                    startIcon={<CopyIcon fill="currentColor" />}
                  />
                </Tooltip>
              </>
            )}
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
              readOnly={!canEdit}
            />
          </Box>
        ) : (
          <Box sx={styles.preview}>
            <Markdown renderHtml={false}>{content}</Markdown>
          </Box>
        )}

        {canEdit && (
          <Box sx={styles.charCounterWrapper}>
            <Typography
              variant="bodySmall"
              sx={styles.charCounter}
            >
              {MAX_CHARS - content.length} characters left.{' '}
              {limitReached && 'You have reached the maximum character limit.'}
            </Typography>
          </Box>
        )}
      </Box>

      {isAiModalOpen && (
        <GenerateProjectContextModal
          open={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          existingContent={content}
          onApply={handleAIGenerated}
        />
      )}
    </Box>
  );
});

ProjectContextEditor.displayName = 'ProjectContextEditor';
export default ProjectContextEditor;

/** @type {MuiSx} */
const getStyles = (limitReached, isEditorFocused) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  body: {
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
    padding: '1rem 1.5rem',
    paddingBottom: '2.375rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    maxWidth: '46.875rem',
    alignSelf: 'center',
    boxSizing: 'border-box',
  },
  editorHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  editorWrapper: ({ palette }) => ({
    flex: 1,
    minHeight: '12rem',
    maxHeight: '43.75rem',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '0.375rem',
    border: `0.0625rem solid ${palette.border.table}`,
    overflow: 'hidden',
    // react-codemirror renders a plain wrapper div; stretch it to fill this container
    '& > div': {
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
    },
    '& .cm-editor': {
      flex: 1,
      minHeight: 0,
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
    minHeight: '12rem',
    maxHeight: '43.75rem',
    height: 'calc(100vh - 18rem)',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    border: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: palette.background.userInputBackground,
    overflow: 'auto',
    fontSize: '0.875rem',
  }),
  charCounterWrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  charCounter: ({ palette }) => ({
    color: limitReached ? palette.text.error : palette.text.primary,
    visibility: isEditorFocused ? 'visible' : 'hidden',
  }),
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  breadcrumbLink: {
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
});
