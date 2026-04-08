import { useCallback, useEffect, useRef } from 'react';

import { FStringAutocompleteHelpers } from '@/[fsd]/features/pipelines/fstring-autocomplete/lib/helpers';
import { useFStringAutocomplete } from '@/[fsd]/features/pipelines/fstring-autocomplete/lib/hooks';

export const useFStringInputAutocomplete = props => {
  const { resolvedValue, onInput, enabled, options } = props;

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const pendingCursorPositionRef = useRef(null);
  const autocompleteStateRef = useRef(null);

  const handleSuggestionSelect = useCallback(
    (selectedVariable, currentAutocompleteState) => {
      const { cursorPosition, nextValue } = FStringAutocompleteHelpers.getFStringAutocompleteInsertion(
        resolvedValue,
        currentAutocompleteState ?? autocompleteStateRef.current,
        selectedVariable,
      );

      pendingCursorPositionRef.current = cursorPosition;
      onInput({
        preventDefault: () => {},
        target: {
          value: nextValue,
        },
      });
    },
    [onInput, resolvedValue],
  );

  const {
    autocompleteState,
    closeAutocomplete,
    filteredOptions,
    handleAutocompleteKeyDown,
    highlightedOptionIndex,
    updateAutocompleteState,
  } = useFStringAutocomplete({
    enabled,
    options,
    onSelect: handleSuggestionSelect,
  });

  autocompleteStateRef.current = autocompleteState;

  const handleChange = useCallback(
    event => {
      onInput(event);
      updateAutocompleteState(event.target.value, event.target.selectionStart ?? event.target.value.length);
    },
    [onInput, updateAutocompleteState],
  );

  const handleCursorChange = useCallback(
    event => {
      if (event.target?.value === undefined) {
        return;
      }

      updateAutocompleteState(event.target.value, event.target.selectionStart ?? event.target.value.length, {
        preserveActiveIndex: true,
      });
    },
    [updateAutocompleteState],
  );

  useEffect(() => {
    if (pendingCursorPositionRef.current === null) {
      return undefined;
    }

    const cursorPosition = pendingCursorPositionRef.current;
    const animationFrameId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange?.(cursorPosition, cursorPosition);
      pendingCursorPositionRef.current = null;
      updateAutocompleteState(resolvedValue, cursorPosition);
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [resolvedValue, updateAutocompleteState]);

  return {
    autocompleteState,
    closeAutocomplete,
    containerRef,
    filteredOptions,
    handleAutocompleteKeyDown,
    handleChange,
    handleCursorChange,
    handleSuggestionSelect,
    highlightedOptionIndex,
    inputRef,
  };
};
