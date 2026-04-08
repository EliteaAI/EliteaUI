import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Form, Formik } from 'formik';

import { useDefaultModel } from '@/[fsd]/shared/lib/hooks';
import { useContextStrategySubmit } from '@/[fsd]/widgets/ContextBudget/lib/hooks';
import { serializeFormData } from '@/[fsd]/widgets/ContextBudget/lib/utils';
import { contextStrategyValidationSchema } from '@/[fsd]/widgets/ContextBudget/lib/validation';
import {
  useConversationEditMutation,
  useOptimizeContextMutation,
  useUpdateContextStrategyMutation,
} from '@/api/chat';
import { StyledDialog } from '@/components/StyledDialog';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import ContextStrategyModalContent from './ContextStrategyModalContent';

const ContextStrategyModal = memo(props => {
  const {
    open,
    onClose,
    conversationId,
    contextStrategy,
    setActiveConversation,
    stats,
    isHighUtilization,
    conversationInstructions,
    persona: conversationPersona,
  } = props;
  const styles = componentStyles();
  const { toastError } = useToast();
  const selectedProjectId = useSelectedProjectId();
  const [updateContextStrategy, { isLoading: isUpdating }] = useUpdateContextStrategyMutation();
  const [updateConversation] = useConversationEditMutation();
  const [optimizeContext, { isLoading: isOptimizing }] = useOptimizeContextMutation();
  const { modelList, defaultModel } = useDefaultModel();

  const [showOptimizeDialog, setShowOptimizeDialog] = useState(false);
  const [expandedAccordions, setExpandedAccordions] = useState({
    tokenManagement: false,
    summarization: false,
    systemMessages: false,
  });

  const initialValues = useMemo(
    () =>
      serializeFormData(
        contextStrategy,
        selectedProjectId,
        defaultModel,
        conversationInstructions,
        conversationPersona,
      ),
    [contextStrategy, selectedProjectId, defaultModel, conversationInstructions, conversationPersona],
  );

  useEffect(() => {
    if (open && initialValues) {
      setExpandedAccordions({
        tokenManagement: initialValues.enabled,
        summarization: initialValues.enabled,
        systemMessages: initialValues.enabled,
      });
    }
  }, [open, initialValues]);

  const handleSubmit = useContextStrategySubmit({
    selectedProjectId,
    conversationId,
    conversationInstructions,
    conversationPersona,
    updateContextStrategy,
    updateConversation,
    setActiveConversation,
    toastError,
  });

  const handleOptimizeNow = useCallback(async () => {
    try {
      setShowOptimizeDialog(false);
      await optimizeContext({
        projectId: selectedProjectId,
        conversationId,
        target_tokens: initialValues?.max_context_tokens,
      }).unwrap();
    } catch (error) {
      toastError(error?.data?.error || 'Failed to optimize context');
      setShowOptimizeDialog(false);
    }
  }, [selectedProjectId, conversationId, optimizeContext, initialValues, toastError]);

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      fullWidth
      sx={styles.dialog}
    >
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={contextStrategyValidationSchema}
        onSubmit={handleSubmit}
      >
        <Form style={styles.form}>
          <ContextStrategyModalContent
            onClose={onClose}
            stats={stats}
            conversationId={conversationId}
            isHighUtilization={isHighUtilization}
            expandedAccordions={expandedAccordions}
            setExpandedAccordions={setExpandedAccordions}
            showOptimizeDialog={showOptimizeDialog}
            handleOptimizeClick={() => setShowOptimizeDialog(true)}
            handleOptimizeCancel={() => setShowOptimizeDialog(false)}
            handleOptimizeNow={handleOptimizeNow}
            isOptimizing={isOptimizing}
            isUpdating={isUpdating}
            modelList={modelList}
          />
        </Form>
      </Formik>
    </StyledDialog>
  );
});

ContextStrategyModal.displayName = 'ContextStrategyModal';

/** @type {MuiSx} */
const componentStyles = () => ({
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
  },
  dialog: {
    '& .MuiDialog-paper': {
      width: '37.5rem', // 600px
      maxWidth: '95vw',
      minWidth: '37.5rem',
      background: ({ palette }) => `${palette.background.tabPanel} !important`,
      backgroundColor: ({ palette }) => `${palette.background.tabPanel} !important`,
    },
  },
});

export default ContextStrategyModal;
