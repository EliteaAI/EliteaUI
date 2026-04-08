import { memo, useCallback, useEffect } from 'react';

import { useFormikContext } from 'formik';

import {
  Box,
  Button,
  DialogContent,
  DialogTitle,
  IconButton,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { SEPARATOR } from '@/[fsd]/widgets/ContextBudget/lib/constants';
import { handleConvertToNumberChange } from '@/[fsd]/widgets/ContextBudget/lib/validation';
import {
  ContextBudgetStats,
  ContextStrategySummarization,
  ContextStrategySystemMessages,
  ContextStrategyTokenManagement,
} from '@/[fsd]/widgets/ContextBudget/ui';
import AlertDialog from '@/components/AlertDialog';
import CloseIcon from '@/components/Icons/CloseIcon';
import InfoIcon from '@/components/Icons/InfoIcon';
import { StyledDialogActions } from '@/components/StyledDialog';

const parseModelValue = value => {
  const [modelName, modelProjectId] = value.split(SEPARATOR);
  return {
    modelName,
    modelProjectId: Number(modelProjectId),
  };
};

const ContextAccordion = memo(props => {
  const { title, content, expanded, isEnabled, onChange } = props;

  return (
    <BasicAccordion
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      expanded={expanded}
      onChange={onChange}
      accordionSX={{
        background: 'transparent !important',
        opacity: isEnabled ? 1 : 0.6,
        pointerEvents: isEnabled ? 'auto' : 'none',
      }}
      items={[
        {
          title,
          content,
        },
      ]}
    />
  );
});

ContextAccordion.displayName = 'ContextAccordion';

const ContextStrategyModalContent = memo(props => {
  const {
    onClose,
    stats,
    conversationId,
    // isHighUtilization, // HIDDEN: Optimize context temporarily disabled
    expandedAccordions,
    setExpandedAccordions,
    showOptimizeDialog,
    // handleOptimizeClick, // HIDDEN: Optimize context temporarily disabled
    handleOptimizeCancel,
    handleOptimizeNow,
    isOptimizing,
    isUpdating,
    modelList,
  } = props;
  const styles = componentStyles();
  const { values, errors, setFieldValue, dirty, isValid, isSubmitting, submitForm } = useFormikContext();

  // Collapse/expand context-dependent accordions when Content Management toggle changes
  useEffect(() => {
    setExpandedAccordions({
      tokenManagement: values.enabled,
      summarization: values.enabled,
      systemMessages: values.enabled,
    });
  }, [values.enabled, setExpandedAccordions]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' && !isUpdating && dirty && isValid && !isSubmitting) {
        event.preventDefault();
        submitForm();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    },
    [isUpdating, dirty, isValid, isSubmitting, submitForm, onClose],
  );

  useEffect(() => {
    const handleKeyDownEvent = event => handleKeyDown(event);
    document.addEventListener('keydown', handleKeyDownEvent);
    return () => {
      document.removeEventListener('keydown', handleKeyDownEvent);
    };
  }, [handleKeyDown]);

  const handleInputChange = useCallback(
    (event, field) => {
      if (field === 'enabled') {
        setFieldValue(field, event?.target?.checked);
        return;
      }

      const value = event?.target?.type === 'checkbox' ? event?.target?.checked : event?.target?.value;

      if (event?.target?.type === 'checkbox') {
        setFieldValue(field, value);
        return;
      }

      const numericFields = ['max_context_tokens', 'preserve_recent_messages'];
      if (numericFields.includes(field)) {
        handleConvertToNumberChange(value, field, setFieldValue);
        return;
      }

      setFieldValue(field, value);
    },
    [setFieldValue],
  );

  const handleSummaryLLMInputChange = useCallback(
    (event, field, isNumeric = false) => {
      const value = event?.target?.value;

      if (field === 'model_name') {
        const { modelName, modelProjectId } = parseModelValue(value);
        setFieldValue('summary_llm_settings.model_name', modelName);
        setFieldValue('summary_llm_settings.model_project_id', modelProjectId);
        return;
      }

      if (isNumeric) {
        handleConvertToNumberChange(value, `summary_llm_settings.${field}`, setFieldValue);
        return;
      }

      setFieldValue(`summary_llm_settings.${field}`, value);
    },
    [setFieldValue],
  );

  return (
    <>
      <DialogTitle sx={styles.dialogTitle}>
        <Box sx={styles.dialogTitleContent}>
          <Box sx={styles.dialogTitleLeft}>
            <Switch
              size="small"
              checked={values.enabled}
              onChange={e => handleInputChange(e, 'enabled')}
              color="primary"
            />
            <Box sx={styles.titleWithIcon}>
              <Typography
                variant="headingMedium"
                color="text.secondary"
              >
                Context Management
              </Typography>
              <Tooltip title="Configure how conversation context is managed and optimized">
                <Box sx={styles.infoIconContainer}>
                  <InfoIcon />
                </Box>
              </Tooltip>
            </Box>
          </Box>
          <IconButton
            variant="elitea"
            color="tertiary"
            onClick={onClose}
            aria-label="Close modal"
            sx={styles.closeButton}
          >
            <CloseIcon sx={styles.closeIcon} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={styles.dialogContent}>
        <Box sx={styles.contentContainer}>
          {/* HIDDEN: Optimize context functionality temporarily disabled
          {isHighUtilization && (
            <Box sx={styles.warningBanner}>
              <Typography
                variant="bodySmall"
                sx={styles.warningText}
              >
                {CONTEXT_MESSAGES.HIGH_USAGE_WARNING}
              </Typography>
              <Button
                variant="elitea"
                color="secondary"
                size="small"
                onClick={handleOptimizeClick}
                disabled={isOptimizing}
                sx={styles.summarizeButton}
              >
                {isOptimizing ? 'Optimizing...' : 'Optimize now'}
              </Button>
            </Box>
          )}
          */}

          <ContextBudgetStats
            stats={stats}
            conversationId={conversationId}
          />

          <ContextAccordion
            title="Context Strategy & Token Management"
            expanded={expandedAccordions.tokenManagement}
            isEnabled={values.enabled}
            onChange={(e, isExpanded) =>
              setExpandedAccordions(prev => ({ ...prev, tokenManagement: isExpanded }))
            }
            content={
              <ContextStrategyTokenManagement
                formData={values}
                errors={errors}
                handleInputChange={handleInputChange}
                isEnabled={values.enabled}
              />
            }
          />

          <ContextAccordion
            title="Summarization"
            expanded={expandedAccordions.summarization}
            isEnabled={values.enabled}
            onChange={(e, isExpanded) =>
              setExpandedAccordions(prev => ({ ...prev, summarization: isExpanded }))
            }
            content={
              <ContextStrategySummarization
                formData={values}
                errors={errors}
                handleInputChange={handleInputChange}
                handleSummaryLLMInputChange={handleSummaryLLMInputChange}
                isEnabled={values.enabled}
                modelList={modelList}
              />
            }
          />

          <ContextAccordion
            title="User Instructions"
            expanded={expandedAccordions.systemMessages}
            isEnabled={values.enabled}
            onChange={(e, isExpanded) =>
              setExpandedAccordions(prev => ({ ...prev, systemMessages: isExpanded }))
            }
            content={
              <ContextStrategySystemMessages
                formData={values}
                errors={errors}
                handleInputChange={handleInputChange}
                isEnabled={values.enabled}
              />
            }
          />
        </Box>
      </DialogContent>

      <StyledDialogActions sx={styles.dialogActions}>
        <Button
          variant="elitea"
          onClick={onClose}
          color="secondary"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isUpdating || !dirty || !isValid || isSubmitting}
        >
          {isUpdating ? 'Saving...' : 'Save'}
        </Button>
      </StyledDialogActions>

      <AlertDialog
        open={showOptimizeDialog}
        onClose={handleOptimizeCancel}
        onCancel={handleOptimizeCancel}
        onConfirm={handleOptimizeNow}
        alarm
        title="Warning"
        alertContent="This will optimize context by pruning messages. This can't be undone. Continue?"
        confirming={isOptimizing}
      />
    </>
  );
});

ContextStrategyModalContent.displayName = 'ContextStrategyModalContent';

/** @type {MuiSx} */
const componentStyles = () => ({
  dialogTitle: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '0.9rem 1.5rem',
  },
  dialogTitleContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  dialogTitleLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  titleWithIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  infoIconContainer: {
    cursor: 'pointer',
  },
  closeButton: ({ palette }) => ({
    padding: '0.5rem',
    '&:hover': {
      backgroundColor: palette.background.button.secondary.hover,
    },
  }),
  closeIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    fill: palette.icon.fill.default,
  }),
  dialogContent: ({ palette }) => ({
    width: '100%',
    backgroundColor: palette.background.secondary,
    borderTop: `.0625rem solid ${palette.border.lines}`,
    borderBottom: `.0625rem solid ${palette.border.lines}`,
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 12.5rem)',
  }),
  contentContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  warningBanner: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 1rem',
    backgroundColor: `${palette.warning.yellow}14`, // #E8B747 at 8% opacity (14 in hex)
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.warning.yellow}66`, // #E8B747 at 40% opacity (66 in hex)
    marginTop: '1rem',
    marginBottom: '0.25rem',
  }),
  warningText: ({ palette }) => ({
    flex: 1,
    color: palette.text.secondary,
  }),
  summarizeButton: {
    flexShrink: 0,
  },
  dialogActions: ({ palette }) => ({
    flexDirection: 'row',
    padding: '0.9rem !important',
    gap: '.3rem',
    width: '100%',
    position: 'sticky',
    bottom: 0,
    backgroundColor: palette.background.default,
    zIndex: 1,
  }),
});

export default ContextStrategyModalContent;
