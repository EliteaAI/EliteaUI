/**
 * The gutter of the skill's two editors (the instructions and an open file), one look for both:
 * the numbers right-aligned, the fold arrows beside them, a line to the text, and no empty lint column
 * (these editors have no linter, so it only made a gap between the numbers and the text).
 */
export const SKILL_EDITOR_GUTTERS = palette => ({
  '& .cm-editor, & .cm-gutters': { backgroundColor: 'transparent !important' },
  '& .cm-gutters': { borderRight: `0.0625rem solid ${palette.border.default}` },
  // The editor's own theme shows it with a stronger selector
  '& .cm-gutter-lint': { display: 'none !important' },
  '& .cm-lineNumbers .cm-gutterElement': { textAlign: 'right', padding: '0 0.25rem 0 1rem' },
  '& .cm-foldGutter .cm-gutterElement': { paddingRight: '0.25rem' },
  '& .cm-content': { paddingLeft: '0.5rem' },
});
