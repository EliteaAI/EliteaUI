import { forwardRef, memo, useImperativeHandle, useMemo, useRef } from 'react';

import { useCodeMirror } from '@/[fsd]/shared/lib/hooks';
import { history, redo, redoDepth, undo, undoDepth } from '@codemirror/commands';
import { lintGutter } from '@codemirror/lint';
import { searchKeymap } from '@codemirror/search';
import { EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { useTheme } from '@emotion/react';
import { vscodeDarkInit, vscodeLightInit } from '@uiw/codemirror-theme-vscode';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';

const createMaxLengthExtension = maxLength => {
  if (!maxLength || maxLength <= 0) {
    return [];
  }

  return EditorState.transactionFilter.of(tr => {
    if (tr.newDoc.length > maxLength) {
      return [];
    }
    return tr;
  });
};

const CodeMirrorEditor = forwardRef((props, ref) => {
  const {
    value,
    extensions: extensionsProp,
    notifyChange,
    width = '100%',
    maxWidth = '100%',
    minWidth = '100%',
    height = 'calc(100vh - 220px)',
    minHeight = 'calc(100vh - 220px)',
    maxHeight,
    autoHeight = false,
    variant = 'bodyMedium',
    onCanUndo,
    onCanRedo,
    onBlur,
    onKeyDown,
    onSyntaxError,
    className,
    readOnly = false,
    maxLength = 0,
  } = props;

  const extensions = useMemo(() => {
    if (!extensionsProp) return [];
    return Array.isArray(extensionsProp) ? extensionsProp : [extensionsProp];
  }, [extensionsProp]);

  const theme = useTheme();
  const editorRef = useRef(null); // Ref to store the EditorView instance

  // Extension to listen for updates and check undo/redo depth
  const updateUndoRedoState = EditorView.updateListener.of(update => {
    onCanUndo?.(undoDepth(update.state) > 0);
    onCanRedo?.(redoDepth(update.state) > 0);
  });

  // Extension to monitor syntax errors from linter
  const syntaxErrorListener = useMemo(() => {
    if (!onSyntaxError) return [];

    return [
      EditorView.updateListener.of(update => {
        if (update.docChanged || update.viewportChanged) {
          const diagnostics = update.state.field(lintGutter, false);

          if (diagnostics) {
            const errors = [];
            diagnostics.iter({
              from: 0,
              to: update.state.doc.length,
              enter: (from, to, diagnostic) => {
                if (diagnostic) {
                  errors.push({
                    from,
                    to,
                    severity: diagnostic.severity,
                    message: diagnostic.message,
                    source: diagnostic.source,
                  });
                }
              },
            });

            onSyntaxError(errors);
          } else {
            // No diagnostics available, report empty errors
            onSyntaxError([]);
          }
        }
      }),
    ];
  }, [onSyntaxError]);

  const customTheme = useMemo(() => {
    const typography = theme.typography[variant];

    const baseTheme = {
      'cm-theme': {
        width: '100%',
      },
      '.cm-content': {
        fontFamily: typography.fontFamily || theme.typography.fontFamily,
        fontSize: typography.fontSize,
        lineHeight: typography.lineHeight,
        fontWeight: typography.fontWeight,
        fontStyle: typography.fontStyle,
        // Remove default top padding so the first line touches the top border
        padding: autoHeight ? '8px 0' : '0',
      },
      // Remove any inner top line/spacing from the scroller and gutters
      '.cm-scroller': {
        paddingTop: 0,
        marginTop: 0,
        borderTop: 'none',
        boxShadow: 'none',
      },
      '.cm-gutters': {
        fontFamily: typography.fontFamily || theme.typography.fontFamily,
        fontSize: `calc(${typeof typography.fontSize === 'number' ? `${typography.fontSize}px` : typography.fontSize} * 0.9)`,
        paddingTop: 0,
        borderTop: 'none',
        boxShadow: 'none',
      },
      // Make line numbers slightly smaller than the main content
      '.cm-gutter': {
        fontFamily: typography.fontFamily || theme.typography.fontFamily,
        fontSize: `calc(${typeof typography.fontSize === 'number' ? `${typography.fontSize}px` : typography.fontSize} * 0.9)`,
        paddingTop: 0,
      },
      '.cm-lineNumbers': {
        paddingTop: 0,
      },
      '.cm-lineNumbers .cm-gutterElement': {
        lineHeight: typography.lineHeight,
      },
      '.cm-editor': {
        borderRadius: '4px',
      },
    };

    // Add auto-height specific styles
    if (autoHeight) {
      baseTheme['.cm-scroller'] = {
        fontFamily: typography.fontFamily || theme.typography.fontFamily,
      };
      baseTheme['.cm-focused'] = {
        outline: 'none',
      };
    }

    return EditorView.theme(baseTheme);
  }, [theme, variant, autoHeight]);

  // Create simplified auto-height extension
  const autoHeightExtension = useMemo(() => {
    if (!autoHeight) return [];

    return [
      EditorView.theme({
        '&': {
          height: 'auto',
          minHeight: '60px',
          maxHeight: maxHeight || '100%',
        },
        '.cm-scroller': {
          minHeight: '60px',
          maxHeight: maxHeight || '100%',
          overflow: 'auto',
        },
        '.cm-content': {
          minHeight: '60px',
          padding: '8px 0',
        },
        '.cm-focused': {
          outline: 'none',
        },
      }),
      // Ensure proper content visibility in auto-height mode
      EditorView.updateListener.of(update => {
        if (update.docChanged || update.geometryChanged) {
          const view = update.view;

          // Use requestAnimationFrame to ensure layout is complete
          window.requestAnimationFrame(() => {
            const contentHeight = view.contentHeight;
            const editorElement = view.dom;
            const scroller = view.scrollDOM;

            // Calculate the height needed to show all content
            const paddingAndMargin = 20; // Account for padding
            const targetHeight = contentHeight + paddingAndMargin;

            // Get maxHeight constraint
            let maxHeightPx =
              parseInt(maxHeight) ||
              (maxHeight && maxHeight.includes('vh')
                ? window.innerHeight * (parseInt(maxHeight) / 100)
                : window.innerHeight * 0.8);

            if (maxHeight && maxHeight.includes('calc')) {
              // For calc expressions, use a reasonable fallback
              maxHeightPx = window.innerHeight - 200;
            }

            // Set appropriate height
            if (targetHeight <= maxHeightPx) {
              // Content fits, set height to show all content
              editorElement.style.height = `${targetHeight}px`;
              scroller.scrollTop = 0; // Reset scroll since all content is visible
            } else {
              // Content exceeds max, use maxHeight and let it scroll
              editorElement.style.height = `${maxHeightPx}px`;
            }
          });
        }
      }),
    ];
  }, [autoHeight, maxHeight]);

  const { code, setCode, isDarkMode, basicExtensions, onInputHandler } = useCodeMirror({
    value,
    notifyChange,
  });

  useImperativeHandle(ref, () => ({
    getCode: () => code,
    setCode,
    undo: () => undo(editorRef.current?.view),
    redo: () => redo(editorRef.current?.view),
    editor: editorRef.current?.editor,
    view: editorRef.current?.view,
    state: editorRef.current?.state,
  }));

  return (
    <CodeMirror
      readOnly={readOnly}
      className={className}
      ref={editorRef}
      value={code}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      theme={
        isDarkMode
          ? vscodeDarkInit({
              settings: {
                background: theme.palette.background.alitaDefault,
                gutterBackground: theme.palette.background.tabPanel,
              },
            })
          : vscodeLightInit({
              settings: {
                background: theme.palette.background.alitaDefault,
                gutterBackground: theme.palette.background.tabPanel,
              },
            })
      }
      width={width}
      maxWidth={maxWidth}
      minWidth={minWidth}
      height={autoHeight ? 'auto' : height}
      minHeight={autoHeight ? 'auto' : minHeight}
      extensions={[
        customTheme,
        history(),
        updateUndoRedoState,
        keymap.of(searchKeymap),
        ...basicExtensions,
        ...autoHeightExtension,
        ...syntaxErrorListener,
        ...extensions,
        createMaxLengthExtension(maxLength),
      ]}
      onChange={onInputHandler}
    />
  );
});

CodeMirrorEditor.displayName = 'CodeMirrorEditor';

export default memo(CodeMirrorEditor);
