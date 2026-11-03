import { memo, useMemo } from 'react';

import { Typography } from '@mui/material';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version';
import { SingleSelect } from '@/[fsd]/shared/ui/select';

// The version of a schedule is a plain form field, not the header switch of the editors
const ScheduleVersionField = memo(props => {
  const { versions = [], value, onChange, disabled = false, error = '' } = props;

  const options = useMemo(
    () =>
      [...versions]
        .sort((a, b) => {
          if (a.name === LATEST_VERSION_NAME) return 1;
          if (b.name === LATEST_VERSION_NAME) return -1;
          return new Date(b.created_at) - new Date(a.created_at);
        })
        .map(({ id, name }) => ({ value: id, label: name })),
    [versions],
  );

  return (
    <>
      <SingleSelect
        data-testid="schedule-version"
        required
        label="Version"
        value={value}
        options={options}
        onValueChange={onChange}
        disabled={disabled}
        error={!!error}
        helperText={error}
        showEmptyPlaceholder={false}
      />
      {disabled && !error && !value && (
        <Typography
          variant="bodySmall"
          color="text.primary"
        >
          Select what to run first to choose a version.
        </Typography>
      )}
    </>
  );
});

ScheduleVersionField.displayName = 'ScheduleVersionField';

export default ScheduleVersionField;
