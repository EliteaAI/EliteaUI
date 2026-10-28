import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Tooltip } from '@mui/material';

import { useLanguageLinter, useToast } from '@/[fsd]/shared/lib/hooks';
import { Button, Field } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import FullscreenOutlinedIcon from '@/assets/full-screen-icon.svg?react';
import { handleCopy } from '@/common/utils';
import CopyIcon from '@/components/Icons/CopyIcon';
import StyledInputModal from '@/components/StyledInputModal';
import { selectActivePipeline } from '@/slices/pipeline';
import { openSearchPanel } from '@codemirror/search';
import { Prec } from '@codemirror/state';
import { keymap } from '@codemirror/view';

// Ctrl/Cmd+F is bound by the editor; these open the same panel, which has the replace field
const replaceKeymap = Prec.high(
  keymap.of([
    { key: 'Mod-h', run: openSearchPanel, preventDefault: true },
    { key: 'Mod-Alt-f', run: openSearchPanel, preventDefault: true },
  ]),
);

const YamlCodeEditor = memo(props => {
  const {
    code,
    onChangeCode,
    onBlur,
    disabled,
    // The single-node editor must not load the whole pipeline YAML on a pipeline reset
    syncWithPipelineReset = true,
    minHeight = '25rem',
    contentTestId,
    'data-testid': dataTestId = 'pipeline-yaml-editor',
    copyMessage = 'The code has been copied to the clipboard.',
    copyButtonTestId = 'pipeline-yaml-copy-button',
    fullScreenButtonTestId = 'pipeline-yaml-full-screen-button',
    fullScreenModalTestId = 'pipeline-yaml-full-screen-modal',
    // Rendered under the full screen editor, e.g. a validation error
    fullScreenAfterContent,
    onFullScreenChange,
  } = props;

  const editorRef = useRef();
  const { toastInfo } = useToast();
  const [isFullScreen, setIsFullScreen] = useState(false);

  const { extensions: lintExtensions } = useLanguageLinter('yaml');
  const extensions = useMemo(() => [replaceKeymap, ...lintExtensions], [lintExtensions]);

  const {
    resetFlag,
    initState: { yamlCode },
  } = useSelector(selectActivePipeline);

  useEffect(() => {
    if (resetFlag && syncWithPipelineReset) {
      editorRef.current?.setCode(yamlCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetFlag]);

  const onCopy = useCallback(() => {
    handleCopy(code);
    toastInfo(copyMessage);
  }, [code, copyMessage, toastInfo]);

  const onOpenFullScreen = useCallback(() => {
    setIsFullScreen(true);
    onFullScreenChange?.(true);
  }, [onFullScreenChange]);

  const onCloseFullScreen = useCallback(() => {
    setIsFullScreen(false);
    onFullScreenChange?.(false);
    onBlur?.();
  }, [onBlur, onFullScreenChange]);

  const onFullScreenCodeChange = useCallback(event => onChangeCode?.(event.target.value), [onChangeCode]);

  const styles = yamlCodeEditorStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.actions}>
        <Tooltip
          title="Copy YAML"
          placement="top"
        >
          <Box component="span">
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              startIcon={<CopyIcon sx={styles.actionIcon} />}
              onClick={onCopy}
              aria-label="Copy YAML"
              data-testid={copyButtonTestId}
            />
          </Box>
        </Tooltip>
        <Tooltip
          title="Full screen view"
          placement="top"
        >
          <Box component="span">
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              startIcon={<FullscreenOutlinedIcon sx={styles.actionIcon} />}
              onClick={onOpenFullScreen}
              aria-label="Full screen view"
              data-testid={fullScreenButtonTestId}
            />
          </Box>
        </Tooltip>
      </Box>
      <Box
        sx={styles.container}
        data-testid={dataTestId}
      >
        <Field.CodeMirrorEditor
          className="nopan nodrag nowheel"
          value={code}
          extensions={extensions}
          height="100%"
          minHeight={minHeight}
          notifyChange={onChangeCode}
          onBlur={onBlur}
          ref={editorRef}
          readOnly={disabled}
          contentTestId={contentTestId}
        />
      </Box>
      {isFullScreen && (
        <StyledInputModal
          open={isFullScreen}
          onClose={onCloseFullScreen}
          value={code}
          title="YAML"
          specifiedLanguage="yaml"
          hasOnChangeCallback
          onChange={onFullScreenCodeChange}
          onRealtimeChange={onChangeCode}
          disabled={disabled}
          afterContent={fullScreenAfterContent}
          codeMirrorExtensions={[replaceKeymap]}
          data-testid={fullScreenModalTestId}
        />
      )}
    </Box>
  );
});

YamlCodeEditor.displayName = 'YamlCodeEditor';

/** @type {MuiSx} */
const yamlCodeEditorStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
  container: ({ palette }) => ({
    width: '100%',
    maxWidth: '100%',
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    '& .error_yaml_code': {
      backgroundColor: palette.alert.error.background,
      background: palette.alert.error.background,
    },
  }),
  // Its own row above the code, as in the configuration inputs, so long lines never run under it
  actions: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.25rem',
    padding: '0.25rem',
    flexShrink: 0,
    backgroundColor: palette.background.default.primary,
  }),
  actionIcon: {
    fontSize: '1rem',
  },
});

export default YamlCodeEditor;
