import { useState } from 'react';

import { Box, Typography } from '@mui/material';

import BaseCheckbox, {
  CHECKBOX_MODES,
  CHECKBOX_VARIANTS,
  alitaCheckboxColors,
} from '@/[fsd]/shared/ui/checkbox/BaseCheckbox';

const handleEmptyOnChange = () => {};

const CHECKBOX_GRID = [
  [
    { checked: false },
    { checked: false, forceHover: true },
    { checked: true },
    { checked: false, disabled: true },
    { indeterminate: true },
  ],
  [null, { checked: true, forceHover: true }, null, { checked: true, disabled: true }, null],
];

const CHECKBOX_HEADERS = ['default', 'hover', 'active', 'disabled', 'active\nindeterminate'];

const RADIO_GRID = [
  [
    { checked: false },
    { checked: false, forceHover: true },
    { checked: true },
    { checked: false, disabled: true },
  ],
  [null, null, null, { checked: true, disabled: true }],
];

const RADIO_HEADERS = ['default', 'hover', 'active', 'disabled'];

export default {
  title: 'shared/ui/BaseCheckbox',
  component: BaseCheckbox,
  argTypes: {
    mode: {
      control: { type: 'select' },
      options: [CHECKBOX_MODES.checkbox, CHECKBOX_MODES.radio],
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'small', 'medium', 'large', 'xl'],
    },
    onChange: { action: 'changed' },
  },
  parameters: {
    layout: 'padded',
  },
};

const InteractiveCheckbox = args => {
  const [checked, setChecked] = useState(args.checked ?? false);
  return (
    <BaseCheckbox
      {...args}
      checked={checked}
      onChange={() => setChecked(prev => !prev)}
    />
  );
};

export const Checkbox = InteractiveCheckbox.bind({});
Checkbox.args = {
  mode: CHECKBOX_MODES.checkbox,
  variant: CHECKBOX_VARIANTS.alita,
  size: 'small',
  checked: false,
  disabled: false,
  indeterminate: false,
};

const InteractiveRadio = args => {
  const [checked, setChecked] = useState(args.checked ?? false);
  return (
    <BaseCheckbox
      {...args}
      checked={checked}
      onChange={() => setChecked(prev => !prev)}
    />
  );
};

export const Radio = InteractiveRadio.bind({});
Radio.args = {
  mode: CHECKBOX_MODES.radio,
  variant: CHECKBOX_VARIANTS.alita,
  size: 'small',
  checked: false,
  disabled: false,
};

const getHoverSx =
  ({ mode, checked, indeterminate }) =>
  theme => {
    const colors = alitaCheckboxColors(theme);

    if (mode === CHECKBOX_MODES.radio) {
      return { '&&': { color: colors.radio.hover.off } };
    }

    const cbColors = colors.checkbox;
    if (indeterminate) {
      return {
        '&&.MuiCheckbox-indeterminate .MuiSvgIcon-root': {
          color: cbColors.hover.indeterminate,
        },
      };
    }
    if (checked) {
      return {
        '&&.Mui-checked .MuiSvgIcon-root': {
          color: cbColors.hover.on,
        },
      };
    }
    return {
      '&&:not(.Mui-checked):not(.MuiCheckbox-indeterminate) .MuiSvgIcon-root': {
        color: cbColors.hover.off,
      },
    };
  };

const GridCell = ({ mode, cellData, size }) => {
  if (!cellData) return <Box />;

  const { checked = false, disabled = false, indeterminate = false, forceHover = false } = cellData;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <BaseCheckbox
        mode={mode}
        variant={CHECKBOX_VARIANTS.alita}
        size={size}
        checked={checked}
        disabled={disabled}
        indeterminate={mode === CHECKBOX_MODES.checkbox ? indeterminate : undefined}
        onChange={handleEmptyOnChange}
        sx={[{ pointerEvents: 'none' }, forceHover && getHoverSx({ mode, checked, indeterminate })]}
      />
    </Box>
  );
};

const StatesRow = ({ title, grid, mode, size }) => {
  return grid.map((row, rowIdx) => (
    <>
      <Typography
        key={`label-${rowIdx}`}
        variant="body2"
        sx={{
          alignSelf: 'center',
          justifySelf: 'start',
          opacity: rowIdx === 0 ? 1 : 0,
        }}
      >
        {title}
      </Typography>

      {row.map((cellData, colIdx) => (
        <GridCell
          key={`${rowIdx}-${colIdx}`}
          mode={mode}
          cellData={cellData}
          size={size}
        />
      ))}
    </>
  ));
};

export const AllControls = args => {
  const size = args.size || 'medium';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Checkbox */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `1fr repeat(${CHECKBOX_HEADERS.length}, 1fr)`,
          gap: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography variant="subtitle2">CHECKBOX</Typography>
        {CHECKBOX_HEADERS.map(label => (
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
          gridTemplateColumns: `1fr repeat(${CHECKBOX_HEADERS.length}, 1fr)`,
          gap: '1rem',
          rowGap: '0.5rem',
        }}
      >
        <StatesRow
          title="Alita"
          grid={CHECKBOX_GRID}
          mode={CHECKBOX_MODES.checkbox}
          size={size}
        />
      </Box>

      {/* Radio */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `1fr repeat(${RADIO_HEADERS.length}, 1fr)`,
          gap: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography variant="subtitle2">RADIO</Typography>
        {RADIO_HEADERS.map(label => (
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
          gridTemplateColumns: `1fr repeat(${RADIO_HEADERS.length}, 1fr)`,
          gap: '1rem',
          rowGap: '0.5rem',
        }}
      >
        <StatesRow
          title="Alita"
          grid={RADIO_GRID}
          mode={CHECKBOX_MODES.radio}
          size={size}
        />
      </Box>
    </Box>
  );
};

AllControls.args = {
  size: 'medium',
};
