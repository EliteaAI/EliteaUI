import { memo, useCallback, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';
import { CopyIconButton } from '@/[fsd]/shared/ui/button';
import Markdown from '@/[fsd]/shared/ui/markdown';

import ErrorTrace from './ErrorTrace';

const ContinuationError = memo(props => {
  const { error, trace, messageId, compact = false } = props;
  const [isPartialExpanded, setIsPartialExpanded] = useState(false);

  const onPartialChange = useCallback((_event, expanded) => {
    setIsPartialExpanded(expanded);
  }, []);

  const partialOutput = error?.partial_output || '';
  const styles = continuationErrorStyles(compact);
  const attemptsText = Number.isInteger(error?.attempts)
    ? ` after ${error.attempts} automatic continuation attempts`
    : '';

  const headline = (
    <Box data-testid="continuation-error-guidance">
      <Typography
        component="div"
        variant="bodyMedium"
        sx={styles.title}
      >
        The model response is incomplete
      </Typography>
      <Typography
        component="div"
        variant="bodySmall"
      >
        {error?.user_message || `The model could not complete the response${attemptsText}.`}
      </Typography>
      <Typography
        component="div"
        variant="bodySmall"
        sx={styles.recoveryGuidance}
      >
        In Model settings, increase Max Tokens in Custom mode or select Default under Max Completion Tokens,
        then regenerate the response.
      </Typography>
    </Box>
  );

  const partialResponse = partialOutput ? (
    <BasicAccordion
      data-testid="continuation-partial-response"
      uppercase={false}
      defaultExpanded={false}
      expanded={isPartialExpanded}
      onChange={onPartialChange}
      style={styles.accordion}
      accordionSX={styles.accordionRoot}
      summarySX={styles.accordionSummary}
      accordionDetailsSX={styles.accordionDetails}
      items={[
        {
          title: 'Partial model response',
          testId: 'continuation-partial-response-toggle',
          summaryAction: (
            <Box data-testid="continuation-partial-response-copy">
              <CopyIconButton
                value={partialOutput}
                tooltip="Copy partial response"
              />
            </Box>
          ),
          content: isPartialExpanded ? (
            <Box data-testid="continuation-partial-response-content">
              <Markdown>{partialOutput}</Markdown>
            </Box>
          ) : null,
        },
      ]}
    />
  ) : null;

  return (
    <Box data-testid="continuation-error">
      <ErrorTrace
        compact={compact}
        headline={headline}
        trace={trace}
        messageId={messageId}
        afterHeadline={partialResponse}
      />
    </Box>
  );
});

ContinuationError.displayName = 'ContinuationError';

const continuationErrorStyles = compact => ({
  title: {
    fontWeight: 600,
    marginBottom: '.375rem',
  },
  recoveryGuidance: {
    marginTop: '.375rem',
  },
  accordion: {
    marginBottom: '.5rem',
  },
  accordionRoot: ({ palette }) => ({
    backgroundColor: palette.background.userInputBackground,
    borderRadius: '.5rem',
  }),
  accordionSummary: {
    minHeight: '2.5rem',
    paddingRight: '2.5rem',
  },
  accordionDetails: {
    padding: compact ? '.5rem .75rem 1rem' : '.75rem 1rem 1.25rem',
    maxHeight: compact ? '18rem' : '32rem',
    overflow: 'auto',
  },
});

export default ContinuationError;
