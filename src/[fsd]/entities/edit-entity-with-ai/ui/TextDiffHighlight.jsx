import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { computeWordDiff } from '../lib/helpers';

const TextDiffHighlight = memo(props => {
  const { original, modified, mode, editable, onChange, maxLength } = props;

  const editableRef = useRef(null);
  const isFocusedRef = useRef(false);

  const theme = useTheme();

  const segments = useMemo(() => computeWordDiff(original || '', modified || ''), [original, modified]);

  const visibleSegments = useMemo(
    () =>
      segments.filter(segment => {
        if (mode === 'original') return segment.type !== 'added';
        return segment.type !== 'removed';
      }),
    [segments, mode],
  );

  const escapeHtml = useCallback(
    text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>'),
    [],
  );

  const highlightHtml = useMemo(() => {
    const addedColor = theme.palette.diff.added;
    const removedColor = theme.palette.diff.removed;

    return visibleSegments
      .map(segment => {
        const escaped = escapeHtml(segment.text);

        if (segment.type === 'added')
          return `<span style="background-color:${addedColor};border-radius:0.125rem;line-height:1.5rem">${escaped}</span>`;

        if (segment.type === 'removed')
          return `<span style="background-color:${removedColor};border-radius:0.125rem;line-height:1.5rem">${escaped}</span>`;

        return escaped;
      })
      .join('');
  }, [theme, visibleSegments, escapeHtml]);

  useEffect(() => {
    if (editable && editableRef.current && !isFocusedRef.current)
      editableRef.current.innerHTML = highlightHtml;
  }, [editable, highlightHtml]);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;

    if (onChange && editableRef.current) {
      let newText = editableRef.current.innerText || '';
      if (maxLength && newText.length > maxLength) newText = newText.slice(0, maxLength);

      if (newText !== modified) onChange(newText);
    }
  }, [onChange, modified, maxLength]);

  const handleInput = useCallback(() => {
    if (!editableRef.current || !maxLength) return;

    const text = editableRef.current.innerText || '';
    if (text.length <= maxLength) {
      onChange?.(text);
      return;
    }

    const truncated = text.slice(0, maxLength);
    editableRef.current.innerText = truncated;

    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(editableRef.current);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    onChange?.(truncated);
  }, [maxLength, onChange]);

  if (editable) {
    return (
      <Box
        contentEditable
        ref={editableRef}
        component="div"
        onFocus={handleFocus}
        onBlur={handleBlur}
        onInput={handleInput}
        sx={[styles.container, styles.editable]}
      />
    );
  }

  return (
    <Typography
      component="div"
      sx={styles.container}
    >
      {visibleSegments.map((segment, index) => (
        <Box
          key={index}
          component="span"
          sx={segment.type !== 'equal' ? styles[segment.type] : undefined}
        >
          {segment.text}
        </Box>
      ))}
    </Typography>
  );
});

TextDiffHighlight.displayName = 'TextDiffHighlight';

/** @type {MuiSx} */
const styles = {
  container: {
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
    color: 'text.secondary',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  editable: ({ palette }) => ({
    outline: 'none',
    cursor: 'text',
    minHeight: '1.5rem',
    caretColor: palette.text.secondary,
  }),
  removed: ({ palette }) => ({
    backgroundColor: palette.diff.removed,
    borderRadius: '0.125rem',
    lineHeight: '1.5rem',
  }),
  added: ({ palette }) => ({
    backgroundColor: palette.diff.added,
    borderRadius: '0.125rem',
    lineHeight: '1.5rem',
  }),
};

export default TextDiffHighlight;
