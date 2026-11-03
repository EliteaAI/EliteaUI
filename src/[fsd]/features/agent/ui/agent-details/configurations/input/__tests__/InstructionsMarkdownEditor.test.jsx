// @vitest-environment jsdom
import { createRef, forwardRef } from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';

import InstructionsMarkdownEditor from '../InstructionsMarkdownEditor';

const toastError = vi.fn();
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useToast: () => ({ toastError }) }));

vi.mock('@/[fsd]/shared/ui', () => {
  const CodeMirrorEditor = forwardRef((props, ref) => (
    <CodeMirror
      ref={ref}
      value={props.value}
      extensions={props.extensions}
      onChange={props.notifyChange}
      readOnly={props.readOnly}
    />
  ));
  CodeMirrorEditor.displayName = 'CodeMirrorEditor';
  return { Field: { CodeMirrorEditor } };
});

vi.mock('@/components/StyledInputModal', () => {
  const StyledInputModal = forwardRef((props, ref) => {
    if (ref) ref.current = { getCurrentValue: () => 'modal text', getCursorPosition: () => 3 };
    return (
      <button
        data-testid={props['data-testid']}
        onClick={() => {
          props.onChange({ target: { value: 'from full screen' } });
          props.onClose();
        }}
      />
    );
  });
  StyledInputModal.displayName = 'StyledInputModal';
  return { default: StyledInputModal };
});

const theme = createTheme({ palette: lightPalette });

const getView = () => EditorView.findFromDOM(document.querySelector('.cm-editor'));

const renderEditor = (props = {}) => {
  const ref = createRef();
  const handlers = {
    onValueChange: vi.fn(),
    onRealtimeChange: vi.fn(),
    updateVariableList: vi.fn(),
    onKeyDown: vi.fn(),
    onCloseFullScreen: vi.fn(),
  };
  const result = render(
    <ThemeProvider theme={theme}>
      <InstructionsMarkdownEditor
        ref={ref}
        value="## Ping"
        {...handlers}
        {...props}
      />
    </ThemeProvider>,
  );
  return { ref, handlers, ...result };
};

describe('InstructionsMarkdownEditor', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('exposes the current content and cursor position', () => {
    const { ref } = renderEditor();

    act(() => getView().dispatch({ selection: { anchor: 3 } }));

    expect(ref.current.getInputContent()).toBe('## Ping');
    expect(ref.current.getCursorPosition()).toBe(3);
  });

  it('notifies realtime and value listeners when the user types', () => {
    const { handlers } = renderEditor();

    act(() => getView().dispatch({ changes: { from: 7, insert: '!' } }));

    expect(handlers.onRealtimeChange).toHaveBeenCalledWith('## Ping!');
    expect(handlers.onValueChange).toHaveBeenCalledWith('## Ping!');
  });

  it('replaces a range without re-notifying the mention hooks', () => {
    const { ref, handlers } = renderEditor();

    act(() => ref.current.replaceRange(3, 7, 'Pong'));

    expect(ref.current.getInputContent()).toBe('## Pong');
    expect(ref.current.getCursorPosition()).toBe(7);
    expect(handlers.onRealtimeChange).not.toHaveBeenCalled();
    expect(handlers.onValueChange).toHaveBeenCalledWith('## Pong');
  });

  it('lets a prevented mention key win over the editor keymap', () => {
    const onKeyDown = vi.fn(event => {
      if (event.key === 'Enter') event.preventDefault();
    });
    renderEditor({ onKeyDown });

    act(() => getView().dispatch({ selection: { anchor: 7 } }));
    fireEvent.keyDown(getView().contentDOM, { key: 'Enter' });

    expect(onKeyDown).toHaveBeenCalled();
    expect(getView().state.doc.toString()).toBe('## Ping');
  });

  it('replaces the instructions with a dropped file', async () => {
    const { ref, handlers } = renderEditor();
    const file = new File(['Hello {{name}}'], 'notes.md', { type: 'text/markdown' });

    fireEvent.drop(getView().contentDOM, { dataTransfer: { files: [file] } });

    await waitFor(() => expect(ref.current.getInputContent()).toBe('Hello {{name}}'));
    expect(handlers.updateVariableList).toHaveBeenCalledWith('Hello {{name}}');
    expect(handlers.onRealtimeChange).not.toHaveBeenCalled();
  });

  it('converts a dropped YAML file to JSON', async () => {
    const { ref } = renderEditor();
    const file = new File(['role: reviewer'], 'agent.yaml', { type: 'text/yaml' });

    fireEvent.drop(getView().contentDOM, { dataTransfer: { files: [file] } });

    await waitFor(() => expect(ref.current.getInputContent()).toBe('{"role":"reviewer"}'));
  });

  it('shows an error when a dropped YAML file cannot be parsed', async () => {
    const { ref } = renderEditor();
    const file = new File(['role: [unclosed'], 'agent.yaml', { type: 'text/yaml' });

    fireEvent.drop(getView().contentDOM, { dataTransfer: { files: [file] } });

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Error parsing File: Unsupported format'));
    expect(ref.current.getInputContent()).toBe('## Ping');
  });

  it('ignores dropped files when disabled', async () => {
    const { ref, handlers } = renderEditor({ disabled: true });
    const file = new File(['Hello'], 'notes.md', { type: 'text/markdown' });

    fireEvent.drop(getView().contentDOM, { dataTransfer: { files: [file] } });

    await new Promise(resolve => setTimeout(resolve, 20));
    expect(ref.current.getInputContent()).toBe('## Ping');
    expect(handlers.updateVariableList).not.toHaveBeenCalled();
  });

  it('routes the ref API to the full-screen editor while it is open', () => {
    const { ref } = renderEditor({ isFullScreenOpen: true });

    expect(ref.current.getInputContent()).toBe('modal text');
    expect(ref.current.getCursorPosition()).toBe(3);
  });

  it('commits full-screen edits on close', () => {
    const { handlers } = renderEditor({ isFullScreenOpen: true });

    fireEvent.click(screen.getByTestId('agent-instructions-full-screen-modal'));

    expect(handlers.onValueChange).toHaveBeenCalledWith('from full screen');
    expect(handlers.updateVariableList).toHaveBeenCalledWith('from full screen');
    expect(handlers.onCloseFullScreen).toHaveBeenCalled();
  });
});
