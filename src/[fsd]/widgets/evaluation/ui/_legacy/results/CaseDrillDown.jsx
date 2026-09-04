import { memo, useCallback, useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';

import { Button, Input } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { EVAL_ENGINE, EVAL_RESULT_STATUS } from '../../../lib/constants';
import { formatScore, getBindingEngineLabel } from '../../../lib/helpers';
import HumanScoreInput from './HumanScoreInput';

const stringifyEvidence = value => {
  if (value == null || value === '') return '—';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const EVIDENCE_SECTIONS = [
  { key: 'input', label: 'Input', getter: c => c.input },
  { key: 'output', label: 'Output', getter: c => c.output },
  { key: 'expected_output', label: 'Expected', getter: c => c.expected_output },
  { key: 'structure', label: 'Agent structure', getter: c => c.structure },
];

const metLabel = met => {
  if (met == null) return '—';
  return met ? 'Met' : 'Missed';
};

// Status label for the validation header. `met` is only meaningful when the
// binding carries a numeric target; otherwise a bare "—" reads as missing data
// even though the validation ran, so distinguish "nothing to check against"
// from "not scored yet".
const outcomeLabel = cell => {
  if (cell.met != null) return metLabel(cell.met);
  const passed = cell.verdict?.passed;
  if (cell.binding.engine === EVAL_ENGINE.code && passed != null) {
    return passed ? 'Passed' : 'Failed';
  }
  if (!cell.pending && cell.nativeScore != null) return 'No target';
  return '—';
};

// Surface a failed scorer/sandbox run so an errored validation isn't a silent
// blank cell. The sandbox stores the Python traceback under verdict.stderr
// (evidence only holds the case input/output), so read the verdict first.
const cellError = cell => {
  if (!cell) return null;
  const verdict = cell.verdict;
  const ev = cell.evidence;
  const errored =
    cell.result?.status === EVAL_RESULT_STATUS.error ||
    verdict?.status === 'error' ||
    verdict?.error ||
    ev?.status === 'error' ||
    ev?.error;
  if (!errored) return null;
  return (
    verdict?.stderr ||
    verdict?.error ||
    ev?.stderr ||
    ev?.error ||
    cell.result?.error ||
    'Validation failed to run.'
  );
};

// Case-level drill-down (§15): evidence pane (collapsed sections) beside the
// validations pane. Human validations expose an inline score input adapting to
// the dimension scale; appending a score re-aggregates the run.
const CaseDrillDown = memo(props => {
  const { card, canScore = false, savingKey = null, onSubmitScore } = props;

  const [drafts, setDrafts] = useState({});

  const setDraft = useCallback((key, patch) => {
    setDrafts(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }, []);

  const handleSave = useCallback(
    cell => {
      const draftKey = `${card.id}::${cell.binding.key}`;
      const draft = drafts[draftKey] ?? {};
      if (draft.native == null) return;
      onSubmitScore?.({
        datasetCaseId: card.id,
        dimensionId: cell.binding.dimension_id,
        nativeScore: draft.native,
        note: draft.note?.trim() || undefined,
        bindingKey: draftKey,
      });
    },
    [drafts, card.id, onSubmitScore],
  );

  const styles = caseDrillDownStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="evaluation-case-drilldown"
    >
      <Box sx={styles.evidencePane}>
        <Typography variant="labelMedium">Evidence</Typography>
        {EVIDENCE_SECTIONS.map(section => (
          <Accordion
            key={section.key}
            disableGutters
            sx={styles.accordion}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography
                variant="bodySmall"
                color="text.secondary"
              >
                {section.label}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography
                component="pre"
                variant="bodySmall"
                sx={styles.evidenceBody}
              >
                {stringifyEvidence(section.getter(card.case))}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      <Box sx={styles.validationsPane}>
        <Typography variant="labelMedium">Validations</Typography>
        {card.cells.map(cell => {
          const key = cell.binding.key;
          const draftKey = `${card.id}::${key}`;
          const isHuman = cell.binding.engine === EVAL_ENGINE.human;
          const draft = drafts[draftKey] ?? {};
          const saving = savingKey === draftKey;
          return (
            <Box
              key={key}
              sx={styles.validationCard}
              data-testid="evaluation-case-validation"
            >
              <Box sx={styles.validationHeader}>
                <Typography variant="bodyMedium">{cell.binding.name}</Typography>
                <Typography
                  variant="bodySmall"
                  color="text.secondary"
                >
                  {getBindingEngineLabel(cell.binding)} · {outcomeLabel(cell)}
                </Typography>
              </Box>

              <Typography
                variant="bodySmall"
                color="text.secondary"
              >
                Score: {formatScore(cell.nativeScore)}
                {cell.verdict?.rationale ? ` · ${cell.verdict.rationale}` : ''}
              </Typography>

              {cellError(cell) && (
                <Box
                  component="pre"
                  sx={styles.cellError}
                  data-testid="evaluation-case-validation-error"
                >
                  {cellError(cell)}
                </Box>
              )}

              {isHuman && canScore && (
                <Box sx={styles.scoreRow}>
                  <HumanScoreInput
                    scaleType={cell.binding.scaleType}
                    scaleMin={cell.binding.scaleMin}
                    scaleMax={cell.binding.scaleMax}
                    value={draft.native ?? cell.nativeScore ?? null}
                    onChange={native => setDraft(draftKey, { native })}
                    disabled={saving}
                  />
                  <Input.InputBase
                    variant="standard"
                    placeholder="Note (optional)"
                    value={draft.note ?? ''}
                    onChange={event => setDraft(draftKey, { note: event.target.value })}
                    disabled={saving}
                    sx={styles.note}
                    inputProps={{ maxLength: 512 }}
                  />
                  <Button.BaseBtn
                    variant={BUTTON_VARIANTS.elitea}
                    color={BUTTON_COLORS.primary}
                    disabled={saving || draft.native == null}
                    onClick={() => handleSave(cell)}
                    data-testid="evaluation-case-save-score"
                  >
                    Save score
                  </Button.BaseBtn>
                </Box>
              )}

              {isHuman && !canScore && cell.pending && (
                <Typography
                  variant="bodySmall"
                  color="text.secondary"
                >
                  Awaiting a reviewer score.
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});

CaseDrillDown.displayName = 'CaseDrillDown';

/** @type {MuiSx} */
const caseDrillDownStyles = () => ({
  root: {
    display: 'flex',
    gap: '1rem',
    minHeight: 0,
  },
  evidencePane: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  accordion: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.lines}`,
    boxShadow: 'none',
    '&:before': { display: 'none' },
  }),
  evidenceBody: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
    fontFamily: 'monospace',
  },
  validationsPane: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  validationCard: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  validationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '0.5rem',
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  note: {
    flex: 1,
    minWidth: '10rem',
  },
  cellError: ({ palette }) => ({
    margin: 0,
    padding: '0.5rem',
    borderRadius: '0.25rem',
    backgroundColor: palette.background.tabButton?.default ?? palette.action.hover,
    color: palette.error.main,
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '10rem',
    overflow: 'auto',
  }),
});

export default CaseDrillDown;
