import { GLOBALS_UPDATED, SET_GLOBALS, STORY_RENDERED } from 'storybook/internal/core-events';
import { addons, types } from 'storybook/manager-api';
import { create } from 'storybook/theming';

import ScreenshotTool from './ScreenshotTool';

const BASE = {
  brandTitle: 'EliteAUI Component Library',
  brandUrl: './',
  brandTarget: '_self',
  appBorderRadius: 8,
  fontBase: '"Roboto", "Helvetica", "Arial", sans-serif',
  fontCode: 'monospace',
  inputBorderRadius: 4,
};

const lightTheme = create({
  ...BASE,
  base: 'light',
  appBg: '#ffffff',
  appContentBg: '#ffffff',
  appBorderColor: '#e0e0e0',
  textColor: '#333333',
  textInverseColor: '#ffffff',
  barTextColor: '#666666',
  barSelectedColor: '#1976d2',
  barBg: '#ffffff',
  inputBg: '#ffffff',
  inputBorder: '#e0e0e0',
  inputTextColor: '#333333',
});

// Colors of src/darkPalette.js
const darkTheme = create({
  ...BASE,
  base: 'dark',
  colorSecondary: '#6ae8fa',
  appBg: '#0E131D',
  appContentBg: '#181F2A',
  appPreviewBg: '#181F2A',
  appBorderColor: '#3B3E46',
  textColor: '#FFFFFF',
  textMutedColor: '#A9B7C1',
  textInverseColor: '#0E131D',
  barTextColor: '#A9B7C1',
  barHoverColor: '#6ae8fa',
  barSelectedColor: '#6ae8fa',
  barBg: '#101721',
  inputBg: '#101721',
  inputBorder: '#3B3E46',
  inputTextColor: '#FFFFFF',
});

// Same rule as the preview's theme decorator
const isDark = globals => ['dark', '#121212'].includes(globals?.backgrounds?.value);

addons.setConfig({
  theme: lightTheme,
  panelPosition: 'bottom',
  selectedPanel: 'storybook/docs/panel',
});

// The Storybook UI follows the toolbar's Backgrounds switch, which is the theme of the stories
addons.register('elitea/theme-sync', api => {
  const applyTheme = () => api.setOptions({ theme: isDark(api.getGlobals()) ? darkTheme : lightTheme });
  [SET_GLOBALS, GLOBALS_UPDATED, STORY_RENDERED].forEach(event => api.on(event, applyTheme));
});

addons.add('elitea/screenshot', {
  type: types.TOOL,
  title: 'Baseline',
  match: ({ viewMode }) => viewMode === 'story',
  render: ScreenshotTool,
});
