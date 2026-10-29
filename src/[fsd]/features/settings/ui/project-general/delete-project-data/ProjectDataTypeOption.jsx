import { memo } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { ProjectDataDeleteConstants } from '@/[fsd]/features/settings/lib/constants';
import { Checkbox } from '@/[fsd]/shared/ui';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';

const { COUNT_UNAVAILABLE, SKIP_REASON } = ProjectDataDeleteConstants;

const ProjectDataTypeOption = memo(props => {
  const { type, summary, isLoading, checked, disabled, onChange } = props;

  const blocked = summary?.blocked || 0;
  const count = isLoading ? '...' : (summary?.count ?? COUNT_UNAVAILABLE);
  const skipHint =
    !isLoading && blocked > 0 ? `${blocked} ${(type.skipReason || SKIP_REASON.published).text}` : '';
  // The type's own tooltip, followed by how many items will be skipped
  const tooltip = [type.tooltip, skipHint].filter(Boolean).join(' ');

  const styles = projectDataTypeOptionStyles();

  return (
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
      {tooltip && (
        <InfoTooltip
          infoTooltip={tooltip}
          testId={`project-data-type-${type.key}-info`}
        />
      )}
    </Box>
  );
});

ProjectDataTypeOption.displayName = 'ProjectDataTypeOption';

/** @type {MuiSx} */
const projectDataTypeOptionStyles = () => ({
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
});

export default ProjectDataTypeOption;
