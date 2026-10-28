import { memo } from 'react';

import { Typography } from '@mui/material';

import { UsageConstants } from '@/[fsd]/features/settings/lib/constants';
import { InfoPopover, infoPopoverTextSx } from '@/[fsd]/shared/ui/info-popover';

const UsageInfoPopover = memo(props => {
  const { isPersonalProject } = props;

  return (
    <InfoPopover
      label="About Usage"
      storageKey={UsageConstants.LS_USAGE_INFO_DISMISSED}
      testIdPrefix="usage-info"
    >
      {isPersonalProject && (
        <Typography
          variant="bodyMedium"
          sx={infoPopoverTextSx}
        >
          This is your Private project. Requests made without selecting a &quot;Team&quot; project are charged
          here, including requests made with personal access tokens from external tools such as Claude Code,
          IDE extensions, and scripts.
        </Typography>
      )}
      <Typography
        variant="bodyMedium"
        sx={infoPopoverTextSx}
      >
        Only requests to platform-managed shared models count toward this budget. Usage of models configured
        with your own provider credentials is billed by that provider and is not included here.
      </Typography>
    </InfoPopover>
  );
});

UsageInfoPopover.displayName = 'UsageInfoPopover';

export default UsageInfoPopover;
