import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Button, Typography } from '@mui/material';

import { extractMcpAuthMetadata } from '@/[fsd]/features/mcp/lib/hooks';
import { McpAuthModal } from '@/[fsd]/features/mcp/ui';
import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';
import ArrowForwardIcon from '@/assets/icons/arrow-forward.svg?react';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const ChatContinue = memo(props => {
  const { onContinue, onAuthSuccess, disabled, message, authRequiredAction, tools } = props;
  const styles = getStyles();
  const projectId = useSelectedProjectId();
  const { toastSuccess } = useToast();

  const [showAuthModal, setShowAuthModal] = useState(false);

  const needToShowAuthButton = useMemo(
    () =>
      authRequiredAction &&
      !tools
        ?.filter(tool => tool.type === 'mcp')
        .find(tool => tool.settings?.url && tool.settings.url === authRequiredAction.toolMeta?.server_url),
    [authRequiredAction, tools],
  );

  const mcpAuthMetadata = useMemo(
    () => (authRequiredAction ? extractMcpAuthMetadata(authRequiredAction) : null),
    [authRequiredAction],
  );

  const handleAuthorize = useCallback(() => {
    setShowAuthModal(true);
  }, []);

  const handleCloseModal = useCallback(
    success => {
      setShowAuthModal(false);
      if (success) {
        toastSuccess('Successful authentication!');
        // After successful auth, call onAuthSuccess (not onContinue)
        // onContinue adds server to ignore list, onAuthSuccess does not
        onAuthSuccess?.();
      }
    },
    [toastSuccess, onAuthSuccess],
  );

  const handleCancelModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  return (
    <>
      <Box sx={styles.container}>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
        >
          {message}
        </Typography>
        <Box sx={styles.buttonContainer}>
          {needToShowAuthButton && (
            <Button
              variant="contained"
              sx={styles.button}
              onClick={handleAuthorize}
              disabled={disabled}
            >
              Authorize
            </Button>
          )}
          <BaseBtn
            variant="neutral"
            sx={styles.button}
            onClick={onContinue}
            disabled={disabled}
            startIcon={<ArrowForwardIcon />}
          >
            Continue
          </BaseBtn>
        </Box>
      </Box>
      {needToShowAuthButton && showAuthModal && mcpAuthMetadata && (
        <McpAuthModal
          open={showAuthModal}
          serverUrl={authRequiredAction.toolMeta?.server_url}
          authServers={mcpAuthMetadata.authServers}
          oauthAuthorizationServer={mcpAuthMetadata.oauthAuthorizationServer}
          oauthMetadata={mcpAuthMetadata.oauthMetadata}
          projectId={projectId}
          onClose={handleCloseModal}
          onCancel={handleCancelModal}
        />
      )}
    </>
  );
});

/** @type {MuiSx} */
const getStyles = () => ({
  container: ({ palette }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '0.75rem 1rem 1rem 1rem',
    gap: '0.75rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.chatContinueBackground,
    alignItems: 'flex-start',
  }),
  buttonContainer: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  button: {
    width: 'auto !important',
  },
});

ChatContinue.displayName = 'ChatContinue';

export default ChatContinue;
