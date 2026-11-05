import { memo, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { TRIGGER_KIND, getListRoute } from '@/[fsd]/entities/schedule';
import { ScheduleRowActions, useScheduleRowActions } from '@/[fsd]/features/schedule';

// The Edit webhook page header menu: rotate, change owner and delete; the form itself is the edit
const WebhookDetailMenu = memo(props => {
  const { webhook } = props;
  const navigate = useNavigate();
  const actions = useScheduleRowActions(webhook);
  const { onDelete } = actions;

  const onDeleteAndLeave = useCallback(async () => {
    // A failed delete keeps the page: the webhook is still there
    if (await onDelete()) navigate(getListRoute(TRIGGER_KIND.webhook), { replace: true });
  }, [onDelete, navigate]);

  return (
    <ScheduleRowActions
      row={webhook}
      hideEdit
      hideToggle
      {...actions}
      onDelete={onDeleteAndLeave}
    />
  );
});

WebhookDetailMenu.displayName = 'WebhookDetailMenu';

export default WebhookDetailMenu;
