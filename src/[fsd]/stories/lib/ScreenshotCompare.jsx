import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { SCREENSHOT_MODES, SCREENSHOT_SIZE } from './screenshot.constants';
import { getBaselineUrl } from './screenshot.helpers';
import { useFitScale } from './useFitScale.hooks';

const GAP_PX = 16;
const LABEL_PX = 24;
const rem = px => `${px / 16}rem`;

// The same story in its own frame of the screenshot's size, so a page that fills the window (100vh) lays out as it
// did for the screenshot, whatever the size of the Storybook pane
const getLiveUrl = (storyId, theme) =>
  `iframe.html?id=${storyId}&viewMode=story&globals=screenshot:${SCREENSHOT_MODES.live};theme:${theme}`;

// The story next to its saved screenshot; the mode comes from the toolbar's «Baseline» switch
const ScreenshotCompare = memo(props => {
  const { Story, storyId, mode = SCREENSHOT_MODES.live, theme } = props;

  const baselineUrl = getBaselineUrl(storyId, theme);
  const isSideBySide = mode === SCREENSHOT_MODES.side;
  const scale = useFitScale(SCREENSHOT_SIZE, isSideBySide ? 2 : 1, GAP_PX, LABEL_PX);

  const styles = screenshotCompareStyles(scale);

  if (mode === SCREENSHOT_MODES.live) return <Story />;

  if (!baselineUrl) {
    return (
      <>
        <Story />
        <Typography
          variant="bodySmall"
          sx={styles.notice}
        >
          No {theme} screenshot yet. Run: npm run storybook:shots -- {storyId}
        </Typography>
      </>
    );
  }

  return (
    <Box sx={styles.root}>
      {isSideBySide && (
        <Box sx={styles.pane}>
          <Typography
            variant="labelMedium"
            sx={styles.label}
          >
            Live
          </Typography>
          <Box sx={styles.viewport}>
            <Box
              component="iframe"
              title="Live"
              src={getLiveUrl(storyId, theme)}
              sx={styles.liveFrame}
            />
          </Box>
        </Box>
      )}
      <Box sx={styles.pane}>
        <Typography
          variant="labelMedium"
          sx={styles.label}
        >
          Baseline
        </Typography>
        <Box
          component="img"
          src={baselineUrl}
          alt="Baseline"
          sx={styles.viewport}
        />
      </Box>
    </Box>
  );
});

ScreenshotCompare.displayName = 'ScreenshotCompare';

/** @type {MuiSx} */
const screenshotCompareStyles = scale => ({
  root: ({ palette }) => ({
    position: 'fixed',
    inset: 0,
    zIndex: 1,
    display: 'flex',
    gap: rem(GAP_PX),
    padding: rem(GAP_PX),
    overflow: 'auto',
    backgroundColor: palette.background.default.secondary,
  }),
  pane: {
    display: 'flex',
    flexDirection: 'column',
    gap: rem(GAP_PX / 2),
    flexShrink: 0,
  },
  label: ({ palette }) => ({
    height: rem(LABEL_PX - GAP_PX / 2),
    color: palette.text.secondary,
  }),
  viewport: ({ palette }) => ({
    position: 'relative',
    width: rem(SCREENSHOT_SIZE.width * scale),
    height: rem(SCREENSHOT_SIZE.height * scale),
    overflow: 'hidden',
    // An outline takes no room, so the frame and the image keep the screenshot's exact size
    outline: `0.0625rem solid ${palette.border.lines}`,
  }),
  liveFrame: {
    width: rem(SCREENSHOT_SIZE.width),
    height: rem(SCREENSHOT_SIZE.height),
    border: 0,
    transform: `scale(${scale})`,
    transformOrigin: '0 0',
  },
  notice: ({ palette }) => ({
    position: 'fixed',
    bottom: '0.75rem',
    right: '0.75rem',
    zIndex: 2000,
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    color: palette.text.primary,
    backgroundColor: palette.background.default.secondary,
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
});

export default ScreenshotCompare;
