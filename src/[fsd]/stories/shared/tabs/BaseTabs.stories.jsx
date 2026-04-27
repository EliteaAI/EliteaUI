import { useState } from 'react';

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { Box, Typography } from '@mui/material';

import BaseTab, { alitaTabColors } from '@/[fsd]/shared/ui/tabs/BaseTab';
import BaseTabs, { TABS_VARIANTS } from '@/[fsd]/shared/ui/tabs/BaseTabs';

const handleEmptyOnChange = () => {};

const TAB_STATES = {
  DEFAULT: 'default',
  HOVER: 'hover',
  ACTIVE: 'active',
  DISABLED: 'disabled',
};

const HEADERS = ['Default', 'Hover', 'Active', 'Disabled'];

export default {
  title: 'shared/ui/BaseTabs',
  component: BaseTabs,
  parameters: {
    layout: 'padded',
  },
};

const InteractiveTemplate = () => {
  const [value, setValue] = useState(0);

  return (
    <BaseTabs
      value={value}
      onChange={(_, newValue) => setValue(newValue)}
      aria-label="interactive tabs"
    >
      <BaseTab
        label="Tab"
        icon={<EmojiEventsIcon />}
        iconPosition="start"
      />
      <BaseTab
        label="Tab"
        icon={<EmojiEventsIcon />}
        iconPosition="start"
      />
    </BaseTabs>
  );
};

export const Interactive = InteractiveTemplate.bind({});

const TabBarCell = ({ state }) => {
  const isHover = state === TAB_STATES.HOVER;
  const isActive = state === TAB_STATES.ACTIVE;
  const isDisabled = state === TAB_STATES.DISABLED;

  const firstTabSx = [
    isHover &&
      (theme => {
        const colors = alitaTabColors(theme)[TABS_VARIANTS.alita];
        return {
          color: `${colors.hover} !important`,
          '& .MuiSvgIcon-root': { color: 'inherit' },
        };
      }),
  ].filter(Boolean);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        ...(isHover && { pointerEvents: 'none' }),
      }}
    >
      <BaseTabs
        value={isActive ? 0 : false}
        onChange={handleEmptyOnChange}
        aria-label="tab states"
      >
        <BaseTab
          label="Tab"
          icon={<EmojiEventsIcon />}
          iconPosition="start"
          sx={firstTabSx}
          disabled={isDisabled}
        />
      </BaseTabs>
    </Box>
  );
};

const StatesRow = ({ title }) => (
  <>
    <Typography
      variant="body2"
      sx={{
        alignSelf: 'center',
        justifySelf: 'start',
      }}
    >
      {title}
    </Typography>
    {Object.values(TAB_STATES).map(state => (
      <TabBarCell
        key={state}
        state={state}
      />
    ))}
  </>
);

export const AllStates = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr repeat(4, 1fr)',
        gap: '1rem',
        paddingBottom: '1rem',
      }}
    >
      <Typography variant="subtitle2">Tab</Typography>
      {HEADERS.map(label => (
        <Typography
          key={label}
          variant="subtitle2"
          sx={{ textAlign: 'center' }}
        >
          {label}
        </Typography>
      ))}
    </Box>

    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr repeat(4, 1fr)',
        gap: '1rem',
        rowGap: '2rem',
      }}
    >
      <StatesRow title="Alita" />
    </Box>
  </Box>
);
