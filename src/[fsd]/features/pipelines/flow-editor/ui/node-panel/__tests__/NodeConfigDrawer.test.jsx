// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

import NodeConfigDrawer from '../NodeConfigDrawer';

describe('NodeConfigDrawer', () => {
  afterEach(() => cleanup());

  it('renders the panel while open and unmounts it after the close animation', async () => {
    const onExited = vi.fn();
    const { rerender } = render(
      <NodeConfigDrawer
        open
        onExited={onExited}
      >
        <div data-testid="panel" />
      </NodeConfigDrawer>,
    );
    expect(screen.getByTestId('panel')).toBeInTheDocument();

    rerender(
      <NodeConfigDrawer
        open={false}
        onExited={onExited}
      >
        <div data-testid="panel" />
      </NodeConfigDrawer>,
    );

    await waitFor(() => expect(onExited).toHaveBeenCalled());
    expect(screen.queryByTestId('panel')).toBeNull();
  });
});
