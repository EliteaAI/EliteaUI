import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import StyledInputEnhancer from '@/[fsd]/shared/ui/input/StyledInputEnhancer';
import { MAX_DESCRIPTION_LENGTH } from '@/common/constants';

const ownerName = owner => owner?.name || owner?.email || '-';

const ScheduleGeneralSection = memo(
  ({ showOwner, owner, name, description, nameError, descriptionError, setFieldValue }) => (
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
          variant="bodyMedium"
          color="text.secondary"
          data-testid="schedule-owner"
        >
          {'Owner: '}
          <Box
            component="span"
            sx={styles.ownerName}
          >
            {ownerName(owner)}
          </Box>
        </Typography>
      )}
    </>
  ),
);

ScheduleGeneralSection.displayName = 'ScheduleGeneralSection';

export default ScheduleGeneralSection;

/** @type {MuiSx} */
const styles = {
  ownerName: ({ palette }) => ({ color: palette.text.primary }),
};
