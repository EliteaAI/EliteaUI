import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import FullscreenOutlinedIcon from '@mui/icons-material/FullscreenOutlined';
import { Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import { Box, useTheme } from '@mui/system';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { Field } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import CollapseIcon from '@/assets/collapse-icon.svg?react';
import ExpandIcon from '@/assets/expand-icon.svg?react';
import CloseIcon from '@/components/Icons/CloseIcon';
import CopyIcon from '@/components/Icons/CopyIcon';
import { jsonLinter, languageOptions } from '@/hooks/useCodeMirrorLanguageExtensions';
import useToast from '@/hooks/useToast';
import { json } from '@codemirror/lang-json';

const MIN_HEIGHT = '18.75rem';
const MAX_HEIGHT = '37.5rem';

const CustomNodeInput = memo(({ id }) => {
  const editorRef = useRef();
  const fullScreenEditorRef = useRef();
  const theme = useTheme();

  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [minHeight, setMinHeight] = useState(MIN_HEIGHT);
  const [isHovering, setIsHovering] = useState(false);

  const { toastError, toastInfo } = useToast();
  const { setYamlJsonObject, isRunningPipeline, yamlJsonObject, disabled } = useContext(FlowEditorContext);
  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );

  // eslint-disable-next-line no-unused-vars
  const { id: _id, ...otherProps } = useMemo(() => yamlNode || {}, [yamlNode]);
  const originalJsonString = useMemo(() => JSON.stringify(otherProps, null, 2), [otherProps]);
  const [jsonString, setJsonString] = useState(originalJsonString);

  useEffect(() => {
    setJsonString(originalJsonString);
    setTimeout(() => {
      editorRef.current?.setCode(originalJsonString);
      fullScreenEditorRef.current?.setCode(originalJsonString);
    }, 30);
  }, [originalJsonString]);

  const [error, setError] = useState('');

  const handleChange = useCallback(
    value => {
      setJsonString(value);
      if (fullScreenMode) {
        editorRef.current?.setCode(value);
      } else {
        fullScreenEditorRef.current?.setCode(value);
      }
    },
    [fullScreenMode],
  );

  const handleBlur = useCallback(() => {
    try {
      const obj = {
        id,
        ...JSON.parse(jsonString),
      };
      if (obj.type === undefined) {
        setError('JSON must have name, description, and settings fields');
      } else {
        setError('');
        FlowEditorHelpers.batchUpdateYamlNode(id, obj, yamlJsonObject, setYamlJsonObject, true);
      }
    } catch {
      setError('Invalid node format');
    }
  }, [id, jsonString, setYamlJsonObject, yamlJsonObject]);

  const onFullScreen = useCallback(() => {
    setFullScreenMode(true);
  }, []);
  const onExitFullScreen = useCallback(() => {
    setFullScreenMode(false);
  }, []);
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      toastInfo('The content has been copied to the clipboard');
    } catch {
      toastError('Failed to copy the content!');
      return;
    }
  }, [toastError, toastInfo, jsonString]);

  const onSwitchHeight = useCallback(() => {
    setMinHeight(prev => (prev === MIN_HEIGHT ? MAX_HEIGHT : MIN_HEIGHT));
  }, []);

  const handleKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onExitFullScreen();
    }
  };

  return (
    <>
      <Box
        component="div"
        className="nowheel"
        sx={{ position: 'relative' }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {isHovering && (
          <Box
            position="absolute"
            display="flex"
            justifyContent="flex-end"
            gap=".25rem"
            top=".3125rem"
            right=".75rem"
            zIndex="999"
          >
            <StyledTooltip
              title="Copy to clipboard"
              placement="top"
            >
              <Box component="span">
                <IconButton
                  disabled={!jsonString}
                  sx={{ marginLeft: '0rem' }}
                  variant="alita"
                  color="tertiary"
                  onClick={onCopy}
                >
                  <CopyIcon
                    sx={{ fontSize: '1rem' }}
                    fill={!jsonString ? theme.palette.icon.fill.disabled : undefined}
                  />
                </IconButton>
              </Box>
            </StyledTooltip>
            <StyledTooltip
              title="Full screen view"
              placement="top"
            >
              <IconButton
                sx={{ marginLeft: '0rem' }}
                variant="alita"
                color="tertiary"
                onClick={onFullScreen}
              >
                <FullscreenOutlinedIcon sx={{ fontSize: 21 }} />
              </IconButton>
            </StyledTooltip>
            <StyledTooltip
              title={minHeight === MAX_HEIGHT ? 'Collapse editor' : 'Expand editor'}
              placement="top"
            >
              <IconButton
                sx={{ marginLeft: '0rem' }}
                variant="alita"
                color="tertiary"
                onClick={onSwitchHeight}
              >
                {minHeight === MAX_HEIGHT ? (
                  <CollapseIcon
                    sx={{ fontSize: '1rem' }}
                    fill={theme.palette.icon.fill.secondary}
                  />
                ) : (
                  <ExpandIcon
                    sx={{ fontSize: '1rem' }}
                    fill={theme.palette.icon.fill.secondary}
                  />
                )}
              </IconButton>
            </StyledTooltip>
          </Box>
        )}
        <Field.CodeMirrorEditor
          className="nopan nodrag nowheel"
          value={jsonString}
          extensions={[json(), jsonLinter]}
          readOnly={isRunningPipeline || disabled}
          height={minHeight}
          minHeight={minHeight}
          notifyChange={handleChange}
          onBlur={handleBlur}
          ref={editorRef}
        />
      </Box>
      <Dialog
        open={fullScreenMode}
        onKeyDown={handleKeyDown}
        slotProps={{
          paper: {
            sx: {
              background: theme.palette.background.tabPanel,
              borderRadius: '1rem',
              border: `.0625rem solid ${theme.palette.border.lines}`,
              boxShadow: theme.palette.boxShadow.default,
              marginTop: 0,
              maxWidth: '90vw',
              height: 'calc(100vh - 10rem)',
              marginLeft: '0rem',
              marginRight: '0rem',
              marginBottom: '0rem',
            },
          },
        }}
      >
        <DialogTitle
          variant="headingMedium"
          color="text.secondary"
          sx={{ height: '3.75rem', padding: '1rem 2rem' }}
        >
          <Box
            display={'flex'}
            flexDirection={'row'}
            justifyContent={'space-between'}
            alignItems={'center'}
          >
            Full screen view
            <Box
              display={'flex'}
              alignItems={'center'}
              justifyContent={'flex-end'}
            >
              <Box
                height={'1.5rem'}
                width={'6.25rem'}
                marginRight={'.5rem'}
              >
                <Typography
                  component={'div'}
                  variant="bodyMedium"
                  color={'text.default'}
                >
                  Content type:
                </Typography>
              </Box>
              <Box>
                <SingleSelect
                  value={'json'}
                  options={languageOptions}
                  customSelectedColor={`${theme.palette.text.primary} !important`}
                  customSelectedFontSize={'.875rem'}
                  sx={{ margin: '.3125rem 0 0 0 !important' }}
                  disabled
                />
              </Box>
              <StyledTooltip
                title={'Copy to clipboard'}
                placement="top"
              >
                <IconButton
                  sx={{ marginLeft: '1.25rem' }}
                  variant="alita"
                  color="tertiary"
                  onClick={onCopy}
                >
                  <CopyIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </StyledTooltip>
              <StyledTooltip
                title={'Exit'}
                placement="top"
              >
                <IconButton
                  sx={{ marginLeft: '1.25rem' }}
                  variant="alita"
                  color="tertiary"
                  onClick={onExitFullScreen}
                >
                  <CloseIcon
                    fill={theme.palette.icon.fill.default}
                    sx={{ fontSize: '1rem', cursor: 'pointer' }}
                  />
                </IconButton>
              </StyledTooltip>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            padding: '0rem 0rem !important',
            width: '80vw',
            height: 'calc(100vh - 13.75rem)',
            borderTop: `.0625rem solid ${theme.palette.border.lines}`,
            backgroundColor: theme.palette.background.secondary,
            overflowY: 'hidden',
          }}
        >
          {error && <div style={{ color: 'red' }}>{error}</div>}
          <Field.CodeMirrorEditor
            className="nopan nodrag nowheel"
            value={jsonString}
            extensions={[json(), jsonLinter]}
            readOnly={isRunningPipeline || disabled}
            notifyChange={handleChange}
            onBlur={handleBlur}
            ref={fullScreenEditorRef}
          />
        </DialogContent>
      </Dialog>
    </>
  );
});

CustomNodeInput.displayName = 'CustomNodeInput';

export default CustomNodeInput;
