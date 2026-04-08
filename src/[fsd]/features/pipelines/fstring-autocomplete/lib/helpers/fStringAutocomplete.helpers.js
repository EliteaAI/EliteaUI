const CLOSED_FSTRING_AUTOCOMPLETE_STATE = {
  activeIndex: 0,
  hasClosingBrace: false,
  isOpen: false,
  query: '',
  replaceEnd: 0,
  replaceStart: 0,
};

const FSTRING_VARIABLE_PATTERN = /^[A-Za-z0-9_]*$/;

export const createClosedFStringAutocompleteState = () => ({
  ...CLOSED_FSTRING_AUTOCOMPLETE_STATE,
});

export const getFStringAutocompleteState = (inputValue = '', cursorPosition = 0) => {
  const safeCursorPosition = typeof cursorPosition === 'number' ? cursorPosition : inputValue.length;
  const valueBeforeCursor = inputValue.slice(0, safeCursorPosition);
  const openBraceIndex = valueBeforeCursor.lastIndexOf('{');

  if (openBraceIndex === -1) {
    return createClosedFStringAutocompleteState();
  }

  const closeBraceBeforeCursor = valueBeforeCursor.lastIndexOf('}');

  if (closeBraceBeforeCursor > openBraceIndex) {
    return createClosedFStringAutocompleteState();
  }

  const query = inputValue.slice(openBraceIndex + 1, safeCursorPosition);

  if (!FSTRING_VARIABLE_PATTERN.test(query)) {
    return createClosedFStringAutocompleteState();
  }

  const nextOpenBraceIndex = inputValue.indexOf('{', openBraceIndex + 1);
  const nextCloseBraceIndex = inputValue.indexOf('}', safeCursorPosition);
  const hasClosingBrace =
    nextCloseBraceIndex !== -1 && (nextOpenBraceIndex === -1 || nextCloseBraceIndex < nextOpenBraceIndex);

  return {
    activeIndex: 0,
    hasClosingBrace,
    isOpen: true,
    query,
    replaceEnd: hasClosingBrace ? nextCloseBraceIndex : safeCursorPosition,
    replaceStart: openBraceIndex + 1,
  };
};

export const filterFStringAutocompleteOptions = (options = [], query = '') => {
  const normalizedQuery = query.toLowerCase();

  return options.filter(option => {
    const optionValue = String(option.value || option.label || '').toLowerCase();

    return normalizedQuery ? optionValue.startsWith(normalizedQuery) : true;
  });
};

export const getNextAutocompleteIndex = (currentIndex, optionsLength, direction) => {
  if (direction === 'ArrowDown') {
    return currentIndex >= optionsLength - 1 ? 0 : currentIndex + 1;
  }

  return currentIndex <= 0 ? optionsLength - 1 : currentIndex - 1;
};

export const getFStringAutocompleteHighlightedIndex = (activeIndex = 0, options = []) => {
  return options.length ? Math.min(activeIndex, options.length - 1) : -1;
};

export const getFStringAutocompleteInsertion = (inputValue, autocompleteState, selectedVariable) => {
  const { hasClosingBrace, replaceEnd, replaceStart } = autocompleteState;
  const insertText = hasClosingBrace ? selectedVariable : `${selectedVariable}}`;
  const nextValue = `${inputValue.slice(0, replaceStart)}${insertText}${inputValue.slice(replaceEnd)}`;

  return {
    changeFrom: replaceStart,
    changeTo: replaceEnd,
    cursorPosition: replaceStart + selectedVariable.length + 1,
    insertText,
    nextValue,
  };
};

export const createVirtualAnchorElement = anchorPosition => {
  if (!anchorPosition) {
    return null;
  }

  return {
    getBoundingClientRect: () => ({
      width: 0,
      height: 0,
      top: anchorPosition.top,
      left: anchorPosition.left,
      right: anchorPosition.left,
      bottom: anchorPosition.top,
      x: anchorPosition.left,
      y: anchorPosition.top,
      toJSON: () => ({}),
    }),
  };
};
