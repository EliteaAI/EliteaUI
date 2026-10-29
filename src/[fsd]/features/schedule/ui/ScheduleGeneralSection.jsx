import { memo } from 'react';

import StyledInputEnhancer from '@/[fsd]/shared/ui/input/StyledInputEnhancer';
import { MAX_DESCRIPTION_LENGTH } from '@/common/constants';

const ownerName = owner => owner?.name || owner?.email || '-';

const ScheduleGeneralSection = memo(
  ({ showOwner, owner, name, description, nameError, descriptionError, setFieldValue }) => (
    <>
      {showOwner && (
        <StyledInputEnhancer
          disabled
          label="Owner"
          value={ownerName(owner)}
        />
      )}
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
    </>
  ),
);

ScheduleGeneralSection.displayName = 'ScheduleGeneralSection';

export default ScheduleGeneralSection;
