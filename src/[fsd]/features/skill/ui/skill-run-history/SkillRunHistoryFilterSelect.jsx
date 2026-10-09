import { memo, useCallback } from 'react';

import { Box } from '@mui/material';

import { SingleSelect } from '@/[fsd]/shared/ui/select';

const SkillRunHistoryFilterSelect = memo(props => {
  const { testId, label, value, options, onChange } = props;
  const styles = skillRunHistoryFilterSelectStyles();
  const onValueChange = useCallback(next => onChange(next ?? null), [onChange]);
  const onClear = useCallback(() => onChange(null), [onChange]);

  return (
    <Box sx={styles.select}>
      <SingleSelect
        label={label}
        value={value ?? ''}
        options={options}
        onValueChange={onValueChange}
        onClear={value === null || value === undefined ? undefined : onClear}
        inputProps={{ 'data-testid': testId }}
        showBorder
      />
    </Box>
  );
});

SkillRunHistoryFilterSelect.displayName = 'SkillRunHistoryFilterSelect';

/** @type {MuiSx} */
const skillRunHistoryFilterSelectStyles = () => ({
  select: {
    width: '10rem',
  },
});

export default SkillRunHistoryFilterSelect;
