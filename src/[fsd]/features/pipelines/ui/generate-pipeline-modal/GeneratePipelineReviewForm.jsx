import { memo, useCallback } from 'react';

import { Alert, Box, Typography } from '@mui/material';

import ResourceSuggestions from '@/[fsd]/features/agent/ui/generate-agent-modal/ResourceSuggestions';
import { Input } from '@/[fsd]/shared/ui';
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from '@/common/constants';

const GeneratePipelineReviewForm = memo(props => {
  const {
    draft,
    onChange,
    selectedToolkitIds,
    onToggleToolkit,
    selectedMcpIds,
    onToggleMcp,
    selectedAgentIds,
    onToggleAgent,
    selectedPipelineIds,
    onTogglePipeline,
  } = props;

  const styles = generatePipelineReviewFormStyles();

  const handleFieldChange = useCallback(
    (field, value) => {
      onChange({ ...draft, [field]: value });
    },
    [draft, onChange],
  );

  const warnings = draft?.validation_result?.warnings ?? [];

  return (
    <Box sx={styles.container}>
      <Box sx={styles.field}>
        <Input.InputBase
          label="Name"
          variant={Input.INPUT_VARIANTS.outlined}
          fullWidth
          size="small"
          value={draft.name || ''}
          onChange={e => handleFieldChange('name', e.target.value)}
          slotProps={{ htmlInput: { maxLength: MAX_NAME_LENGTH } }}
          inputProps={{ 'data-testid': 'generate-pipeline-review-name-input' }}
        />
      </Box>

      <Box sx={styles.field}>
        <Input.InputBase
          label="Description"
          variant={Input.INPUT_VARIANTS.outlined}
          fullWidth
          size="small"
          multiline
          minRows={2}
          maxRows={4}
          value={draft.description || ''}
          onChange={e => handleFieldChange('description', e.target.value)}
          slotProps={{ htmlInput: { maxLength: MAX_DESCRIPTION_LENGTH } }}
          inputProps={{ 'data-testid': 'generate-pipeline-review-description-input' }}
        />
      </Box>

      {warnings.length > 0 && (
        <Alert
          severity="warning"
          sx={styles.warningsAlert}
        >
          <Typography sx={styles.warningsTitle}>Validation warnings:</Typography>
          {warnings.map((w, i) => (
            <Typography
              key={i}
              sx={styles.warningItem}
            >
              {w.node_id ? `[${w.node_id}] ` : ''}
              {w.message}
            </Typography>
          ))}
        </Alert>
      )}

      <Box sx={styles.field}>
        <Typography sx={styles.yamlLabel}>Pipeline YAML</Typography>
        <Box
          component="pre"
          sx={styles.yamlPreview}
          data-testid="generate-pipeline-review-yaml"
        >
          {draft.pipeline_yaml || ''}
        </Box>
      </Box>

      <ResourceSuggestions
        title="Suggested Toolkits:"
        items={draft.suggested_toolkits}
        selectedIds={selectedToolkitIds}
        onToggle={onToggleToolkit}
        entityType="toolkit"
      />

      <ResourceSuggestions
        title="Suggested MCP:"
        items={draft.suggested_mcp}
        selectedIds={selectedMcpIds}
        onToggle={onToggleMcp}
        entityType="mcp"
      />

      <ResourceSuggestions
        title="Suggested Pipelines:"
        items={draft.suggested_pipelines}
        selectedIds={selectedPipelineIds}
        onToggle={onTogglePipeline}
        entityType="pipeline"
      />

      <ResourceSuggestions
        title="Suggested Agents:"
        items={draft.suggested_agents}
        selectedIds={selectedAgentIds}
        onToggle={onToggleAgent}
        entityType="agent"
      />
    </Box>
  );
});

GeneratePipelineReviewForm.displayName = 'GeneratePipelineReviewForm';

/** @type {MuiSx} */
const generatePipelineReviewFormStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  yamlLabel: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: '1.5rem',
    color: 'text.primary',
  },
  yamlPreview: ({ palette }) => ({
    margin: 0,
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    border: `0.0625rem solid ${palette.border.lines}`,
    fontFamily: 'monospace',
    fontSize: '0.8125rem',
    lineHeight: '1.5',
    color: palette.text.primary,
    overflowX: 'auto',
    maxHeight: '16rem',
    overflowY: 'auto',
    whiteSpace: 'pre',
  }),
  warningsAlert: {
    padding: '0.5rem 1rem',
  },
  warningsTitle: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    marginBottom: '0.25rem',
  },
  warningItem: {
    fontSize: '0.8125rem',
  },
});

export default GeneratePipelineReviewForm;
