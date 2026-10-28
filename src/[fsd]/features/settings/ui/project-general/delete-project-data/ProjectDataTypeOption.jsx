import { memo } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { ProjectDataDeleteConstants } from '@/[fsd]/features/settings/lib/constants';
import { Checkbox } from '@/[fsd]/shared/ui';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';

const { COUNT_UNAVAILABLE } = ProjectDataDeleteConstants;

const ProjectDataTypeOption = memo(props => {
  const { type, summary, isLoading, checked, disabled, onChange } = props;

  const blocked = summary?.blocked || 0;
  const count = isLoading ? '...' : (summary?.count ?? COUNT_UNAVAILABLE);

  const styles = projectDataTypeOptionStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.row}>
        <FormControlLabel
          data-testid={`project-data-type-${type.key}`}
          sx={styles.label}
          control={
            <Checkbox.BaseCheckbox
              checked={checked}
              onChange={onChange}
              disabled={disabled}
            />
          }
          label={
            <Typography variant="bodyMedium">
              {type.label}
              <Typography
                component="span"
                variant="bodySmall"
                color="text.secondary"
                sx={styles.count}
              >
                {count}
              </Typography>
            </Typography>
          }
        />
        {type.tooltip && (
          <InfoTooltip
            infoTooltip={type.tooltip}
            testId={`project-data-type-${type.key}-info`}
          />
        )}
      </Box>
      {!isLoading && blocked > 0 && (
        <Typography
          variant="bodySmall2"
          color="text.secondary"
          sx={styles.blocked}
          data-testid={`project-data-type-${type.key}-blocked`}
        >
          {blocked} published, will be skipped
        </Typography>
      )}
    </Box>
  );
});

ProjectDataTypeOption.displayName = 'ProjectDataTypeOption';

/** @type {MuiSx} */
const projectDataTypeOptionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  label: {
    marginRight: 0,
  },
  count: {
    marginLeft: '0.5rem',
  },
  blocked: {
    paddingLeft: '2rem',
  },
});

export default ProjectDataTypeOption;
