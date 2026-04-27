import { useCallback } from 'react';

import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import { Button, Typography } from '@mui/material';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import { StyledDialog, StyledDialogActions, StyledDialogContentText } from './StyledDialog';

/**
 * Confirmation modal for redirect-type application toolkits
 * Shows toolkit information and allows user to open in new tab or cancel
 */
const ConfirmRedirectModal = ({ open, toolkitName, toolkitDescription, redirectUrl, onClose }) => {
  const navigate = useNavigate();

  const handleOpenInNewTab = useCallback(() => {
    if (redirectUrl) {
      window.open(redirectUrl, '_blank');
    }
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  }, [redirectUrl, onClose, navigate]);

  const handleCancel = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  }, [onClose, navigate]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleOpenInNewTab();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleCancel();
      }
    },
    [handleOpenInNewTab, handleCancel],
  );

  return (
    <StyledDialog
      open={open}
      onClose={handleCancel}
      onKeyDown={handleKeyDown}
      aria-labelledby="redirect-dialog-title"
      aria-describedby="redirect-dialog-description"
    >
      <DialogTitle id="redirect-dialog-title">
        <Typography variant="headingMedium">Open Application</Typography>
      </DialogTitle>
      <DialogContent>
        <StyledDialogContentText id="redirect-dialog-description">
          <Typography
            variant="bodyMedium"
            sx={{ mb: 1 }}
          >
            {toolkitName || 'This application'} will open in a new browser tab.
          </Typography>
          {toolkitDescription && (
            <Typography
              variant="bodySmall"
              color="text.secondary"
            >
              {toolkitDescription}
            </Typography>
          )}
        </StyledDialogContentText>
      </DialogContent>
      <StyledDialogActions>
        <Button
          variant="alita"
          color="secondary"
          onClick={handleCancel}
        >
          <Typography variant="labelSmall">Cancel</Typography>
        </Button>
        <Button
          variant="alita"
          color="primary"
          onClick={handleOpenInNewTab}
          autoFocus
        >
          <Typography variant="labelSmall">Open in New Tab</Typography>
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  );
};

ConfirmRedirectModal.propTypes = {
  open: PropTypes.bool.isRequired,
  toolkitName: PropTypes.string,
  toolkitDescription: PropTypes.string,
  redirectUrl: PropTypes.string.isRequired,
  onClose: PropTypes.func,
};

export default ConfirmRedirectModal;
