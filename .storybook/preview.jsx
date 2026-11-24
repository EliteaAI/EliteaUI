import { enGB } from 'date-fns/locale/en-GB';
import { Provider } from 'react-redux';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';

import getDesignTokens from '../src/MainTheme';
import { ToastProvider } from '../src/[fsd]/shared/ui/toast';
import ScreenshotCompare from '../src/[fsd]/stories/lib/ScreenshotCompare';
import { SCREENSHOT_MODES, SCREENSHOT_TAG } from '../src/[fsd]/stories/lib/screenshot.constants';
import StorybookStore from './storybookStore';

// The toolbar's Backgrounds switch is the theme; Storybook 10 keeps its key ('dark'), older versions its color
const getThemeMode = globals => (['dark', '#121212'].includes(globals.backgrounds?.value) ? 'dark' : 'light');

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
    // Stories tagged 'screenshot' can be shown next to their saved screenshot (scripts/storybookScreenshots.js)
    (Story, context) =>
      context.tags.includes(SCREENSHOT_TAG) ? (
        <ScreenshotCompare
          // A story or theme of its own starts from its newest screenshot
          key={`${context.id}-${getThemeMode(context.globals)}`}
          Story={Story}
          storyId={context.id}
          mode={context.globals.screenshot}
          theme={getThemeMode(context.globals)}
        />
      ) : (
        <Story />
      ),
    (Story, context) => {
      // Create theme using EliteAUI's theme function
      const theme = createTheme(getDesignTokens(getThemeMode(context.globals)));

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
                    background: theme.palette.background.default.secondary,
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
    // Set by the «Baseline» tool of .storybook/ScreenshotTool.jsx, shown only on stories tagged 'screenshot'
    screenshot: {
      name: 'Baseline',
      description: 'Compare a screenshot-tagged story with its saved screenshot',
    },
  },

  initialGlobals: {
    backgrounds: {
      value: 'light',
    },
    screenshot: SCREENSHOT_MODES.live,
  },
};

export default preview;
