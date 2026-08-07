import { memo } from 'react';

import { FormControlLabel, Typography } from '@mui/material';

import { LabelWithTooltip } from '@/[fsd]/features/pipelines/flow-editor/ui/settings/InputMappings';
import { Checkbox } from '@/[fsd]/shared/ui';

const BooleanField = memo(props => {
  const { value, onChange, disabled, tooltip } = props;

  return (
    <FormControlLabel
      control={
        <Checkbox.BaseCheckbox
          checked={value === true}
          onChange={onChange}
          disabled={disabled}
          size="large"
        />
      }
      label={<LabelWithTooltip tooltip={<Typography variant="labelSmall">{tooltip}</Typography>} />}
      sx={styles.formControlLabel}
      className="nopan nodrag"
      labelPlacement="start"
    />
  );
});

BooleanField.displayName = 'BooleanField';

/** @type {MuiSx} */
const styles = {
  formControlLabel: {
    marginLeft: 0,
    height: '2.8125rem',
    alignItems: 'center',
  },
};

export default BooleanField;
