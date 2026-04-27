import { useState } from 'react';

import { Box, Typography } from '@mui/material';

import BaseSwitch, { SWITCH_VARIANTS } from '@/[fsd]/shared/ui/switch/BaseSwitch';

const STATE_OVERRIDE = {
  DEFAULT_OFF: 'default_off',
  DEFAULT_ON: 'default_on',
  DISABLED_OFF: 'disabled_off',
  DISABLED_ON: 'disabled_on',
};

const handleEmptyOnChange = () => {};

export default {
  title: 'shared/ui/BaseSwitch',
  component: BaseSwitch,
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'medium'],
    },
    disabled: { control: 'boolean' },
    checked: { control: 'boolean' },
    onChange: { action: 'changed' },
  },
  parameters: {
    layout: 'padded',
  },
};

const Template = args => {
  const [checked, setChecked] = useState(args.checked || false);

  const handleChange = event => {
    setChecked(event.target.checked);
    args.onChange?.(event, event.target.checked);
  };

  return (
    <BaseSwitch
      {...args}
      checked={checked}
      onChange={handleChange}
    />
  );
};

export const Default = Template.bind({});
Default.args = {
  variant: 'elitea',
  checked: false,
  disabled: false,
};

export const WithInfoTooltip = Template.bind({});
WithInfoTooltip.args = {
  variant: 'elitea',
  checked: false,
  disabled: false,
  infoTooltip: 'This is an info tooltip',
};

export const Checked = Template.bind({});
Checked.args = {
  variant: 'elitea',
  checked: true,
  disabled: false,
};

export const Disabled = Template.bind({});
Disabled.args = {
  variant: 'elitea',
  checked: false,
  disabled: true,
};

export const DisabledChecked = Template.bind({});
DisabledChecked.args = {
  variant: 'elitea',
  checked: true,
  disabled: true,
};

const StaticSwitch = ({ stateOverride, size = 'small' }) => {
  const getSwitchProps = () => {
    switch (stateOverride) {
      case STATE_OVERRIDE.DEFAULT_OFF:
        return {
          checked: false,
          disabled: false,
        };
      case STATE_OVERRIDE.DEFAULT_ON:
        return {
          checked: true,
          disabled: false,
        };
      case STATE_OVERRIDE.DISABLED_OFF:
        return {
          checked: false,
          disabled: true,
        };
      case STATE_OVERRIDE.DISABLED_ON:
        return {
          checked: true,
          disabled: true,
        };
      default:
        return {
          checked: false,
          disabled: false,
        };
    }
  };

  return (
    <BaseSwitch
      variant={SWITCH_VARIANTS.elitea}
      size={size}
      {...getSwitchProps()}
      onChange={handleEmptyOnChange}
    />
  );
};

const SwitchStatesRow = ({ title, size = 'small' }) => {
  const states = [
    STATE_OVERRIDE.DEFAULT_OFF,
    STATE_OVERRIDE.DEFAULT_ON,
    STATE_OVERRIDE.DISABLED_OFF,
    STATE_OVERRIDE.DISABLED_ON,
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
          <StaticSwitch
            stateOverride={state}
            size={size}
          />
        </Box>
      ))}
    </>
  );
};

export const AllSwitches = args => {
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
        <Typography variant="subtitle2">SWITCH</Typography>
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center' }}
        >
          Enabled Off
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center' }}
        >
          Enabled On
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center' }}
        >
          Disabled Off
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{ textAlign: 'center' }}
        >
          Disabled On
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
        <SwitchStatesRow
          title="EliteA"
          size={args.size}
        />
      </Box>
    </Box>
  );
};

AllSwitches.args = {
  size: 'small',
};
