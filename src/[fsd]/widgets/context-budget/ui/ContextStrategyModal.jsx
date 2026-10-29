import React, { memo, useEffect, useMemo, useState } from 'react';

import { Form, Formik } from 'formik';

import { useDefaultModel, useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { useContextStrategySubmit } from '@/[fsd]/widgets/context-budget/lib/hooks';
import { serializeFormData } from '@/[fsd]/widgets/context-budget/lib/utils';
import { contextStrategyValidationSchema } from '@/[fsd]/widgets/context-budget/lib/validation';
import { useConversationEditMutation, useUpdateContextStrategyMutation } from '@/api';
import { StyledDialog } from '@/components/StyledDialog';

import ContextStrategyModalContent from './ContextStrategyModalContent';

const ContextStrategyModal = memo(props => {
  const {
    open,
    onClose,
    conversationId,
    contextStrategy,
    setActiveConversation,
    stats,
    conversationInstructions,
    persona: conversationPersona,
  } = props;
  const styles = componentStyles();
  const { toastError } = useToast();
  const selectedProjectId = useSelectedProjectId();
  const [updateContextStrategy, { isLoading: isUpdating }] = useUpdateContextStrategyMutation();
  const [updateConversation] = useConversationEditMutation();
  const { defaultModel } = useDefaultModel();

  const [expandedAccordions, setExpandedAccordions] = useState({
    contextManagement: false,
    personaManagement: false,
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
    if (open) {
      setExpandedAccordions({
        contextManagement: true,
        personaManagement: true,
      });
    }
  }, [open]);

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
            expandedAccordions={expandedAccordions}
            setExpandedAccordions={setExpandedAccordions}
            isUpdating={isUpdating}
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
      background: ({ palette }) => `${palette.background.default.tertiary} !important`,
      backgroundColor: ({ palette }) => `${palette.background.default.tertiary} !important`,
    },
  },
});

export default ContextStrategyModal;
