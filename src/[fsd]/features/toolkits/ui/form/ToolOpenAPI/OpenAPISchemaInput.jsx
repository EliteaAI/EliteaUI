import { memo, useCallback, useMemo, useState } from 'react';

import YAML from 'js-yaml';

import { Box, FormControl, FormHelperText, IconButton, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { OpenApiHelpers } from '@/[fsd]/features/toolkits/lib/helpers';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Field, Modal } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import FullscreenIcon from '@/assets/full-screen-icon.svg?react';
import { useLanguageLinter } from '@/hooks/useCodeMirrorLanguageExtensions';
import useToast from '@/hooks/useToast';

const OpenAPISchemaInput = memo(props => {
  const { containerSX = {}, value, onValueChange, error, helperText, onSyntaxError, setToolErrors } = props;
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { toastError } = useToast();
  const styles = getStyles(isDragOver);

  const onDragOver = useCallback(event => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(event => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const parseSchemaActions = useCallback(
    (data, showError) => {
      let fileData = '';
      try {
        try {
          fileData = JSON.parse(data);
        } catch {
          fileData = YAML.load(data);
        }
        if (!fileData || !fileData['paths']) {
          showError && toastError('Invalid Open API schema file!');
          setToolErrors(prevErrors => ({
            ...prevErrors,
            openApiSchema: true,
          }));
          return { parsedActions: [], fileData, description: '' };
        }
      } catch {
        showError && toastError('Invalid Open API schema file!');
        setToolErrors(prevErrors => ({
          ...prevErrors,
          openApiSchema: true,
        }));
        return { parsedActions: [], fileData, description: '' };
      }
      const parsedActions = OpenApiHelpers.openAPIExtract(fileData);
      const description = fileData?.description || fileData?.info?.description || '';
      setToolErrors(prevErrors =>
        prevErrors.openApiSchema
          ? {
              ...prevErrors,
              openApiSchema: false,
            }
          : prevErrors,
      );
      return { parsedActions, fileData, description };
    },
    [setToolErrors, toastError],
  );

  const handleFile = useCallback(
    isForDragDrop => event => {
      event.preventDefault();
      setIsDragOver(false);
      const reader = new FileReader();
      const file = isForDragDrop ? event.dataTransfer.files[0] : event.target.files[0];

      reader.onload = async e => {
        const contents = e.target.result;
        const { parsedActions, fileData, description } = parseSchemaActions(contents, true);
        const schemaString = fileData ? JSON.stringify(fileData, null, 2) : '';
        onValueChange(schemaString, parsedActions, description);
      };
      reader.readAsText(file);
    },
    [onValueChange, parseSchemaActions],
  );

  const onClickChooseFile = useCallback(() => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json,.txt,.yml,.yaml';

    fileInput.onchange = handleFile(false);
    fileInput.click();
  }, [handleFile]);

  const onChangeSchema = useCallback(
    newValue => {
      const { parsedActions, description } = parseSchemaActions(newValue, false);
      onValueChange(newValue, parsedActions, description);
    },
    [onValueChange, parseSchemaActions],
  );

  const detectedLanguage = useMemo(() => {
    try {
      JSON.parse(value);
      return 'json';
    } catch {
      return 'yaml';
    }
  }, [value]);

  const { extensions } = useLanguageLinter(detectedLanguage);

  const handleOpenFullScreen = useCallback(() => {
    setIsFullScreen(true);
  }, []);

  const handleCloseFullScreen = useCallback(() => {
    setIsFullScreen(false);
  }, []);

  return (
    <Box sx={[styles.container, containerSX]}>
      <BasicAccordion
        showMode={AccordionConstants.AccordionShowMode.LeftMode}
        accordionSX={styles.accordionSX}
        summarySX={styles.accordionSummarySX}
        items={[
          {
            title: 'Schema',
            content: (
              <FormControl
                error={!!error}
                sx={styles.formControl}
              >
                <Box
                  sx={styles.editorWrapper}
                  onDrop={handleFile(true)}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                >
                  <Box
                    aria-label="full-scrn-btn"
                    sx={styles.fullScreenWrapper}
                  >
                    <Tooltip
                      title="Full screen view"
                      placement="top"
                    >
                      <IconButton
                        variant="alita"
                        color="tertiary"
                        onClick={handleOpenFullScreen}
                      >
                        <FullscreenIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  {!value && (
                    <Typography
                      sx={styles.placeholderText}
                      variant="bodyMedium"
                    >
                      Enter or drag&drop your OpenAPI schema here, or &nbsp;
                      <Box
                        component="span"
                        sx={styles.chooseFileLink}
                        onClick={onClickChooseFile}
                      >
                        choose file
                      </Box>
                    </Typography>
                  )}
                  <Field.CodeMirrorEditor
                    value={value || ''}
                    notifyChange={onChangeSchema}
                    extensions={extensions}
                    onSyntaxError={onSyntaxError}
                    {...styles.editor}
                  />
                </Box>
                <FormHelperText>{error ? helperText : undefined}</FormHelperText>
              </FormControl>
            ),
          },
        ]}
      />

      {isFullScreen && (
        <Modal.StyledInputModalBase
          open={isFullScreen}
          onClose={handleCloseFullScreen}
          title="Schema"
          value={value}
          specifiedLanguage={detectedLanguage}
          disableSelectLanguage
        >
          <Box sx={styles.fullscreenEditorContainer}>
            <Box sx={styles.fullscreenEditorWrapper}>
              <Field.CodeMirrorEditor
                value={value || ''}
                notifyChange={onChangeSchema}
                extensions={extensions}
                variant="bodyMedium"
                onSyntaxError={onSyntaxError}
              />
            </Box>
          </Box>
        </Modal.StyledInputModalBase>
      )}
    </Box>
  );
});

OpenAPISchemaInput.displayName = 'OpenAPISchemaInput';

/** @type {MuiSx} */
const getStyles = isDragOver => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '0.5rem',
  },
  formControl: {
    width: '100%',
    height: '25rem',
    padding: '0.5rem 0rem',
    boxSizing: 'border-box',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  editorWrapper: {
    height: '100%',
    width: '100%',
    position: 'relative',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    border: ({ palette }) => `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: ({ palette }) => (isDragOver ? palette.text.contextHighLight : 'transparent'),
    '&:hover': {
      '& [aria-label="full-scrn-btn"]': { display: 'block' },
    },
    '& .cm-editor': {
      height: '24.375rem !important',
      maxHeight: '24.375rem !important',
      borderRadius: '0.5rem',
      backgroundColor: 'transparent',
    },
    '& .cm-scroller': {
      maxHeight: '24.375rem !important',
      overflow: 'auto !important',
    },
    '& .cm-content': {
      padding: '0.5rem',
      height: 'auto',
    },
    '& .cm-gutters': {
      borderRadius: '0.5rem 0 0 0.5rem',
    },
  },
  editor: {
    height: '100%',
    minHeight: '100%',
    maxHeight: '100%',
    variant: 'bodyMedium',
  },
  placeholderText: {
    position: 'absolute',
    top: '0.5rem',
    left: '3.625rem',
    zIndex: 100,
    pointerEvents: 'none',
    color: ({ palette }) => palette.text.button.disabled,
  },
  chooseFileLink: {
    textDecoration: 'underline',
    cursor: 'pointer',
    pointerEvents: 'auto',
  },
  fullscreenEditorContainer: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
  },
  fullScreenWrapper: {
    position: 'absolute',
    display: 'none',
    top: '0.25rem',
    right: '0.25rem',
    zIndex: 10,
    '& svg': {
      width: '0.7rem',
      height: '0.7rem',
    },
    '&:hover': {
      button: {
        background: 'transparent',
      },
    },
  },
  fullscreenEditorWrapper: ({ palette }) => ({
    flex: 1,
    height: '100%',
    position: 'relative',
    '& .cm-editor': {
      backgroundColor: palette.background.default,
    },
    '& .cm-scroller': {
      backgroundColor: palette.background.default,
    },
    '& .cm-gutters': {
      backgroundColor: palette.background.tabPanel,
      borderRight: 'none',
    },
  }),
  accordionSX: {
    background: ({ palette }) => `${palette.background.tabPanel} !important`,
  },
  accordionSummarySX: {
    '& .MuiAccordionSummary-content': { alignItems: 'center', paddingRight: 0 },
    paddingRight: '0 !important',
  },
});

export default OpenAPISchemaInput;
