import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import {
  buildToolkitAuthorizationMessage,
  getToolkitAuthorizationContext,
} from '@/[fsd]/features/chat/lib/helpers/mcpAuthorization.helpers';
import {
  McpAuthHelpers,
  McpAuthModal,
  extractMcpAuthMetadata,
  useMcpTokenChange,
} from '@/[fsd]/features/mcp';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import ArrowForwardIcon from '@/assets/icons/arrow-forward.svg?react';

import ToolkitActionPanel from './ToolkitActionPanel';

const ChatContinue = memo(props => {
  const {
    onContinue,
    onAuthSuccess,
    disabled,
    message,
    authRequiredAction,
    continueLabel = 'Continue',
    title = '⚠️ Toolkit Authorization Required',
    authorizationText,
    hideContinue = false,
    detailsExpanded = false,
  } = props;
  const styles = getStyles();
  const projectId = useSelectedProjectId();
  const { toastSuccess } = useToast();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const automaticResumeRef = useRef({ actionId: null, attempted: false, resumed: false });

  const mcpAuthMetadata = useMemo(
    () => (authRequiredAction ? extractMcpAuthMetadata(authRequiredAction) : null),
    [authRequiredAction],
  );
  const authorizationContext = useMemo(
    () => (authRequiredAction ? getToolkitAuthorizationContext(authRequiredAction) : null),
    [authRequiredAction],
  );
  const authorizationMessage = useMemo(
    () => buildToolkitAuthorizationMessage(authorizationContext, message),
    [authorizationContext, message],
  );
  const serverUrl =
    authRequiredAction?.toolOutputs?.server_url || authRequiredAction?.toolMeta?.server_url || '';
  const tokenStorageKey = serverUrl;
  const { isLoggedIn: hasTargetToken } = useMcpTokenChange({ serverUrl });

  useEffect(() => {
    if (!authRequiredAction || disabled || showAuthModal || !mcpAuthMetadata) return;
    const actionId = authRequiredAction.authorizationRequestId || authRequiredAction.id;
    const isFirstCheck = automaticResumeRef.current.actionId !== actionId;
    if (isFirstCheck) {
      automaticResumeRef.current = { actionId, attempted: false, resumed: false };
    }
    if (automaticResumeRef.current.resumed) return;

    // A later token event means this endpoint was authenticated by another
    // same-user tab. Resume without repeating the family lookup.
    if (!isFirstCheck && hasTargetToken) {
      automaticResumeRef.current.resumed = true;
      onAuthSuccess?.(authRequiredAction);
      return;
    }
    if (automaticResumeRef.current.attempted) return;
    automaticResumeRef.current.attempted = true;

    const reused = McpAuthHelpers.reuseAuthFamilyToken({
      serverUrl,
      tokenStorageKey,
      authorizationServers: mcpAuthMetadata.authServers,
      resourceScopes: mcpAuthMetadata.resourceScopes,
      // On the first check an existing endpoint token was part of the failed
      // request and must be marked rejected. A later token-change event means
      // another family member has just supplied a fresh token for this endpoint.
      rejectCurrentToken: isFirstCheck,
    });

    if (reused) {
      automaticResumeRef.current.resumed = true;
      onAuthSuccess?.(authRequiredAction);
    }
  }, [
    authRequiredAction,
    disabled,
    showAuthModal,
    mcpAuthMetadata,
    serverUrl,
    tokenStorageKey,
    hasTargetToken,
    onAuthSuccess,
  ]);
  const detailRows = useMemo(() => {
    if (!authorizationContext) return [];
    const {
      serverUrl: contextServerUrl,
      resourceMetadataUrl,
      authorizationServers,
      scopes,
    } = authorizationContext;
    return [
      ['Toolkit server', contextServerUrl],
      ['Resource metadata', resourceMetadataUrl],
      ['Authorization server', authorizationServers.join(', ')],
      ['Scopes', scopes.join(', ')],
    ].filter(([, value]) => value);
  }, [authorizationContext]);

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
        onAuthSuccess?.(authRequiredAction);
      }
    },
    [toastSuccess, onAuthSuccess, authRequiredAction],
  );

  const handleCancelModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  if (authRequiredAction) {
    return (
      <>
        <ToolkitActionPanel
          data-testid="toolkit-authorization-panel"
          data-authorization-request-id={authRequiredAction.authorizationRequestId || undefined}
          title={title}
          message={authorizationText || authorizationMessage}
          detailRows={detailRows}
          defaultExpanded={detailsExpanded}
        >
          <BaseBtn
            data-testid="toolkit-authorization-authorize-button"
            variant="positive"
            sx={styles.button}
            startIcon={<CheckedIcon />}
            onClick={handleAuthorize}
            disabled={disabled}
          >
            Authorize
          </BaseBtn>
          {!hideContinue && (
            <BaseBtn
              data-testid="toolkit-authorization-skip-button"
              variant="neutral"
              sx={styles.button}
              onClick={onContinue}
              disabled={disabled}
              startIcon={<ArrowForwardIcon />}
            >
              {continueLabel}
            </BaseBtn>
          )}
        </ToolkitActionPanel>
        {showAuthModal && mcpAuthMetadata && (
          <McpAuthModal
            open={showAuthModal}
            serverUrl={authRequiredAction.toolMeta?.server_url}
            tokenStorageKey={authRequiredAction.toolOutputs?.server_url}
            mcpAuthMetadata={mcpAuthMetadata}
            projectId={projectId}
            toolkitId={mcpAuthMetadata?.toolkitId}
            toolkitType={authRequiredAction.toolMeta?.toolkit_type}
            title={`Toolkit Authorization — ${authorizationContext?.toolkitName || 'Toolkit'}`}
            onClose={handleCloseModal}
            onCancel={handleCancelModal}
          />
        )}
      </>
    );
  }

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
    backgroundColor: palette.components.chatContinue.background,
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
