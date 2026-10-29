// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import YamlCodeEditor from '../YamlCodeEditor';

const { toastInfo, handleCopy } = vi.hoisted(() => ({ toastInfo: vi.fn(), handleCopy: vi.fn() }));

vi.mock('react-redux', async importOriginal => ({
  ...(await importOriginal()),
  useSelector: () => ({ resetFlag: false, initState: { yamlCode: '' } }),
}));

vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useToast: () => ({ toastInfo }),
  useLanguageLinter: () => ({ extensions: [] }),
}));

vi.mock('@/[fsd]/shared/ui', async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    Field: {
      ...original.Field,
      CodeMirrorEditor: props => (
        <textarea
          data-testid="code-mirror-stub"
          value={props.value}
          readOnly={props.readOnly}
          onChange={event => props.notifyChange(event.target.value)}
        />
      ),
    },
  };
});

vi.mock('@/common/utils', async importOriginal => ({ ...(await importOriginal()), handleCopy }));

vi.mock('@/components/StyledInputModal', () => ({
  default: props => (
    <div data-testid={props['data-testid']}>
      <textarea
        data-testid="full-screen-textarea"
        value={props.value}
        readOnly={props.disabled}
        onChange={event => props.onRealtimeChange(event.target.value)}
      />
      <button
        data-testid="full-screen-close"
        onClick={props.onClose}
      />
      {props.afterContent}
    </div>
  ),
}));

const theme = createTheme({ palette: darkPalette });

const renderEditor = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <YamlCodeEditor
        code={'state: {}\n'}
        onChangeCode={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

describe('YamlCodeEditor', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('copies the code from the button inside the editor', () => {
    renderEditor({ copyMessage: 'Copied' });

    fireEvent.click(screen.getByTestId('pipeline-yaml-copy-button'));

    expect(handleCopy).toHaveBeenCalledWith('state: {}\n');
    expect(toastInfo).toHaveBeenCalledWith('Copied');
  });

  it('edits the code in full screen and reports when it opens and closes', () => {
    const onChangeCode = vi.fn();
    const onBlur = vi.fn();
    const onFullScreenChange = vi.fn();
    renderEditor({ onChangeCode, onBlur, onFullScreenChange, fullScreenAfterContent: 'Some error' });

    fireEvent.click(screen.getByTestId('pipeline-yaml-full-screen-button'));

    expect(onFullScreenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByTestId('pipeline-yaml-full-screen-modal')).toHaveTextContent('Some error');
    fireEvent.change(screen.getByTestId('full-screen-textarea'), { target: { value: 'entry_point: a\n' } });
    expect(onChangeCode).toHaveBeenCalledWith('entry_point: a\n');

    fireEvent.click(screen.getByTestId('full-screen-close'));

    expect(onFullScreenChange).toHaveBeenLastCalledWith(false);
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('pipeline-yaml-full-screen-modal')).toBeNull();
  });

  it('keeps Copy and full screen available when read-only', () => {
    renderEditor({ disabled: true });

    expect(screen.getByTestId('code-mirror-stub')).toHaveAttribute('readonly');
    expect(screen.getByTestId('pipeline-yaml-copy-button')).toBeEnabled();
    fireEvent.click(screen.getByTestId('pipeline-yaml-full-screen-button'));
    expect(screen.getByTestId('full-screen-textarea')).toHaveAttribute('readonly');
  });
});
