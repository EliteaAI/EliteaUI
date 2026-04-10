import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Button, Collapse, Typography } from '@mui/material';

import { useListModelsQuery } from '@/api/configurations';
import { TOOL_ACTION_TYPES, ToolActionStatus } from '@/common/constants';
import { getToolInfoFromAction } from '@/common/toolActionUitls';
import { getToolIconByType } from '@/common/toolkitUtils';
import Markdown from '@/components/Markdown.jsx';
import useGetComponentWidth from '@/hooks/useGetComponentWidth';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { useTheme } from '@emotion/react';

import EliteAImage from '../EliteAImage';
import ModelIcon from '../Icons/ModelIcon';
import { StyledCircleProgress } from './StyledComponents';
import ToolModal from './ToolModal';

// Number of visible lines in streaming content window (collapsed/expanded)
const STREAMING_WINDOW_LINES_COLLAPSED = 15;
const STREAMING_WINDOW_LINES_EXPANDED = 30;
// Approximate line height in pixels for calculating window height
const LINE_HEIGHT_PX = 20;

// Separate component for previous execution - thinking collapsed, content shown
const PreviousExecutionView = memo(({ execution, index, styles }) => {
  const [thinkingExpanded, setThinkingExpanded] = useState(false);

  const onToggleThinking = useCallback(() => {
    setThinkingExpanded(prev => !prev);
  }, []);

  return (
    <>
      {execution.thinking && execution.thinking.trim() && (
        <Box sx={styles.thinkingContainer}>
          <Box
            sx={styles.thinkingHeader}
            onClick={onToggleThinking}
          >
            <Typography
              variant="bodySmall"
              sx={styles.thinkingLabel}
            >
              Thinking {index + 1} (completed)
            </Typography>
            {thinkingExpanded ? (
              <ExpandLessIcon sx={styles.thinkingIcon} />
            ) : (
              <ExpandMoreIcon sx={styles.thinkingIcon} />
            )}
          </Box>
          <Collapse in={thinkingExpanded}>
            <Box sx={styles.thinkingContent}>
              <Typography
                variant="bodySmall"
                sx={styles.thinkingText}
              >
                {execution.thinking}
              </Typography>
            </Box>
          </Collapse>
        </Box>
      )}
      {execution.content && execution.content.trim() && (
        <Box sx={styles.previousResponseContent}>
          <Typography
            variant="bodyMedium"
            component="pre"
            sx={styles.previousResponseText}
          >
            {execution.content}
          </Typography>
        </Box>
      )}
    </>
  );
});

PreviousExecutionView.displayName = 'PreviousExecutionView';

const ActionView = memo(props => {
  const {
    action,
    showProgress = false,
    tools,
    onlyShowToolkit = false,
    width = '100%',
    onAuth,
    isStreaming = false,
  } = props;
  const [openModalView, setOpenModalView] = useState(false);
  const [thinkingExpanded, setThinkingExpanded] = useState(true);
  const [streamingWindowExpanded, setStreamingWindowExpanded] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const streamingContentRef = useRef(null);

  // Auto-scroll to bottom when streaming content updates (if enabled)
  useEffect(() => {
    if (isStreaming && autoScrollEnabled && streamingContentRef.current) {
      streamingContentRef.current.scrollTop = streamingContentRef.current.scrollHeight;
    }
  }, [isStreaming, autoScrollEnabled, action.content, action.originalContent]);

  // Reset window and auto-scroll settings when streaming ends
  useEffect(() => {
    if (!isStreaming) {
      setStreamingWindowExpanded(false);
      setAutoScrollEnabled(true);
    }
  }, [isStreaming]);

  // Calculate window height based on expanded state
  const streamingWindowLines = streamingWindowExpanded
    ? STREAMING_WINDOW_LINES_EXPANDED
    : STREAMING_WINDOW_LINES_COLLAPSED;

  const theme = useTheme();
  const { componentRef, componentWidth } = useGetComponentWidth();
  const { toolName, toolkitName, toolkitType, toolContent, message, iconMeta, thinking, originalToolName } =
    getToolInfoFromAction(action, tools);

  // Resolve human-readable display name for LLM chips.
  // toolkitName for model chips is the raw model key (e.g. "gpt-4o"); look up the display_name.
  const projectId = useSelectedProjectId();
  const { data: { items: modelsList = [] } = {} } = useListModelsQuery(
    { projectId, include_shared: true },
    { skip: toolkitType !== 'model' || !projectId },
  );
  const resolvedToolkitName = useMemo(() => {
    if (toolkitType === 'model' && modelsList.length) {
      const model = modelsList.find(m => m.name.includes(toolkitName.replace(/^\d+_/, '')));
      if (model) return model.display_name || model.name || toolkitName;
    }
    return toolkitName;
  }, [toolkitType, toolkitName, modelsList]);

  const styles = actionViewStyles();

  const needAuthAction = useMemo(
    () => action.status === ToolActionStatus.actionRequired && !!action?.toolMeta?.server_url,
    [action.status, action?.toolMeta?.server_url],
  );

  // Check if this is a named LLM action (pipeline node like Start, Chat) vs generic "Thinking step"
  const isNamedLlmAction = useMemo(
    () => action.type === TOOL_ACTION_TYPES.Llm && action.name && action.name !== 'Thinking step',
    [action.type, action.name],
  );

  // Check by type only - streaming uses actual tool names, history uses constants
  // During streaming: show inline content for named LLM actions (user sees content as it comes)
  // After streaming (history): hide inline content for named LLM actions (use modal instead)
  // SwarmChild type always shows inline content (sub-agent responses)
  const showInlineContent = useMemo(
    () =>
      (action.type === TOOL_ACTION_TYPES.SwarmChild && toolContent) ||
      ((action.type === TOOL_ACTION_TYPES.Llm || action.type === TOOL_ACTION_TYPES.Toolkit) &&
        !onlyShowToolkit &&
        toolContent &&
        (isStreaming || !isNamedLlmAction)),
    [action.type, onlyShowToolkit, toolContent, isNamedLlmAction, isStreaming],
  );

  // Hide header (badge + label) only for generic "Thinking step" that has content - just show the text
  // Named LLM actions (pipeline nodes) should always show the header/chip
  const showHeader = useMemo(
    () => !(action.type === TOOL_ACTION_TYPES.Llm && toolContent && !showProgress && !isNamedLlmAction),
    [action.type, toolContent, showProgress, isNamedLlmAction],
  );

  const showMessage = useMemo(
    () => !onlyShowToolkit && action.type === TOOL_ACTION_TYPES.Tool && message,
    [onlyShowToolkit, action.type, message],
  );

  // Show inline thinking for LLM actions when thinking content is available
  const showInlineThinking = useMemo(
    () => !onlyShowToolkit && action.type === TOOL_ACTION_TYPES.Llm && thinking,
    [onlyShowToolkit, action.type, thinking],
  );

  // Previous executions from merged same-name actions (for streaming)
  const previousExecutions = useMemo(() => action.previousExecutions || [], [action.previousExecutions]);

  // Helper to build title with tool name appended when relevant
  const buildTitle = useCallback(
    (separator, includeToolNameCheck = false) => {
      let title = resolvedToolkitName;

      // Determine if tool name should be appended
      const isDifferentName =
        toolName && toolName !== resolvedToolkitName && toolName !== resolvedToolkitName.replace(/\s/g, '');
      const isOriginalNameFromTools =
        action.parent_agent_name || (originalToolName && originalToolName !== resolvedToolkitName);
      const shouldInclude = includeToolNameCheck
        ? isDifferentName && !onlyShowToolkit && action.type !== TOOL_ACTION_TYPES.Llm
        : isDifferentName;
      if (shouldInclude) {
        title += `${separator}${toolName}${isOriginalNameFromTools ? ` (${action.parent_agent_name || originalToolName})` : ''}`;
      } else {
        title += `${isOriginalNameFromTools ? ` (${action.parent_agent_name || originalToolName})` : ''}`;
      }

      return title;
    },
    [resolvedToolkitName, toolName, action.parent_agent_name, action.type, originalToolName, onlyShowToolkit],
  );

  // Badge title uses ": " separator and respects onlyShowToolkit mode
  const displayTitle = useMemo(() => buildTitle(': ', true), [buildTitle]);

  // Modal title uses " - " separator and always shows tool name if different
  const modalTitle = useMemo(() => buildTitle(' - ', true), [buildTitle]);

  const modalInput = useMemo(() => {
    if (typeof action.toolInputs === 'string') return action.toolInputs;
    if (typeof action.toolInputs === 'object') return JSON.stringify(action.toolInputs, null, 2);
    return action.toolInputs || '';
  }, [action.toolInputs]);

  const modalOutput = useMemo(() => {
    const outputData = action.toolOutputs || action.content || action.originalContent;
    let result = '';
    if (typeof outputData === 'string') result = outputData;
    else if (typeof outputData === 'object') result = JSON.stringify(outputData, null, 2);
    else result = outputData || '';

    // Prepend thinking/reasoning if available
    if (thinking) {
      result = `**💭 Thinking:**\n\n${thinking}\n\n---\n\n**📝 Response:**\n\n${result}`;
    }
    return result;
  }, [action.toolOutputs, action.content, action.originalContent, thinking]);

  const contentBoxWidth = useMemo(
    () => (componentWidth ? `${componentWidth - 24}px` : '100%'),
    [componentWidth],
  );

  const onClickToolkit = useCallback(() => {
    setOpenModalView(true);
  }, []);

  const onCloseModalView = useCallback(() => {
    setOpenModalView(false);
  }, []);

  const onToggleThinking = useCallback(() => {
    setThinkingExpanded(prev => !prev);
  }, []);

  const onToggleStreamingWindow = useCallback(() => {
    setStreamingWindowExpanded(prev => !prev);
  }, []);

  const onToggleAutoScroll = useCallback(() => {
    setAutoScrollEnabled(prev => !prev);
  }, []);

  const renderIcon = useCallback(() => {
    if (iconMeta?.url && (toolkitType === 'application' || toolkitType === 'pipeline')) {
      return (
        <EliteAImage
          style={styles.imageStyle}
          image={iconMeta}
        />
      );
    }
    if (toolkitType !== 'model') {
      return getToolIconByType(toolkitType, theme, { internalToolkitName: action?.toolMeta?.toolkit_name });
    }
    return <ModelIcon style={styles.modelIconStyle} />;
  }, [
    iconMeta,
    toolkitType,
    theme,
    action?.toolMeta?.toolkit_name,
    styles.imageStyle,
    styles.modelIconStyle,
  ]);

  return (
    <>
      <Box sx={styles.container(width)}>
        {showHeader && (
          <Box sx={styles.header}>
            <Box
              sx={styles.toolkitBadge}
              onClick={onClickToolkit}
            >
              <Box sx={styles.iconContainer}>
                {showProgress ? (
                  <StyledCircleProgress
                    size={14}
                    sx={styles.progress}
                  />
                ) : (
                  renderIcon()
                )}
              </Box>
              <Typography
                variant="bodySmall2"
                color="text.secondary"
                sx={styles.toolkitName}
              >
                {displayTitle}
              </Typography>
            </Box>
            {needAuthAction && onAuth && (
              <Button
                variant="elitea"
                color="secondary"
                onClick={onAuth}
                sx={styles.authButton}
              >
                Authorize
              </Button>
            )}
          </Box>
        )}

        {/* Previous executions from merged same-name actions - thinking collapsed, content shown */}
        {previousExecutions.map((execution, idx) => (
          <PreviousExecutionView
            key={`prev-exec-${idx}`}
            execution={execution}
            index={idx}
            styles={styles}
          />
        ))}

        {showInlineThinking && (
          <Box sx={styles.thinkingContainer}>
            <Box
              sx={styles.thinkingHeader}
              onClick={onToggleThinking}
            >
              <Typography
                variant="bodySmall"
                sx={styles.thinkingLabel}
              >
                {previousExecutions.length > 0 ? `Thinking ${previousExecutions.length + 1}` : 'Thinking'}
              </Typography>
              {thinkingExpanded ? (
                <ExpandLessIcon sx={styles.thinkingIcon} />
              ) : (
                <ExpandMoreIcon sx={styles.thinkingIcon} />
              )}
            </Box>
            <Collapse in={thinkingExpanded}>
              <Box sx={styles.thinkingContent}>
                <Typography
                  variant="bodySmall"
                  sx={styles.thinkingText}
                >
                  {thinking}
                </Typography>
              </Box>
            </Collapse>
          </Box>
        )}

        {showMessage && (
          <Box sx={styles.messageContainer}>
            <Box sx={styles.messageContent(contentBoxWidth)}>
              {action.markdown ? (
                <Markdown renderHtml={action.renderHtml || false}>{message}</Markdown>
              ) : (
                <Typography
                  variant="bodyMedium"
                  sx={styles.messageText}
                >
                  {message || ''}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {showInlineContent && (
          <Box
            ref={componentRef}
            sx={styles.contentContainer}
          >
            <Box
              ref={streamingContentRef}
              sx={styles.contentBox(contentBoxWidth, isStreaming, streamingWindowLines)}
            >
              {action.markdown ? (
                <Markdown renderHtml={action.renderHtml || false}>{toolContent}</Markdown>
              ) : (
                <Typography
                  variant="bodyMedium"
                  sx={styles.contentText}
                >
                  {toolContent || ''}
                </Typography>
              )}
            </Box>
            {isStreaming && (
              <Box sx={styles.streamingControlsContainer}>
                <Typography
                  onClick={onToggleAutoScroll}
                  variant="bodySmall"
                  sx={styles.streamingToggleButton}
                >
                  {autoScrollEnabled ? 'Pause scroll' : 'Resume scroll'}
                </Typography>
                <Typography
                  onClick={onToggleStreamingWindow}
                  variant="bodySmall"
                  sx={styles.streamingToggleButton}
                >
                  {streamingWindowExpanded ? 'Show less' : 'Show more'}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
      <ToolModal
        open={openModalView}
        onClose={onCloseModalView}
        toolData={action}
        title={modalTitle}
        input={modalInput}
        output={modalOutput}
      />
    </>
  );
});

ActionView.displayName = 'ActionView';

/** @type {MuiSx} */
const actionViewStyles = () => ({
  container: width => ({
    width,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  }),
  header: {
    width: '100%',
    height: 'auto',
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    overflowX: 'auto',
  },
  toolkitBadge: ({ palette }) => ({
    height: '1.75rem',
    display: 'flex',
    padding: '0.125rem 0.75rem',
    gap: '0.5rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    alignItems: 'center',
    cursor: 'pointer',
    '&:hover': {
      background: palette.background.participant.hover,
    },
  }),
  iconContainer: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: palette.icon.fill.default,
    '& svg': {
      fill: `${palette.icon.fill.default} !important`,
    },
  }),
  modelIconStyle: {
    fontSize: '1rem',
  },
  imageStyle: { width: 16, height: 16, borderRadius: '50%', overflow: 'hidden' },
  toolkitName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  progressContainer: {
    width: '1rem',
    height: '1rem',
    marginRight: '0.75rem',
  },
  authButton: {
    minWidth: '5.625rem',
  },
  progress: ({ palette }) => ({
    color: palette.text.info,
    minWidth: '14px',
    minHeight: '14px',
    flexShrink: 0,
  }),
  thinkingContainer: ({ palette }) => ({
    borderRadius: '0.5rem',
    border: `1px solid ${palette.border.lines}`,
    backgroundColor: palette.background.secondary,
    overflow: 'hidden',
  }),
  thinkingHeader: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    backgroundColor: palette.background.secondary,
    '&:hover': {
      backgroundColor: palette.background.participant.hover,
    },
  }),
  thinkingLabel: ({ palette }) => ({
    color: palette.text.secondary,
    fontStyle: 'italic',
  }),
  thinkingIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.text.secondary,
  }),
  thinkingContent: ({ palette }) => ({
    padding: '0.5rem 0.75rem',
    borderTop: `1px solid ${palette.border.lines}`,
    color: palette.text.secondary,
    fontStyle: 'italic',
    '& p': {
      margin: 0,
    },
  }),
  thinkingText: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
    fontFamily: 'inherit',
  },
  previousResponseContent: {
    padding: '0.5rem 0',
  },
  previousResponseText: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
    fontFamily: 'inherit',
  },
  messageContainer: {
    borderRadius: '0.5rem',
    padding: '0rem 0.5rem',
  },
  messageContent: contentBoxWidth => ({
    overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    width: contentBoxWidth,
    overflow: 'scroll',
  }),
  messageText: ({ palette }) => ({
    color: palette.text.metrics,
  }),
  contentContainer: {
    borderRadius: '0.5rem',
    padding: '0rem 0.5rem',
  },
  contentBox: (contentBoxWidth, isStreaming, windowLines) => ({
    overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    width: contentBoxWidth,
    // During streaming: fixed height window with auto-scroll
    // After streaming: show full content without height limit
    ...(isStreaming
      ? {
          maxHeight: `${windowLines * LINE_HEIGHT_PX}px`,
          overflowY: 'auto',
          overflowX: 'hidden',
          // Smooth scrolling for better UX
          scrollBehavior: 'smooth',
        }
      : {
          overflow: 'visible',
        }),
  }),
  streamingControlsContainer: {
    marginTop: '0.5rem',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
  },
  streamingToggleButton: ({ palette }) => ({
    color: palette.text.button.showMore,
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  }),
  contentText: ({ palette }) => ({
    color: palette.text.metrics,
  }),
});

export default ActionView;
