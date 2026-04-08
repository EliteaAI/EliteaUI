import React, { useCallback, useMemo, useState } from 'react';

import Split from 'react-split';

import { Box, Dialog, DialogContent, FormControl, IconButton, Typography, useTheme } from '@mui/material';

import { Field } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import {
  detectContentType,
  getExtensionsByLang,
  languageOptions,
} from '@/hooks/useCodeMirrorLanguageExtensions';
import useToast from '@/hooks/useToast';
import { EditorView } from '@codemirror/view';

import CloseIcon from '../Icons/CloseIcon';
import CopyIcon from '../Icons/CopyIcon';

const ToolModal = ({ open, onClose, toolData, title = '', input = '', output = '' }) => {
  const theme = useTheme();
  const { toastInfo } = useToast();

  // State for format selection
  const [inputFormat, setInputFormat] = useState('auto');
  const [outputFormat, setOutputFormat] = useState('auto');

  // Available format options from the shared language extensions
  const formatOptions = useMemo(() => [{ value: 'auto', label: 'Auto-detect' }, ...languageOptions], []);

  const getLanguageExtension = useCallback((format, content) => {
    const actualFormat = format === 'auto' ? detectContentType(content) : format;

    // Use the shared language extension system and always add word wrapping
    const { extensionWithoutLinter } = getExtensionsByLang(actualFormat);
    return [...extensionWithoutLinter, EditorView.lineWrapping];
  }, []);

  const handleCopyToClipboard = useCallback(
    text => {
      navigator.clipboard.writeText(text).then(() => {
        toastInfo('Content copied to clipboard');
      });
    },
    [toastInfo],
  );

  const modalTitle = title || (toolData ? `${toolData.toolName} - ${toolData.status || ''}` : 'Tool Details');

  const handleInputFormatChange = useCallback(value => {
    setInputFormat(value);
  }, []);

  const handleOutputFormatChange = useCallback(value => {
    setOutputFormat(value);
  }, []);

  const handleCopyInput = useCallback(() => {
    handleCopyToClipboard(input);
  }, [handleCopyToClipboard, input]);

  const handleCopyOutput = useCallback(() => {
    handleCopyToClipboard(output);
  }, [handleCopyToClipboard, output]);

  const renderFormatSelector = useCallback(
    (currentFormat, onChangeHandler) => (
      <FormControl
        size="small"
        sx={{ minWidth: 120 }}
      >
        <SingleSelect
          sx={{ marginBottom: '0px' }}
          label={''}
          value={currentFormat}
          onValueChange={onChangeHandler}
          options={formatOptions || []}
          inputSX={{
            padding: '0px 0px !important',
            '& .MuiInput-input': {
              paddingBottom: '3px !important',
            },
            '& .MuiSelect-icon': {
              top: 'calc(50% - 9px) !important',
            },
          }}
        />
      </FormControl>
    ),
    [formatOptions],
  );

  const handleKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      onKeyDown={handleKeyDown}
      maxWidth="xl"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: theme.palette.background.secondary,
            border: `1px solid ${theme.palette.border.lines}`,
            borderRadius: '16px',
            boxShadow: theme.palette.boxShadow.default,
            maxWidth: '1200px',
            minHeight: '80vh',
            maxHeight: '90vh',
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
          padding: '16px 32px',
          backgroundColor: theme.palette.background.tabPanel,
          borderBottom: `1px solid ${theme.palette.border.lines}`,
          borderRadius: '16px 16px 0 0',
        }}
      >
        <Typography
          variant="headingMedium"
          sx={{
            color: theme.palette.text.secondary,
            flex: 1,
          }}
        >
          {modalTitle}
        </Typography>

        <IconButton
          onClick={onClose}
          variant="elitea"
          color="tertiary"
          sx={{
            padding: '6px',
          }}
        >
          <CloseIcon
            sx={{
              fontSize: 16,
              fill: theme.palette.icon.fill.default,
            }}
          />
        </IconButton>
      </Box>

      {/* Content */}
      <DialogContent
        sx={{
          padding: 0,
          height: 'calc(80vh - 80px)',
          minHeight: '500px',
          maxHeight: 'calc(90vh - 80px)',
          backgroundColor: theme.palette.background.secondary,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          '& .split': {
            display: 'flex',
            height: '100%',
            flex: 1,
            minHeight: 0,
          },
          '& .gutter': {
            backgroundColor: theme.palette.border.lines,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '50%',
            width: '8px',
            cursor: 'col-resize',
            transition: 'background-color 0.2s ease',
            '&:hover': {
              backgroundColor: theme.palette.border.table,
            },
          },
          '& .gutter.gutter-horizontal': {
            backgroundImage: `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+YMBxO7BwNP24cZmIACdSEgB0BDL/8DgCQKjF2QqBKgAAAAAElFTkSuQmCC')`,
          },
        }}
      >
        <Split
          className="split"
          sizes={[50, 50]}
          minSize={300}
          expandToMin={false}
          gutterSize={8}
          gutterAlign="center"
          snapOffset={30}
          dragInterval={1}
          direction="horizontal"
          cursor="col-resize"
        >
          {/* Input Section */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: '150px',
              overflow: 'hidden',
            }}
          >
            {/* Input Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
                padding: '12px 24px',
                backgroundColor: theme.palette.background.tabPanel,
                borderBottom: `1px solid ${theme.palette.border.lines}`,
                minHeight: '52px',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="subtitle"
                  sx={{
                    color: theme.palette.text.primary,
                  }}
                >
                  INPUT
                </Typography>
                {renderFormatSelector(inputFormat, handleInputFormatChange)}
              </Box>

              <IconButton
                onClick={handleCopyInput}
                variant="elitea"
                color="tertiary"
                sx={{
                  padding: '6px',
                }}
              >
                <CopyIcon
                  sx={{
                    fontSize: 16,
                  }}
                />
              </IconButton>
            </Box>

            {/* Input Content */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <Field.CodeMirrorEditor
                value={input}
                readOnly={true}
                extensions={getLanguageExtension(inputFormat, input)}
                autoHeight={true}
                maxHeight="calc(80vh - 125px)"
                variant="caption"
                width="100%"
                height="100%"
              />
            </Box>
          </Box>

          {/* Output Section */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: '150px',
              overflow: 'hidden',
            }}
          >
            {/* Output Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
                padding: '12px 24px',
                backgroundColor: theme.palette.background.tabPanel,
                borderBottom: `1px solid ${theme.palette.border.lines}`,
                minHeight: '52px',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="subtitle"
                  sx={{
                    color: theme.palette.text.primary,
                  }}
                >
                  OUTPUT
                </Typography>
                {renderFormatSelector(outputFormat, handleOutputFormatChange)}
              </Box>

              <IconButton
                onClick={handleCopyOutput}
                variant="elitea"
                color="tertiary"
                sx={{
                  padding: '6px',
                }}
              >
                <CopyIcon
                  sx={{
                    fontSize: 16,
                  }}
                />
              </IconButton>
            </Box>

            {/* Output Content */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <Field.CodeMirrorEditor
                value={output}
                readOnly={true}
                extensions={getLanguageExtension(outputFormat, output)}
                autoHeight={true}
                maxHeight="calc(80vh - 125px)"
                variant="caption"
                width="100%"
                height="100%"
              />
            </Box>
          </Box>
        </Split>
      </DialogContent>
    </Dialog>
  );
};

export default ToolModal;
