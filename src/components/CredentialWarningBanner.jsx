import { memo, useEffect, useMemo, useRef } from 'react';

import { useSelector } from 'react-redux';

import { Box, Link, Typography } from '@mui/material';

import { Banner } from '@/[fsd]/shared/ui';
import { useEliteaAssistantRef } from '@/[fsd]/widgets/support-assistant';
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
  const assistantRef = useEliteaAssistantRef();
  const hasShownPopup = useRef(false);
  const styles = getStyles();

  useEffect(() => {
    if (hasShownPopup.current) return;
    hasShownPopup.current = true;
    setTimeout(() => assistantRef?.current?.showPopup(), 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <Banner.BannerMessage variant="warning">
      <Typography
        variant="bodySmall"
        sx={styles.text}
      >
        <Box component="strong">Credential setup required:</Box>
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
    </Banner.BannerMessage>
  );
});

CredentialWarningBanner.displayName = 'CredentialWarningBanner';

/** @type {MuiSx} */
const getStyles = () => ({
  text: ({ palette }) => ({
    flex: 1,
    //change path for main DT = "#ffebd3" ; LT = "#D37015"
    color: palette.mode === 'dark' ? '#ffebd3' : '#D37015',
    wordBreak: 'break-word',
  }),
  link: ({ palette }) => ({
    //change path for main DT = "#29B8F5" ; LT = "#006DD1"
    color: palette.mode === 'dark' ? '#29B8F5' : '#006DD1',
    textDecorationColor: palette.mode === 'dark' ? '#29B8F5' : '#006DD1',
    '&:hover': {
      //change path for main DT = "#006DD1"  ; LT = "#29B8F5"
      color: palette.mode === 'dark' ? '#006DD1' : '#29B8F5',
    },
  }),
});

export default CredentialWarningBanner;
