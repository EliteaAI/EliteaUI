import { useCallback, useEffect, useMemo, useState } from 'react';

import { CodeMirrorEditorHelpers } from '@/[fsd]/shared/lib/helpers';
import useAlitaTheme from '@/hooks/useAlitaTheme';
import { lintGutter } from '@codemirror/lint';
import { search } from '@codemirror/search';
import { EditorView, basicSetup } from '@uiw/react-codemirror';

export const useCodeMirror = props => {
  const { value, notifyChange, showLintGutter = true, showFoldByIndent = true } = props;

  const [code, setCode] = useState(value);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const { isDarkMode } = useAlitaTheme();

  useEffect(() => {
    setCode(value);
  }, [value]);

  const basicExtensions = useMemo(
    () =>
      [
        basicSetup({
          foldGutter: false,
          indentOnInput: true,
          highlightActiveLineGutter: true,
          searchKeymap: false,
        }),
        search(),
        EditorView.lineWrapping, // Enable word wrapping to prevent horizontal scrolling
        showLintGutter ? lintGutter() : undefined,
        showFoldByIndent ? CodeMirrorEditorHelpers.foldByIndent() : undefined,
      ].filter(item => item),
    [showFoldByIndent, showLintGutter],
  );

  const onInputHandler = useCallback(
    newValue => {
      setCode(newValue);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      // Set a new timeout to update Formik's state after a delay
      const timeout = setTimeout(() => {
        notifyChange?.(newValue);
      }, 30);

      setDebounceTimeout(timeout);
    },
    [debounceTimeout, notifyChange],
  );

  return {
    code,
    isDarkMode,
    basicExtensions,
    onInputHandler,
    setCode,
  };
};
