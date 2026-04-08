import { Box, Typography, useTheme } from '@mui/material';

import { Input } from '@/[fsd]/shared/ui';
import { INPUT_VARIANTS, eliteaTextFieldColorStyle } from '@/[fsd]/shared/ui/input/textFieldVariants';

export default {
  title: 'shared/ui/InputBase',
  component: Input.InputBase,
  parameters: {
    layout: 'padded',
  },
};

export const Simple = () => (
  <Box sx={{ maxWidth: 400 }}>
    <Input.InputBase
      label="Label"
      tooltipDescription="Optional info"
      value=""
      hasActionsToolBar={false}
      placeholder="Enter value..."
    />
    <Input.InputBase
      label="Label"
      required
      tooltipDescription="Optional info"
      value=""
      hasActionsToolBar={false}
      placeholder="Enter value..."
    />
    <Input.InputBase
      label="Label"
      value=""
      hasActionsToolBar={false}
      placeholder="Enter value..."
    />
    <Input.InputBase
      required
      label="Label"
      value=""
      error
      helperText="Error message"
      hasActionsToolBar={false}
      placeholder="Enter value..."
    />
  </Box>
);

const COLUMN_HEADERS = [
  'Default',
  'Hover',
  'Active / Filled',
  'Filled (Inactive)',
  'Hover on Filled',
  'Disabled (Default)',
  'Disabled (Filled)',
  'Error (Default)',
  'Error (Filled)',
];

const MIN_COLUMN_WIDTH = 200;
const ROW_LABEL_WIDTH = 120;
const GRID_MIN_WIDTH = ROW_LABEL_WIDTH + COLUMN_HEADERS.length * MIN_COLUMN_WIDTH;

const buildSimpleColumns = () => [
  { key: 'default', value: '', forceState: 'default' },
  { key: 'hover', value: '', forceState: 'hover' },
  { key: 'activeFilled', value: '[content]', forceState: 'active' },
  { key: 'filledInactive', value: '[content]', forceState: 'default' },
  { key: 'hoverFilled', value: '[content]', forceState: 'hover' },
  { key: 'disabledDefault', value: '', disabled: true, forceState: 'disabled' },
  { key: 'disabledFilled', value: '[content]', disabled: true, forceState: 'disabled' },
  { key: 'errorDefault', value: '', error: true, helperText: 'Error message' },
  { key: 'errorFilled', value: '[content]', error: true, helperText: 'Error message' },
];

const buildExpandableColumns = () => [
  { key: 'default', value: '', forceState: 'default' },
  {
    key: 'hover',
    value: '',
    forceState: 'hover',
    hasActionsToolBar: true,
    showCopyAction: false,
    showExpandAction: false,
    showFullScreenAction: true,
    forceShowActionsToolbar: true,
  },
  { key: 'activeFilled', value: '[content]', forceState: 'active' },
  { key: 'filledInactive', value: '[content]', forceState: 'default' },
  {
    key: 'hoverFilled',
    value: '[content]',
    forceState: 'hover',
    hasActionsToolBar: true,
    forceShowActionsToolbar: true,
  },
  { key: 'disabledDefault', value: '', disabled: true, forceState: 'disabled' },
  { key: 'disabledFilled', value: '[content]', disabled: true, forceState: 'disabled' },
  { key: 'errorDefault', value: '', error: true, helperText: 'Error message' },
  { key: 'errorFilled', value: '[content]', error: true, helperText: 'Error message' },
];

const INPUT_STATES_ROWS = [
  {
    id: 'simple',
    label: 'Simple',
    columns: buildSimpleColumns(),
    rowProps: {
      label: 'Label',
      tooltipDescription: 'Optional info',
    },
  },
  {
    id: 'expandable',
    label: 'Expandable',
    columns: buildExpandableColumns(),
    rowProps: {
      label: 'Label',
    },
  },
  {
    id: 'simple-no-label',
    label: 'Without label',
    columns: buildSimpleColumns(),
    rowProps: {
      tooltipDescription: 'Optional info',
      placeholder: 'Field hint',
    },
  },
  {
    id: 'expandable-no-label',
    label: 'Without label + Expandable',
    columns: buildExpandableColumns(),
    rowProps: {
      placeholder: 'Field hint',
    },
  },
];

const getForceStateSx = (forceState, theme) => {
  if (!forceState) return {};
  const colors = eliteaTextFieldColorStyle(theme)[INPUT_VARIANTS.standard];
  if (!colors) return {};

  switch (forceState) {
    case 'default':
      return {
        '& label': { color: colors.default.label.color },
        '& :not(.Mui-error).MuiInput-underline:before': {
          borderBottomColor: colors.default.underline.color,
        },
      };
    case 'hover':
      return {
        '& :not(.Mui-error).MuiInput-underline:before': {
          borderBottomColor: colors.hover.underline.color,
        },
      };
    case 'active':
      return {
        '& label': { color: colors.active.label.color },
        '& :not(.Mui-error).MuiInput-underline:before': {
          borderBottomColor: colors.default.underline.color,
        },
        '& :not(.Mui-error).MuiInput-underline:after': {
          borderBottomColor: colors.active.underline.color,
          transform: 'scaleX(1)',
          borderBottomWidth: '1px',
        },
      };
    case 'disabled':
      return {
        '& label': { color: colors.disabled.label.color },
        '& input': { color: colors.disabled.input.color },
        '& textarea': { color: colors.disabled.textarea.color },
      };
    default:
      return {};
  }
};

const InputCell = ({ columnConfig, rowProps }) => {
  const theme = useTheme();
  const {
    value,
    disabled = false,
    error = false,
    helperText,
    forceState,
    hasActionsToolBar = false,
    showCopyAction,
    showExpandAction,
    showFullScreenAction,
    forceShowActionsToolbar,
  } = columnConfig;
  const { label, tooltipDescription, placeholder } = rowProps || {};

  const forceStateSx = getForceStateSx(forceState, theme);

  const toolbarProps = {};
  if (hasActionsToolBar) {
    toolbarProps.hasActionsToolBar = true;
    if (showCopyAction !== undefined) toolbarProps.showCopyAction = showCopyAction;
    if (showExpandAction !== undefined) toolbarProps.showExpandAction = showExpandAction;
    if (showFullScreenAction !== undefined) toolbarProps.showFullScreenAction = showFullScreenAction;
    if (forceShowActionsToolbar !== undefined) toolbarProps.forceShowActionsToolbar = forceShowActionsToolbar;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        minWidth: MIN_COLUMN_WIDTH,
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Input.InputBase
          label={label}
          tooltipDescription={tooltipDescription}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          error={error}
          helperText={helperText}
          hasActionsToolBar={hasActionsToolBar}
          {...toolbarProps}
          sx={forceStateSx}
        />
      </Box>
    </Box>
  );
};

const StatesRow = ({ rowConfig }) => {
  const { label: rowLabel, columns, rowProps } = rowConfig;
  return (
    <>
      <Typography
        variant="body2"
        sx={{
          alignSelf: 'center',
          justifySelf: 'start',
        }}
      >
        {rowLabel}
      </Typography>
      {columns.map(col => (
        <InputCell
          key={col.key}
          columnConfig={col}
          rowProps={rowProps}
        />
      ))}
    </>
  );
};

export const AllStates = () => (
  <Box sx={{ overflowX: 'auto', width: '100%' }}>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `${ROW_LABEL_WIDTH}px repeat(${COLUMN_HEADERS.length}, minmax(${MIN_COLUMN_WIDTH}px, 1fr))`,
        gap: '1rem',
        minWidth: GRID_MIN_WIDTH,
      }}
    >
      <Typography variant="subtitle2">TEXT INPUT</Typography>
      {COLUMN_HEADERS.map(header => (
        <Typography
          key={header}
          variant="subtitle2"
          sx={{ textAlign: 'center' }}
        >
          {header}
        </Typography>
      ))}
    </Box>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `${ROW_LABEL_WIDTH}px repeat(${COLUMN_HEADERS.length}, minmax(${MIN_COLUMN_WIDTH}px, 1fr))`,
        gap: '1rem',
        minWidth: GRID_MIN_WIDTH,
        rowGap: '2rem',
      }}
    >
      {INPUT_STATES_ROWS.map(row => (
        <StatesRow
          key={row.id}
          rowConfig={row}
        />
      ))}
    </Box>
  </Box>
);
