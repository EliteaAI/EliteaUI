import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, IconButton } from '@mui/material';

import { ChatButton } from '@/[fsd]/features/chat/ui';
import { ViewRunHistoryButton } from '@/[fsd]/shared/ui/button';
import { ContextBudgetUI } from '@/[fsd]/widgets/ContextBudget';
import { WELCOME_MESSAGE_ID } from '@/common/constants';
import DoubleLeftIcon from '@/components/Icons/DoubleLeftIcon';
import DoubleRightIcon from '@/components/Icons/DoubleRightIcon';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import { ContentContainer } from '@/pages/Common/index.js';
import ChatBox from '@/pages/NewChat/ChatBox.jsx';
import { useTheme } from '@emotion/react';

/**
 * Creates styles object based on component state
 * @param {Object} params - State parameters for styling
 * @param {boolean} params.isSmallWindow - Whether the window is small
 * @param {boolean} params.collapsed - Whether the chat panel is collapsed
 * @param {string} params.display - Display property for the container
 * @returns {import('@mui/material').SxProps}
 */
const createStyles = ({ isSmallWindow, collapsed, display, activeConversation }) => ({
  chatContainer: {
    minWidth: isSmallWindow ? '100%' : collapsed ? '1.75rem' : '20rem',
    width: isSmallWindow ? '100%' : collapsed ? '1.75rem' : undefined,
    maxWidth: '100%',
    position: 'relative',
    height: '100% !important',
    display: display || 'flex',
    flexDirection: 'row',
    boxSizing: 'border-box',
    gap: '0.75rem',
  },
  collapseButton: {
    padding: '0',
    marginLeft: '0',
    position: 'absolute',
    top: '0.25rem',
    left: '0',
    zIndex: 100,
    '&:hover': {
      color: 'white',
      '& svg': { fill: 'white' },
    },
  },
  chatContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    maxWidth: '100%',
    flex: 1,
    gap: '0.75rem',
    boxSizing: 'border-box',
  },
  topBarContainer: {
    display: !collapsed ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    width: '100%',
    paddingLeft: '2.25rem',
  },
  clearButtonContainer: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
    marginRight: !isSmallWindow && activeConversation?.id ? '0.25rem' : '0',
    gap: '0.5rem',
  },
});

const ChatPanel = forwardRef((props, ref) => {
  const { settings, display, onCollapsed, setActiveConversation, editorPanelRef, onShowHistory } = props;
  const { isStreaming, activeConversation } = settings;
  const theme = useTheme();
  const boxRef = useRef();
  const [collapsed, setCollapsed] = useState(false);
  const { isSmallWindow } = useIsSmallWindow();
  const {
    yamlCode,
    initState: { yamlCode: initialYamlCode },
  } = useSelector(state => state.pipeline);
  const isPipelineDirty = useMemo(() => yamlCode !== initialYamlCode, [initialYamlCode, yamlCode]);

  // Generate styles based on current state
  const styles = useMemo(
    () =>
      createStyles({
        isSmallWindow,
        collapsed,
        display,
        activeConversation,
      }),
    [isSmallWindow, collapsed, display, activeConversation],
  );

  useImperativeHandle(ref, () => ({
    stopRun: () => boxRef.current?.stopAll(),
  }));

  const onClickCollapsed = useCallback(() => {
    setCollapsed(!collapsed);
    onCollapsed?.(!collapsed);
  }, [collapsed, onCollapsed]);

  useEffect(() => {
    if (isSmallWindow) {
      setCollapsed(false);
      onCollapsed?.(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSmallWindow]);

  const shouldDisableClear =
    !activeConversation?.chat_history?.length ||
    isStreaming ||
    (activeConversation?.chat_history?.length === 1 &&
      activeConversation.chat_history[0].id === WELCOME_MESSAGE_ID);

  return (
    <>
      <ContentContainer sx={styles.chatContainer}>
        {!isSmallWindow && (
          <IconButton
            sx={styles.collapseButton}
            variant="alita"
            color="tertiary"
            onClick={onClickCollapsed}
          >
            {collapsed ? (
              <DoubleLeftIcon
                fill={theme.palette.icon.fill.default}
                width={16}
              />
            ) : (
              <DoubleRightIcon
                fill={theme.palette.icon.fill.default}
                width={16}
              />
            )}
          </IconButton>
        )}
        <Box sx={styles.chatContent}>
          <Box sx={styles.topBarContainer}>
            {activeConversation?.id && (
              <ContextBudgetUI.ContextBudgetInfo
                conversationId={activeConversation?.id}
                compact
                contextStrategy={activeConversation?.meta?.context_strategy || {}}
                setActiveConversation={setActiveConversation}
                conversationInstructions={activeConversation?.instructions}
              />
            )}
            <Box sx={styles.clearButtonContainer}>
              <ChatButton.ClearChatButton
                disabled={shouldDisableClear}
                onClear={() => {
                  const hasRunsInProgress = editorPanelRef?.current?.hasRunsInProgress?.();
                  if (hasRunsInProgress) boxRef.current?.stopAll();

                  boxRef.current?.onClear();
                }}
              />
              {onShowHistory && <ViewRunHistoryButton onShowHistory={onShowHistory} />}
            </Box>
          </Box>
          {!collapsed && (
            <ChatBox
              {...settings}
              setActiveConversation={setActiveConversation}
              disableChat={settings.disableChat || isPipelineDirty}
              chatOnly
              type="chat"
              isAgentsPage={true}
              hideAttachments={true}
              ref={boxRef}
              inputPlaceholder="Type your message."
            />
          )}
        </Box>
      </ContentContainer>
    </>
  );
});

ChatPanel.displayName = 'ChatPanel';

export default ChatPanel;
