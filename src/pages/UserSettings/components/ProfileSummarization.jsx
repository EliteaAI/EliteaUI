import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { ContextBudgetUI } from '@/[fsd]/widgets/ContextBudget';
import { handleConvertToNumberChange } from '@/[fsd]/widgets/ContextBudget/lib/validation';

import { createContextStrategyFormData, parseModelValue } from '../profileUtils';

const ProfileSummarization = memo(props => {
  const { modelList } = props;

  const { values, errors, setFieldValue } = useFormikContext();

  const styles = profileSummarizationStyles();

  // Create adapter for ContextStrategy components
  const contextFormData = useMemo(() => createContextStrategyFormData(values), [values]);

  // Map errors for ContextStrategy components
  const contextErrors = useMemo(
    () => ({
      summary_llm_settings: errors.summary_llm_settings,
    }),
    [errors],
  );

  // Field mapping for ContextStrategy components
  const fieldMapping = useMemo(
    () => ({
      enable_summarization: 'enable_summarization',
    }),
    [],
  );

  // Handler factory for ContextStrategy components
  const handleInputChange = useCallback(
    (event, field) => {
      const value = event?.target?.type === 'checkbox' ? event?.target?.checked : event?.target?.value;
      const formikField = fieldMapping[field] || field;

      if (event?.target?.type === 'checkbox') {
        setFieldValue(formikField, value);
        return;
      }

      handleConvertToNumberChange(value, formikField, setFieldValue);
    },
    [fieldMapping, setFieldValue],
  );

  const handleSummaryLLMInputChange = useCallback(
    (event, field, isNumeric = false) => {
      const value = event?.target?.value;

      if (field === 'model_name') {
        const { modelName, modelProjectId } = parseModelValue(value);
        setFieldValue('summary_llm_settings.model_name', modelName);
        setFieldValue('summary_llm_settings.model_project_id', modelProjectId);
      } else if (isNumeric) {
        handleConvertToNumberChange(value, `summary_llm_settings.${field}`, setFieldValue);
      } else {
        setFieldValue(`summary_llm_settings.${field}`, value);
      }
    },
    [setFieldValue],
  );

  return (
    <BasicAccordion
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      defaultExpanded
      accordionSX={styles.accordion}
      items={[
        {
          title: 'Default Summarization',
          content: (
            <Box sx={styles.accordionContent}>
              {/* Reuse ContextStrategySummarization */}
              <ContextBudgetUI.ContextStrategySummarization
                formData={contextFormData}
                errors={contextErrors}
                handleInputChange={handleInputChange}
                handleSummaryLLMInputChange={handleSummaryLLMInputChange}
                isEnabled={values.context_enabled}
                modelList={modelList}
                enableAutoBlur={false}
              />
            </Box>
          ),
        },
      ]}
    />
  );
});

ProfileSummarization.displayName = 'ProfileSummarization';

/** @type {MuiSx} */
const profileSummarizationStyles = () => ({
  accordion: {
    background: 'transparent !important',
  },
  accordionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingRight: '1rem',
    paddingTop: '0.6rem',
  },
});

export default ProfileSummarization;
