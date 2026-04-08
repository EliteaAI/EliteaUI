import { memo } from 'react';

import { Box } from '@mui/material';

import { Input, Label, Switch } from '@/[fsd]/shared/ui';
// import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { CONTEXT_MESSAGES } from '@/[fsd]/widgets/ContextBudget/lib/constants';
// import ShareIcon from '@/assets/share-icon.svg?react';
// import { PUBLIC_PROJECT_ID } from '@/common/constants';
import FormInput from '@/components/FormInput';

// import BriefcaseIcon from '@/components/Icons/BriefcaseIcon';

// const SEPARATOR = '$$$';

const ContextStrategySummarization = memo(props => {
  const {
    formData,
    errors,
    handleInputChange,
    handleSummaryLLMInputChange,
    isEnabled,
    enableAutoBlur = true,
  } = props;

  const styles = summarizationStyles();

  // const selectedModelValue = useMemo(
  //   () =>
  //     `${formData.summary_llm_settings.model_name}${SEPARATOR}${formData.summary_llm_settings.model_project_id}`,
  //   [formData.summary_llm_settings.model_name, formData.summary_llm_settings.model_project_id],
  // );
  //
  // const modelOptions = useMemo(
  //   () =>
  //     modelList.map(model => ({
  //       value: `${model.name}${SEPARATOR}${model.project_id}`,
  //       label: model.display_name || model.name,
  //       isPublic: model.project_id === PUBLIC_PROJECT_ID,
  //     })),
  //   [modelList],
  // );

  return (
    <Box sx={styles.container}>
      {/* Enable Toggle */}
      <Box sx={styles.toggleSection}>
        <Switch.BaseSwitch
          checked={formData.enable_summarization}
          onChange={(event, checkedValue) =>
            handleInputChange({ target: { checked: checkedValue, type: 'checkbox' } }, 'enable_summarization')
          }
          disabled={!isEnabled}
          label="Enable automatic summarization"
          slotProps={{
            switch: { size: 'small' },
            formControlLabel: {
              sx: styles.toggleLabel,
            },
          }}
        />
      </Box>

      {/* Summarization Instructions */}
      <Box sx={[styles.section, styles.sectionSummarizationInstruction]}>
        <Label.InfoLabelWithTooltip
          label="Summarization instructions"
          tooltip="Custom instructions for how summaries should be generated"
          sx={styles.label}
        />
        <Input.StyledInputEnhancer
          autoComplete="off"
          variant="standard"
          fullWidth
          multiline
          maxRows={6}
          minRows={3}
          collapseContent
          value={formData.summary_llm_settings.instructions}
          onChange={e => handleSummaryLLMInputChange(e, 'instructions')}
          enableAutoBlur={enableAutoBlur}
          error={!!errors.summary_llm_settings?.instructions}
          helperText={errors.summary_llm_settings?.instructions}
          disabled={!isEnabled || !formData.enable_summarization}
          placeholder={CONTEXT_MESSAGES.DEFAULT_SUMMARY_INSTRUCTION}
          hasActionsToolBar
          fieldName="Summarization Instructions"
          containerProps={styles.formInput}
        />
      </Box>

      <Box sx={styles.grid}>
        {/* FEATURE TOGGLE: Summary Model - Hidden */}
        {/* <Box sx={[styles.section, styles.sectionSummaryModel]}>
          <Label.InfoLabelWithTooltip
            label="Summary Model"
            tooltip="AI model used for generating conversation summaries"
            sx={styles.label}
          />
          <SingleSelect
            showBorder
            value={selectedModelValue}
            onChange={e => handleSummaryLLMInputChange(e, 'model_name')}
            disabled={!isEnabled || !formData.enable_summarization}
            options={modelOptions}
            inputSX={styles.selectInput}
            renderOption={(option, isSelected) => (
              <MenuItem
                key={option.value}
                value={option.value}
                selected={isSelected}
              >
                <Box sx={styles.menuItemContent}>
                  {option.isPublic ? (
                    <ShareIcon
                      status={CollectionStatus.Published}
                      fontSize="0.875rem"
                    />
                  ) : (
                    <BriefcaseIcon fontSize="0.875rem" />
                  )}
                  <Typography variant="bodyMedium">{option.label}</Typography>
                </Box>
              </MenuItem>
            )}
          />
        </Box> */}

        {/* FEATURE TOGGLE: Summary Trigger Ratio - Hidden */}
        {/* <Box sx={styles.section}>
          <Label.InfoLabelWithTooltip
            label="Summary Trigger Ratio"
            tooltip="Trigger summarization when context reaches this ratio (0.1-1.0)"
            sx={styles.label}
          />
          <FormInput
            type="text"
            value={formData.summary_trigger_ratio}
            onChange={e => handleInputChange(e, 'summary_trigger_ratio')}
            error={!!errors.summary_trigger_ratio}
            helperText={errors.summary_trigger_ratio || ' '}
            disabled={!isEnabled || !formData.enable_summarization}
            inputProps={{
              min: 0.1,
              max: 1.0,
              step: 0.1,
            }}
            sx={styles.formInput}
          />
        </Box> */}

        {/* FEATURE TOGGLE: Min Messages for Summary - Hidden */}
        {/* <Box sx={styles.section}>
          <Label.InfoLabelWithTooltip
            label="Min Messages for Summary"
            tooltip="Minimum messages required before creating a summary"
            sx={styles.label}
          />
          <FormInput
            type="text"
            inputMode="numeric"
            value={formData.min_messages_for_summary}
            onChange={e => handleInputChange(e, 'min_messages_for_summary')}
            error={!!errors.min_messages_for_summary}
            helperText={errors.min_messages_for_summary || ' '}
            disabled={!isEnabled || !formData.enable_summarization}
            inputProps={{
              pattern: '[1-9][0-9]*',
            }}
            sx={styles.formInput}
          />
        </Box> */}

        {/* Target Summary Tokens */}
        <Box sx={styles.section}>
          <Label.InfoLabelWithTooltip
            label="Target Summary Tokens"
            tooltip="Target length for summary generation"
            sx={styles.label}
          />
          <FormInput
            type="text"
            inputMode="numeric"
            value={formData.summary_llm_settings.max_tokens}
            onChange={e => handleSummaryLLMInputChange(e, 'max_tokens', true)}
            error={!!errors.summary_llm_settings?.max_tokens}
            helperText={errors.summary_llm_settings?.max_tokens || ' '}
            disabled={!isEnabled || !formData.enable_summarization}
            inputProps={{
              pattern: '[1-9][0-9]*',
            }}
            sx={styles.formInput}
          />
        </Box>
      </Box>
    </Box>
  );
});

ContextStrategySummarization.displayName = 'ContextStrategySummarization';

/** @type {MuiSx} */
const summarizationStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    paddingRight: '1rem',
  },
  toggleSection: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '0.5rem',
  },
  toggleLabel: {
    gap: '0.7rem',
    marginTop: '-1rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sectionSummaryModel: {
    gap: '0.65rem',
    overflow: 'hidden',
  },
  sectionSummarizationInstruction: {
    gap: 0,
    marginBottom: '1.15rem',
  },
  label: {
    paddingLeft: '0.75rem',
  },
  formInput: {
    padding: '0rem',
    margin: '0rem',
  },
  selectInput: {
    '& .MuiSelect-select': {
      '& .MuiBox-root': {
        overflow: 'hidden',
        '& .MuiTypography-root': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
      },
    },
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0rem 1rem',
  },
  menuItemContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
});

export default ContextStrategySummarization;
