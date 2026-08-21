// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Box } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import IndexConfigurationTab from '../IndexConfigurationTab';

vi.mock('@/[fsd]/features/toolkits/ui', () => ({
  ToolkitForm: {
    ToolFormContainer: props => <Box data-testid={`field-${props.fieldKey}`} />,
  },
}));

vi.mock('@/[fsd]/shared/ui', () => ({
  ScrollableContainer: props => <Box>{props.children}</Box>,
}));

afterEach(() => cleanup());

const renderTab = configFields =>
  render(
    <IndexConfigurationTab
      configFields={configFields}
      configSchema={{ properties: Object.fromEntries(configFields.map(k => [k, { type: 'string' }])) }}
      configInputVariables={{}}
      onChangeInputVariables={() => {}}
    />,
  );

describe('IndexConfigurationTab', () => {
  it('spins while the schema has not arrived', () => {
    renderTab([]);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('index-configuration-empty')).not.toBeInTheDocument();
  });

  it('renders every field except the immutable index name', () => {
    renderTab(['index_name', 'clean_index', 'branch']);

    expect(screen.queryByTestId('field-index_name')).not.toBeInTheDocument();
    expect(screen.getByTestId('field-clean_index')).toBeInTheDocument();
    expect(screen.getByTestId('field-branch')).toBeInTheDocument();
    expect(screen.queryByTestId('index-configuration-empty')).not.toBeInTheDocument();
  });

  it('explains itself instead of going blank when index name is the only field', () => {
    renderTab(['index_name']);

    expect(screen.getByTestId('index-configuration-empty')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
