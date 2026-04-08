import { enGB } from 'date-fns/locale/en-GB';
import { Provider } from 'react-redux';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';

import getDesignTokens from '../src/MainTheme';
import { ToastProvider } from '../src/components/ToastProvider';
import StorybookStore from './storybookStore';

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
      expanded: true,
      sort: 'requiredFirst',
    },
    docs: {
      toc: {
        contentsSelector: '.sbdocs-content',
        headingSelector: 'h1, h2, h3',
        ignoreSelector: '#primary',
        title: 'Table of Contents',
        disable: false,
      },
      source: {
        type: 'dynamic',
        language: 'jsx',
        format: true,
        excludeDecorators: true,
      },
    },
    backgrounds: {
      options: {
        light: {
          name: 'light',
          value: '#ffffff',
        },

        dark: {
          name: 'dark',
          value: '#121212',
        },

        grey: {
          name: 'grey',
          value: '#f5f5f5',
        },
      },
    },
    viewport: {
      options: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
          type: 'mobile',
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
          type: 'tablet',
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1024px', height: '768px' },
          type: 'desktop',
        },
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },

  decorators: [
    (Story, context) => {
      // Determine theme mode based on background or explicit theme setting
      const isDark = context.globals.backgrounds?.value === '#121212' || context.globals.theme === 'dark';

      // Create theme using EliteAUI's theme function
      const theme = createTheme(getDesignTokens(isDark ? 'dark' : 'light'));

      return (
        <Provider store={StorybookStore}>
          <ThemeProvider theme={theme}>
            <ToastProvider>
              <LocalizationProvider
                dateAdapter={AdapterDateFns}
                adapterLocale={enGB}
              >
                <CssBaseline />
                <div
                  style={{
                    padding: '16px',
                    background: theme.palette.background.default,
                    minHeight: '100vh',
                  }}
                >
                  <Story />
                </div>
              </LocalizationProvider>
            </ToastProvider>
          </ThemeProvider>
        </Provider>
      );
    },
  ],

  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: ['light', 'dark'],
        showName: true,
      },
    },
  },

  initialGlobals: {
    backgrounds: {
      value: 'light',
    },
  },
};

export default preview;
