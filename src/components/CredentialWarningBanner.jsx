import { memo, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { Box, Link, Typography } from '@mui/material';

import ErrorIcon from '@/assets/error-icon.svg?react';
import { BORDER_RADIUS } from '@/common/designTokens';
import RouteDefinitions, { getBasename } from '@/routes';

// Credential setup required: This toolkit requires your own private GitHub credentials. Create a credential with the ID "github_shared_toolkit" in your Private workspace to use this toolkit.
/**
 * Displays a styled warning banner when a private credential referenced by a
 * shared toolkit is not found in the current user's personal project.
 * Provides a "Create a credential" link that opens the credential creation page
 * in a new tab with the required ID and name pre-filled.
 *
 * Props:
 *   credentialId   {string}  The required credential ID (elitea_title)
 *   credentialType {string}  The credential type (e.g. 'github', 'pat')
 *   section        {string}  The credential section (e.g. 'credentials')
 */
const CredentialWarningBanner = memo(({ credentialId, credentialType, section }) => {
  const { personal_project_id } = useSelector(state => state.user);
  const styles = getStyles();

  const createUrl = useMemo(() => {
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const basename = getBasename();
    const type = credentialType || '';

    const routePath = type
      ? RouteDefinitions.CreateCredentialTypeFromMain.replace(':credentialType', type)
      : RouteDefinitions.CreateCredentialFromMain;

    const params = new URLSearchParams();
    if (personal_project_id) params.set('project_id', String(personal_project_id));
    if (section) params.set('section', section);
    if (credentialId) {
      params.set('prefill_name', credentialId);
      params.set('prefill_id', credentialId);
    }

    return `${baseUrl}${basename}/${personal_project_id}${routePath}?${params.toString()}`;
  }, [credentialId, credentialType, section, personal_project_id]);

  return (
    <Box sx={styles.container}>
      <Box
        component={ErrorIcon}
        sx={styles.icon}
      />
      <Typography
        variant="bodySmall"
        sx={styles.text}
      >
        <strong>Credential setup required:</strong>
        {credentialType ? ` This toolkit requires your own private ${credentialType} credentials. ` : ' '}
        <Link
          href={createUrl}
          target="_blank"
          rel="noreferrer"
          sx={styles.link}
        >
          Create a credential
        </Link>
        {` with the matching ID ${credentialId ? `"${credentialId}"` : ''} in your Private workspace to use this toolkit.`}
      </Typography>
    </Box>
  );
});

CredentialWarningBanner.displayName = 'CredentialWarningBanner';

/** @type {MuiSx} */
const getStyles = () => ({
  container: ({ palette }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: palette.background.errorBkg,
    border: `0.0625rem solid ${palette.border.error}`,
    borderRadius: BORDER_RADIUS.MD,
    marginTop: '0.5rem',
  }),
  icon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.icon.fill.error,
    flexShrink: 0,
    marginTop: '0.1rem',
  }),
  text: ({ palette }) => ({
    flex: 1,
    color: palette.text.warningText,
    wordBreak: 'break-word',
  }),
  link: ({ palette }) => ({
    color: palette.text.createButton,
    textDecorationColor: palette.text.createButton,
    '&:hover': {
      color: palette.text.createButton,
    },
  }),
});

export default CredentialWarningBanner;
