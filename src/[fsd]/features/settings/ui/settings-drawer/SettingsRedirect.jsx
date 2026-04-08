import { memo, useEffect } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

const VALID_TABS = ['model-configuration', 'tokens', 'integrations', 'secrets', 'projects', 'analytics'];
const LEGACY_TABS = ['configuration', 'information'];
const DEFAULT_TAB = 'model-configuration';

/**
 * Component to handle backwards compatibility for old settings routes
 * - /settings/configuration -> /settings/model-configuration
 * - /settings/information -> /settings/model-configuration
 * - /settings (no tab) -> /settings/model-configuration
 * - Invalid tabs -> /settings/model-configuration
 */
const SettingsRedirect = memo(() => {
  const { tab } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const shouldRedirect = !tab || LEGACY_TABS.includes(tab) || !VALID_TABS.includes(tab);

    if (shouldRedirect) {
      navigate(`/settings/${DEFAULT_TAB}`, { replace: true });
    }
  }, [tab, navigate]);

  return null;
});

SettingsRedirect.displayName = 'SettingsRedirect';

export default SettingsRedirect;
