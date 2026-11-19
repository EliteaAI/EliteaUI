// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ToolFormContainer from '../ToolFormContainer';

vi.mock('@/[fsd]/shared/ui', () => {
  const stub = kind => {
    const FieldStub = props => (
      <span
        data-testid={`${kind}-${props.fieldKey}`}
        data-options={JSON.stringify(props.fieldProperties.enumValues ?? null)}
      />
    );
    return FieldStub;
  };
  return {
    Field: {
      CommonStringField: stub('string'),
      CommonNumberField: stub('number'),
      CommonBooleanField: stub('boolean'),
      CommonObjectField: stub('object'),
      CommonArrayField: stub('array'),
      AnyOfPatternField: stub('pattern'),
      SecretInputField: stub('secret'),
    },
  };
});

afterEach(() => cleanup());

const renderField = property =>
  render(
    <ToolFormContainer
      fieldKey="choice"
      property={property}
      schema={{ properties: { choice: property } }}
      toolInputVariables={{}}
      onChangeInputVariables={() => {}}
    />,
  );

const optionsOf = kind => JSON.parse(screen.getByTestId(`${kind}-choice`).dataset.options);

describe('ToolFormContainer option lists', () => {
  it('offers a top-level string enum', () => {
    renderField({ type: 'string', enum: ['a', 'b'] });

    expect(optionsOf('string')).toEqual(['a', 'b']);
  });

  it('offers the enum of an Optional Literal nested in anyOf', () => {
    renderField({ anyOf: [{ type: 'string', enum: ['opened', 'closed'] }, { type: 'null' }] });

    expect(optionsOf('string')).toEqual(['opened', 'closed']);
  });

  it('routes an integer enum to the select with numeric options', () => {
    renderField({ type: 'integer', enum: [10, 20] });

    expect(optionsOf('string')).toEqual([10, 20]);
    expect(screen.queryByTestId('number-choice')).not.toBeInTheDocument();
  });

  it('keeps a top-level enum declared next to anyOf', () => {
    renderField({ enum: ['a', 'b'], anyOf: [{ type: 'string' }, { type: 'null' }] });

    expect(optionsOf('string')).toEqual(['a', 'b']);
  });

  it('offers a single-value Literal emitted as const', () => {
    renderField({ type: 'string', const: 'release' });

    expect(optionsOf('string')).toEqual(['release']);
  });

  it('keeps free text when anyOf also allows any string', () => {
    renderField({ anyOf: [{ type: 'string', enum: ['a'] }, { type: 'string' }, { type: 'null' }] });

    expect(optionsOf('string')).toBeNull();
  });

  it('keeps plain text and number inputs without an enum', () => {
    renderField({ type: 'string' });
    expect(optionsOf('string')).toBeNull();
    cleanup();

    renderField({ anyOf: [{ type: 'integer' }, { type: 'null' }] });
    expect(optionsOf('number')).toBeNull();
  });
});
