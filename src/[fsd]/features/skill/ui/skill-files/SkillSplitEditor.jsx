import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import {
  SKILL_EDITOR_VIEWS,
  SKILL_FILES_SEARCH_PARAMS,
  SKILL_FILE_ACTIONS,
  SKILL_SIDE_PANELS,
} from '@/[fsd]/features/skill/lib/constants';
import { findSkillFile, isPathInFolder } from '@/[fsd]/features/skill/lib/helpers';
import {
  useSkillEditorSearchParams,
  useSkillFileActions,
  useSkillFrontmatterEditor,
  useSkillModels,
} from '@/[fsd]/features/skill/lib/hooks';
import { useIsSmallWindow } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import {
  EntityTestPanelConstants,
  EntityTestPanelUI,
  useTestPanelWidth,
} from '@/[fsd]/widgets/entity-test-panel';
import PlusIcon from '@/components/Icons/PlusIcon';

import SkillFileDeleteDialog from './SkillFileDeleteDialog';
import SkillFileHeader from './SkillFileHeader';
import SkillFileRenameDialog from './SkillFileRenameDialog';
import SkillFileTree from './SkillFileTree';
import SkillFileViewer from './SkillFileViewer';
import SkillFilesEmpty from './SkillFilesEmpty';
import SkillInstructionsPane from './SkillInstructionsPane';
import SkillPaneHeader from './SkillPaneHeader';
import SkillTestButton from './SkillTestButton';
import SkillViewSwitch from './SkillViewSwitch';

const { TEST_PANEL_STORAGE_KEYS } = EntityTestPanelConstants;
const TREE_WIDTH = '18.75rem';
const NO_FILES = [];
const RENAME_ACTIONS = [SKILL_FILE_ACTIONS.rename, SKILL_FILE_ACTIONS.renameFolder];
const DELETE_ACTIONS = [SKILL_FILE_ACTIONS.delete, SKILL_FILE_ACTIONS.deleteFolder];
const FOLDER_ACTIONS = [
  SKILL_FILE_ACTIONS.renameFolder,
  SKILL_FILE_ACTIONS.deleteFolder,
  SKILL_FILE_ACTIONS.uploadHere,
];

/**
 * The skill page under its header:
 * - Settings: the short fields on the left, the instructions (SKILL.md) on the right with a Files card under them;
 * - Files: the tree on the left, the open file on the right; Instructions or Test opens one more column beside it.
 * Test opens a resizable column on the right in both, at the width Agents use. Below 1200 px Settings with Test
 * stacks the settings over the instructions, and Files with a panel hides the open file. Test in full screen hides
 * every other column. The tab, the file and the side panel live in the address.
 */
const SkillSplitEditor = memo(props => {
  const {
    settings,
    settingsActions,
    files = NO_FILES,
    scope,
    disabled,
    readOnlyFiles,
    instructionsKey,
    isTestPanelOpen,
    isFullScreen = false,
    onOpenTestPanel,
    onCloseTestPanel,
    renderTestPanelControls,
    testPanelContent,
  } = props;

  const theme = useTheme();
  const rootRef = useRef(null);
  const { models } = useSkillModels();
  const { editorText, onEditorChange, frontmatterErrors } = useSkillFrontmatterEditor({ models });
  const { view, panel, filePath, updateParams } = useSkillEditorSearchParams({
    isTestPanelOpen,
    onOpenTestPanel,
  });
  const isFiles = view === SKILL_EDITOR_VIEWS.files;
  const isInstructionsOpen = isFiles && !isTestPanelOpen && panel === SKILL_SIDE_PANELS.instructions;

  const requestedFile = findSkillFile(files, filePath);
  const openFile = filePath ? requestedFile : files[0] || null;
  const openPath = openFile?.path ?? null;
  const missingPath = filePath && files.length && !requestedFile ? filePath : null;

  const { isSmallWindow } = useIsSmallWindow();
  const isTestFullScreen = isTestPanelOpen && isFullScreen;
  const isSettingsStacked = isSmallWindow && isTestPanelOpen;
  const isFileHidden = isSmallWindow && (isTestPanelOpen || isInstructionsOpen);

  const [initialTestWidth] = useState(() => Math.round(window.innerWidth / 3));
  const {
    containerRef: testColumnRef,
    width: testWidth,
    handleResizeStart,
  } = useTestPanelWidth({
    workspaceRef: rootRef,
    storageKeyPrefix: TEST_PANEL_STORAGE_KEYS.chat,
    defaultWidth: initialTestWidth,
  });

  const styles = skillSplitEditorStyles({
    isTestPanelOpen,
    isTestFullScreen,
    isInstructionsOpen,
    isSettingsStacked,
    isFileHidden,
    testWidth,
  });

  const onPathMoved = useCallback(
    (path, newPath) => {
      if (path === openPath) updateParams({ [SKILL_FILES_SEARCH_PARAMS.file]: newPath });
    },
    [openPath, updateParams],
  );
  const onPathRemoved = useCallback(
    path => {
      if (path === openPath) updateParams({ [SKILL_FILES_SEARCH_PARAMS.file]: null });
    },
    [openPath, updateParams],
  );
  const { isBusy, uploadFiles, renamePath, deletePath, downloadPath, copyPath } = useSkillFileActions({
    ...scope,
    files,
    onPathMoved,
    onPathRemoved,
  });

  const onChangeView = useCallback(
    nextView =>
      nextView &&
      updateParams({
        [SKILL_FILES_SEARCH_PARAMS.view]: nextView === SKILL_EDITOR_VIEWS.files ? nextView : null,
        ...(isTestPanelOpen ? {} : { [SKILL_FILES_SEARCH_PARAMS.panel]: null }),
      }),
    [isTestPanelOpen, updateParams],
  );
  const onOpenFiles = useCallback(() => onChangeView(SKILL_EDITOR_VIEWS.files), [onChangeView]);

  const onSelectFile = useCallback(
    path =>
      updateParams({
        [SKILL_FILES_SEARCH_PARAMS.view]: SKILL_EDITOR_VIEWS.files,
        [SKILL_FILES_SEARCH_PARAMS.file]: path,
      }),
    [updateParams],
  );

  const onOpenInstructions = useCallback(() => {
    if (isTestPanelOpen) onCloseTestPanel?.();
    updateParams({ [SKILL_FILES_SEARCH_PARAMS.panel]: SKILL_SIDE_PANELS.instructions });
  }, [isTestPanelOpen, onCloseTestPanel, updateParams]);

  const onCloseInstructions = useCallback(
    () => updateParams({ [SKILL_FILES_SEARCH_PARAMS.panel]: null }),
    [updateParams],
  );

  const fileInputRef = useRef(null);
  const uploadTarget = useRef(null);
  const pickFiles = useCallback(target => {
    uploadTarget.current = target;
    if (!fileInputRef.current) return;
    fileInputRef.current.multiple = !target?.file;
    fileInputRef.current.click();
  }, []);
  const onAddFiles = useCallback(() => pickFiles(null), [pickFiles]);
  const onFilesPicked = useCallback(
    event => {
      const picked = Array.from(event.target.files || []);
      event.target.value = '';
      if (picked.length) uploadFiles(picked, uploadTarget.current);
    },
    [uploadFiles],
  );

  const [pendingAction, setPendingAction] = useState(null);
  const closePendingAction = useCallback(() => setPendingAction(null), []);

  const onFileAction = useCallback(
    (action, rawPath) => {
      const path = FOLDER_ACTIONS.includes(action) ? rawPath.replace(/\/$/, '') : rawPath;
      if (action === SKILL_FILE_ACTIONS.download) downloadPath(path);
      else if (action === SKILL_FILE_ACTIONS.copyPath) copyPath(path);
      else if (action === SKILL_FILE_ACTIONS.replace) pickFiles({ file: path });
      else if (action === SKILL_FILE_ACTIONS.uploadHere) pickFiles({ folder: path });
      else if (RENAME_ACTIONS.includes(action) || DELETE_ACTIONS.includes(action))
        setPendingAction({ action, path, isFolder: FOLDER_ACTIONS.includes(action) });
    },
    [copyPath, downloadPath, pickFiles],
  );

  const onConfirmRename = useCallback(
    async newPath => {
      await renamePath(pendingAction.path, newPath, pendingAction.isFolder);
      setPendingAction(null);
    },
    [pendingAction, renamePath],
  );
  const onConfirmDelete = useCallback(async () => {
    await deletePath(pendingAction.path, pendingAction.isFolder);
    setPendingAction(null);
  }, [deletePath, pendingAction]);

  const takenPaths = useMemo(() => files.map(file => file.path), [files]);
  const pendingFolderFileCount = useMemo(
    () =>
      pendingAction?.isFolder
        ? files.filter(file => isPathInFolder(file.path, pendingAction.path)).length
        : 0,
    [files, pendingAction],
  );

  const viewSwitch = (
    <SkillViewSwitch
      value={view}
      onChange={onChangeView}
      filesCount={files.length}
    />
  );

  const renderFileBody = () => {
    if (openFile)
      return (
        <SkillFileViewer
          file={openFile}
          scope={scope}
          onDownload={downloadPath}
        />
      );
    if (missingPath)
      return (
        <Typography
          variant="bodySmall"
          sx={styles.missingFile}
          data-testid="skill-file-missing"
        >
          {`${missingPath} is not in this version.`}
        </Typography>
      );
    return (
      <SkillFilesEmpty
        readOnly={readOnlyFiles}
        onAdd={onAddFiles}
      />
    );
  };

  return (
    <Box
      ref={rootRef}
      sx={styles.root}
      data-testid="skill-split-editor"
      data-view={view}
      data-panel={
        isTestPanelOpen ? SKILL_SIDE_PANELS.test : isInstructionsOpen ? SKILL_SIDE_PANELS.instructions : ''
      }
    >
      <Box
        sx={styles.workArea}
        data-testid="skill-work-area"
      >
        {isFiles ? (
          <>
            <Box sx={styles.tree}>
              <SkillPaneHeader title={viewSwitch}>
                {!readOnlyFiles && (
                  <Button.BaseBtn
                    variant={BUTTON_VARIANTS.secondary}
                    startIcon={<PlusIcon fill={theme.palette.icon.secondary} />}
                    onClick={onAddFiles}
                    disabled={isBusy}
                    aria-label="Add files"
                    title="Add files"
                    data-testid="skill-files-add"
                  />
                )}
              </SkillPaneHeader>
              {files.length > 0 && (
                <SkillFileTree
                  files={files}
                  selectedPath={openPath}
                  readOnly={readOnlyFiles}
                  onSelect={onSelectFile}
                  onAction={onFileAction}
                />
              )}
            </Box>
            <Box
              sx={styles.fileColumn}
              data-testid="skill-file-column"
            >
              <SkillFileHeader
                file={openFile}
                isInstructionsOpen={isInstructionsOpen}
                isTestPanelOpen={isTestPanelOpen}
                onOpenInstructions={onOpenInstructions}
                onOpenTest={onOpenTestPanel}
                onCopyPath={copyPath}
              />
              <Box sx={styles.fileBody}>{renderFileBody()}</Box>
            </Box>
            {isInstructionsOpen && (
              <SkillInstructionsPane
                files={files}
                editorText={editorText}
                frontmatterErrors={frontmatterErrors}
                onEditorChange={onEditorChange}
                openPath={openPath}
                instructionsKey={instructionsKey}
                disabled={disabled}
                onOpenFile={onSelectFile}
                onClose={onCloseInstructions}
                sx={styles.sideColumn}
              />
            )}
          </>
        ) : (
          <Box
            sx={styles.settingsGroup}
            data-stacked={isSettingsStacked ? 'true' : 'false'}
            data-testid="skill-settings-group"
          >
            <Box sx={styles.settings}>
              <SkillPaneHeader title={viewSwitch}>{settingsActions}</SkillPaneHeader>
              <Box sx={styles.settingsBody}>{settings}</Box>
            </Box>
            <SkillInstructionsPane
              files={files}
              editorText={editorText}
              frontmatterErrors={frontmatterErrors}
              onEditorChange={onEditorChange}
              instructionsKey={instructionsKey}
              disabled={disabled}
              showViewToggle
              showFilesBar
              readOnlyFiles={readOnlyFiles}
              fitContent={isSettingsStacked}
              headerActions={isTestPanelOpen ? null : <SkillTestButton onClick={onOpenTestPanel} />}
              onOpenFile={onSelectFile}
              onOpenFiles={onOpenFiles}
              onAddFiles={onAddFiles}
              sx={styles.instructionsColumn}
            />
          </Box>
        )}
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={onFilesPicked}
        data-testid="skill-files-input"
      />
      <Box
        ref={testColumnRef}
        sx={styles.testColumn}
        aria-hidden={!isTestPanelOpen}
        data-testid="skill-test-panel"
      >
        {!isTestFullScreen && (
          <EntityTestPanelUI.TestPanelResizeHandle
            onResizeStart={handleResizeStart}
            testId="skill-test-panel-resize-handle"
            sx={styles.resizeHandle}
          />
        )}
        <SkillPaneHeader
          title="Test"
          sx={styles.testHeader}
        >
          {renderTestPanelControls?.({ onClose: onCloseTestPanel })}
        </SkillPaneHeader>
        <Box sx={styles.testBody}>{testPanelContent}</Box>
      </Box>
      <SkillFileRenameDialog
        open={RENAME_ACTIONS.includes(pendingAction?.action)}
        path={pendingAction?.path}
        isFolder={pendingAction?.isFolder}
        takenPaths={takenPaths}
        isLoading={isBusy}
        onClose={closePendingAction}
        onConfirm={onConfirmRename}
      />
      <SkillFileDeleteDialog
        open={DELETE_ACTIONS.includes(pendingAction?.action)}
        path={pendingAction?.path}
        isFolder={pendingAction?.isFolder}
        fileCount={pendingFolderFileCount}
        isLoading={isBusy}
        onClose={closePendingAction}
        onConfirm={onConfirmDelete}
      />
    </Box>
  );
});

SkillSplitEditor.displayName = 'SkillSplitEditor';

/** @type {MuiSx} */
const skillSplitEditorStyles = ({
  isTestPanelOpen,
  isTestFullScreen,
  isInstructionsOpen,
  isSettingsStacked,
  isFileHidden,
  testWidth,
}) => {
  const column = ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
    borderRight: `0.0625rem solid ${palette.border.default}`,
    backgroundColor: palette.background.surface.secondary,
  });
  return {
    root: ({ palette }) => ({
      display: 'flex',
      width: '100%',
      minWidth: 0,
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
      backgroundColor: palette.background.default.tertiary,
    }),
    workArea: {
      display: isTestFullScreen ? 'none' : 'contents',
    },
    settingsGroup: {
      display: 'flex',
      flexDirection: isSettingsStacked ? 'column' : 'row',
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      ...(isSettingsStacked && { overflowY: 'auto' }),
    },
    settings: theme => ({
      ...column(theme),
      flex: isSettingsStacked ? '0 0 auto' : 1,
      backgroundColor: theme.palette.background.default.tertiary,
      ...(isSettingsStacked && { borderBottom: `0.0625rem solid ${theme.palette.border.default}` }),
    }),
    settingsBody: {
      flex: isSettingsStacked ? '0 0 auto' : 1,
      minHeight: 0,
      overflowY: isSettingsStacked ? 'visible' : 'auto',
      padding: '1rem 1.5rem 2.5rem',
      // The sections paint their own tertiary fill; in this column they sit on the column's colour (Figma)
      '& .MuiAccordion-root, & .MuiAccordionSummary-root': { background: 'transparent !important' },
    },
    instructionsColumn: theme => ({
      ...column(theme),
      flex: isSettingsStacked ? '0 0 auto' : 1,
      borderRight: isTestPanelOpen ? `0.0625rem solid ${theme.palette.border.default}` : 'none',
    }),
    tree: theme => ({
      ...column(theme),
      flex: `0 0 ${TREE_WIDTH}`,
      backgroundColor: theme.palette.background.default.tertiary,
    }),
    fileColumn: theme => ({
      ...column(theme),
      display: isFileHidden ? 'none' : 'flex',
      flex: 1,
      borderRight: isTestPanelOpen || isInstructionsOpen ? column(theme).borderRight : 'none',
    }),
    fileBody: {
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    },
    missingFile: ({ palette }) => ({
      padding: '5rem 1.5rem 0',
      textAlign: 'center',
      color: palette.text.primary,
    }),
    sideColumn: theme => ({
      ...column(theme),
      flex: 1,
      borderRight: 'none',
    }),
    testColumn: theme => ({
      ...column(theme),
      position: 'relative',
      display: isTestPanelOpen ? 'flex' : 'none',
      flexShrink: 0,
      width: isTestFullScreen ? '100%' : `${testWidth / 16}rem`,
      maxWidth: isTestFullScreen ? '100%' : '50%',
      minWidth: isTestFullScreen ? undefined : '20rem',
      borderRight: 'none',
      background: theme.palette.background.default.primary,
    }),
    resizeHandle: {
      left: '-0.375rem',
      width: '0.75rem',
    },
    testHeader: {
      paddingRight: '1.5rem',
    },
    testBody: {
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '1rem 0.5rem 0.5rem',
      // The run's chat box draws its own rounded frame and fill and cuts its input's focus glow: not in this column
      '& [data-tour="chat-workspace"]': {
        border: 'none',
        borderRadius: 0,
        background: 'transparent',
        overflow: 'visible',
      },
    },
  };
};

export default SkillSplitEditor;
