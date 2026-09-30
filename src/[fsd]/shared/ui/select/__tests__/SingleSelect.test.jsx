// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import SingleSelect from '../SingleSelect';

const OPTIONS = [{ value: 'a', label: 'Option A' }];

const renderSelect = props =>
  render(
    <ThemeProvider theme={createTheme({ palette: lightPalette })}>
      <SingleSelect
        options={OPTIONS}
        value=""
        showBorder
        displayEmpty
        {...props}
      />
    </ThemeProvider>,
  );

describe('SingleSelect info tooltip', () => {
  afterEach(() => cleanup());

  it('puts the given test id on the info icon next to the label', () => {
    renderSelect({
      label: 'Field',
      infoIconDescription: 'Some hint',
      infoTooltipTestId: 'field-info',
      infoTooltipContentTestId: 'field-info-text',
    });

    expect(screen.getByTestId('field-info')).toBeInTheDocument();
  });

  it('renders no info icon without a description', () => {
    renderSelect({ label: 'Field', infoTooltipTestId: 'field-info' });

    expect(screen.queryByTestId('field-info')).not.toBeInTheDocument();
  });
});
