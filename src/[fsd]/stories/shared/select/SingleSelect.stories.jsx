import { useState } from 'react';

import { Box, Typography } from '@mui/material';

import { Select } from '@/[fsd]/shared/ui';

export default {
  title: 'shared/ui/Select',
  component: Select.SingleSelect,
  parameters: {
    layout: 'padded',
  },
};

const FILLED_VALUE = 'filled';

const DEMO_OPTIONS = [
  { label: '[content]', value: FILLED_VALUE },
  { label: '[content +1]', value: 'filled-1' },
  { label: '[content +2]', value: 'filled-2' },
];

const MULTI_DEMO_OPTIONS = [
  { label: 'Tag 1', value: 'tag-1' },
  { label: 'Tag 2', value: 'tag-2' },
  { label: 'Tag 3', value: 'tag-3' },
  { label: 'Tag 4', value: 'tag-4' },
  { label: 'Tag 5', value: 'tag-5' },
];

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

const buildSimpleColumns = () => [
  { key: 'default', value: '' },
  { key: 'hover', value: '' },
  {
    key: 'activeFilled',
    value: '',
  },
  { key: 'filledInactive', value: FILLED_VALUE },
  { key: 'hoverFilled', value: FILLED_VALUE },
  { key: 'disabledDefault', value: '', disabled: true },
  { key: 'disabledFilled', value: FILLED_VALUE, disabled: true },
  { key: 'errorDefault', value: '', error: true, helperText: 'Error message' },
  { key: 'errorFilled', value: FILLED_VALUE, error: true, helperText: 'Error message' },
];

const buildFilteringColumns = () => [
  { key: 'default', value: FILLED_VALUE },
  { key: 'hover', value: FILLED_VALUE },
  { key: 'activeFilled', value: FILLED_VALUE },
  { key: 'filledInactive', value: FILLED_VALUE },
  { key: 'hoverFilled', value: FILLED_VALUE },
  { key: 'disabledDefault', value: FILLED_VALUE, disabled: true },
];

const buildMultipleColumns = () => [
  { key: 'default', value: [] },
  { key: 'hover', value: [] },
  { key: 'activeFilled', value: [] },
  { key: 'filledInactive', value: ['tag-1', 'tag-4'] },
  { key: 'hoverFilled', value: ['tag-1', 'tag-4'] },
  { key: 'disabledDefault', value: [], disabled: true },
  { key: 'disabledFilled', value: ['tag-1', 'tag-4'], disabled: true },
];

const INPUT_STATES_ROWS = [
  {
    id: 'simple',
    label: 'Simple',
    columns: buildSimpleColumns(),
    rowProps: {
      label: 'Label',
      options: DEMO_OPTIONS,
    },
  },
  {
    id: 'multiple',
    label: 'Multi-select with chips',
    columns: buildMultipleColumns(),
    rowProps: {
      label: 'Tags',
      options: MULTI_DEMO_OPTIONS,
      multiple: true,
    },
  },
  {
    id: 'withoutUnderline',
    label: 'Filtering select',
    columns: buildFilteringColumns(),
    rowProps: {
      options: DEMO_OPTIONS,
      showBorder: false,
    },
  },
];

const MIN_COLUMN_WIDTH = 200;
const ROW_LABEL_WIDTH = 120;
const GRID_MIN_WIDTH = ROW_LABEL_WIDTH + COLUMN_HEADERS.length * MIN_COLUMN_WIDTH;

const SelectCell = ({ column, rowProps, rowId }) => {
  const { value, disabled = false, error = false, helperText } = column;
  const { label, options = DEMO_OPTIONS, ...restRowProps } = rowProps;
  const [selectedValue, setSelectedValue] = useState(value);

  const inputId = `allstates-ss-${rowId}-${column.key}`;

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
        <Select.SingleSelect
          id={inputId}
          label={label}
          value={selectedValue}
          disabled={disabled}
          error={error}
          helperText={helperText}
          showBorder
          onValueChange={setSelectedValue}
          options={options}
          {...restRowProps}
        />
      </Box>
    </Box>
  );
};

const StatesRow = ({ row }) => {
  const { label: rowLabel, columns, rowProps, id: rowId } = row;
  const emptyCount = COLUMN_HEADERS.length - columns.length;
  return (
    <>
      <Typography
        variant="body2"
        sx={{ alignSelf: 'center', justifySelf: 'start' }}
      >
        {rowLabel}
      </Typography>
      {columns.map(column => (
        <SelectCell
          key={column.key}
          column={column}
          rowProps={rowProps}
          rowId={rowId}
        />
      ))}
      {Array.from({ length: emptyCount }).map((_, i) => (
        <Box key={`empty-${i}`} />
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
      <Typography
        variant="subtitle2"
        gutterBottom
      >
        SELECT
      </Typography>
      {COLUMN_HEADERS.map(header => (
        <Typography
          key={header}
          variant="subtitle2"
          gutterBottom
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
          row={row}
        />
      ))}
    </Box>
  </Box>
);
