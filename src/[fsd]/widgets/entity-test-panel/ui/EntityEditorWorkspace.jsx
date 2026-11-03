import { memo, useMemo, useRef } from 'react';

import { Box } from '@mui/material';

import { useIsSmallWindow } from '@/[fsd]/shared/lib/hooks';

import EntityTestPanel from './EntityTestPanel';

/**
 * Editor page layout: configuration with a Test button on top, plus an on-demand Test panel on the right.
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
    storageKeyPrefix,
    testIdPrefix,
  } = props;

  const workspaceRef = useRef();
  const { isSmallWindow } = useIsSmallWindow();
  const isConfigHidden = isTestPanelOpen && isFullScreen;
  const isConfigStacked = isTestPanelOpen || isSmallWindow;

  // Same element while the inputs are unchanged, so chat updates don't re-render the configuration
  const config = useMemo(() => renderConfig({ isConfigStacked }), [renderConfig, isConfigStacked]);

  const styles = entityEditorWorkspaceStyles(isSmallWindow, isConfigHidden);

  return (
    <Box
      ref={workspaceRef}
      sx={styles.root}
      data-testid={`${testIdPrefix}-editor-workspace`}
    >
      <Box sx={styles.configArea}>
        <Box sx={styles.toolbar}>
          {toolbarActions}
          {testButton}
        </Box>
        <Box sx={styles.configBody}>{config}</Box>
      </Box>
      <EntityTestPanel
        isOpen={isTestPanelOpen}
        isFullWidth={isSmallWindow || isFullScreen}
        workspaceRef={workspaceRef}
        storageKeyPrefix={storageKeyPrefix}
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
  configBody: {
    flex: 1,
    minHeight: 0,
  },
});

export default EntityEditorWorkspace;
