import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { FStringAutocompleteHelpers } from '@/[fsd]/features/pipelines/fstring-autocomplete/lib/helpers';
import { useFStringAutocomplete } from '@/[fsd]/features/pipelines/fstring-autocomplete/lib/hooks';
import { Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';

const handleAutocompleteKey = (contextRef, key) => {
  const ctx = contextRef.current;

  if (!ctx || !ctx.autocompleteState.isOpen) {
    return false;
  }

  if (key === 'ArrowDown' || key === 'ArrowUp') {
    if (ctx.filteredStateVariableOptions.length === 0) {
      return false;
    }

    ctx.setActiveIndex(
      FStringAutocompleteHelpers.getNextAutocompleteIndex(
        ctx.highlightedOptionIndex,
        ctx.filteredStateVariableOptions.length,
        key,
      ),
    );

    return true;
  }

  if (key === 'Enter') {
    const selectedOption = ctx.filteredStateVariableOptions[ctx.highlightedOptionIndex];

    if (!selectedOption) {
      return false;
    }

    ctx.handleSuggestionSelect(selectedOption.value);

    return true;
  }

  if (key === 'Escape') {
    ctx.closeAutocomplete();

    return true;
  }

  return false;
};

/**
 * Bridges the generic fstring-autocomplete logic with a CodeMirror editor view.
 *
 * Returns `mergedExtensions` (the caller's extensions + tracking / keymap) and
 * `popperProps` ready to spread onto `<FStringAutocompletePopper />`.
 */
export const useCodeMirrorFStringAutocomplete = ({
  editorRef,
  extensions,
  notifyChange,
  enableFStringAutocomplete = false,
  readOnly = false,
  stateVariableOptions = [],
}) => {
  const updateAutocompleteFromViewRef = useRef(null);
  const autocompleteKeyContextRef = useRef(null);

  const [autocompleteAnchor, setAutocompleteAnchor] = useState(null);

  const handleSuggestionSelectFromView = useCallback(
    (selectedVariable, currentAutocompleteState) => {
      const view = editorRef.current?.view;

      if (!view || !currentAutocompleteState.isOpen) {
        return;
      }

      const currentEditorValue = view.state.doc.toString();
      const { changeFrom, changeTo, cursorPosition, insertText, nextValue } =
        FStringAutocompleteHelpers.getFStringAutocompleteInsertion(
          currentEditorValue,
          currentAutocompleteState,
          selectedVariable,
        );

      view.dispatch({
        changes: {
          from: changeFrom,
          to: changeTo,
          insert: insertText,
        },
        selection: {
          anchor: cursorPosition,
        },
        scrollIntoView: true,
      });
      notifyChange?.(nextValue);
      view.focus();
    },
    [editorRef, notifyChange],
  );

  const {
    autocompleteState,
    closeAutocomplete: closeAutocompleteState,
    filteredOptions: filteredStateVariableOptions,
    highlightedOptionIndex,
    setActiveIndex,
    updateAutocompleteState,
  } = useFStringAutocomplete({
    enabled: enableFStringAutocomplete && !readOnly,
    options: stateVariableOptions,
    onSelect: handleSuggestionSelectFromView,
  });

  const closeAutocomplete = useCallback(() => {
    closeAutocompleteState();
    setAutocompleteAnchor(null);
  }, [closeAutocompleteState]);

  const updateAutocompleteFromView = useCallback(
    view => {
      if (!enableFStringAutocomplete || readOnly || !stateVariableOptions.length || !view?.hasFocus) {
        closeAutocomplete();
        return;
      }

      const currentValue = view.state.doc.toString();
      const cursorPosition = view.state.selection.main.head;
      const nextAutocompleteState = updateAutocompleteState(currentValue, cursorPosition);

      if (!nextAutocompleteState.isOpen) {
        setAutocompleteAnchor(null);
        return;
      }

      const cursorCoordinates = view.coordsAtPos(cursorPosition);

      setAutocompleteAnchor(
        cursorCoordinates
          ? {
              left: cursorCoordinates.left,
              top: cursorCoordinates.bottom,
            }
          : null,
      );
    },
    [
      closeAutocomplete,
      enableFStringAutocomplete,
      readOnly,
      stateVariableOptions.length,
      updateAutocompleteState,
    ],
  );

  const handleSuggestionSelect = useCallback(
    selectedVariable => {
      handleSuggestionSelectFromView(selectedVariable, autocompleteState);
      closeAutocomplete();
    },
    [autocompleteState, closeAutocomplete, handleSuggestionSelectFromView],
  );

  const isAutocompleteActive = useMemo(
    () => enableFStringAutocomplete && !readOnly && stateVariableOptions.length > 0,
    [enableFStringAutocomplete, readOnly, stateVariableOptions.length],
  );

  const trackingExtension = useMemo(() => {
    if (!isAutocompleteActive) {
      return null;
    }

    return EditorView.updateListener.of(update => {
      if (update.docChanged || update.selectionSet || update.focusChanged) {
        updateAutocompleteFromViewRef.current(update.view);
      }
    });
  }, [isAutocompleteActive]);

  const autocompleteKeymap = useMemo(() => {
    if (!isAutocompleteActive) {
      return null;
    }

    return Prec.highest(
      keymap.of([
        { key: 'ArrowDown', run: () => handleAutocompleteKey(autocompleteKeyContextRef, 'ArrowDown') },
        { key: 'ArrowUp', run: () => handleAutocompleteKey(autocompleteKeyContextRef, 'ArrowUp') },
        { key: 'Enter', run: () => handleAutocompleteKey(autocompleteKeyContextRef, 'Enter') },
        { key: 'Escape', run: () => handleAutocompleteKey(autocompleteKeyContextRef, 'Escape') },
      ]),
    );
  }, [isAutocompleteActive]);

  const mergedExtensions = useMemo(() => {
    const normalizedExtensions = Array.isArray(extensions) ? extensions : extensions ? [extensions] : [];
    const extras = [trackingExtension, autocompleteKeymap].filter(Boolean);

    return extras.length ? [...normalizedExtensions, ...extras] : normalizedExtensions;
  }, [extensions, trackingExtension, autocompleteKeymap]);

  const virtualAnchor = useMemo(
    () => FStringAutocompleteHelpers.createVirtualAnchorElement(autocompleteAnchor),
    [autocompleteAnchor],
  );

  useEffect(() => {
    updateAutocompleteFromViewRef.current = updateAutocompleteFromView;
  }, [updateAutocompleteFromView]);

  // Keep ref up to date on every render so keymap closure always uses latest values
  autocompleteKeyContextRef.current = {
    autocompleteState,
    filteredStateVariableOptions,
    highlightedOptionIndex,
    handleSuggestionSelect,
    closeAutocomplete,
    setActiveIndex,
  };

  const popperProps = useMemo(
    () => ({
      open: autocompleteState.isOpen && filteredStateVariableOptions.length > 0 && !!virtualAnchor,
      anchorEl: virtualAnchor,
      options: filteredStateVariableOptions,
      highlightedIndex: highlightedOptionIndex,
      onSelect: handleSuggestionSelect,
    }),
    [
      autocompleteState.isOpen,
      filteredStateVariableOptions,
      highlightedOptionIndex,
      virtualAnchor,
      handleSuggestionSelect,
    ],
  );

  return { mergedExtensions, popperProps };
};
