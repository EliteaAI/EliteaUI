import { memo, useCallback } from 'react';

import { Box } from '@mui/material';

import { getInterruptIdentity } from '@/[fsd]/features/chat/lib/helpers/hitl.helpers.js';
import { ChatContinue, ChatHitlActions, ContinuationError, ErrorTrace } from '@/[fsd]/features/chat/ui';
import { SubAgentAccordion } from '@/[fsd]/features/chat/ui/sub-agent-section';

const AnswerApprovals = memo(props => {
  const {
    continuationError,
    exception,
    messageId,
    onCopy,
    budgetErrorCode,
    realAnswer,
    authorizationBuckets,
    tools,
    resolveAuthorizationAgentType,
    renderAuthorizationCard,
    hideContinueButton,
    requiresConfirmation,
    onContinueTokenLimitExecution,
    onContinueWithConfirmation,
    hitlBuckets,
    visibleHitlInterrupts,
    onHitlResume,
  } = props;

  const renderHitlCard = useCallback(
    ({ interrupt, index }) => {
      const toolCallId = interrupt?.tool_call_id || '';
      const interruptId = getInterruptIdentity(interrupt);
      return (
        <ChatHitlActions
          key={interruptId || `hitl-${index}`}
          hitlInterrupt={interrupt}
          toolCallId={toolCallId}
          interruptId={interruptId}
          onHitlResume={onHitlResume}
          disabled={!onHitlResume || Boolean(interrupt?.decided) || Boolean(interrupt?.queued)}
        />
      );
    },
    [onHitlResume],
  );

  return (
    <>
      {continuationError ? (
        <ContinuationError
          error={continuationError}
          trace={exception}
          messageId={messageId}
        />
      ) : exception ? (
        <ErrorTrace
          headline={realAnswer}
          trace={exception}
          messageId={messageId}
          onCopy={onCopy}
          budgetErrorCode={budgetErrorCode}
        />
      ) : null}

      {authorizationBuckets.coordinator.map(renderAuthorizationCard)}
      {authorizationBuckets.subAgents.map(bucket => (
        <SubAgentAccordion
          key={`authorization-sa-${bucket.instanceKey}`}
          name={bucket.name}
          label={bucket.label}
          tools={tools}
          agentType={resolveAuthorizationAgentType(bucket)}
          paused
          defaultExpanded
          transparent
        >
          {bucket.actions.map(renderAuthorizationCard)}
        </SubAgentAccordion>
      ))}

      {!hideContinueButton && !!requiresConfirmation && (
        <ChatContinue
          message={requiresConfirmation.message}
          disabled={!onContinueTokenLimitExecution}
          onContinue={onContinueWithConfirmation}
        />
      )}

      {hitlBuckets.hasSubAgents ? (
        <Box sx={hitlGroupsContainerSx}>
          {hitlBuckets.coordinator.map(renderHitlCard)}
          {hitlBuckets.subAgents.map(bucket => (
            <SubAgentAccordion
              key={`hitl-sa-${bucket.instanceKey}`}
              name={bucket.name}
              label={bucket.label}
              tools={tools}
              agentType={bucket.agentType}
              paused
              defaultExpanded
              transparent
            >
              {bucket.entries.map(renderHitlCard)}
            </SubAgentAccordion>
          ))}
        </Box>
      ) : (
        visibleHitlInterrupts.map((interrupt, index) => renderHitlCard({ interrupt, index }))
      )}
    </>
  );
});

AnswerApprovals.displayName = 'AnswerApprovals';

const hitlGroupsContainerSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  width: '100%',
};

export default AnswerApprovals;
