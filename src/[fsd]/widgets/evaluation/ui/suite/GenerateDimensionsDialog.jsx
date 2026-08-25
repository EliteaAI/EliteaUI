import { memo, useCallback, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { Checkbox, Input, Modal } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';

import {
  useAddEvalBindingMutation,
  useCreateEvalDimensionMutation,
  useGenerateEvalDimensionsMutation,
} from '../../api';
import { DIMENSION_TIER_OPTIONS, EVAL_TIER } from '../../lib/constants';
import { parseEvalError } from '../../lib/helpers';

const MAX_COUNT_HINT = 20;

const STEPS = {
  input: 'input',
  loading: 'loading',
  review: 'review',
  saving: 'saving',
};

// Weight is always sized 1 for generated drafts, whatever the LLM proposed — the
// user tunes relative weighting after review, once the dimension is actually in the
// suite alongside its siblings; a stale AI guess at that number isn't worth carrying in.
const dimensionCreateBody = draft => ({
  name: draft.name,
  description: draft.description,
  allowed_engines: draft.allowed_engines,
  scale_type: draft.scale_type,
  scale_min: draft.scale_min,
  scale_max: draft.scale_max,
  polarity: draft.polarity,
  default_weight: 1,
  default_target: draft.default_target ?? null,
  default_target_operator: draft.default_target_operator ?? null,
  tier: draft.tier ?? EVAL_TIER.agent_adhoc,
});

const bindingCreateBody = (dimensionId, draft) => ({
  dimension_id: dimensionId,
  weight: 1,
  target: draft.target ?? draft.default_target ?? null,
  target_operator: draft.target_operator ?? draft.default_target_operator ?? null,
  ...(draft.evidence_scope ? { evidence_scope: draft.evidence_scope } : {}),
});

// Draft-review flow for the "Generate with AI" suite action (§13.3 follow-up). Mirrors the
// generic single-entity GenerateEntityModal shape (input -> loading -> review) but the review
// step here is a checklist over a *list* of dimension+binding drafts, since the backend
// endpoint returns several proposals in one call rather than a single entity.
const GenerateDimensionsDialog = memo(props => {
  const { open, projectId, applicationId, applicationVersionId, suiteId, onClose } = props;

  const [step, setStep] = useState(STEPS.input);
  const [countHint, setCountHint] = useState('');
  const [drafts, setDrafts] = useState([]);
  const [checkedIndexes, setCheckedIndexes] = useState(new Set());
  const [error, setError] = useState('');

  const [generateDimensions] = useGenerateEvalDimensionsMutation();
  const [createDimension] = useCreateEvalDimensionMutation();
  const [addBinding] = useAddEvalBindingMutation();

  const reset = useCallback(() => {
    setStep(STEPS.input);
    setCountHint('');
    setDrafts([]);
    setCheckedIndexes(new Set());
    setError('');
  }, []);

  const isBusy = step === STEPS.loading || step === STEPS.saving;

  // Guards every dismissal path at once — BaseModal wires onClose to Cancel, the X button, the
  // backdrop and Escape, and none of the in-flight calls are cancellable.
  const handleClose = useCallback(() => {
    if (isBusy) return;
    reset();
    onClose?.();
  }, [isBusy, reset, onClose]);

  const handleGenerate = useCallback(async () => {
    setStep(STEPS.loading);
    setError('');
    try {
      const parsedCount = Number.parseInt(countHint, 10);
      const result = await generateDimensions({
        projectId,
        body: {
          application_id: applicationId,
          version_id: applicationVersionId ?? null,
          // Backend validates count_hint as 1..20; clamp rather than let a typed 50 come back a 400.
          ...(Number.isFinite(parsedCount) && parsedCount > 0
            ? { count_hint: Math.min(parsedCount, MAX_COUNT_HINT) }
            : {}),
        },
      }).unwrap();
      const items = (result?.dimensions ?? []).map(item => ({ ...item, tier: EVAL_TIER.agent_adhoc }));
      setDrafts(items);
      setCheckedIndexes(new Set(items.map((_, index) => index)));
      setStep(STEPS.review);
    } catch (generationError) {
      setError(parseEvalError(generationError, 'Failed to generate dimensions.'));
      setStep(STEPS.input);
    }
  }, [countHint, generateDimensions, projectId, applicationId, applicationVersionId]);

  const handleToggle = useCallback(index => {
    setCheckedIndexes(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleTierChange = useCallback((index, tier) => {
    setDrafts(prev => prev.map((draft, draftIndex) => (draftIndex === index ? { ...draft, tier } : draft)));
  }, []);

  const handleSave = useCallback(async () => {
    if (suiteId == null) return;
    setStep(STEPS.saving);
    setError('');
    // Items are saved one at a time and there is no rollback, so a mid-loop failure leaves the
    // earlier items persisted. Drop those from the review list on failure so the user retries
    // only what actually failed instead of double-creating what already landed.
    const saved = new Set();
    try {
      for (const index of checkedIndexes) {
        const draft = drafts[index];
        const created = await createDimension({ projectId, body: dimensionCreateBody(draft) }).unwrap();
        if (created?.id != null) {
          await addBinding({ projectId, suiteId, body: bindingCreateBody(created.id, draft) }).unwrap();
        }
        saved.add(index);
      }
      reset();
      onClose?.();
    } catch (saveError) {
      const remaining = drafts
        .map((draft, index) => ({ draft, index }))
        .filter(({ index }) => !saved.has(index));
      setDrafts(remaining.map(({ draft }) => draft));
      setCheckedIndexes(
        new Set(remaining.flatMap(({ index }, position) => (checkedIndexes.has(index) ? [position] : []))),
      );
      const reason = parseEvalError(saveError, 'Failed to save the selected dimensions.');
      setError(
        saved.size
          ? `${reason} ${saved.size} dimension(s) were already added and have been removed from this list.`
          : reason,
      );
      setStep(STEPS.review);
    }
  }, [checkedIndexes, drafts, createDimension, addBinding, projectId, suiteId, reset, onClose]);

  const styles = generateDimensionsDialogStyles();

  const renderContent = () => {
    if (step === STEPS.loading || step === STEPS.saving) {
      return (
        <Box sx={styles.centered}>
          <CircularProgress size={28} />
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            {step === STEPS.loading ? 'Analyzing agent instructions…' : 'Saving selected dimensions…'}
          </Typography>
        </Box>
      );
    }

    if (step === STEPS.review) {
      return (
        <Box sx={styles.reviewList}>
          {drafts.map((draft, index) => (
            <Box
              key={index}
              sx={styles.reviewItem}
              data-testid="generate-dimensions-review-item"
            >
              <Checkbox.BaseCheckbox
                checked={checkedIndexes.has(index)}
                onChange={() => handleToggle(index)}
                data-testid="generate-dimensions-review-checkbox"
              />
              <Box sx={styles.reviewItemBody}>
                <Typography variant="labelMedium">{draft.name}</Typography>
                <Typography
                  variant="bodySmall2"
                  color="text.secondary"
                >
                  {draft.description}
                </Typography>
                <SingleSelect
                  showBorder
                  value={draft.tier ?? EVAL_TIER.agent_adhoc}
                  options={DIMENSION_TIER_OPTIONS}
                  onValueChange={value => handleTierChange(index, value)}
                  data-testid="generate-dimensions-review-tier-select"
                />
              </Box>
            </Box>
          ))}
          {!drafts.length && (
            <Typography
              variant="bodySmall"
              color="text.secondary"
            >
              No dimensions were proposed. Try adjusting the count and generating again.
            </Typography>
          )}
        </Box>
      );
    }

    return (
      <Box sx={styles.inputBody}>
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          Propose evaluation dimensions and bindings from this agent&apos;s current instructions.
        </Typography>
        <Input.InputBase
          fullWidth
          variant="standard"
          label="Number of dimensions (optional)"
          value={countHint}
          onChange={event => setCountHint(event.target.value)}
          type="number"
          inputProps={{ inputMode: 'numeric', min: 1, max: 20 }}
          data-testid="generate-dimensions-count-hint"
        />
      </Box>
    );
  };

  return (
    <Modal.BaseModal
      open={open}
      title="Generate dimensions with AI"
      onClose={handleClose}
      content={
        <Box sx={styles.content}>
          {renderContent()}
          {!!error && (
            <Typography
              variant="bodySmall"
              color="error"
            >
              {error}
            </Typography>
          )}
        </Box>
      }
      onConfirm={step === STEPS.review ? handleSave : handleGenerate}
      confirmButtonText={step === STEPS.review ? 'Add selected' : 'Generate'}
      confirming={
        isBusy || (step === STEPS.review && !checkedIndexes.size)
      }
      data-testid="generate-dimensions-dialog"
    />
  );
});

GenerateDimensionsDialog.displayName = 'GenerateDimensionsDialog';

/** @type {MuiSx} */
const generateDimensionsDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    minWidth: '28rem',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '2rem 0',
  },
  inputBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingTop: '0.5rem',
  },
  reviewList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    maxHeight: '24rem',
    overflowY: 'auto',
  },
  reviewItem: ({ palette }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    padding: '0.5rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  reviewItemBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: 0,
  },
});

export default GenerateDimensionsDialog;
