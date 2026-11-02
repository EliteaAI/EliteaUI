import { memo, useCallback, useMemo, useState } from 'react';

import { getToolkitAuthorizationContext } from '@/[fsd]/features/chat';
import { McpAuthModal, extractMcpAuthMetadata } from '@/[fsd]/features/mcp';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { BaseBtn } from '@/[fsd]/shared/ui/button';

/**
 * The "Sign in" action of a run that waits for a toolkit sign-in. It opens the same sign-in window as the
 * chat. The sign-in is stored in the browser; the decision call reads it when the owner approves.
 * `authAction` is the toolkit authorization card of the paused message; `primary` makes the button the main action.
 */
const ScheduleRunSignIn = memo(props => {
  const { authAction, primary = false, disabled = false } = props;
  const projectId = useSelectedProjectId();
  const { toastSuccess } = useToast();
  const [open, setOpen] = useState(false);
  const mcpAuthMetadata = useMemo(() => extractMcpAuthMetadata(authAction), [authAction]);
  const authContext = useMemo(() => getToolkitAuthorizationContext(authAction), [authAction]);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleCancel = useCallback(() => setOpen(false), []);
  const handleClose = useCallback(
    success => {
      setOpen(false);
      if (success) toastSuccess('Successful authentication!');
    },
    [toastSuccess],
  );

  return (
    <>
      <BaseBtn
        data-testid="schedule-run-sign-in"
        variant="elitea"
        color={primary ? 'primary' : 'secondary'}
        disabled={disabled || !mcpAuthMetadata}
        onClick={handleOpen}
      >
        Sign in
      </BaseBtn>
      {open && mcpAuthMetadata && (
        <McpAuthModal
          open={open}
          serverUrl={authAction.toolMeta?.server_url}
          tokenStorageKey={authAction.toolOutputs?.server_url}
          mcpAuthMetadata={mcpAuthMetadata}
          projectId={projectId}
          toolkitId={mcpAuthMetadata?.toolkitId}
          toolkitType={authAction.toolMeta?.toolkit_type}
          title={`Toolkit Authorization — ${authContext?.toolkitName || 'Toolkit'}`}
          onClose={handleClose}
          onCancel={handleCancel}
        />
      )}
    </>
  );
});

ScheduleRunSignIn.displayName = 'ScheduleRunSignIn';

export default ScheduleRunSignIn;
