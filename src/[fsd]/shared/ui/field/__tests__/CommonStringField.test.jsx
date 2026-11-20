// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import CommonStringField from '../CommonStringField';

vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useToast: () => ({ toastInfo: () => {} }) }));
vi.mock('@/[fsd]/shared/ui', () => ({ Field: {}, Input: {} }));
vi.mock('@/[fsd]/shared/ui/tooltip/InfoTooltip', () => ({ default: () => null }));
vi.mock('@/components/Icons/CopyIcon', () => ({ default: () => null }));
vi.mock('@/[fsd]/shared/ui/select', () => ({
  SingleSelect: props => (
    <span
      data-testid="select"
      data-value={JSON.stringify(props.value)}
    >
      {props.options.map(option => (
        <button
          key={option.label}
          data-testid={`option-${option.label}`}
          data-label-type={typeof option.label}
          onClick={() => props.onValueChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </span>
  ),
}));

afterEach(() => cleanup());

const renderSelect = (enumValues, fieldValue, onChangeInputVariables = () => {}) =>
  render(
    <CommonStringField
      fieldKey="link_type"
      fieldValue={fieldValue}
      fieldProperties={{ enumValues, isRequired: true, label: 'Link type' }}
      property={{ type: 'integer', enum: enumValues }}
      toolInputVariables={{}}
      onChangeInputVariables={onChangeInputVariables}
    />,
  );

describe('CommonStringField select', () => {
  it('labels numeric options as text and sends the raw number', () => {
    const onChange = vi.fn();
    renderSelect([10, 20], undefined, onChange);

    fireEvent.click(screen.getByTestId('option-20'));

    expect(screen.getByTestId('option-20').dataset.labelType).toBe('string');
    expect(onChange).toHaveBeenCalledWith({ link_type: 20 });
  });

  it('keeps a selected 0 displayed', () => {
    renderSelect([0, 1], 0);

    expect(screen.getByTestId('select').dataset.value).toBe('0');
  });
});
