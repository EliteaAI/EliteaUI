import React, { useCallback, useState } from 'react';

import { Form, Formik } from 'formik';

import { Alert, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import AlertDialog from '@/components/AlertDialog';
import DirtyDetector from '@/components/Formik/DirtyDetector';
import useEditorNavBlocking from '@/hooks/useEditorNavBlocking';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import EditorHeader from '@/pages/NewChat/components/EditorHeader';

/**
 * Base editor component that provides common functionality for all editor types
 * (Agent, Pipeline, Toolkit, etc.)
 *
 * @param {boolean} isVisible - Whether the editor is visible
 * @param {boolean} isDirty - Whether the form has unsaved changes (can be composite)
 * @param {function} setIsDirty - Callback to update dirty state from DirtyDetector
 * @param {function} onClose - Handler for closing the editor
 * @param {string} title - Editor title (entity name)
 * @param {string} subtitle - Optional subtitle (version name, etc.)
 * @param {function} onDiscard - Handler for discarding changes
 * @param {React.ReactNode} saveButton - Save button component to render
 * @param {object} initialValues - Formik initial values
 * @param {object} validationSchema - Yup validation schema (optional)
 * @param {object} error - API error object (optional)
 * @param {function} onCloseError - Handler for closing error alert
 * @param {React.ReactNode} children - Editor-specific content
 * @param {function} onDirtyStateChange - Optional callback when dirty state changes
 * @param {React.ReactNode} formContent - Optional content to render between header and main content (e.g., tabs)
 */
const BaseEditor = ({
  isVisible,
  isDirty,
  setIsDirty,
  onClose,
  title,
  subtitle,
  onDiscard,
  saveButton,
  initialValues = {},
  validationSchema,
  error,
  onCloseError,
  children,
  onDirtyStateChange,
  formContent,
  isPublic,
  contentSX,
}) => {
  const theme = useTheme();
  const { isSmallWindow } = useIsSmallWindow();

  // State for warning dialog
  const [showWarning, setShowWarning] = useState(false);

  // Use the editor navigation blocking hook
  const { setBlockNav } = useEditorNavBlocking(isVisible, isDirty);

  const handleCancel = useCallback(() => {
    if (isDirty && !isPublic) {
      setShowWarning(true);
    } else {
      if (isDirty) {
        onDiscard?.();
      }
      onClose?.();
    }
  }, [isDirty, isPublic, onClose, onDiscard]);

  const handleDialogConfirm = useCallback(() => {
    setShowWarning(false);
    onClose?.();
  }, [onClose]);

  const handleDialogCancel = () => {
    setShowWarning(false);
  };

  const handleCloseError = () => {
    onCloseError?.();
  };

  const handleIsDirtyChange = useCallback(
    newIsDirty => {
      setIsDirty?.(newIsDirty);
      onDirtyStateChange?.(newIsDirty);
    },
    [setIsDirty, onDirtyStateChange],
  );

  const handleDiscard = useCallback(() => {
    onDiscard?.();
    setIsDirty?.(false);
    setBlockNav(false);
  }, [onDiscard, setIsDirty, setBlockNav]);

  const styles = baseEditorStyles(isVisible, isSmallWindow, theme);

  return (
    <Box sx={styles.container}>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={validationSchema}
      >
        <Form style={styles.form}>
          <DirtyDetector setDirty={handleIsDirtyChange} />
          <EditorHeader
            title={title}
            subtitle={subtitle}
            onCancel={handleCancel}
            onDiscard={handleDiscard}
            saveButton={saveButton}
            isPublic={isPublic}
          />

          {/* Optional form content (e.g., tabs) */}
          {formContent}

          {/* Main content area */}
          <Box sx={[styles.content, contentSX]}>
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                onClose={handleCloseError}
              >
                {error?.data?.message || error?.message || 'Failed to load configuration'}
              </Alert>
            )}
            {children}
          </Box>
        </Form>
      </Formik>

      {/* Discard changes warning dialog */}
      <AlertDialog
        title={'Warning'}
        alertContent={'You are editing now. Do you want to discard current changes and continue?'}
        open={showWarning}
        alarm
        onClose={handleDialogCancel}
        onCancel={handleDialogCancel}
        onConfirm={handleDialogConfirm}
        confirmButtonText="Confirm"
      />
    </Box>
  );
};

BaseEditor.displayName = 'BaseEditor';

/** @type {MuiSx} */
const baseEditorStyles = (isVisible, isSmallWindow, theme) => ({
  container: {
    display: isVisible ? 'flex' : 'none',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '100%',
    minHeight: '100%',
    width: '100%',
    justifyContent: 'flex-start',
    minWidth: isSmallWindow ? '100%' : '240px',
    background: theme.palette.background.tabPanel,
    border: `1px solid ${theme.palette.border.lines}`,
    borderRadius: '16px',
    overflow: 'hidden',
    position: 'relative',
  },
  form: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flexGrow: 1,
    overflow: 'auto',
    width: '100%',
    padding: '16px',
  },
});

export default BaseEditor;
