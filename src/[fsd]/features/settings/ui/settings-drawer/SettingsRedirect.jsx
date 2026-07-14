import { memo, useEffect } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

const VALID_TABS = [
  'project-general',
  'ai-providers',
  'tokens',
  'integrations',
  'secrets',
  'projects',
  'analytics',
  'project-params',
  'prompts',
  'environment',
  'preferences',
  'notifications',
];
const LEGACY_TABS = ['configuration', 'information'];
const DEFAULT_TAB = 'ai-providers';

/**
 * Component to handle backwards compatibility for old settings routes
 * - /settings/configuration -> /settings/ai-providers
 * - /settings/information -> /settings/ai-providers
 * - /settings (no tab) -> /settings/ai-providers
 * - Invalid tabs -> /settings/ai-providers
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
