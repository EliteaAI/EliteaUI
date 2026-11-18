import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import RejectIcon from '@/assets/reject.svg?react';

const formatValue = value => {
  if (value === null || value === undefined || value === '') return '—';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
};

/** Elitea Builder Changes card (#7383): a destructive change waits here for Apply / Cancel. */
const BuilderChangesetControl = memo(props => {
  const { hitlInterrupt, onHitlResume, disabled, toolCallId, interruptId } = props;
  const { summary, message, diff = [], arguments: operationArgs } = hitlInterrupt || {};
  const styles = getStyles();

  const handleApply = useCallback(() => {
    onHitlResume?.({ action: 'apply', toolCallId, interruptId });
  }, [interruptId, onHitlResume, toolCallId]);

  const handleCancel = useCallback(() => {
    onHitlResume?.({ action: 'cancel', toolCallId, interruptId });
  }, [interruptId, onHitlResume, toolCallId]);

  return (
    <Box
      data-testid="builder-changeset-card"
      sx={styles.container}
    >
      <Typography
        variant="labelMedium"
        sx={styles.title}
      >
        Confirm change
      </Typography>
      <Typography
        variant="labelMedium"
        sx={styles.summary}
      >
        {summary || message}
      </Typography>
      {diff.length > 0 && (
        <Box sx={styles.diff}>
          {diff.map(entry => (
            <Box
              key={entry.field}
              sx={styles.diffRow}
            >
              <Typography
                variant="bodySmall"
                sx={styles.field}
              >
                {entry.field}
              </Typography>
              {entry.added_lines || entry.removed_lines ? (
                <Box>
                  {(entry.removed_lines || []).map(line => (
                    <Typography
                      key={`-${line}`}
                      variant="bodySmall"
                      sx={styles.removed}
                    >
                      {`- ${line}`}
                    </Typography>
                  ))}
                  {(entry.added_lines || []).map(line => (
                    <Typography
                      key={`+${line}`}
                      variant="bodySmall"
                      sx={styles.added}
                    >
                      {`+ ${line}`}
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Box sx={styles.change}>
                  <Typography
                    variant="bodySmall"
                    sx={styles.removed}
                  >
                    {formatValue(entry.before)}
                  </Typography>
                  <Typography variant="bodySmall">→</Typography>
                  <Typography
                    variant="bodySmall"
                    sx={styles.added}
                  >
                    {formatValue(entry.after)}
                  </Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}
      {!diff.length && operationArgs && (
        <Typography
          variant="bodySmall"
          sx={styles.args}
        >
          {formatValue(operationArgs)}
        </Typography>
      )}
      <Box sx={styles.buttons}>
        <BaseBtn
          data-testid="builder-changeset-apply-button"
          variant="positive"
          startIcon={<CheckedIcon />}
          onClick={handleApply}
          disabled={disabled}
          sx={styles.buttonIcon}
        >
          Apply
        </BaseBtn>
        <BaseBtn
          data-testid="builder-changeset-cancel-button"
          variant="alarm"
          startIcon={<RejectIcon />}
          onClick={handleCancel}
          disabled={disabled}
          sx={styles.buttonIcon}
        >
          Cancel
        </BaseBtn>
      </Box>
    </Box>
  );
});

BuilderChangesetControl.displayName = 'BuilderChangesetControl';

/** @type {MuiSx} */
const getStyles = () => ({
  container: ({ palette }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '0.625rem 0.75rem',
    gap: '0.5rem',
    borderRadius: '0.625rem',
    background: palette.background.surface.interactive.active,
    border: `0.0625rem solid ${palette.warning.main}`,
    alignItems: 'flex-start',
  }),
  title: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 600,
    color: palette.warning.main,
  }),
  summary: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 600,
    color: palette.text.primary,
  }),
  diff: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    width: '100%',
  },
  diffRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  field: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  change: {
    display: 'flex',
    gap: '0.375rem',
    flexWrap: 'wrap',
  },
  added: ({ palette }) => ({
    color: palette.success.main,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }),
  removed: ({ palette }) => ({
    color: palette.error.main,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }),
  args: ({ palette }) => ({
    color: palette.text.secondary,
    wordBreak: 'break-word',
  }),
  buttons: {
    display: 'flex',
    gap: '0.625rem',
    alignItems: 'center',
  },
  buttonIcon: {
    '& .MuiButton-startIcon': {
      color: 'white',
    },
  },
});

export default BuilderChangesetControl;
