import { memo } from 'react';

import { Box, FormControlLabel, Tooltip, Typography } from '@mui/material';

import { Checkbox, Input } from '@/[fsd]/shared/ui';
import InfoIcon from '@/components/Icons/InfoIcon';

const OAuthFormFields = memo(props => {
  const {
    clientId,
    clientSecret,
    scope,
    onClientIdChange,
    onClientSecretChange,
    onScopeChange,
    availableScopes = [],
    needClientId = false,
    needSecret = false,
    autoFocus = false,
    saveCredentials = false,
    onSaveCredentialsChange,
    showSaveCredentials = false,
  } = props;
  const styles = getStyles({ scope });
  return (
    <>
      {needClientId && (
        <Input.StyledInputEnhancer
          autoComplete="off"
          label="Client ID"
          placeholder="Enter OAuth client ID from the provider"
          onChange={onClientIdChange}
          value={clientId}
          enableAutoBlur={false}
          autoFocus={autoFocus}
          required
        />
      )}
      {needSecret && (
        <Input.StyledInputEnhancer
          autoComplete="off"
          label="Client Secret"
          placeholder={'Enter OAuth client secret'}
          onChange={onClientSecretChange}
          value={clientSecret}
          enableAutoBlur={false}
          type="password"
          required
        />
      )}
      <Input.StyledInputEnhancer
        autoComplete="off"
        label={
          <Typography
            variant="bodyMedium"
            color="text.primary"
            sx={styles.labelWithIcon}
          >
            Scope (optional)
            {availableScopes.length > 0 && (
              <Tooltip
                title={`MCP server supports: ${availableScopes.join(', ')}.`}
                placement="top"
              >
                <Box sx={styles.infoIconWrapper}>
                  <InfoIcon
                    width={16}
                    height={16}
                  />
                </Box>
              </Tooltip>
            )}
          </Typography>
        }
        onChange={onScopeChange}
        value={scope}
        placeholder="Enter OAuth scopes (space-separated)"
        enableAutoBlur={false}
      />
      {showSaveCredentials && (
        <FormControlLabel
          control={
            <Checkbox.BaseCheckbox
              checked={saveCredentials}
              onChange={onSaveCredentialsChange}
            />
          }
          label={
            <Typography
              variant="bodyMedium"
              color="text.primary"
            >
              Remember credentials for this session
            </Typography>
          }
          sx={styles.checkboxLabel}
        />
      )}
    </>
  );
});

/** @type {MuiSx} */
const getStyles = () => ({
  labelWithIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  infoIconWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: '0.25rem',
    color: 'text.secondary',
    cursor: 'default',
  },
  checkboxLabel: {
    marginTop: '0.5rem',
    marginBottom: '0.5rem',
  },
});

OAuthFormFields.displayName = 'OAuthFormFields';

export default OAuthFormFields;
