import { SCREENSHOT_DIR } from './screenshot.constants';
import { getBaselineFileName } from './screenshotFile.helpers';

const BASELINES = import.meta.glob('/src/**/__screenshots__/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

export const getBaselineUrl = (storyId, theme) => {
  const suffix = `/${SCREENSHOT_DIR}/${getBaselineFileName(storyId, theme)}`;
  const key = Object.keys(BASELINES).find(path => path.endsWith(suffix));
  return key ? BASELINES[key] : null;
};
