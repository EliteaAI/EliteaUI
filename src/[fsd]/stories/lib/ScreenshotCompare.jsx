import { memo, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { Select } from '@/[fsd]/shared/ui';

import { SCREENSHOT_MODES, SCREENSHOT_SIZE } from './screenshot.constants';
import { getBaselineVersions } from './screenshot.helpers';
import { useFitScale } from './useFitScale.hooks';

const GAP_PX = 16;
const LABEL_PX = 40;
const SELECT_MAX_WIDTH_PX = 400;
const LIVE = 'live';
const LIVE_OPTION = { value: LIVE, label: 'Live' };
const rem = px => `${px / 16}rem`;

// The same story in its own frame of the screenshot's size, so a page that fills the window (100vh) lays out as it
// did for the screenshot, whatever the size of the Storybook pane
const getLiveUrl = (storyId, theme) =>
  `iframe.html?id=${storyId}&viewMode=story&globals=screenshot:${SCREENSHOT_MODES.live};backgrounds.value:${theme}`;

// The story next to its saved screenshot; the mode comes from the toolbar's «Baseline» switch. Each pane picks a version
// of the screenshot (the left one also the live story), so two versions can be compared as well
const ScreenshotCompare = memo(props => {
  const { Story, storyId, mode = SCREENSHOT_MODES.live, theme } = props;

  const versions = useMemo(() => getBaselineVersions(storyId, theme), [storyId, theme]);
  const [leftValue, setLeftValue] = useState(LIVE);
  const [rightValue, setRightValue] = useState(() => versions[0]?.value);
  const leftOptions = useMemo(() => [LIVE_OPTION, ...versions], [versions]);
  const leftVersion = versions.find(version => version.value === leftValue);
  const rightVersion = versions.find(version => version.value === rightValue) ?? versions[0];
  const isSideBySide = mode === SCREENSHOT_MODES.side;
  const scale = useFitScale(SCREENSHOT_SIZE, isSideBySide ? 2 : 1, GAP_PX, LABEL_PX);

  const styles = screenshotCompareStyles(scale);
  const menuProps = useMemo(() => ({ slotProps: { paper: { sx: styles.menu } } }), [styles.menu]);

  if (mode === SCREENSHOT_MODES.live) return <Story />;

  if (!versions.length) {
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
          <Select.SingleSelect
            value={leftVersion ? leftValue : LIVE}
            options={leftOptions}
            onValueChange={setLeftValue}
            maxDisplayValueLength="100%"
            customMenuProps={menuProps}
            sx={styles.select}
          />
          {leftVersion ? (
            <Box
              component="img"
              src={leftVersion.url}
              alt={leftVersion.label}
              sx={styles.viewport}
            />
          ) : (
            <Box sx={styles.viewport}>
              <Box
                component="iframe"
                title="Live"
                src={getLiveUrl(storyId, theme)}
                sx={styles.liveFrame}
              />
            </Box>
          )}
        </Box>
      )}
      <Box sx={styles.pane}>
        <Select.SingleSelect
          value={rightVersion.value}
          options={versions}
          onValueChange={setRightValue}
          maxDisplayValueLength="100%"
          customMenuProps={menuProps}
          sx={styles.select}
        />
        <Box
          component="img"
          src={rightVersion.url}
          alt={rightVersion.label}
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
  select: {
    height: rem(LABEL_PX - GAP_PX / 2),
    width: rem(SCREENSHOT_SIZE.width * scale),
    maxWidth: rem(SELECT_MAX_WIDTH_PX),
    margin: 0,
    // The value's wrapper must shrink, or a long commit subject is cut without the ellipsis
    '& .MuiSelect-select > .MuiBox-root': {
      minWidth: 0,
      maxWidth: '100%',
    },
  },
  // Long names end with an ellipsis, the whole one shows on hover
  menu: {
    maxWidth: rem(SELECT_MAX_WIDTH_PX),
  },
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
