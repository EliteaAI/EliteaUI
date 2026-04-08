import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

const eliteaTheme = create({
  base: 'light',
  brandTitle: 'EliteAUI Component Library',
  brandUrl: './',
  brandTarget: '_self',

  // UI
  appBg: '#ffffff',
  appContentBg: '#ffffff',
  appBorderColor: '#e0e0e0',
  appBorderRadius: 8,

  // Typography
  fontBase: '"Roboto", "Helvetica", "Arial", sans-serif',
  fontCode: 'monospace',

  // Text colors
  textColor: '#333333',
  textInverseColor: '#ffffff',

  // Toolbar default and active colors
  barTextColor: '#666666',
  barSelectedColor: '#1976d2',
  barBg: '#ffffff',

  // Form colors
  inputBg: '#ffffff',
  inputBorder: '#e0e0e0',
  inputTextColor: '#333333',
  inputBorderRadius: 4,
});

addons.setConfig({
  theme: eliteaTheme,
  panelPosition: 'bottom',
  selectedPanel: 'storybook/docs/panel',
});
