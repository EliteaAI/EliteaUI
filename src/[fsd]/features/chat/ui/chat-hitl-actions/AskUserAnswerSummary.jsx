import { memo, useEffect, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { useLazyMessageTraceQuery } from '@/[fsd]/features/chat/api';
import { buildAskUserSummary, findAskUserAction } from '@/[fsd]/features/chat/lib/helpers/hitl.helpers.js';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

// Summarizes completed ask_user actions, including reloaded traces.
const AskUserAnswerSummary = memo(props => {
  const { toolActions } = props;
  const styles = askUserAnswerSummaryStyles();
  const projectId = useSelectedProjectId();
  const [getMessageTrace] = useLazyMessageTraceQuery();
  const [fetchedDetail, setFetchedDetail] = useState(null);

  const action = useMemo(() => findAskUserAction(toolActions), [toolActions]);

  const hasInlineData = Boolean(action?.toolInputs || action?.toolOutputs || action?.content);
  const needsFetch = Boolean(action && !hasInlineData && action.traceStepId && projectId);

  useEffect(() => {
    if (!needsFetch) return;
    setFetchedDetail(null);
    getMessageTrace({
      projectId,
      stepId: action.traceStepId,
      messageGroupId: action.traceMessageGroupId,
    })
      .then(response => {
        if (response?.data) setFetchedDetail(response.data);
      })
      .catch(() => {});
  }, [needsFetch, projectId, action?.traceStepId, action?.traceMessageGroupId, getMessageTrace]);

  const items = useMemo(() => {
    if (!action) return null;
    const toolInputs = fetchedDetail?.tool_inputs ?? action.toolInputs;
    const toolOutputs = fetchedDetail?.tool_output ?? action.toolOutputs ?? action.content;
    return buildAskUserSummary(toolInputs, toolOutputs);
  }, [action, fetchedDetail]);

  if (!items?.length) return null;

  return (
    <Box sx={styles.container}>
      {items.map((item, index) => (
        <Box
          key={`${index}-${item.question}`}
          sx={styles.item}
        >
          <Typography
            variant="bodyMedium"
            sx={styles.question}
          >
            {`${index + 1}. ${item.question}`}
          </Typography>
          {item.answer && (
            <Typography
              variant="bodySmall"
              sx={styles.answer}
            >
              {item.answer}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
});

AskUserAnswerSummary.displayName = 'AskUserAnswerSummary';

/** @type {MuiSx} */
const askUserAnswerSummaryStyles = () => ({
  container: ({ palette }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1rem 1.25rem',
    marginBottom: '1rem',
    borderRadius: '0.75rem',
    background: palette.background.default.secondary,
    border: `0.0625rem solid ${palette.border.cardsOutlines}`,
  }),
  item: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  question: ({ palette }) => ({
    fontWeight: 600,
    color: palette.text.primary,
  }),
  answer: ({ palette }) => ({
    color: palette.text.secondary,
  }),
});

export default AskUserAnswerSummary;
