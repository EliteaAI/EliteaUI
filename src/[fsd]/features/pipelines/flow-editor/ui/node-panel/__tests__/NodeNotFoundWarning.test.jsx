// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import NodeNotFoundWarning from '../NodeNotFoundWarning';

const theme = createTheme({ palette: darkPalette });

describe('NodeNotFoundWarning', () => {
  afterEach(() => cleanup());

  it('renders the message under the given testid', () => {
    render(
      <ThemeProvider theme={theme}>
        <NodeNotFoundWarning
          message="Toolkit not found — select a replacement or delete this node"
          data-testid="pipeline-toolkit-node-not-found"
        />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('pipeline-toolkit-node-not-found')).toHaveTextContent(
      'Toolkit not found — select a replacement or delete this node',
    );
  });
});
