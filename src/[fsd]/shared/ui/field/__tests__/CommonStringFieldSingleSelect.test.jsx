// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import CommonStringField from '../CommonStringField';

vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useToast: () => ({ toastInfo: () => {} }) }));
vi.mock('@/[fsd]/shared/ui', () => ({ Banner: () => null, Field: {}, Input: {} }));
vi.mock('@/components/Icons/CopyIcon', () => ({ default: () => null }));

afterEach(() => cleanup());

const renderSelect = (enumValues, fieldValue) =>
  render(
    <ThemeProvider theme={createTheme({ palette: lightPalette })}>
      <CommonStringField
        fieldKey="link_type"
        fieldValue={fieldValue}
        fieldProperties={{ enumValues, isRequired: true, label: 'Link type' }}
        property={{ type: 'integer', enum: enumValues }}
        toolInputVariables={{}}
        onChangeInputVariables={() => {}}
      />
    </ThemeProvider>,
  );

describe('CommonStringField with the real SingleSelect', () => {
  it('shows a selected numeric option', () => {
    renderSelect([10, 20], 20);

    expect(screen.getByRole('combobox')).toHaveTextContent('20');
  });

  it('shows a selected 0', () => {
    renderSelect([0, 1], 0);

    expect(screen.getByRole('combobox')).toHaveTextContent('0');
  });
});
