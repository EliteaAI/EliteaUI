// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import SkillCompareFileText from '../SkillCompareFileText';

const theme = createTheme({ palette: darkPalette });

const renderText = props =>
  render(
    <ThemeProvider theme={theme}>
      <SkillCompareFileText
        tone="added"
        editable
        {...props}
      />
    </ThemeProvider>,
  );

const differingWords = () =>
  [...screen.getByTestId('skill-compare-file-highlights').querySelectorAll('[data-differing]')].map(
    span => span.textContent,
  );

describe('SkillCompareFileText', () => {
  afterEach(() => cleanup());

  it('highlights the words the other version does not have', () => {
    renderText({ value: 'rect_type: int\nfield: dict', otherValue: 'rect_type: str\nfield: dict' });
    expect(differingWords()).toEqual(['int']);
    expect(screen.getByTestId('skill-compare-file-field')).toHaveValue('rect_type: int\nfield: dict');
  });

  it('follows the text as it is typed, with no need to leave the field', () => {
    const { rerender } = renderText({ value: 'rect_type: str', otherValue: 'rect_type: str' });
    expect(differingWords()).toEqual([]);
    rerender(
      <ThemeProvider theme={theme}>
        <SkillCompareFileText
          tone="added"
          editable
          value="rect_type: int"
          otherValue="rect_type: str"
        />
      </ThemeProvider>,
    );
    expect(differingWords()).toEqual(['int']);
  });

  it('highlights nothing where the other version has no such file', () => {
    renderText({ value: 'validate()' });
    expect(differingWords()).toEqual([]);
  });

  it('passes the typed text on, line breaks as typed', () => {
    const onChange = vi.fn();
    renderText({ value: 'a', otherValue: 'a', onChange });
    fireEvent.change(screen.getByTestId('skill-compare-file-field'), { target: { value: 'a\n\nb' } });
    expect(onChange).toHaveBeenCalledWith('a\n\nb');
  });

  it('cannot be typed in when the version is read only', () => {
    renderText({ value: 'a', otherValue: 'a', editable: false });
    expect(screen.getByTestId('skill-compare-file-field')).toHaveAttribute('readonly');
  });
});
