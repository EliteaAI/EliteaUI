import { memo, useCallback, useEffect, useState } from 'react';

import { Box, Button, FormControl, FormHelperText, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import { Input, Modal, Select } from '@/[fsd]/shared/ui';
import { filterProps } from '@/common/utils';

const StyledFormControl = styled(
  FormControl,
  filterProps('showBorder'),
)(({ theme, showBorder }) =>
  showBorder
    ? {
        '& .MuiSelect-icon': {
          marginRight: '.75rem',
        },
        verticalAlign: 'bottom',

        '& .MuiInputBase-root.MuiInput-root': {
          padding: '0 .75rem',

          '&:not(:hover, .Mui-error):before': {
            borderBottom: `.0625rem solid ${theme.palette.border.lines}`,
          },

          '&:hover:not(.Mui-disabled, .Mui-error):before': {
            borderBottom: `.125rem solid ${theme.palette.border.hover}`,
          },
        },

        '& .MuiFormHelperText-root.Mui-error': {
          paddingLeft: '.75rem',
        },
      }
    : {
        margin: '0 8px',
        verticalAlign: 'bottom',
        '& .MuiInputBase-root.MuiInput-root:before': {
          border: 'none',
        },
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            border: 'none',
          },
          '&:hover fieldset': {
            border: 'none',
          },
          '&.Mui-focused fieldset': {
            border: 'none',
          },
          '& .MuiFormHelperText-root.Mui-error': {
            paddingLeft: '.75rem',
          },
        },
      },
);

const validateEmail = email => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

const validateEmails = emails => {
  let containInvalidEmail = false;
  let message = 'Invalid email: ';
  for (let index = 0; index < emails.length; index++) {
    if (!validateEmail(emails[index])) {
      message = message + (containInvalidEmail ? ', ' : '') + emails[index];
      containInvalidEmail = true;
    }
  }
  return {
    containInvalidEmail,
    message,
  };
};

const InviteUserDialog = memo(props => {
  const { title, open, onClose, onCancel, onConfirm, confirmButtonText = 'Invite', rolesOptions } = props;

  const [inputText, setInputText] = useState('');
  const [emails, setEmails] = useState([]);
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);

  useEffect(() => {
    if (!open) {
      setInputText('');
      setEmails([]);
      setError(false);
      setHelperText('');
      setSelectedRoles([]);
    }
  }, [open]);

  const parseEmails = useCallback(parsedEmails => {
    const { containInvalidEmail, message } = validateEmails(parsedEmails);
    if (!containInvalidEmail) {
      setError(false);
      setHelperText('');
    } else {
      setError(true);
      setHelperText(message);
    }
  }, []);

  const handleChange = useCallback(e => {
    const {
      target: { value },
    } = e;
    setEmails(value.split(','));
    setInputText(value);
  }, []);

  const handleBlur = useCallback(() => {
    parseEmails(emails);
  }, [emails, parseEmails]);

  const handleRolesChange = useCallback(newRoles => {
    setSelectedRoles(newRoles);
  }, []);

  const handleConfirm = useCallback(() => {
    const trimmedEmails = emails.map(email => email.trim()).filter(email => email);
    onConfirm({
      emails: trimmedEmails,
      roles: selectedRoles,
    });
  }, [emails, onConfirm, selectedRoles]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' && emails.length > 0 && selectedRoles.length > 0 && !error) {
        event.preventDefault();
        handleConfirm();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    },
    [emails.length, selectedRoles.length, error, handleConfirm, onCancel],
  );

  useEffect(() => {
    if (error) {
      const { containInvalidEmail } = validateEmails(
        inputText
          .split(',')
          .map(item => item.trim())
          .filter(item => !!item),
      );
      setError(containInvalidEmail);
    }
  }, [error, inputText]);

  const styles = inviteUserDialogStyles();

  return (
    <Modal.BaseModal
      open={open}
      title={title}
      onClose={onClose}
      onKeyDown={handleKeyDown}
      content={
        <Box sx={styles.contentWrapper}>
          <Typography
            variant="bodyMedium"
            color="text.secondary"
          >
            Enter user emails(separated by comma) and select roles to define permissions for this project.
          </Typography>
          <Box sx={styles.inputSection}>
            <StyledFormControl
              sx={styles.formControl}
              variant="standard"
              size="small"
              fullWidth
              showBorder
              error={error}
            >
              <Input.StyledInputEnhancer
                containerProps={{ width: '100%' }}
                autoComplete="off"
                required
                fullWidth
                multiline
                maxRows={10}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                value={emails.join(',')}
                label="Emails"
                enableAutoBlur={false}
                onBlur={handleBlur}
              />
              {error && <FormHelperText>{helperText}</FormHelperText>}
            </StyledFormControl>
          </Box>
          <Select.SingleSelect
            label="Roles"
            onValueChange={handleRolesChange}
            value={selectedRoles}
            options={rolesOptions}
            multiple
            showBorder
          />
        </Box>
      }
      actions={
        <Box sx={styles.actionsWrapper}>
          <Button
            variant="elitea"
            color="secondary"
            onClick={onCancel}
            disableRipple
          >
            Cancel
          </Button>
          <Button
            variant="elitea"
            color="primary"
            onClick={handleConfirm}
            disableRipple
            disabled={!emails.length || !selectedRoles.length || error}
          >
            {confirmButtonText}
          </Button>
        </Box>
      }
    />
  );
});

InviteUserDialog.displayName = 'InviteUserDialog';

/** @type {MuiSx} */
const inviteUserDialogStyles = () => ({
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  actionsWrapper: {
    display: 'flex',
    gap: '1rem',
  },
  inputSection: {
    minHeight: '3.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  formControl: {
    margin: '0 !important',
    border: 'none !important',
  },
  searchInput: {
    width: '100%',
    paddingTop: '0.1875rem',
  },
  menuPaper: {
    marginTop: '0.5rem',
  },
  valueItem: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  labelSX: {
    left: '0.75rem',
  },
});

export default InviteUserDialog;
