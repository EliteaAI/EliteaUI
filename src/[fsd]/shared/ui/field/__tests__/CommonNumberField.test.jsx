// @vitest-environment jsdom
import { useState } from 'react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const { default: CommonNumberField } = await import('../CommonNumberField');

const theme = createTheme({ palette: darkPalette });

const Harness = ({ property = { type: 'integer' }, onChange }) => {
  const [values, setValues] = useState({ limit: null });
  return (
    <CommonNumberField
      fieldKey="limit"
      fieldValue={values.limit}
      fieldProperties={{ label: 'Limit' }}
      toolInputVariables={values}
      onChangeInputVariables={next => {
        onChange(next);
        setValues(next);
      }}
      property={property}
      fieldType="integer"
    />
  );
};

const renderField = props => {
  const onChange = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <Harness
        {...props}
        onChange={onChange}
      />
    </ThemeProvider>,
  );
  return { input: screen.getByRole('textbox'), onChange };
};

const lastLimit = onChange => onChange.mock.calls.at(-1)[0].limit;

describe('CommonNumberField integer input', () => {
  afterEach(cleanup);

  it('keeps -1 and sends it as a number', () => {
    const { input, onChange } = renderField();
    fireEvent.change(input, { target: { value: '-1' } });
    expect(input).toHaveValue('-1');
    expect(lastLimit(onChange)).toBe(-1);
  });

  it('shows a lone minus while typing but sends null', () => {
    const { input, onChange } = renderField();
    fireEvent.change(input, { target: { value: '-' } });
    expect(input).toHaveValue('-');
    expect(lastLimit(onChange)).toBeNull();
    fireEvent.change(input, { target: { value: '-3' } });
    expect(input).toHaveValue('-3');
    expect(lastLimit(onChange)).toBe(-3);
  });

  it('clearing gives null', () => {
    const { input, onChange } = renderField();
    fireEvent.change(input, { target: { value: '-' } });
    fireEvent.change(input, { target: { value: '' } });
    expect(input).toHaveValue('');
    expect(lastLimit(onChange)).toBeNull();
  });

  it('keeps only a leading minus', () => {
    const { input, onChange } = renderField();
    fireEvent.change(input, { target: { value: '1-2' } });
    expect(lastLimit(onChange)).toBe(12);
    fireEvent.change(input, { target: { value: '--1' } });
    expect(lastLimit(onChange)).toBe(-1);
  });

  it('shows the minimum error for a negative value instead of changing it', () => {
    const { input, onChange } = renderField({ property: { type: 'integer', minimum: 0 } });
    fireEvent.change(input, { target: { value: '-5' } });
    expect(input).toHaveValue('-5');
    expect(lastLimit(onChange)).toBe(-5);
    expect(screen.getByText('Value must be at least 0')).toBeInTheDocument();
  });

  it('shows the exclusiveMinimum error for 0', () => {
    const { input } = renderField({
      property: { anyOf: [{ type: 'integer', exclusiveMinimum: 0 }, { type: 'null' }] },
    });
    fireEvent.change(input, { target: { value: '0' } });
    expect(screen.getByText('Value must be greater than 0')).toBeInTheDocument();
  });
});
