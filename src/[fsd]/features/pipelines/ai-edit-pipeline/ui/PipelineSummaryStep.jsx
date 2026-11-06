import { memo, useCallback, useEffect, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { ToolItemCard } from '@/[fsd]/entities/edit-entity-with-ai';
import { Input, Text } from '@/[fsd]/shared/ui';
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from '@/common/constants';

import { computeSummaryTools, toolKey } from '../lib/helpers';

const PipelineSummaryStep = memo(props => {
  const {
    currentTools,
    draftData,
    onDraftChange,
    addToolkitIds,
    addMcpIds,
    addAgentIds,
    addPipelineIds,
    addSkillIds,
    removeToolRecordIds,
    onValidationChange,
  } = props;

  const name = draftData?.name ?? '';
  const description = draftData?.description ?? '';
  const pipelineYaml = draftData?.pipeline_yaml ?? '';

  const summaryTools = useMemo(
    () =>
      computeSummaryTools(currentTools, draftData, {
        addToolkitIds,
        addMcpIds,
        addAgentIds,
        addPipelineIds,
        addSkillIds,
        removeToolRecordIds,
      }),
    [
      currentTools,
      draftData,
      addToolkitIds,
      addMcpIds,
      addAgentIds,
      addPipelineIds,
      addSkillIds,
      removeToolRecordIds,
    ],
  );

  const handleFieldChange = useCallback(
    (field, value) => onDraftChange({ ...draftData, [field]: value }),
    [draftData, onDraftChange],
  );

  const isNameValid = name.trim().length > 0;

  useEffect(() => {
    onValidationChange?.(isNameValid);
  }, [isNameValid, onValidationChange]);

  const styles = pipelineSummaryStepStyles();

  return (
    <Box
      sx={styles.container}
      data-testid="ai-edit-pipeline-summary-step"
    >
      <Box sx={styles.field}>
        <Typography sx={styles.label}>Name</Typography>
        <Box sx={[styles.editableCard, !isNameValid && styles.errorCard]}>
          <Input.InputBase
            fullWidth
            value={name}
            onChange={e => handleFieldChange('name', e.target.value)}
            inputProps={{ maxLength: MAX_NAME_LENGTH, 'data-testid': 'ai-edit-pipeline-summary-name' }}
            enableAutoBlur={false}
            disableUnderline
            sx={styles.cardInput}
          />
        </Box>
        {!isNameValid && <Typography sx={styles.fieldError}>Name is required</Typography>}
        {name.length > 0 && (
          <Text.CharacterCounter
            value={name}
            maxLength={MAX_NAME_LENGTH}
            hideMaxLimitMessage
            sx={styles.characterCounter}
          />
        )}
      </Box>

      <Box sx={styles.field}>
        <Typography sx={styles.label}>Description</Typography>
        <Box sx={styles.editableCard}>
          <Input.InputBase
            fullWidth
            multiline
            maxRows={3}
            value={description}
            onChange={e => handleFieldChange('description', e.target.value)}
            inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
            enableAutoBlur={false}
            disableUnderline
            sx={styles.cardInput}
          />
        </Box>
        {description.length > 0 && (
          <Text.CharacterCounter
            value={description}
            maxLength={MAX_DESCRIPTION_LENGTH}
            hideMaxLimitMessage
            sx={styles.characterCounter}
          />
        )}
      </Box>

      <Box sx={styles.field}>
        <Typography sx={styles.label}>Pipeline YAML</Typography>
        <Box sx={styles.editableCard}>
          <Input.InputBase
            fullWidth
            multiline
            minRows={6}
            maxRows={16}
            value={pipelineYaml}
            onChange={e => handleFieldChange('pipeline_yaml', e.target.value)}
            enableAutoBlur={false}
            disableUnderline
            sx={[styles.cardInput, styles.codeInput]}
          />
        </Box>
      </Box>

      <Box sx={styles.section}>
        <Typography sx={styles.sectionLabel}>Tools & Skills:</Typography>
        {summaryTools.length > 0 ? (
          <Box sx={styles.toolsList}>
            {summaryTools.map(item => (
              <ToolItemCard
                key={toolKey(item)}
                item={item}
                entityType={item.entityType}
              />
            ))}
          </Box>
        ) : (
          <Typography sx={styles.emptyText}>No tools, agents, pipelines or skills attached</Typography>
        )}
      </Box>
    </Box>
  );
});

PipelineSummaryStep.displayName = 'PipelineSummaryStep';

/** @type {MuiSx} */
const pipelineSummaryStepStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingBlock: '1rem 1.25rem',
    paddingInline: 'max(2rem, calc((100% - 46rem) / 2))',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: '1.5rem',
    color: 'text.primary',
  },
  editableCard: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    border: `0.0625rem solid ${palette.border.lines}`,
    transition: 'border-color 0.2s ease',
    '&:hover': { borderColor: palette.border.hover },
    '&:focus-within': { borderColor: palette.primary.main },
  }),
  errorCard: ({ palette }) => ({
    borderColor: palette.error.main,
    '&:hover': { borderColor: palette.error.main },
    '&:focus-within': { borderColor: palette.error.main },
  }),
  cardInput: ({ palette }) => ({
    '& .MuiInputBase-input': {
      padding: '0 !important',
      margin: '0 !important',
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: '1.5rem',
      color: palette.text.secondary,
      caretColor: palette.text.secondary,
    },
    '& .MuiInputBase-root': {
      padding: '0 !important',
      minHeight: 'unset',
      '&::before, &::after': {
        display: 'none !important',
      },
    },
    '& .MuiInput-underline::before, & .MuiInput-underline::after': {
      display: 'none !important',
    },
    '& textarea': {
      padding: '0 !important',
      margin: '0 !important',
    },
    padding: 0,
  }),
  codeInput: {
    '& .MuiInputBase-input': {
      fontFamily: 'monospace',
      fontSize: '0.8125rem',
    },
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    paddingTop: '0.5rem',
  },
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    letterSpacing: '0.045rem',
    textTransform: 'uppercase',
    color: 'text.primary',
  },
  toolsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  emptyText: {
    fontSize: '0.75rem',
    color: 'text.primary',
    fontStyle: 'italic',
  },
  fieldError: {
    fontSize: '0.75rem',
    color: 'error.main',
  },
  characterCounter: {
    alignSelf: 'flex-end',
  },
});

export default PipelineSummaryStep;
