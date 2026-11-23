// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import SingleSelectMenuItem from '@/[fsd]/shared/ui/select/SingleSelectMenuItem';
import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import VersionIconBlock from '../VersionIconBlock';

vi.mock('react-redux', () => ({
  useSelector: select => select({ settings: { project: { id: 5 } } }),
}));

const renderLinkedOption = ({ handleSetDefaultVersion, onClick }) =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={createTheme({ palette: lightPalette })}>
        <SingleSelectMenuItem
          onClick={onClick}
          option={{
            value: 11,
            label: 'v2',
            to: '/agents/all/1/11',
            icon: (
              <VersionIconBlock
                id={11}
                name="v2"
                status="draft"
                defaultVersionID={10}
                handleSetDefaultVersion={handleSetDefaultVersion}
              />
            ),
          }}
          showOptionIcon
        />
      </ThemeProvider>
    </MemoryRouter>,
  );

describe('VersionIconBlock set as default inside a linked option', () => {
  afterEach(cleanup);

  it('sets the default without following the option link or selecting the option', () => {
    const handleSetDefaultVersion = vi.fn();
    const onClick = vi.fn();
    renderLinkedOption({ handleSetDefaultVersion, onClick });

    expect(screen.getByTestId('select-option-11')).toHaveAttribute('href', '/5/agents/all/1/11');

    // fireEvent returns false when the click's default action (following the href) was prevented
    expect(fireEvent.click(screen.getByTestId('version-option-set-default-v2'))).toBe(false);
    expect(handleSetDefaultVersion).toHaveBeenCalledWith(11);
    expect(onClick).not.toHaveBeenCalled();
  });
});
