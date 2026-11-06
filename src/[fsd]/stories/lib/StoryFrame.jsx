import { memo, useState } from 'react';

import { Provider } from 'react-redux';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

import { Box } from '@mui/material';

import { FilePreviewNavigationProvider } from '@/[fsd]/shared/ui';

import { createStoryStore } from './storyStore';

// Store and router are created once per mount so re-renders keep the screen state
const StoryFrame = memo(props => {
  const { Story, state, width, height, path } = props;

  const styles = storyFrameStyles(width, height);

  const [store] = useState(() => createStoryStore(state));
  const [router] = useState(() =>
    createMemoryRouter(
      [
        {
          path: '*',
          element: (
            <FilePreviewNavigationProvider>
              <Box sx={styles.root}>
                <Story />
              </Box>
            </FilePreviewNavigationProvider>
          ),
        },
      ],
      { initialEntries: [path] },
    ),
  );

  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
});

StoryFrame.displayName = 'StoryFrame';

/** @type {MuiSx} */
const storyFrameStyles = (width, height) => ({
  root: ({ palette }) => ({
    position: 'fixed',
    top: 0,
    left: 0,
    display: 'flex',
    width: `${width / 16}rem`,
    height: `${height / 16}rem`,
    backgroundColor: palette.background.default.primary,
  }),
});

export default StoryFrame;
