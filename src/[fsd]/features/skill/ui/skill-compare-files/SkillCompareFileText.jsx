import { memo, useCallback, useMemo } from 'react';

import { Box } from '@mui/material';

import { computeWordDiff } from '@/[fsd]/entities/edit-entity-with-ai';

const LAST_LINE_FILLER = '\u200b';

const SkillCompareFileText = memo(props => {
  const { value, otherValue, tone, editable, onChange, maxLength } = props;
  const styles = skillCompareFileTextStyles(tone);

  const segments = useMemo(
    () => computeWordDiff(otherValue ?? value, value).filter(segment => segment.type !== 'removed'),
    [otherValue, value],
  );

  const handleChange = useCallback(event => onChange?.(event.target.value), [onChange]);

  return (
    <Box sx={styles.root}>
      <Box
        aria-hidden
        sx={[styles.text, styles.highlights]}
        data-testid="skill-compare-file-highlights"
      >
        {segments.map((segment, index) => (
          <Box
            key={index}
            component="span"
            sx={segment.type === 'added' ? styles.differing : undefined}
            data-differing={segment.type === 'added' || undefined}
          >
            {segment.text}
          </Box>
        ))}
        {LAST_LINE_FILLER}
      </Box>
      <Box
        component="textarea"
        value={value}
        readOnly={!editable}
        maxLength={maxLength}
        spellCheck={false}
        onChange={handleChange}
        sx={[styles.text, styles.field]}
        data-testid="skill-compare-file-field"
      />
    </Box>
  );
});

SkillCompareFileText.displayName = 'SkillCompareFileText';

/** @type {MuiSx} */
const skillCompareFileTextStyles = tone => ({
  root: {
    position: 'relative',
    minHeight: '1.5rem',
  },
  text: {
    margin: 0,
    padding: 0,
    border: 0,
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1.5rem',
    letterSpacing: 'normal',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    tabSize: 4,
  },
  highlights: {
    color: 'transparent',
    userSelect: 'none',
  },
  differing: ({ palette }) => ({
    backgroundColor: palette.diff[tone],
    borderRadius: '0.125rem',
  }),
  field: ({ palette }) => ({
    position: 'absolute',
    inset: 0,
    display: 'block',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
    resize: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: palette.text.secondary,
    caretColor: palette.text.secondary,
  }),
});

export default SkillCompareFileText;
