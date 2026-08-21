// @vitest-environment jsdom
import { useState } from 'react';

import { Formik, useFormikContext } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { useToolkitTestRunner } from '../useToolkitTestRunner.hooks';

vi.mock('@/pages/Applications/Components/Tools/consts', () => ({
  ToolTypes: { custom: { value: 'custom' } },
}));

vi.mock('@/[fsd]/features/toolkits/lib/helpers', () => ({
  ToolkitChatHelpers: {
    validateToolkitForm: (schema, variables) =>
      (schema.required || []).every(field => Boolean(variables?.[field])),
  },
}));

vi.mock('@/hooks/toolkit/useGetSelectedToolSchema', () => ({
  useGetSelectedToolSchema: () => ({
    type: 'object',
    required: ['query'],
    properties: { query: { type: 'string' } },
  }),
}));

vi.mock('@/[fsd]/features/mcp', () => ({
  useMcpAuthModal: () => ({ handleMcpAuthRequired: () => {}, getModalProps: () => ({}) }),
}));

vi.mock('../useToolkitChat.hooks', () => ({
  useToolkitChat: () => ({
    chatHistory: [],
    handleRunTool: () => {},
    handleClearChat: () => {},
    isRunning: false,
    retryLastRun: () => {},
    modelList: [],
    onSelectModel: () => {},
    onSetLLMSettings: () => {},
    selectedModel: null,
    llmSettings: {},
  }),
}));

afterEach(() => cleanup());

const TOOLKIT = { id: 43, type: 'confluence', settings: {} };

const Runner = () => {
  const { values, setFieldValue } = useFormikContext();
  const { selectedTool, onChangeTool, toolInputVariables, onChangeInputVariables } = useToolkitTestRunner({
    toolkitId: '43',
    values,
  });

  return (
    <>
      <button
        data-testid="pick-tool"
        onClick={() => onChangeTool('search_index')}
      />
      <button
        data-testid="fill-query"
        onClick={() => onChangeInputVariables({ ...toolInputVariables, query: 'typed by user' })}
      />
      <button
        data-testid="dirty-formik"
        onClick={() => setFieldValue('probe', 'formik state')}
      />
      <span data-testid="tool">{String(selectedTool)}</span>
      <span data-testid="query">{String(toolInputVariables.query)}</span>
      <span data-testid="formik-probe">{String(values.probe)}</span>
    </>
  );
};

const Host = () => {
  const [name, setName] = useState('Confluence Stub');
  const [, rerender] = useState(0);

  return (
    <>
      <button
        data-testid="refetch-same-content"
        onClick={() => rerender(n => n + 1)}
      />
      <button
        data-testid="refetch-new-content"
        onClick={() => setName('Renamed toolkit')}
      />
      <Formik
        enableReinitialize
        initialValues={{ ...TOOLKIT, name }}
        onSubmit={() => {}}
      >
        <Runner />
      </Formik>
    </>
  );
};

const enterSearch = () => {
  fireEvent.click(screen.getByTestId('pick-tool'));
  fireEvent.click(screen.getByTestId('fill-query'));
  fireEvent.click(screen.getByTestId('dirty-formik'));
};

const expectSearchIntact = () => {
  expect(screen.getByTestId('tool')).toHaveTextContent('search_index');
  expect(screen.getByTestId('query')).toHaveTextContent('typed by user');
};

describe('useToolkitTestRunner under Formik reinitialization', () => {
  it('does not reinitialize when initialValues is a fresh reference over identical content', () => {
    render(<Host />);
    enterSearch();

    fireEvent.click(screen.getByTestId('refetch-same-content'));
    fireEvent.click(screen.getByTestId('refetch-same-content'));

    expect(screen.getByTestId('formik-probe')).toHaveTextContent('formik state');
    expectSearchIntact();
  });

  it('keeps the selected tool and entered parameters even when reinitialization does fire', () => {
    render(<Host />);
    enterSearch();

    fireEvent.click(screen.getByTestId('refetch-new-content'));

    expect(screen.getByTestId('formik-probe')).toHaveTextContent('undefined');
    expectSearchIntact();
  });
});
