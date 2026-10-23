// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { FlowEditorContext, NodeCardContext } from '@/[fsd]/shared/lib/context';
import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import CustomHandle from '../CustomHandle';

const setEdges = vi.fn();

vi.mock('@xyflow/react', async importOriginal => ({
  ...(await importOriginal()),
  Handle: ({ children, onClick }) => (
    <div
      data-testid="rf-handle"
      onClick={onClick}
    >
      {children}
    </div>
  ),
  useNodeId: () => 'llm_1',
  useEdges: () => [{ id: 'e1', source: 'llm_1', target: 'printer_1' }],
  useReactFlow: () => ({ setEdges }),
}));

const theme = createTheme({ palette: darkPalette });

const renderHandle = ({ props = {}, context = {}, isExpanded = true } = {}) => {
  const onAddFromHandle = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <FlowEditorContext.Provider value={{ onAddFromHandle, ...context }}>
        <NodeCardContext.Provider value={{ isExpanded }}>
          <CustomHandle
            type="source"
            id="out"
            isConnectable
            {...props}
          />
        </NodeCardContext.Provider>
      </FlowEditorContext.Provider>
    </ThemeProvider>,
  );
  return { onAddFromHandle: context.onAddFromHandle ?? onAddFromHandle };
};

describe('CustomHandle', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows the Output label and the "+" on an expanded source handle', () => {
    renderHandle();

    expect(screen.getByText('Output')).toBeInTheDocument();
    expect(screen.getByTestId('pipeline-node-add-from-output-llm_1-out')).toBeInTheDocument();
  });

  it('opens the connection dropdown from the "+" without selecting edges', () => {
    const { onAddFromHandle } = renderHandle();
    const plus = screen.getByTestId('pipeline-node-add-from-output-llm_1-out');

    fireEvent.click(plus);

    expect(onAddFromHandle).toHaveBeenCalledWith({ nodeId: 'llm_1', handleId: 'out', anchorEl: plus });
    expect(setEdges).not.toHaveBeenCalled();
  });

  it('keeps selecting the connected edges when the pill itself is clicked', () => {
    renderHandle();

    fireEvent.click(screen.getByTestId('rf-handle'));

    expect(setEdges).toHaveBeenCalled();
  });

  it('does not open the dropdown when the handle is not connectable', () => {
    const { onAddFromHandle } = renderHandle({ props: { isConnectable: false } });

    fireEvent.click(screen.getByTestId('pipeline-node-add-from-output-llm_1-out'));

    expect(onAddFromHandle).not.toHaveBeenCalled();
  });

  it('does not open the dropdown in read-only mode (no callback in the context)', () => {
    renderHandle({ context: { onAddFromHandle: undefined } });

    fireEvent.click(screen.getByTestId('pipeline-node-add-from-output-llm_1-out'));

    expect(setEdges).toHaveBeenCalled();
  });

  it('hides the label and the "+" on a collapsed (mini) card', () => {
    renderHandle({ isExpanded: false });

    expect(screen.queryByText('Output')).toBeNull();
    expect(screen.queryByTestId('pipeline-node-add-from-output-llm_1-out')).toBeNull();
  });
});
