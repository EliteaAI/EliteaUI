import { memo, useCallback, useEffect } from 'react';

import { useFormikContext } from 'formik';

import { Box, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import { CONTEXT_WINDOW_COPY } from '@/[fsd]/widgets/context-budget/lib/constants';
import { handleConvertToNumberChange } from '@/[fsd]/widgets/context-budget/lib/validation';
import {
  ContextBudgetStats,
  ContextStrategySystemMessages,
  ContextWindowModeSelector,
  ManualMaxContextTokensField,
  SummarizationSettings,
} from '@/[fsd]/widgets/context-budget/ui';
import ContextAccordion from '@/[fsd]/widgets/context-budget/ui/ContextAccordion';
import CloseIcon from '@/components/Icons/CloseIcon';
import { StyledDialogActions } from '@/components/StyledDialog';

const ContextStrategyModalContent = memo(props => {
  const { onClose, stats, conversationId, expandedAccordions, setExpandedAccordions, isUpdating } = props;
  const styles = componentStyles();
  const { values, errors, setFieldValue, dirty, isValid, isSubmitting, submitForm } = useFormikContext();

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
      const value = event?.target?.type === 'checkbox' ? event?.target?.checked : event?.target?.value;

      if (event?.target?.type === 'checkbox') {
        setFieldValue(field, value);
        return;
      }

      const numericFields = ['preserve_recent_messages', 'manual_max_context_tokens'];
      if (numericFields.includes(field)) {
        handleConvertToNumberChange(value, field, setFieldValue);
        return;
      }

      setFieldValue(field, value);
    },
    [setFieldValue],
  );

  const handleWindowModeChange = useCallback(
    mode => setFieldValue('context_window_mode', mode),
    [setFieldValue],
  );

  return (
    <>
      <DialogTitle sx={styles.dialogTitle}>
        <Box sx={styles.dialogTitleContent}>
          <Box sx={styles.titleWithIcon}>
            <Typography
              variant="headingMedium"
              color="text.secondary"
            >
              Context Management
            </Typography>
            <InfoTooltip infoTooltip="Configure how chat context is managed and optimized" />
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
          <ContextBudgetStats
            stats={stats}
            conversationId={conversationId}
          />

          <ContextAccordion
            title="Context Management"
            expanded={expandedAccordions.contextManagement}
            onChange={(e, isExpanded) =>
              setExpandedAccordions(prev => ({ ...prev, contextManagement: isExpanded }))
            }
            content={
              <Box sx={styles.sectionContent}>
                <ContextWindowModeSelector
                  value={values.context_window_mode}
                  onChange={handleWindowModeChange}
                  balancedWindowTokens={stats?.balancedWindowTokens}
                  fullWindowTokens={stats?.fullWindowTokens}
                />
                {stats?.manualMaxTokensEnabled && (
                  <ManualMaxContextTokensField
                    value={values.manual_max_context_tokens}
                    error={errors.manual_max_context_tokens}
                    onChange={e => handleInputChange(e, 'manual_max_context_tokens')}
                  />
                )}
                <SummarizationSettings />
              </Box>
            }
          />

          <ContextAccordion
            title="Persona Management"
            expanded={expandedAccordions.personaManagement}
            onChange={(e, isExpanded) =>
              setExpandedAccordions(prev => ({ ...prev, personaManagement: isExpanded }))
            }
            content={
              <ContextStrategySystemMessages
                formData={values}
                errors={errors}
                handleInputChange={handleInputChange}
              />
            }
          />
        </Box>
      </DialogContent>

      <StyledDialogActions sx={styles.dialogActions}>
        <Typography
          variant="bodySmall"
          color="text.default"
          sx={styles.footerNote}
        >
          {CONTEXT_WINDOW_COPY.APPLIES_NEXT}
        </Typography>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          onClick={onClose}
          color={BUTTON_COLORS.secondary}
        >
          Cancel
        </Button.BaseBtn>
        <Button.BaseBtn
          type="submit"
          variant={BUTTON_VARIANTS.contained}
          disabled={isUpdating || !dirty || !isValid || isSubmitting}
          data-testid="context-modal-save-button"
        >
          {isUpdating ? 'Saving...' : 'Save'}
        </Button.BaseBtn>
      </StyledDialogActions>
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
      backgroundColor: palette.background.surface.interactive.selected,
    },
  }),
  closeIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    fill: palette.icon.default,
  }),
  dialogContent: ({ palette }) => ({
    width: '100%',
    backgroundColor: palette.background.default.secondary,
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
  sectionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingRight: '1rem',
  },
  footerNote: {
    flex: 1,
  },
  dialogActions: ({ palette }) => ({
    flexDirection: 'row',
    padding: '0.9rem !important',
    gap: '.3rem',
    width: '100%',
    position: 'sticky',
    bottom: 0,
    backgroundColor: palette.background.default.secondary,
    zIndex: 1,
  }),
});

export default ContextStrategyModalContent;
