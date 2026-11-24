import SCREENSHOT_HISTORY from 'virtual:screenshot-history';

import { SCREENSHOT_DIR } from './screenshot.constants';
import { getBaselineFileName } from './screenshotFile.helpers';

const BASELINES = import.meta.glob('/src/**/__screenshots__/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

const getSavedUrl = fileName => {
  const suffix = `/${SCREENSHOT_DIR}/${fileName}`;
  const key = Object.keys(BASELINES).find(path => path.endsWith(suffix));
  return key ? BASELINES[key] : null;
};

const getVersionLabel = ({ version, date, subject, uncommitted }) =>
  uncommitted ? `v${version} · not committed` : `v${version} · ${date} · ${subject}`;

// Versions of a story's screenshot in a theme from git (.storybook/screenshotHistory.js), newest first; the newest
// is the saved file
export const getBaselineVersions = (storyId, theme) => {
  const fileName = getBaselineFileName(storyId, theme);
  const savedUrl = getSavedUrl(fileName);
  if (!savedUrl) return [];

  const history = SCREENSHOT_HISTORY[fileName] ?? [];
  if (!history.length) return [{ value: 1, label: 'v1 · not committed', url: savedUrl }];

  return history
    .map((version, index) => ({
      value: version.version,
      label: getVersionLabel(version),
      url: index === history.length - 1 ? savedUrl : version.url,
    }))
    .reverse();
};
