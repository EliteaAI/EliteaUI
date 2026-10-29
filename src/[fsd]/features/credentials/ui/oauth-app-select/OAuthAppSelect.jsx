import { memo, useEffect, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { useOAuthAppListQuery } from '@/[fsd]/features/credentials/api/oauthAppsApi';
import { OAuthAppHelpers } from '@/[fsd]/features/credentials/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { SingleSelect } from '@/[fsd]/shared/ui/select';

// Default app mode of the Teams/Outlook/SharePoint credentials: pick an admin-managed OAuth app (Microsoft Entra ID for these types).
// The selector is shown only when more than one app applies. Everything else (client, secret,
// authority, scopes, token refresh) comes from the app server-side and is set in the Admin Portal.
const OAuthAppSelect = memo(props => {
  const {
    k,
    value,
    credentialType,
    label,
    description,
    required,
    editField,
    setDefaultField = editField,
    fieldPath,
    endpointPath,
    endpoint,
    disabled = false,
    appError,
  } = props;

  const styles = oauthAppSelectStyles();
  const projectId = useSelectedProjectId();
  const { data: { apps = [] } = {}, isFetching } = useOAuthAppListQuery(
    { projectId, type: credentialType },
    { skip: !projectId || !credentialType },
  );

  const options = useMemo(() => apps.map(app => ({ label: app.name, value: app.id })), [apps]);
  const selectedApp = useMemo(() => apps.find(app => app.id === value), [apps, value]);

  // A new credential gets the admin's default app
  useEffect(() => {
    if (disabled || value || isFetching) return;
    const app = OAuthAppHelpers.pickDefaultOAuthApp(apps);
    if (app) setDefaultField(fieldPath, app.id);
  }, [apps, disabled, fieldPath, isFetching, setDefaultField, value]);

  // Token keys are "<credential uuid>:<oauth_discovery_endpoint>": mirror the app's authority
  // (not secret, and dropped by the server on save) so sign-in and test connection share a key.
  // Switching to Custom app clears it again (ToolSection, see OAuthAppHelpers.APP_MIRRORED_FIELDS).
  useEffect(() => {
    if (disabled || !selectedApp || selectedApp.oauth_discovery_endpoint === endpoint) return;
    setDefaultField(endpointPath, selectedApp.oauth_discovery_endpoint);
  }, [disabled, endpoint, endpointPath, selectedApp, setDefaultField]);

  if (!isFetching && !apps.length && !value) {
    return (
      <Box
        sx={styles.hint}
        data-testid={`toolkit-field-${k}-no-apps`}
      >
        <Typography variant="bodySmall">
          No app is configured for this project. Ask your administrator to configure an app, or use Custom
          app.
        </Typography>
      </Box>
    );
  }

  const error = appError || (value && !isFetching && !selectedApp ? 'This app is no longer available' : '');

  if (apps.length === 1 && selectedApp && !error) {
    return (
      <Box
        sx={styles.hint}
        data-testid={`toolkit-field-${k}-single-app`}
      >
        <Typography variant="bodySmall">Sign-in settings are managed by your administrator.</Typography>
      </Box>
    );
  }

  return (
    <Box data-testid={`toolkit-field-${k}-oauth-app`}>
      <SingleSelect
        showBorder
        label={label}
        infoIconDescription={description}
        required={required}
        onValueChange={newValue => editField(fieldPath, newValue)}
        value={selectedApp ? value : ''}
        options={options}
        customSelectedFontSize="0.875rem"
        disabled={disabled}
        error={Boolean(error)}
        helperText={error ? `${error}. Switch to Custom app.` : ''}
      />
    </Box>
  );
});

OAuthAppSelect.displayName = 'OAuthAppSelect';

/** @type {MuiSx} */
const oauthAppSelectStyles = () => ({
  hint: ({ palette }) => ({
    padding: '0.5rem 0.75rem 1rem',
    color: palette.text.secondary,
  }),
});

export default OAuthAppSelect;
