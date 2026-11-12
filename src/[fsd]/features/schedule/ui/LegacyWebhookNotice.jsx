import { memo } from 'react';

import { Link, Typography } from '@mui/material';

import { BannerMessage } from '@/[fsd]/shared/ui/banner-message';

// A stored legacy webhook trigger: no new ones can be made, so the owner is sent to the webhook rows (#7402)
const LegacyWebhookNotice = memo(props => {
  const { onOpenWebhooks, sx } = props;

  return (
    <BannerMessage
      variant="warning"
      containerSx={sx}
    >
      <Typography
        variant="bodySmall"
        data-testid="legacy-webhook-notice"
      >
        This webhook uses a deprecated URL. Create a webhook in Settings → Webhooks (or in this
        pipeline&apos;s{' '}
        {onOpenWebhooks ? (
          <Link
            component="button"
            className="nopan nodrag"
            type="button"
            variant="bodySmall"
            onClick={onOpenWebhooks}
          >
            Webhooks section
          </Link>
        ) : (
          'Webhooks section'
        )}
        ) and switch the sender to the new URL.
      </Typography>
    </BannerMessage>
  );
});

LegacyWebhookNotice.displayName = 'LegacyWebhookNotice';

export default LegacyWebhookNotice;
