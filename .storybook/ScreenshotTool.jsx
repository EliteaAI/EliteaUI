import React, { memo, useCallback } from 'react';

import { Select } from 'storybook/internal/components';
import { useGlobals, useStorybookState } from 'storybook/manager-api';

import { PhotoIcon } from '@storybook/icons';

import { SCREENSHOT_MODES, SCREENSHOT_TAG } from '../src/[fsd]/stories/lib/screenshot.constants';

const OPTIONS = [
  { value: SCREENSHOT_MODES.live, title: 'Live' },
  { value: SCREENSHOT_MODES.side, title: 'Side by side' },
  { value: SCREENSHOT_MODES.baseline, title: 'Baseline only' },
];

// The «Baseline» switch of the toolbar, only on stories that have saved screenshots
const ScreenshotTool = memo(() => {
  const { storyId, index } = useStorybookState();
  const [globals, updateGlobals] = useGlobals();
  const mode = globals.screenshot ?? SCREENSHOT_MODES.live;

  const handleSelect = useCallback(value => updateGlobals({ screenshot: value }), [updateGlobals]);

  if (!index?.[storyId]?.tags?.includes(SCREENSHOT_TAG)) return null;

  return (
    <Select
      key={mode}
      ariaLabel="Baseline"
      icon={<PhotoIcon />}
      options={OPTIONS}
      defaultOptions={mode}
      onSelect={handleSelect}
    />
  );
});

ScreenshotTool.displayName = 'ScreenshotTool';

export default ScreenshotTool;
