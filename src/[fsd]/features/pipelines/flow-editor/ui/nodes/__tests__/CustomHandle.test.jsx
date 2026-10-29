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
  Handle: ({ children, onClick, position, style, isConnectable }) => (
    <div
      data-testid="rf-handle"
      data-position={position}
      data-connectable={String(isConnectable)}
      style={{ left: style?.left, top: style?.top }}
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

  describe('orientation', () => {
    it('puts the Input on top and the Output at the bottom top to bottom', () => {
      renderHandle();
      expect(screen.getByTestId('rf-handle')).toHaveAttribute('data-position', 'bottom');
      cleanup();

      renderHandle({ props: { type: 'target' } });
      expect(screen.getByTestId('rf-handle')).toHaveAttribute('data-position', 'top');
    });

    it('puts the Input on the left and the Output on the right left to right', () => {
      renderHandle({ context: { orientation: 'horizontal' } });
      expect(screen.getByTestId('rf-handle')).toHaveAttribute('data-position', 'right');
      cleanup();

      renderHandle({ props: { type: 'target' }, context: { orientation: 'horizontal' } });
      expect(screen.getByTestId('rf-handle')).toHaveAttribute('data-position', 'left');
    });

    it('spreads several outputs along the bottom edge top to bottom', () => {
      renderHandle({ props: { offset: 'calc(50% - 3.125rem)', outputIndex: 0 } });

      expect(screen.getByTestId('rf-handle').style.left).toBe('calc(50% - 3.125rem)');
      expect(screen.getByTestId('rf-handle').style.top).toBe('');
    });

    it('stacks several outputs below the card header left to right', () => {
      renderHandle({
        props: { offset: 'calc(50% - 3.125rem)', outputIndex: 0 },
        context: { orientation: 'horizontal' },
      });
      expect(screen.getByTestId('rf-handle').style.top).toBe('5.125rem');
      expect(screen.getByTestId('rf-handle').style.left).toBe('');
      cleanup();

      renderHandle({ props: { outputIndex: 2 }, context: { orientation: 'horizontal' } });
      expect(screen.getByTestId('rf-handle').style.top).toBe('8.375rem');
    });

    it('keeps several outputs inside a mini card left to right', () => {
      renderHandle({
        props: { outputIndex: 0, outputCount: 2 },
        context: { orientation: 'horizontal' },
        isExpanded: false,
      });
      expect(screen.getByTestId('rf-handle').style.top).toBe('calc(50% - 0.5rem)');
      cleanup();

      renderHandle({
        props: { outputIndex: 1, outputCount: 2 },
        context: { orientation: 'horizontal' },
        isExpanded: false,
      });
      expect(screen.getByTestId('rf-handle').style.top).toBe('calc(50% + 0.5rem)');
    });

    it('keeps a single output centred left to right', () => {
      renderHandle({ context: { orientation: 'horizontal' } });

      expect(screen.getByTestId('rf-handle').style.top).toBe('');
    });
  });

  describe('locked canvas', () => {
    it('is not connectable and hides the "+"', () => {
      renderHandle({ context: { isCanvasLocked: true } });

      expect(screen.getByTestId('rf-handle')).toHaveAttribute('data-connectable', 'false');
      expect(screen.getByText('Output')).toBeInTheDocument();
      expect(screen.queryByTestId('pipeline-node-add-from-output-llm_1-out')).toBeNull();
    });

    it('is connectable again once unlocked', () => {
      renderHandle({ context: { isCanvasLocked: false } });

      expect(screen.getByTestId('rf-handle')).toHaveAttribute('data-connectable', 'true');
    });
  });
});
