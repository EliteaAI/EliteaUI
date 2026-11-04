import { memo, useMemo, useRef } from 'react';

import { Box } from '@mui/material';

import { useIsSmallWindow } from '@/[fsd]/shared/lib/hooks';

import EntityTestPanel from './EntityTestPanel';

/**
 * Editor page layout: configuration plus an on-demand Test panel on the right.
 * The toolbar (Edit with AI + Test button) goes where it takes no extra row:
 * - two config columns: `renderConfig({ toolbar })` puts it in the left column's first section header
 * - panel open: the Test button is hidden, as for Pipelines, and the actions move into the panel header
 * - small windows: a row above the configuration, since the panel stacks below
 * `renderConfig({ isConfigStacked })` lays the sections out in one column while the panel is open.
 * Opening, closing or going full screen only changes styles, so nothing inside is remounted.
 */
const EntityEditorWorkspace = memo(props => {
  const {
    renderConfig,
    toolbarActions,
    testButton,
    testPanelControls,
    testPanelContent,
    isTestPanelOpen,
    isFullScreen = false,
    testIdPrefix,
  } = props;

  const workspaceRef = useRef();
  const { isSmallWindow } = useIsSmallWindow();
  const isConfigHidden = isTestPanelOpen && isFullScreen;
  const isConfigStacked = isTestPanelOpen || isSmallWindow;
  const isToolbarInPanel = isTestPanelOpen && !isSmallWindow;

  const styles = useMemo(
    () => entityEditorWorkspaceStyles(isSmallWindow, isConfigHidden),
    [isSmallWindow, isConfigHidden],
  );

  const inlineToolbar = useMemo(
    () =>
      isConfigStacked ? null : (
        <Box sx={styles.inlineToolbar}>
          {toolbarActions}
          {testButton}
        </Box>
      ),
    [isConfigStacked, styles.inlineToolbar, testButton, toolbarActions],
  );

  // Same element while the inputs are unchanged, so chat updates don't re-render the configuration
  const config = useMemo(
    () => renderConfig({ isConfigStacked, toolbar: inlineToolbar }),
    [renderConfig, isConfigStacked, inlineToolbar],
  );

  return (
    <Box
      ref={workspaceRef}
      sx={styles.root}
      data-testid={`${testIdPrefix}-editor-workspace`}
    >
      <Box sx={styles.configArea}>
        {isSmallWindow && (
          <Box sx={styles.toolbar}>
            {toolbarActions}
            {!isTestPanelOpen && testButton}
          </Box>
        )}
        <Box sx={styles.configBody}>{config}</Box>
      </Box>
      <EntityTestPanel
        isOpen={isTestPanelOpen}
        isFullWidth={isSmallWindow || isFullScreen}
        workspaceRef={workspaceRef}
        headerActions={isToolbarInPanel ? toolbarActions : null}
        controls={testPanelControls}
        testIdPrefix={testIdPrefix}
      >
        {testPanelContent}
      </EntityTestPanel>
    </Box>
  );
});

EntityEditorWorkspace.displayName = 'EntityEditorWorkspace';

/** @type {MuiSx} */
const entityEditorWorkspaceStyles = (isSmallWindow, isConfigHidden) => ({
  root: {
    display: 'flex',
    flexDirection: isSmallWindow ? 'column' : 'row',
    gap: '1.5rem',
    width: '100%',
    height: '100%',
    padding: '0.75rem 1.5rem 1.5rem',
    boxSizing: 'border-box',
    overflow: isSmallWindow ? 'auto' : 'hidden',
  },
  configArea: {
    flex: 1,
    minWidth: 0,
    minHeight: isSmallWindow ? 'calc(100vh - 13.75rem)' : 0,
    display: isConfigHidden ? 'none' : 'flex',
    flexDirection: 'column',
  },
  // Same height as the Test panel header, so both rows line up
  toolbar: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '0.5rem',
    height: '1.75rem',
    marginTop: '0.25rem',
    marginBottom: '1rem',
  },
  inlineToolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  configBody: {
    flex: 1,
    minHeight: 0,
  },
});

export default EntityEditorWorkspace;
