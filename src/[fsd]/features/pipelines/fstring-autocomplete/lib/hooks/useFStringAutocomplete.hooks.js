import { useCallback, useMemo, useState } from 'react';

import { FStringAutocompleteHelpers } from '@/[fsd]/features/pipelines/fstring-autocomplete/lib/helpers';

export const useFStringAutocomplete = props => {
  const { enabled = false, options = [], onSelect } = props;

  const [autocompleteState, setAutocompleteState] = useState(
    FStringAutocompleteHelpers.createClosedFStringAutocompleteState,
  );

  const filteredOptions = useMemo(() => {
    if (!enabled || !autocompleteState.isOpen || !options.length) {
      return [];
    }

    return FStringAutocompleteHelpers.filterFStringAutocompleteOptions(options, autocompleteState.query);
  }, [autocompleteState.isOpen, autocompleteState.query, enabled, options]);

  const highlightedOptionIndex = useMemo(() => {
    return FStringAutocompleteHelpers.getFStringAutocompleteHighlightedIndex(
      autocompleteState.activeIndex,
      filteredOptions,
    );
  }, [autocompleteState.activeIndex, filteredOptions]);

  const closeAutocomplete = useCallback(() => {
    setAutocompleteState(FStringAutocompleteHelpers.createClosedFStringAutocompleteState());
  }, []);

  const updateAutocompleteState = useCallback(
    (inputValue, cursorPosition, { preserveActiveIndex = false } = {}) => {
      if (!enabled || !options.length) {
        const closedState = FStringAutocompleteHelpers.createClosedFStringAutocompleteState();

        setAutocompleteState(closedState);

        return closedState;
      }

      const nextState = FStringAutocompleteHelpers.getFStringAutocompleteState(inputValue, cursorPosition);

      if (preserveActiveIndex) {
        setAutocompleteState(prevState => {
          if (nextState.isOpen && prevState.isOpen && nextState.query === prevState.query) {
            return { ...nextState, activeIndex: prevState.activeIndex };
          }

          return nextState;
        });
      } else {
        setAutocompleteState(nextState);
      }

      return nextState;
    },
    [enabled, options.length],
  );

  const handleAutocompleteKeyDown = useCallback(
    event => {
      if (event.key === 'Escape' && autocompleteState.isOpen) {
        event.preventDefault();
        closeAutocomplete();

        return true;
      }

      if (!autocompleteState.isOpen || filteredOptions.length === 0) {
        return false;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setAutocompleteState(prevState => ({
          ...prevState,
          activeIndex: FStringAutocompleteHelpers.getNextAutocompleteIndex(
            prevState.activeIndex,
            filteredOptions.length,
            'ArrowDown',
          ),
        }));

        return true;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setAutocompleteState(prevState => ({
          ...prevState,
          activeIndex: FStringAutocompleteHelpers.getNextAutocompleteIndex(
            prevState.activeIndex,
            filteredOptions.length,
            'ArrowUp',
          ),
        }));

        return true;
      }

      if (event.key === 'Enter') {
        const selectedOption = filteredOptions[highlightedOptionIndex];

        if (!selectedOption) {
          return false;
        }

        event.preventDefault();
        onSelect?.(selectedOption.value, autocompleteState);
        closeAutocomplete();

        return true;
      }

      return false;
    },
    [autocompleteState, closeAutocomplete, filteredOptions, highlightedOptionIndex, onSelect],
  );

  const setActiveIndex = useCallback(nextIndex => {
    setAutocompleteState(prevState => ({
      ...prevState,
      activeIndex: nextIndex,
    }));
  }, []);

  return {
    autocompleteState,
    closeAutocomplete,
    filteredOptions,
    handleAutocompleteKeyDown,
    highlightedOptionIndex,
    setActiveIndex,
    updateAutocompleteState,
  };
};
