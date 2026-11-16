import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { useToast } from '@/[fsd]/shared/lib/hooks';
import { Select } from '@/[fsd]/shared/ui';

const NONE = '__none__';

/**
 * The picker behind both scheduled-evaluation defaults (the project's and an agent's): the
 * offered datasets plus a "None" entry, saved as soon as one is picked.
 */
const DefaultDatasetSelect = memo(props => {
  const { testId, datasets, datasetId, currentName, noneLabel = 'None', isError, disabled, onSave } = props;

  const styles = defaultDatasetSelectStyles();
  const { toastError, toastSuccess } = useToast();

  const options = useMemo(() => {
    const listed = datasets.map(dataset => ({ value: String(dataset.id), label: dataset.name }));
    // A stored default that is no longer offered still has to show, or the picker would read "None"
    if (datasetId != null && !listed.some(option => option.value === String(datasetId))) {
      listed.push({ value: String(datasetId), label: currentName || `Dataset ${datasetId}` });
    }
    return [{ value: NONE, label: noneLabel }, ...listed];
  }, [datasets, datasetId, currentName, noneLabel]);

  const onChange = useCallback(
    async event => {
      const picked = event.target.value;
      try {
        await onSave(picked === NONE ? null : +picked);
        toastSuccess('Saved');
      } catch (error) {
        toastError(error?.data?.error || 'Unable to update the default evaluation dataset');
      }
    },
    [onSave, toastError, toastSuccess],
  );

  return (
    <Box sx={styles.root}>
      <Select.SingleSelect
        data-testid={testId}
        options={options}
        value={datasetId != null ? String(datasetId) : NONE}
        onChange={onChange}
        // A failed read must not pass for a stored "None" the user could overwrite.
        disabled={disabled || isError}
      />
      {isError && (
        <Typography
          variant="bodySmall"
          color="text.error"
          data-testid={`${testId}-error`}
        >
          Unable to load the default dataset.
        </Typography>
      )}
    </Box>
  );
});

DefaultDatasetSelect.displayName = 'DefaultDatasetSelect';

/** @type {MuiSx} */
const defaultDatasetSelectStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
});

export default DefaultDatasetSelect;
