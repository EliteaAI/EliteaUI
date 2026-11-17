import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { Box, useTheme } from '@mui/material';

import {
  SKILL_EDITOR_VIEWS,
  SKILL_FILES_SEARCH_PARAMS,
  SKILL_FILE_ACTIONS,
  SKILL_SIDE_PANELS,
} from '@/[fsd]/features/skill/lib/constants';
import { useIsSmallWindow, useToast } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PlusIcon from '@/components/Icons/PlusIcon';

import SkillFileHeader from './SkillFileHeader';
import SkillFileTree from './SkillFileTree';
import SkillFileViewer from './SkillFileViewer';
import SkillFilesEmpty from './SkillFilesEmpty';
import SkillInstructionsPane from './SkillInstructionsPane';
import SkillPaneHeader from './SkillPaneHeader';
import SkillTestButton from './SkillTestButton';
import SkillViewSwitch from './SkillViewSwitch';

const TREE_WIDTH = '18.75rem';

// Prototype answers to the file actions: the backend for them does not exist yet
const ACTION_MESSAGES = {
  [SKILL_FILE_ACTIONS.download]: name => `Downloading ${name}`,
  [SKILL_FILE_ACTIONS.copyPath]: name => `Path copied: ${name} — paste it into the instructions`,
  [SKILL_FILE_ACTIONS.rename]: () => 'A path field takes the place of the name here',
  [SKILL_FILE_ACTIONS.renameFolder]: () => 'A name field takes the place of the folder name here',
  [SKILL_FILE_ACTIONS.replace]: () => 'A file picker opens here to replace the file',
  [SKILL_FILE_ACTIONS.uploadHere]: name => `A file picker opens here to upload into ${name}`,
  [SKILL_FILE_ACTIONS.delete]: name => `${name} is deleted until Save. Discard brings it back`,
  [SKILL_FILE_ACTIONS.deleteFolder]: name => `Folder ${name} is deleted until Save. Discard brings it back`,
};

/**
 * The skill page (Figma "Skills (new) with files"), columns side by side under the page header:
 * - Settings: the short fields on the left, the instructions (SKILL.md) on the right with a Files line under them;
 * - Files: the tree on the left, the open file on the right; Instructions or Test opens one more column beside it.
 * Test opens a third column in both views. A window narrower than 1200 px (useIsSmallWindow, as on dev):
 * Settings with Test stacks the settings over the instructions; Files with a panel hides the open file.
 * Test in full screen hides every other column, as on dev. The view, the file and the side panel live in the address
 * (?view=files&file=…&panel=instructions|test), so a link opens the same state.
 */
const SkillSplitEditor = memo(props => {
  const {
    settings,
    settingsActions,
    files = [],
    disabled,
    isTestPanelOpen,
    isFullScreen = false,
    onOpenTestPanel,
    onCloseTestPanel,
    renderTestPanelControls,
    testPanelContent,
  } = props;

  const theme = useTheme();
  const { toastInfo } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get(SKILL_FILES_SEARCH_PARAMS.view) || SKILL_EDITOR_VIEWS.settings;
  const panelParam = searchParams.get(SKILL_FILES_SEARCH_PARAMS.panel);
  const isFiles = view === SKILL_EDITOR_VIEWS.files;
  const isInstructionsOpen = isFiles && !isTestPanelOpen && panelParam === SKILL_SIDE_PANELS.instructions;

  const [selectedPath, setSelectedPath] = useState(() => searchParams.get(SKILL_FILES_SEARCH_PARAMS.file));
  const openPath = useMemo(() => {
    if (!files.length) return null;
    return files.some(file => file.path === selectedPath) ? selectedPath : files[0].path;
  }, [files, selectedPath]);
  const openFile = useMemo(() => files.find(file => file.path === openPath) || null, [files, openPath]);

  const { isSmallWindow } = useIsSmallWindow();
  const isTestFullScreen = isTestPanelOpen && isFullScreen;
  const isSettingsStacked = isSmallWindow && isTestPanelOpen;
  const isFileHidden = isSmallWindow && (isTestPanelOpen || isInstructionsOpen);

  const styles = skillSplitEditorStyles({
    isTestPanelOpen,
    isInstructionsOpen,
    isSettingsStacked,
    isFileHidden,
  });

  const updateParams = useCallback(
    changes =>
      setSearchParams(
        previous => {
          const next = new URLSearchParams(previous);
          Object.entries(changes).forEach(([key, value]) => {
            if (value) next.set(key, value);
            else next.delete(key);
          });
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  // A link with panel=test opens the Test panel once, the way the Test button does
  const openedFromLink = useRef(false);
  useEffect(() => {
    if (openedFromLink.current) return;
    openedFromLink.current = true;
    if (panelParam === SKILL_SIDE_PANELS.test && !isTestPanelOpen) onOpenTestPanel?.();
  }, [isTestPanelOpen, onOpenTestPanel, panelParam]);

  const onChangeView = useCallback(
    nextView =>
      nextView &&
      updateParams({
        [SKILL_FILES_SEARCH_PARAMS.view]: nextView === SKILL_EDITOR_VIEWS.files ? nextView : null,
        [SKILL_FILES_SEARCH_PARAMS.panel]: null,
      }),
    [updateParams],
  );
  const onOpenFiles = useCallback(() => onChangeView(SKILL_EDITOR_VIEWS.files), [onChangeView]);

  const onSelectFile = useCallback(
    path => {
      setSelectedPath(path);
      updateParams({
        [SKILL_FILES_SEARCH_PARAMS.view]: SKILL_EDITOR_VIEWS.files,
        [SKILL_FILES_SEARCH_PARAMS.file]: path,
      });
    },
    [updateParams],
  );

  const onOpenTest = useCallback(() => {
    updateParams({ [SKILL_FILES_SEARCH_PARAMS.panel]: SKILL_SIDE_PANELS.test });
    onOpenTestPanel?.();
  }, [onOpenTestPanel, updateParams]);

  const onCloseTest = useCallback(() => {
    updateParams({ [SKILL_FILES_SEARCH_PARAMS.panel]: null });
    onCloseTestPanel?.();
  }, [onCloseTestPanel, updateParams]);

  // In Files one panel at a time: Instructions takes the place of Test
  const onOpenInstructions = useCallback(() => {
    if (isTestPanelOpen) onCloseTestPanel?.();
    updateParams({ [SKILL_FILES_SEARCH_PARAMS.panel]: SKILL_SIDE_PANELS.instructions });
  }, [isTestPanelOpen, onCloseTestPanel, updateParams]);

  const onCloseInstructions = useCallback(
    () => updateParams({ [SKILL_FILES_SEARCH_PARAMS.panel]: null }),
    [updateParams],
  );

  // Add files opens the device's file picker at once, wherever it is pressed: no stop at the empty Files tab
  const fileInputRef = useRef(null);
  const onAddFiles = useCallback(() => fileInputRef.current?.click(), []);
  const onFilesPicked = useCallback(
    event => {
      const picked = Array.from(event.target.files || []);
      event.target.value = '';
      if (!picked.length) return;
      // Prototype: there is no upload backend yet, so the choice is only named
      toastInfo(`${picked.length === 1 ? picked[0].name : `${picked.length} files`} — uploaded on Save`);
    },
    [toastInfo],
  );

  const onFileAction = useCallback(
    (action, path) => toastInfo(ACTION_MESSAGES[action]?.(path.replace(/\/$/, '')) ?? action),
    [toastInfo],
  );

  const viewSwitch = (
    <SkillViewSwitch
      value={view}
      onChange={onChangeView}
      filesCount={files.length}
    />
  );

  return (
    <Box
      sx={styles.root}
      data-testid="skill-split-editor"
      data-view={view}
      data-panel={
        isTestPanelOpen ? SKILL_SIDE_PANELS.test : isInstructionsOpen ? SKILL_SIDE_PANELS.instructions : ''
      }
    >
      {isTestFullScreen ? null : isFiles ? (
        <>
          <Box sx={styles.tree}>
            <SkillPaneHeader title={viewSwitch}>
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.secondary}
                startIcon={<PlusIcon fill={theme.palette.icon.secondary} />}
                onClick={onAddFiles}
                aria-label="Add files"
                title="Add files"
                data-testid="skill-files-add"
              />
            </SkillPaneHeader>
            {files.length > 0 && (
              <SkillFileTree
                files={files}
                selectedPath={openPath}
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
              onOpenTest={onOpenTest}
              onAction={onFileAction}
            />
            <Box sx={styles.fileBody}>
              {openFile ? (
                <SkillFileViewer
                  file={openFile}
                  onAction={onFileAction}
                  disabled={disabled}
                />
              ) : (
                <SkillFilesEmpty onAdd={onAddFiles} />
              )}
            </Box>
          </Box>
          {isInstructionsOpen && (
            <SkillInstructionsPane
              files={files}
              openPath={openPath}
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
            disabled={disabled}
            showViewToggle
            showFilesBar
            fitContent={isSettingsStacked}
            headerActions={isTestPanelOpen ? null : <SkillTestButton onClick={onOpenTest} />}
            onOpenFile={onSelectFile}
            onOpenFiles={onOpenFiles}
            onAddFiles={onAddFiles}
            sx={styles.instructionsColumn}
          />
        </Box>
      )}
      {/* The device's file picker, hidden: Add files opens it, as ImportSchedulesDialog does */}
      <input // component-check: allow native file picker, hidden
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={onFilesPicked}
        data-testid="skill-files-input"
      />
      {/* Stays mounted while closed, so the chat keeps its conversation and running requests */}
      <Box
        sx={styles.testColumn}
        aria-hidden={!isTestPanelOpen}
        data-testid="skill-test-panel"
      >
        <SkillPaneHeader
          title="Test"
          sx={styles.testHeader}
        >
          {renderTestPanelControls?.({ onClose: onCloseTest })}
        </SkillPaneHeader>
        <Box sx={styles.testBody}>{testPanelContent}</Box>
      </Box>
    </Box>
  );
});

SkillSplitEditor.displayName = 'SkillSplitEditor';

/** @type {MuiSx} */
const skillSplitEditorStyles = ({ isTestPanelOpen, isInstructionsOpen, isSettingsStacked, isFileHidden }) => {
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
    // Settings and the instructions: side by side, or one over the other in a narrow window with Test open
    settingsGroup: {
      display: 'flex',
      flexDirection: isSettingsStacked ? 'column' : 'row',
      flex: isTestPanelOpen && !isSettingsStacked ? 2 : 1,
      minWidth: 0,
      minHeight: 0,
      // Stacked: General shows whole, and the column scrolls as one with the instructions under it
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
    sideColumn: theme => ({
      ...column(theme),
      flex: 1,
      borderRight: 'none',
    }),
    // Figma "Test": the chat lies on the column itself, no inner frame; #0E131D in dark, the page gradient in light
    testColumn: theme => ({
      ...column(theme),
      display: isTestPanelOpen ? 'flex' : 'none',
      flex: 1,
      borderRight: 'none',
      background: theme.palette.background.default.primary,
    }),
    // The ✕ keeps 24px from the page edge, as the column's left side does
    testHeader: {
      paddingRight: '1.5rem',
    },
    testBody: {
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      // The chat box keeps 8px round its input: with 8px here the input stands 16px from the column edges
      padding: '1rem 0.5rem 0.5rem',
      // The run's chat box draws its own rounded frame and fill and cuts what passes its edge (the input's
      // focus glow): not in this column
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
