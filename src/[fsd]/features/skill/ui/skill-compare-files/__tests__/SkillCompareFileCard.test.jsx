// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import SkillCompareFileCard from '../SkillCompareFileCard';

const theme = createTheme({ palette: darkPalette });

const renderCard = props =>
  render(
    <ThemeProvider theme={theme}>
      <SkillCompareFileCard
        side="left"
        file={{ path: 'assets/template.pdf', size: 49152, isText: false }}
        {...props}
      />
    </ThemeProvider>,
  );

describe('SkillCompareFileCard', () => {
  afterEach(() => cleanup());

  it('shows the name and the size of the file, not its folder', () => {
    renderCard();
    const card = screen.getByTestId('skill-compare-file-card-left');
    expect(card).toHaveTextContent('template.pdf');
    expect(card).toHaveTextContent('48 KB');
    expect(card).not.toHaveTextContent('assets/');
  });

  it('downloads the file of its version', () => {
    const onDownload = vi.fn();
    renderCard({ onDownload });
    fireEvent.click(screen.getByLabelText('Download template.pdf'));
    expect(onDownload).toHaveBeenCalledWith('assets/template.pdf');
  });

  it('is framed as a changed value only where the versions differ', () => {
    renderCard({ isChanged: true });
    expect(screen.getByTestId('skill-compare-file-card-left')).toHaveAttribute('data-changed', 'true');
    cleanup();
    renderCard({ isChanged: false });
    expect(screen.getByTestId('skill-compare-file-card-left')).not.toHaveAttribute('data-changed');
  });

  it('does not call a short text file too long when only the other version keeps it from being compared', () => {
    renderCard({ file: { path: 'notes.md', size: 1024, isText: true } });
    const card = screen.getByTestId('skill-compare-file-card-left');
    expect(card).toHaveTextContent('1 KB');
    expect(card).not.toHaveTextContent('too long');
  });

  it('says why a text file is not compared', () => {
    renderCard({ file: { path: 'notes/big.txt', size: 2097152, isText: true } });
    expect(screen.getByTestId('skill-compare-file-card-left')).toHaveTextContent('too long to compare here');
  });
});
