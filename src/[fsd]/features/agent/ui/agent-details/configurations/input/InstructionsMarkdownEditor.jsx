import { forwardRef, memo, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';

import YAML from 'js-yaml';

import { Box, alpha } from '@mui/material';

import { useToast } from '@/[fsd]/shared/lib/hooks';
import { Field } from '@/[fsd]/shared/ui';
import { debounce, getFileFormat } from '@/common/utils';
import StyledInputModal from '@/components/StyledInputModal';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView, ExternalChange, Prec, ViewPlugin } from '@uiw/react-codemirror';

const VARIABLES_UPDATE_DELAY = 500;

const InstructionsMarkdownEditor = memo(
  forwardRef((props, ref) => {
    const {
      value = '',
      disabled = false,
      codeMirrorExtensions,
      onKeyDown,
      onValueChange,
      onRealtimeChange,
      updateVariableList,
      isFullScreenOpen = false,
      onCloseFullScreen,
      afterContent,
      sx,
    } = props;

    const [isDragOver, setIsDragOver] = useState(false);
    const { toastError } = useToast();
    const styles = instructionsMarkdownEditorStyles(isDragOver);
    const editorRef = useRef(null);
    const viewRef = useRef(null);
    const modalRef = useRef(null);
    const suppressRealtimeRef = useRef(false);
    const onKeyDownRef = useRef(onKeyDown);
    const onRealtimeChangeRef = useRef(onRealtimeChange);
    const updateVariableListRef = useRef(updateVariableList);
    const onFileDropRef = useRef(null);
    onKeyDownRef.current = onKeyDown;
    onRealtimeChangeRef.current = onRealtimeChange;
    updateVariableListRef.current = updateVariableList;

    const debouncedUpdateVariableList = useMemo(
      () => debounce(text => updateVariableListRef.current?.(text), VARIABLES_UPDATE_DELAY),
      [],
    );

    const editorExtensions = useMemo(
      () => [
        markdown(),
        ...(codeMirrorExtensions || []),
        ViewPlugin.define(view => {
          viewRef.current = view;
          return {
            destroy: () => {
              if (viewRef.current === view) viewRef.current = null;
            },
          };
        }),
        // Mention keys (arrows / Enter) must win over CodeMirror's own keymap.
        Prec.highest(
          EditorView.domEventHandlers({
            keydown: event => {
              onKeyDownRef.current?.(event);
              return event.defaultPrevented;
            },
            dragover: () => {
              setIsDragOver(true);
              return false;
            },
            dragleave: () => {
              setIsDragOver(false);
              return false;
            },
            // A dropped file replaces the whole instructions instead of being inserted at the drop point.
            drop: (event, view) => {
              setIsDragOver(false);
              const file = event.dataTransfer?.files?.[0];
              if (!file || view.state.readOnly) return false;
              event.preventDefault();
              onFileDropRef.current?.(file);
              return true;
            },
          }),
        ),
        EditorView.updateListener.of(update => {
          if (!update.docChanged) return;
          if (update.transactions.some(transaction => transaction.annotation(ExternalChange))) return;
          if (suppressRealtimeRef.current) {
            suppressRealtimeRef.current = false;
            return;
          }
          onRealtimeChangeRef.current?.(update.state.doc.toString());
        }),
      ],
      [codeMirrorExtensions],
    );

    const handleNotifyChange = useCallback(
      text => {
        onValueChange?.(text);
        debouncedUpdateVariableList(text);
      },
      [debouncedUpdateVariableList, onValueChange],
    );

    const handleFullScreenChange = useCallback(
      event => {
        const text = event.target.value;
        onValueChange?.(text);
        updateVariableListRef.current?.(text);
      },
      [onValueChange],
    );

    const replaceRange = useCallback((start, end, replacement) => {
      if (modalRef.current) {
        modalRef.current.replaceRange?.(start, end, replacement);
        return;
      }
      const view = viewRef.current;
      if (!view) return;
      const cursorPos = start + replacement.length;
      suppressRealtimeRef.current = true;
      view.dispatch({
        changes: { from: start, to: end, insert: replacement },
        selection: { anchor: cursorPos },
      });
      suppressRealtimeRef.current = false;
      view.focus();
    }, []);

    const handleFileDrop = useCallback(
      file => {
        const reader = new FileReader();
        reader.onload = () => {
          const view = viewRef.current;
          if (!view) return;
          try {
            const text =
              getFileFormat(file.name) === 'yaml' ? JSON.stringify(YAML.load(reader.result)) : reader.result;
            suppressRealtimeRef.current = true;
            view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
            suppressRealtimeRef.current = false;
            updateVariableListRef.current?.(text);
          } catch {
            toastError('Error parsing File: Unsupported format');
          }
        };
        reader.readAsText(file);
      },
      [toastError],
    );
    onFileDropRef.current = handleFileDrop;

    useImperativeHandle(ref, () => ({
      restoreValue: (valueToRestore = '') => editorRef.current?.setCode?.(valueToRestore),
      getInputContent: () => {
        if (modalRef.current) return modalRef.current.getCurrentValue?.() ?? value;
        return viewRef.current?.state.doc.toString() ?? value;
      },
      getCursorPosition: () => {
        if (modalRef.current) return modalRef.current.getCursorPosition?.() ?? null;
        return viewRef.current?.state.selection.main.head ?? null;
      },
      replaceRange,
    }));

    return (
      <>
        <Box
          data-testid="agent-instructions-editor"
          sx={[styles.editorWrapper, sx]}
        >
          <Field.CodeMirrorEditor
            ref={editorRef}
            value={value}
            notifyChange={handleNotifyChange}
            extensions={editorExtensions}
            height="100%"
            minHeight="0"
            readOnly={disabled}
            contentTestId="agent-instructions-input"
          />
        </Box>
        {isFullScreenOpen && (
          <StyledInputModal
            ref={modalRef}
            open
            title="Instructions"
            value={value}
            disabled={disabled}
            specifiedLanguage="markdown"
            hasOnChangeCallback
            onChange={handleFullScreenChange}
            onClose={onCloseFullScreen}
            onKeyDown={onKeyDown}
            onRealtimeChange={onRealtimeChange}
            afterContent={afterContent}
            codeMirrorExtensions={codeMirrorExtensions}
            data-testid="agent-instructions-full-screen-modal"
          />
        )}
      </>
    );
  }),
);

InstructionsMarkdownEditor.displayName = 'InstructionsMarkdownEditor';

/** @type {MuiSx} */
const instructionsMarkdownEditorStyles = isDragOver => ({
  editorWrapper: ({ palette }) => ({
    display: 'flex',
    height: '24rem',
    ...(isDragOver && {
      '& .cm-editor': { backgroundColor: alpha(palette.components.contextHighlight.background, 0.08) },
    }),
    borderRadius: '0.375rem',
    border: `0.0625rem solid ${palette.border.default}`,
    overflow: 'hidden',
    '&:focus-within': { borderColor: palette.primary.main },
    '& .cm-theme': { width: '100%' },
    '& .cm-gutters': {
      backgroundColor: 'transparent',
      borderRight: `0.0625rem solid ${palette.border.default}`,
    },
  }),
});

export default InstructionsMarkdownEditor;
