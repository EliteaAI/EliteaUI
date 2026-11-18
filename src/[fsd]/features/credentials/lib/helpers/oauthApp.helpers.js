// Default app / Custom app modes of the Teams, Outlook, SharePoint and Microsoft Graph credentials (#7149).
export const OAUTH_APP_FIELD = 'oauth_app_id';
// The Default app subsection is the one keyed by oauth_app_id, never matched by its display name
export const isOAuthAppSection = subsection => Boolean(subsection?.key_fields?.includes(OAUTH_APP_FIELD));
// Set on the form by the Default app picker (not stored by the server); cleared when leaving Default app
export const APP_MIRRORED_FIELDS = ['oauth_discovery_endpoint'];

export const OAUTH_APP_CREDENTIAL_TYPES = ['teams', 'outlook', 'sharepoint', 'ms_graph'];

export const isOAuthAppCredentialType = type => OAUTH_APP_CREDENTIAL_TYPES.includes(type);

// The app preselected for a new credential: the admin's default, else the only one offered.
export const pickDefaultOAuthApp = (apps = []) =>
  apps.find(app => app.is_default) || (apps.length === 1 ? apps[0] : null);

export const usesOAuthApp = settings => Boolean(settings?.[OAUTH_APP_FIELD]);

// Form modes returned with the project's app list (see the configurations plugin's credential_mode)
export const OAUTH_APP_MODES = { default: 'default', choice: 'choice', custom: 'custom' };

// The server already moves a credential to a Default app that applies (it then reads as a Default app
// credential), except SharePoint App-only. What is left for the form:
// - one that references an app keeps the Default app tab even when the app is gone, so its error
//   shows and the user can switch to Custom app;
// - one still read with its own app (client_id) where a Default applies is App-only: it keeps the switcher.
export const hasOwnApp = settings => Boolean(settings?.client_id) && !usesOAuthApp(settings);

export const resolveOAuthAppMode = (data, settings) => {
  const mode = data?.mode || OAUTH_APP_MODES.custom;
  if (mode !== OAUTH_APP_MODES.default && usesOAuthApp(settings)) return OAUTH_APP_MODES.choice;
  if (mode === OAUTH_APP_MODES.default && hasOwnApp(settings)) return OAUTH_APP_MODES.choice;
  return mode;
};

export const filterOAuthAppSubsections = (subsections = [], mode) => {
  if (mode === OAUTH_APP_MODES.default) return subsections.filter(isOAuthAppSection);
  if (mode === OAUTH_APP_MODES.custom) return subsections.filter(sub => !isOAuthAppSection(sub));
  return subsections;
};
