import { useState } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import TabGroupButton, { colorTabGroupButtonStyle } from '@/[fsd]/shared/ui/tab-group-button/TabGroupButton';
import GearIcon from '@/assets/gear-icon.svg?react';
import MoonIcon from '@/assets/moon-icon.svg?react';
import SunIcon from '@/assets/sun-icon.svg?react';

const STATE_OVERRIDE = {
  DEFAULT: 'default',
  HOVER: 'hover',
  ACTIVE: 'active',
  DISABLED: 'disabled',
};

const handleEmptyOnChange = () => {};

export default {
  title: 'shared/ui/TabGroupButton',
  component: TabGroupButton,
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
    disabled: { control: 'boolean' },
    onChange: { action: 'changed' },
  },
  parameters: {
    layout: 'padded',
  },
};

const twoButtonsIcons = [
  {
    value: 'moon',
    icon: <MoonIcon />,
    tooltip: 'Moon',
  },
  {
    value: 'sun',
    icon: <SunIcon />,
    tooltip: 'Sun',
  },
];

const threeButtonsIcons = [
  {
    value: 'moon',
    icon: <MoonIcon />,
    tooltip: 'Moon',
  },
  {
    value: 'sun',
    icon: <SunIcon />,
    tooltip: 'Sun',
  },
  {
    value: 'gear',
    icon: <GearIcon />,
    tooltip: 'Settings',
  },
];

const twoButtonsLabels = [
  {
    value: 'alita',
    label: 'Alita',
    tooltip: 'Alita',
  },
  {
    value: 'codemie',
    label: 'Codemie',
    tooltip: 'Codemie',
  },
];

const threeButtonsLabels = [
  {
    value: 'alita',
    label: 'Alita',
    tooltip: 'Alita',
  },
  {
    value: 'codemie',
    label: 'Codemie',
    tooltip: 'Codemie',
  },
  {
    value: 'studio',
    label: 'Studio',
    tooltip: 'Studio',
  },
];

const Template = args => {
  const [value, setValue] = useState(args.defaultValue || args.arrayBtn?.[0]?.value);

  const handleChange = (event, newValue) => {
    if (newValue !== null) {
      setValue(newValue);
      args.onChange?.(event, newValue);
    }
  };

  return (
    <TabGroupButton
      {...args}
      value={value}
      onChange={handleChange}
    />
  );
};

export const TwoButtonsIconsOnly = Template.bind({});
TwoButtonsIconsOnly.args = {
  arrayBtn: twoButtonsIcons,
};

export const ThreeButtonsIconsOnly = Template.bind({});
ThreeButtonsIconsOnly.args = {
  arrayBtn: threeButtonsIcons,
};

export const TwoButtonsLabelsOnly = Template.bind({});
TwoButtonsLabelsOnly.args = {
  arrayBtn: twoButtonsLabels,
};

export const ThreeButtonsLabelsOnly = Template.bind({});
ThreeButtonsLabelsOnly.args = {
  arrayBtn: threeButtonsLabels,
};

const StaticTabGroup = ({ arrayBtn, stateOverride, size = 'small' }) => {
  const theme = useTheme();
  const colors = colorTabGroupButtonStyle(theme).alita;

  const getStateStyles = () => {
    const stateStyleMap = {
      [STATE_OVERRIDE.DISABLED]: {
        color: colors.disabled.color,
        fill: colors.disabled.fill,
        backgroundColor: colors.disabled.background,
        pointerEvents: 'none',
        '& svg': {
          fill: colors.disabled.fill,
        },
      },
      [STATE_OVERRIDE.HOVER]: {
        color: colors.hover.color,
        fill: colors.hover.fill,
        backgroundColor: colors.hover.background,
        '& svg': {
          fill: colors.hover.fill,
        },
      },
      [STATE_OVERRIDE.ACTIVE]: {
        color: colors.active.color,
        fill: colors.active.fill,
        backgroundColor: colors.active.background,
        '& svg': {
          fill: colors.active.fill,
        },
      },
      [STATE_OVERRIDE.DEFAULT]: {},
    };

    return stateStyleMap[stateOverride] || {};
  };

  const getSelectedValue = () => {
    const statesWithoutSelection = [STATE_OVERRIDE.DEFAULT, STATE_OVERRIDE.HOVER, STATE_OVERRIDE.ACTIVE];

    if (statesWithoutSelection.includes(stateOverride)) {
      return null;
    }

    if (stateOverride === STATE_OVERRIDE.DISABLED) {
      return arrayBtn[0]?.value;
    }

    return null;
  };

  const isDisabled = stateOverride === STATE_OVERRIDE.DISABLED;

  return (
    <TabGroupButton
      arrayBtn={arrayBtn}
      size={size}
      value={getSelectedValue()}
      disabled={isDisabled}
      customSx={getStateStyles()}
      onChange={handleEmptyOnChange}
    />
  );
};

const TabGroupStatesRow = ({ title, arrayBtn, size = 'small' }) => {
  const states = [
    STATE_OVERRIDE.DEFAULT,
    STATE_OVERRIDE.HOVER,
    STATE_OVERRIDE.ACTIVE,
    STATE_OVERRIDE.DISABLED,
  ];

  return (
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

      {states.map(state => (
        <Box
          key={state}
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <StaticTabGroup
            arrayBtn={arrayBtn}
            stateOverride={state}
            size={size}
          />
        </Box>
      ))}
    </>
  );
};

const variantsConfig = [
  {
    title: '2 Buttons (Icons)',
    arrayBtn: twoButtonsIcons,
  },
  {
    title: '3 Buttons (Icons)',
    arrayBtn: threeButtonsIcons,
  },
  {
    title: '2 Buttons (Labels)',
    arrayBtn: twoButtonsLabels,
  },
  {
    title: '3 Buttons (Labels)',
    arrayBtn: threeButtonsLabels,
  },
];

export const AllTabGroupButtons = args => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr repeat(4, 1fr)',
          gap: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography variant="subtitle2">TAB GROUP</Typography>
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center' }}
        >
          Default
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center' }}
        >
          Hover
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center' }}
        >
          Active
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center' }}
        >
          Disabled
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr repeat(4, 1fr)',
          gap: '1rem',
          rowGap: '2rem',
        }}
      >
        {variantsConfig.map((variant, index) => (
          <TabGroupStatesRow
            key={`${variant.title}-${index}`}
            title={variant.title}
            arrayBtn={variant.arrayBtn}
            size={args.size}
          />
        ))}
      </Box>
    </Box>
  );
};
