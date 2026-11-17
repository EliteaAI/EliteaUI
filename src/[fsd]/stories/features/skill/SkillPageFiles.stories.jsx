import { Suspense, lazy } from 'react';

import { Box } from '@mui/material';

import '@/[fsd]/app/routes';
import { withStoryApi } from '@/[fsd]/stories/lib/storyApi';

import {
  NEAR_LIMIT_MD,
  OVER_LIMIT_MD,
  PDF_FORMS_FILES,
  SKILLS,
  buildRoutes,
  storyState,
} from './skillPageStory.data';

// Lazy so the routes module loads before the layout
const AppLayout = lazy(() => import('@/[fsd]/app/layout/AppLayout'));

const page = () => (
  <Box sx={{ width: '100%' }}>
    <Suspense>
      <AppLayout />
    </Suspense>
  </Box>
);

const withSkill = ({
  skill = SKILLS.pdfForms,
  files = PDF_FORMS_FILES,
  instructions,
  path = '',
  mode = 'dark',
  width = 1366,
}) => [
  withStoryApi({
    routes: buildRoutes({
      skillDetails: instructions
        ? { ...skill, version_details: { ...skill.version_details, instructions } }
        : skill,
      files,
    }),
    // The code editor follows the user's theme setting, not Storybook's: set both
    // The Figma frames show the sidebar open
    state: { ...storyState, settings: { ...storyState.settings, mode, sideBarCollapsed: false } },
    width,
    height: 728,
    path: `/skills/all/${skill.id}${path}`,
  }),
];

const dark = { globals: { theme: 'dark' } };
const light = { globals: { theme: 'light' } };

// Figma "Skills (new) with files" (Alita Project, node 31548:102875): Settings / Files, Instructions, Test on demand
export default {
  title: 'features/skill/Skill Page — Settings and Files',
  parameters: { layout: 'fullscreen' },
  render: page,
};

export const SettingsDark = { ...dark, decorators: withSkill({}) };
export const SettingsLight = { ...light, decorators: withSkill({ mode: 'light' }) };

const FILE = '&file=scripts/check_fields.py';

// Test open beside the instructions (frame "Skill Page_Settings view_open Test")
export const SettingsTestDark = { ...dark, decorators: withSkill({ path: '?panel=test' }) };
export const SettingsTestLight = { ...light, decorators: withSkill({ mode: 'light', path: '?panel=test' }) };

export const FilesDark = { ...dark, decorators: withSkill({ path: `?view=files${FILE}` }) };
export const FilesLight = { ...light, decorators: withSkill({ mode: 'light', path: `?view=files${FILE}` }) };

// The instructions beside the open file (frame "Skill Page_Files view_Open Instructions")
export const FilesInstructionsDark = {
  ...dark,
  decorators: withSkill({ path: `?view=files${FILE}&panel=instructions` }),
};
export const FilesInstructionsLight = {
  ...light,
  decorators: withSkill({ mode: 'light', path: `?view=files${FILE}&panel=instructions` }),
};

// Test beside the open file (frame "Skill Page_Files view_Open Test")
export const FilesTestDark = { ...dark, decorators: withSkill({ path: `?view=files${FILE}&panel=test` }) };
export const FilesTestLight = {
  ...light,
  decorators: withSkill({ mode: 'light', path: `?view=files${FILE}&panel=test` }),
};

export const FilesUnmentionedDark = {
  ...dark,
  decorators: withSkill({ path: '?view=files&file=LICENSE.txt' }),
};

export const FilesBinaryDark = {
  ...dark,
  decorators: withSkill({ path: '?view=files&file=assets/template.pdf' }),
};

export const NoFilesSettingsDark = {
  ...dark,
  decorators: withSkill({ skill: SKILLS.statusReport, files: [] }),
};
export const NoFilesDark = {
  ...dark,
  decorators: withSkill({ skill: SKILLS.statusReport, files: [], path: '?view=files' }),
};
export const NoFilesLight = {
  ...light,
  decorators: withSkill({ mode: 'light', skill: SKILLS.statusReport, files: [], path: '?view=files' }),
};

export const NearLimitDark = { ...dark, decorators: withSkill({ instructions: NEAR_LIMIT_MD }) };
export const OverLimitDark = { ...dark, decorators: withSkill({ instructions: OVER_LIMIT_MD }) };

// A window narrower than 1200 px (dev's useIsSmallWindow): shoot these with the window at 1100 px.
// Settings with Test: the settings over the instructions, Test beside them.
const NARROW = 1100;
export const SettingsTestNarrowDark = {
  ...dark,
  decorators: withSkill({ path: '?panel=test', width: NARROW }),
};
export const SettingsTestNarrowLight = {
  ...light,
  decorators: withSkill({ mode: 'light', path: '?panel=test', width: NARROW }),
};
// Files with a panel: the open file hides, the tree and the panel stay
export const FilesInstructionsNarrowDark = {
  ...dark,
  decorators: withSkill({ path: `?view=files${FILE}&panel=instructions`, width: NARROW }),
};
export const FilesTestNarrowDark = {
  ...dark,
  decorators: withSkill({ path: `?view=files${FILE}&panel=test`, width: NARROW }),
};
