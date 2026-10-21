// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { EditorState } from '@codemirror/state';

import { createMaxLengthExtension } from '../CodeMirrorEditor';

const LIMIT = 50;

const editor = doc => EditorState.create({ doc, extensions: [createMaxLengthExtension(LIMIT)] });

const typed = (state, spec, userEvent = 'input.type') =>
  state.update({ ...spec, userEvent }).state.doc.toString();

describe('createMaxLengthExtension', () => {
  it('caps what a user types at the limit', () => {
    expect(typed(editor('i'.repeat(45)), { changes: { from: 45, insert: 'x'.repeat(10) } })).toHaveLength(
      LIMIT,
    );
  });

  it('loads a saved value longer than the limit without cutting it', () => {
    const loaded = editor('').update({ changes: { from: 0, insert: 'i'.repeat(80) } }).state;

    expect(loaded.doc.length).toBe(80);
  });

  it('lets a user shorten text that is over the limit', () => {
    expect(typed(editor('i'.repeat(80)), { changes: { from: 79, to: 80 } }, 'delete.backward')).toHaveLength(
      79,
    );
  });

  it('lets a user paste over a selection when the text stays over the limit but shrinks', () => {
    expect(
      typed(editor('i'.repeat(80)), { changes: { from: 0, to: 10, insert: 'x' } }, 'input.paste'),
    ).toHaveLength(71);
  });

  it('keeps what a user pastes over a selection in text that is over the limit, up to its current length', () => {
    const selected = EditorState.create({
      doc: 'i'.repeat(80),
      selection: { anchor: 10, head: 12 },
      extensions: [createMaxLengthExtension(LIMIT)],
    });
    const { state } = selected.update({
      changes: { from: 10, to: 12, insert: 'XYZ' },
      userEvent: 'input.paste',
    });

    expect(state.doc.length).toBe(80);
    expect(state.doc.sliceString(10, 12)).toBe('XY');
    expect(state.selection.main.head).toBe(12);
  });

  it('leaves the cursor after a paste that lands past the limit in text that is over it', () => {
    const selected = EditorState.create({
      doc: 'i'.repeat(80),
      selection: { anchor: 70, head: 72 },
      extensions: [createMaxLengthExtension(LIMIT)],
    });
    const { state } = selected.update({
      changes: { from: 70, to: 72, insert: 'XYZ' },
      userEvent: 'input.paste',
    });

    expect(state.selection.main.head).toBe(72);
  });

  it('keeps a user from growing text that is already over the limit', () => {
    expect(typed(editor('i'.repeat(80)), { changes: { from: 80, insert: 'x' } })).toHaveLength(80);
  });
});
