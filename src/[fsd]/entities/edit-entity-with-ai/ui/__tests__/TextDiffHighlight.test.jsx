// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';

import TextDiffHighlight from '../TextDiffHighlight';

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

const theme = createTheme({ palette: { diff: { added: '#00ff00', removed: '#ff0000' } } });

const renderEditable = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <TextDiffHighlight
        original="hello"
        modified="hello"
        mode="modified"
        editable
        {...props}
      />
    </ThemeProvider>,
  );

const getEditable = container => container.querySelector('[contenteditable]');

const typeText = (element, text) => {
  // jsdom doesn't implement innerText layout; the assignment is read back as-is by the component.
  element.innerText = text;
  fireEvent.input(element);
};

describe('TextDiffHighlight (editable)', () => {
  it('emits onChange on every input when no maxLength is set', () => {
    const onChange = vi.fn();
    const { container } = renderEditable({ onChange });
    const editable = getEditable(container);

    fireEvent.focus(editable);
    typeText(editable, 'hello world');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('hello world');
  });

  it('truncates input to maxLength', () => {
    const onChange = vi.fn();
    const { container } = renderEditable({ onChange, maxLength: 5 });
    const editable = getEditable(container);

    fireEvent.focus(editable);
    typeText(editable, 'hello world');

    expect(onChange).toHaveBeenLastCalledWith('hello');
  });

  it('does not emit onChange on blur when text is already synced', () => {
    const onChange = vi.fn();
    const { container } = renderEditable({ onChange, modified: 'hello world' });
    const editable = getEditable(container);

    fireEvent.focus(editable);
    editable.innerText = 'hello world';
    fireEvent.blur(editable);

    expect(onChange).not.toHaveBeenCalled();
    expect(editable.textContent).toBe('hello world');
    expect(editable.querySelector('span')).toHaveTextContent('world');
  });

  it('emits onChange on blur when text differs from modified', () => {
    const onChange = vi.fn();
    const { container } = renderEditable({ onChange });
    const editable = getEditable(container);

    fireEvent.focus(editable);
    editable.innerText = 'changed';
    fireEvent.blur(editable);

    expect(onChange).toHaveBeenCalledWith('changed');
  });
});
