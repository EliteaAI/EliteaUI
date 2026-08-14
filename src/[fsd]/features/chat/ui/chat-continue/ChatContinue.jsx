import { memo, useCallback, useId, useMemo, useState } from 'react';

import { Box, Collapse, Typography } from '@mui/material';

import {
  buildToolkitAuthorizationMessage,
  getToolkitAuthorizationContext,
} from '@/[fsd]/features/chat/lib/helpers/mcpAuthorization.helpers';
import { McpAuthModal, extractMcpAuthMetadata } from '@/[fsd]/features/mcp';
import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import ArrowForwardIcon from '@/assets/icons/arrow-forward.svg?react';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

const ChatContinue = memo(props => {
  const {
    onContinue,
    onAuthSuccess,
    disabled,
    message,
    authRequiredAction,
    participantName,
    continueLabel = 'Continue',
  } = props;
  const styles = getStyles();
  const projectId = useSelectedProjectId();
  const { toastSuccess } = useToast();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const detailsId = useId();

  const mcpAuthMetadata = useMemo(
    () => (authRequiredAction ? extractMcpAuthMetadata(authRequiredAction) : null),
    [authRequiredAction],
  );
  const authorizationContext = useMemo(
    () => (authRequiredAction ? getToolkitAuthorizationContext(authRequiredAction, participantName) : null),
    [authRequiredAction, participantName],
  );
  const authorizationMessage = useMemo(
    () => buildToolkitAuthorizationMessage(authorizationContext, message),
    [authorizationContext, message],
  );
  const detailRows = useMemo(() => {
    if (!authorizationContext) return [];
    const { serverUrl, resourceMetadataUrl, authorizationServers, scopes } = authorizationContext;
    return [
      ['Toolkit server', serverUrl],
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
        onAuthSuccess?.();
      }
    },
    [toastSuccess, onAuthSuccess],
  );

  const handleCancelModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  const toggleDetails = useCallback(() => {
    setShowDetails(current => !current);
  }, []);

  if (authRequiredAction) {
    return (
      <>
        <Box
          data-testid="toolkit-authorization-panel"
          data-authorization-request-id={authRequiredAction.authorizationRequestId || undefined}
          sx={styles.authorizationContainer}
        >
          <Typography
            variant="labelMedium"
            sx={styles.authorizationTitle}
          >
            ⚠️ Toolkit Authorization Required
          </Typography>
          <Typography
            variant="labelMedium"
            sx={styles.authorizationMessage}
          >
            {authorizationMessage}
          </Typography>
          {detailRows.length > 0 && (
            <Box sx={styles.detailsWrapper}>
              <Box
                role="button"
                tabIndex={0}
                aria-expanded={showDetails}
                aria-controls={detailsId}
                onClick={toggleDetails}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleDetails();
                  }
                }}
                sx={styles.detailsHeader}
              >
                <Typography
                  variant="labelSmall"
                  sx={styles.detailsHeaderText}
                >
                  Authorization details {showDetails ? '▾' : '▸'}
                </Typography>
              </Box>
              <Collapse
                in={showDetails}
                id={detailsId}
              >
                <Box sx={styles.detailsList}>
                  {detailRows.map(([label, value]) => (
                    <Box
                      key={label}
                      sx={styles.detailsRow}
                    >
                      <Typography
                        variant="labelSmall"
                        sx={styles.detailsLabel}
                      >
                        {label}:
                      </Typography>
                      <Typography
                        variant="labelSmall"
                        sx={styles.detailsValue}
                      >
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Box>
          )}
          <Box sx={styles.buttonContainer}>
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
          </Box>
        </Box>
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
    backgroundColor: palette.background.chatContinueBackground,
    alignItems: 'flex-start',
  }),
  authorizationContainer: ({ palette }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '0.625rem 0.75rem',
    gap: '0.5rem',
    borderRadius: '0.625rem',
    background: palette.background.userInputBackgroundActive,
    border: `0.0625rem solid ${palette.warning.main}`,
    alignItems: 'flex-start',
  }),
  authorizationTitle: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: '1.25rem',
    color: palette.warning.main,
  }),
  authorizationMessage: ({ palette }) => ({
    fontSize: '0.8125rem',
    fontWeight: 400,
    lineHeight: '1.25rem',
    color: palette.text.secondary,
  }),
  detailsWrapper: ({ palette }) => ({
    width: '100%',
    borderRadius: '0.375rem',
    border: `0.0625rem solid ${palette.border?.lines || palette.divider}`,
    overflow: 'hidden',
  }),
  detailsHeader: ({ palette }) => ({
    padding: '0.375rem 0.625rem',
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: palette.action.hover,
  }),
  detailsHeaderText: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 600,
    color: palette.text.secondary,
  }),
  detailsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.5rem 0.625rem',
  },
  detailsRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-start',
  },
  detailsLabel: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 600,
    color: palette.text.secondary,
    flexShrink: 0,
  }),
  detailsValue: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 400,
    color: palette.text.primary,
    overflowWrap: 'anywhere',
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
