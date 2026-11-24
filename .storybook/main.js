import { fileURLToPath } from 'url';

import { screenshotHistory } from './screenshotHistory.js';

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    {
      name: '@storybook/addon-docs',
      options: {
        configureJSX: true,
        babelOptions: {},
        sourceLoaderOptions: null,
        transcludeMarkdown: true,
      },
    },
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    defaultName: 'Documentation',
  },
  core: {
    // No «what's new» pop-ups in the sidebar
    disableWhatsNewNotifications: true,
  },
  features: {
    // No git-based «new / changed story» markers in the sidebar
    changeDetection: false,
    // No «Get started» onboarding checklist in the sidebar and the menu
    sidebarOnboardingChecklist: false,
    menuOnboardingChecklist: false,
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: prop => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  viteFinal: async viteConfig => {
    // Merge custom configuration into the default config
    const { mergeConfig } = await import('vite');

    return mergeConfig(viteConfig, {
      // Add any custom Vite configuration here if needed
      define: {
        global: 'globalThis',
      },
      // Versions of the saved story screenshots from git, for the stories' compare view
      plugins: [screenshotHistory(fileURLToPath(new URL('..', import.meta.url)))],
    });
  },
};

export default config;
