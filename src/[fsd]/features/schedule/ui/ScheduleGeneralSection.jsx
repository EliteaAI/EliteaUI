import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import StyledInputEnhancer from '@/[fsd]/shared/ui/input/StyledInputEnhancer';
import { MAX_DESCRIPTION_LENGTH } from '@/common/constants';

const ownerName = owner => owner?.name || owner?.email || '-';

const ScheduleGeneralSection = memo(props => {
  const { showOwner, owner, name, description, nameError, descriptionError, setFieldValue } = props;

  const styles = scheduleGeneralSectionStyles();

  return (
    <>
      <StyledInputEnhancer
        required
        label="Name"
        value={name}
        onChange={event => setFieldValue('name', event.target.value)}
        error={!!nameError}
        helperText={nameError}
      />
      <StyledInputEnhancer
        multiline
        label="Description"
        value={description}
        onChange={event => setFieldValue('description', event.target.value)}
        inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
        error={!!descriptionError}
        helperText={descriptionError}
      />
      {showOwner && (
        <Typography
          variant="bodySmall"
          color="text.primary"
          data-testid="schedule-owner"
        >
          {'Owner:  '}
          <Box
            component="span"
            sx={styles.ownerName}
          >
            {ownerName(owner)}
          </Box>
        </Typography>
      )}
    </>
  );
});

ScheduleGeneralSection.displayName = 'ScheduleGeneralSection';

/** @type {MuiSx} */
const scheduleGeneralSectionStyles = () => ({
  ownerName: ({ palette }) => ({ color: palette.text.secondary, fontWeight: 600 }),
});

export default ScheduleGeneralSection;
