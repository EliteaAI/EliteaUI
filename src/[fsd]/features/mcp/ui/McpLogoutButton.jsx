import { memo, useCallback, useState } from 'react';

import { IconButton, Tooltip } from '@mui/material';

import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { McpLogoutModal } from '@/[fsd]/features/mcp/ui';
import LogoutIcon from '@/assets/logout-icon.svg?react';
import useToast from '@/hooks/useToast';

const McpLogoutButton = memo(props => {
  const { serverUrl, onSuccess } = props;
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { toastSuccess } = useToast();

  const onConfirmLogout = useCallback(() => {
    if (serverUrl) {
      McpAuthHelpers.logout(serverUrl);
    }
    setShowLogoutModal(false);
    toastSuccess('You have successfully logged out!');
    onSuccess?.();
  }, [serverUrl, toastSuccess, onSuccess]);

  const onLogout = useCallback(e => {
    // Stop propagation to prevent parent click handlers from triggering
    e.stopPropagation();
    setShowLogoutModal(true);
  }, []);

  const onCloseLogout = useCallback(() => {
    setShowLogoutModal(false);
  }, []);

  // Stop mouse events from bubbling to parent containers (e.g., ClickAwayListener)
  const stopPropagation = useCallback(e => {
    e.stopPropagation();
  }, []);

  return (
    <>
      <Tooltip
        title="Log out"
        placement="top"
      >
        <IconButton
          onClick={onLogout}
          onMouseDown={stopPropagation}
          onMouseEnter={stopPropagation}
          onMouseLeave={stopPropagation}
          variant="elitea"
          color="tertiary"
        >
          <LogoutIcon
            width={16}
            height={16}
          />
        </IconButton>
      </Tooltip>
      <McpLogoutModal
        serverUrl={serverUrl}
        open={showLogoutModal}
        onClose={onCloseLogout}
        onConfirm={onConfirmLogout}
      />
    </>
  );
});

McpLogoutButton.displayName = 'McpLogoutButton';

export default McpLogoutButton;
