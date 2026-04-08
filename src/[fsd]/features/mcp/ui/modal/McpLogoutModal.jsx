import { memo, useCallback, useMemo } from 'react';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Typography,
} from '@mui/material';

import { isPrebuildMcpType, logout } from '@/[fsd]/features/mcp/lib/helpers/mcpAuth.helpers';
import CloseIcon from '@/components/Icons/CloseIcon';

const McpLogoutModal = memo(props => {
  const { serverUrl, toolkitType, open, onClose, onConfirm } = props;

  const styles = getModalStyles();

  // Check if this is a pre-built MCP
  const isPrebuildMcp = useMemo(() => isPrebuildMcpType(toolkitType), [toolkitType]);

  // Display name for the server/toolkit
  const displayName = useMemo(() => {
    if (isPrebuildMcp) {
      return toolkitType;
    }
    return serverUrl;
  }, [isPrebuildMcp, toolkitType, serverUrl]);

  const handleCancel = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const handleLogout = useCallback(() => {
    // For pre-built MCPs, use toolkitType; for remote MCPs, use serverUrl
    if (isPrebuildMcp) {
      logout(null, toolkitType);
    } else if (serverUrl) {
      logout(serverUrl);
    } else {
      return;
    }

    // Call onConfirm callback if provided
    onConfirm?.();

    // Close the modal
    onClose?.(true);
  }, [isPrebuildMcp, toolkitType, serverUrl, onClose, onConfirm]);

  const handleKeyDown = event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleLogout();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
    }
  };

  return (
    <Dialog
      open={open}
      keepMounted
      onKeyDown={handleKeyDown}
      slotProps={{
        paper: {
          sx: styles.dialogPaper,
        },
      }}
    >
      <DialogTitle
        variant="headingMedium"
        color="text.secondary"
        sx={styles.dialogTitle}
      >
        MCP Authorization
        <IconButton
          variant="elitea"
          color="tertiary"
          aria-label="close"
          onClick={handleCancel}
          sx={styles.closeButton}
        >
          <CloseIcon sx={styles.closeButtonIcon} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={styles.dialogContent}>
        <Typography
          variant="bodyMedium"
          component="div"
          sx={{ marginBottom: '1rem' }}
        >
          This MCP server requires OAuth authorization to access its tools. It supports automatic client
          registration.
        </Typography>
        <Typography
          variant="headingSmall"
          component="div"
          sx={styles.serverUrl}
        >
          {isPrebuildMcp ? 'Toolkit: ' : 'Server: '}
          <Typography
            variant="bodyMedium"
            component="span"
          >
            {isPrebuildMcp ? (
              displayName
            ) : (
              <Link
                href={serverUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={styles.link}
              >
                {serverUrl}
              </Link>
            )}
          </Typography>
        </Typography>
        <Typography
          variant="bodyMedium"
          component="div"
          sx={{ marginTop: '1.5rem' }}
        >
          Are you sure to log out?
        </Typography>
      </DialogContent>
      <DialogActions sx={styles.dialogActions}>
        <Button
          variant="elitea"
          color="secondary"
          onClick={handleCancel}
          disableRipple
        >
          Cancel
        </Button>
        <Button
          variant="elitea"
          color="primary"
          onClick={handleLogout}
          disableRipple
        >
          Log out
        </Button>
      </DialogActions>
    </Dialog>
  );
});

/** @type {MuiSx} */
const getModalStyles = () => ({
  dialogPaper: ({ palette, spacing }) => ({
    background: palette.background.tabPanel,
    borderRadius: spacing(2),
    border: `0.0625rem solid ${palette.border.lines}`,
    boxShadow: palette.boxShadow.default,
    marginTop: 0,
    maxWidth: '35rem',
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 0,
  }),
  dialogTitle: ({ palette, spacing }) => ({
    height: spacing(7.5),
    padding: spacing(2, 2.5, 2, 3),
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }),
  closeButton: ({ spacing }) => ({
    position: 'absolute',
    right: spacing(2),
    top: spacing(2),
  }),
  closeButtonIcon: {
    fontSize: '1rem',
  },
  dialogContent: ({ palette, spacing }) => ({
    padding: spacing(3),
    paddingTop: `${spacing(3)} !important`,
    backgroundColor: palette.background.tabPanel,
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  dialogActions: ({ palette, spacing }) => ({
    padding: spacing(2, 3),
    backgroundColor: palette.background.tabPanel,
    justifyContent: 'flex-end',
    gap: spacing(1),
  }),
  serverUrl: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  link: {
    textDecoration: 'underline',
    '&:hover': {
      cursor: 'pointer',
      textDecoration: 'underline',
    },
  },
});

McpLogoutModal.displayName = 'McpLogoutModal';

export default McpLogoutModal;
