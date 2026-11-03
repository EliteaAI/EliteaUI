import { memo } from 'react';

import { Box } from '@mui/material';

/**
 * Frame of an editor Test panel: header toolbar + body. Stays mounted while closed, so the chat inside
 * keeps its conversation and running requests.
 */
const EntityTestPanelShell = memo(props => {
  const {
    isOpen,
    width,
    panelRef,
    isFullWidth = false,
    resizeHandle,
    controls,
    children,
    testId = 'test-panel',
  } = props;

  const styles = entityTestPanelShellStyles(isOpen, width, isFullWidth);

  return (
    <Box
      ref={panelRef}
      sx={styles.root}
      aria-hidden={!isOpen}
      data-testid={testId}
    >
      {resizeHandle}
      <Box sx={styles.header}>{controls}</Box>
      <Box sx={styles.body}>{children}</Box>
    </Box>
  );
});

EntityTestPanelShell.displayName = 'EntityTestPanelShell';

/** @type {MuiSx} */
const entityTestPanelShellStyles = (isOpen, width, isFullWidth) => ({
  root: {
    position: 'relative',
    display: isOpen ? 'flex' : 'none',
    flexDirection: 'column',
    flexShrink: 0,
    width: isFullWidth ? '100%' : `${width / 16}rem`,
    maxWidth: isFullWidth ? '100%' : '50%',
    minWidth: isFullWidth ? undefined : '20rem',
    height: '100%',
    minHeight: isFullWidth ? 'calc(100vh - 13.75rem)' : undefined,
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '0.5rem',
    height: '1.75rem',
    marginTop: '0.25rem',
    marginBottom: '1rem',
  },
  // The chat draws the bordered card itself, so this is layout only
  body: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
});

export default EntityTestPanelShell;
