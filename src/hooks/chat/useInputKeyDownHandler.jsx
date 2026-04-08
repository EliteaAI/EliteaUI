import { useCallback, useEffect, useRef, useState } from 'react';

const NewSpecialSymbolsString = '#';

export const useNewInputKeyDownHandler = (options = {}) => {
  const { disableHashtagDetection = false } = options;
  const [isProcessingSymbols, setIsProcessingSymbols] = useState(false);
  const [query, setQuery] = useState('');
  const queryRef = useRef(query);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const reset = useCallback(() => {
    setIsProcessingSymbols(false);
    setQuery('');
  }, []);

  const onKeyDown = useCallback(
    event => {
      if (disableHashtagDetection) return;

      const { target } = event;
      const { selectionStart, selectionEnd, value } = target;

      if (!isProcessingSymbols && event.key.length === 1 && NewSpecialSymbolsString.includes(event.key)) {
        // Start processing when "#" is typed
        setIsProcessingSymbols(true);
        setQuery(event.key);
      } else if (isProcessingSymbols) {
        if (event.key.length === 1 && event.key.match(/^[\x20-\x7E]*$/)) {
          // Add printable characters to query
          setQuery(prev => prev + event.key);
        } else if (event.key === 'Backspace' || event.key === 'Delete') {
          // Handle deletion - simplified logic
          let willDeleteQuery = false;

          if (selectionStart !== selectionEnd) {
            // Text is selected - check if our query is in the selection
            const selectedText = value.substring(selectionStart, selectionEnd);
            willDeleteQuery = selectedText.includes(queryRef.current);
          } else {
            // Single character deletion
            if (event.key === 'Backspace') {
              // Only reset if we're about to delete the "#" symbol itself
              const charToDelete = selectionStart > 0 ? value[selectionStart - 1] : '';
              willDeleteQuery = charToDelete === '#' && queryRef.current.length === 1;
            } else if (event.key === 'Delete') {
              // Similar check for forward delete
              const charToDelete = selectionStart < value.length ? value[selectionStart] : '';
              willDeleteQuery = charToDelete === '#' && queryRef.current.length === 1;
            }

            // Additional check: if query becomes empty (no "#"), reset
            if (queryRef.current.length === 0) {
              willDeleteQuery = true;
            }
          }

          if (willDeleteQuery) {
            reset();
            return;
          }

          // Update query by removing the character being deleted
          if (event.key === 'Backspace') {
            setQuery(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
          } else if (event.key === 'Delete') {
            // For forward delete, we need to be more careful about which character to remove
            // For simplicity, we'll just remove the last character as well
            setQuery(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
          }
        } else if (event.key === 'Escape') {
          // Allow escape key to cancel symbol processing
          reset();
        }
      }
    },
    [isProcessingSymbols, reset, disableHashtagDetection],
  );

  return {
    onKeyDown,
    isProcessingSymbols,
    query,
    stopProcessingSymbols: reset,
  };
};

export const useNewStartConversationInputKeyDownHandler = (options = {}) => {
  const { disableHashtagDetection = false } = options;
  const [isProcessingSymbols, setIsProcessingSymbols] = useState(false);
  const [query, setQuery] = useState('');

  const onKeyDown = useCallback(
    event => {
      if (disableHashtagDetection) return;

      if (!isProcessingSymbols && event.key.length === 1 && NewSpecialSymbolsString.includes(event.key)) {
        setIsProcessingSymbols(true);
        setQuery(event.key);
      } else if (isProcessingSymbols) {
        if (event.key.length === 1 && event.key.match(/^[\x20-\x7E]*$/)) {
          setQuery(prev => prev + event.key);
        } else if (event.key === 'Backspace') {
          setQuery(prev => prev.slice(0, -1));
        }
      }
    },
    [isProcessingSymbols, disableHashtagDetection],
  );

  const reset = useCallback(() => {
    setIsProcessingSymbols(false);
    setQuery('');
  }, []);

  useEffect(() => {
    if (!query) {
      reset();
    }
  }, [query, reset]);

  return {
    onKeyDown,
    isProcessingSymbols,
    query,
    stopProcessingSymbols: reset,
  };
};
