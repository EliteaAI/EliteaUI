import { useCallback, useEffect, useRef, useState } from 'react';

const NewSpecialSymbolsString = '#';
const AtSymbol = '@';
const PRINTABLE_ASCII_REGEX = /^[\x20-\x7E]*$/;

export const useNewInputKeyDownHandler = (options = {}) => {
  const { disableHashtagDetection = false } = options;

  // '#' tracking
  const [isProcessingSymbols, setIsProcessingSymbols] = useState(false);
  const [query, setQuery] = useState('');
  const queryRef = useRef(query);

  // '@' tracking
  const [isProcessingAtSymbol, setIsProcessingAtSymbol] = useState(false);
  const [atQuery, setAtQuery] = useState('');
  const atQueryRef = useRef(atQuery);
  const atAnchorRef = useRef(null);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    atQueryRef.current = atQuery;
  }, [atQuery]);

  const reset = useCallback(() => {
    setIsProcessingSymbols(false);
    setQuery('');
  }, []);

  const resetAt = useCallback(() => {
    setIsProcessingAtSymbol(false);
    setAtQuery('');
    atAnchorRef.current = null;
  }, []);

  const onKeyDown = useCallback(
    event => {
      if (disableHashtagDetection) return;

      const { target } = event;
      const { selectionStart, selectionEnd, value } = target;

      // --- '@' mention mode ---
      if (isProcessingAtSymbol) {
        if (event.key.length === 1 && event.key.match(PRINTABLE_ASCII_REGEX)) {
          if (event.key === ' ') {
            resetAt();
          } else {
            setAtQuery(prev => prev + event.key);
          }
        } else if (event.key === 'Backspace' || event.key === 'Delete') {
          let willDeleteAt = false;

          if (selectionStart !== selectionEnd) {
            const selectedText = value.substring(selectionStart, selectionEnd);
            willDeleteAt = selectedText.includes(atQueryRef.current);
          } else if (event.key === 'Backspace') {
            const charToDelete = selectionStart > 0 ? value[selectionStart - 1] : '';
            willDeleteAt = charToDelete === AtSymbol && atQueryRef.current.length === 1;
          } else {
            const charToDelete = selectionStart < value.length ? value[selectionStart] : '';
            willDeleteAt = charToDelete === AtSymbol && atQueryRef.current.length === 1;
          }

          if (atQueryRef.current.length === 0) willDeleteAt = true;

          if (willDeleteAt) {
            resetAt();
            return;
          }

          setAtQuery(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
        } else if (event.key === 'Escape') {
          resetAt();
        }
        return;
      }

      // --- '#' mention mode ---
      if (isProcessingSymbols) {
        if (event.key.length === 1 && event.key.match(PRINTABLE_ASCII_REGEX)) {
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
        return;
      }

      // --- Idle: check for trigger symbols ---
      if (event.key === AtSymbol) {
        setIsProcessingAtSymbol(true);
        setAtQuery(AtSymbol);
        atAnchorRef.current = selectionStart;
      } else if (event.key.length === 1 && NewSpecialSymbolsString.includes(event.key)) {
        setIsProcessingSymbols(true);
        setQuery(event.key);
      }
    },
    [isProcessingSymbols, isProcessingAtSymbol, reset, resetAt, disableHashtagDetection],
  );

  return {
    onKeyDown,
    isProcessingSymbols,
    query,
    stopProcessingSymbols: reset,
    isProcessingAtSymbol,
    atQuery,
    stopProcessingAtSymbol: resetAt,
    atAnchorRef,
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
        if (event.key.length === 1 && event.key.match(PRINTABLE_ASCII_REGEX)) {
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
