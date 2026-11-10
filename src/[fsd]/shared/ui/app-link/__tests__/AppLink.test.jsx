// @vitest-environment jsdom
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import AppLink from '../AppLink';

const fixture = vi.hoisted(() => ({ projectId: 5 }));

vi.mock('react-redux', () => ({
  useSelector: select => select({ settings: { project: { id: fixture.projectId } } }),
}));

const Location = () => <div data-testid="location">{useLocation().pathname}</div>;

const renderLink = (props = {}) =>
  render(
    <MemoryRouter>
      <Routes>
        <Route
          path="*"
          element={<Location />}
        />
      </Routes>
      <AppLink
        to="/agents/all/7?viewMode=owner"
        data-testid="link"
        {...props}
      >
        Agent
      </AppLink>
    </MemoryRouter>,
  );

describe('AppLink', () => {
  afterEach(cleanup);

  it('renders a real anchor whose href is prefixed with the active project', () => {
    renderLink();
    expect(screen.getByTestId('link').tagName).toBe('A');
    expect(screen.getByTestId('link')).toHaveAttribute('href', '/5/agents/all/7?viewMode=owner');
  });

  it('computes the href itself even if a wrapper passes one down', () => {
    renderLink({ href: '/agents/all/7?viewMode=owner' });
    expect(screen.getByTestId('link')).toHaveAttribute('href', '/5/agents/all/7?viewMode=owner');
  });

  it('leaves the href alone when there is no project', () => {
    fixture.projectId = undefined;
    renderLink();
    expect(screen.getByTestId('link')).toHaveAttribute('href', '/agents/all/7?viewMode=owner');
    fixture.projectId = 5;
  });

  it('navigates in-app on a plain click, to the clean target', () => {
    renderLink();
    fireEvent.click(screen.getByTestId('link'));
    expect(screen.getByTestId('location')).toHaveTextContent('/agents/all/7');
  });

  it('does not navigate when the caller took over the click', () => {
    renderLink({ onClick: event => event.preventDefault() });
    fireEvent.click(screen.getByTestId('link'));
    expect(screen.getByTestId('location')).toHaveTextContent('/');
    expect(screen.getByTestId('location')).not.toHaveTextContent('/agents');
  });

  it('runs onClick for a plain left click', () => {
    const onClick = vi.fn();
    renderLink({ onClick });
    fireEvent.click(screen.getByTestId('link'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['ctrl', { ctrlKey: true }],
    ['meta', { metaKey: true }],
    ['shift', { shiftKey: true }],
    ['alt', { altKey: true }],
    ['middle button', { button: 1 }],
  ])('skips onClick and leaves the default alone for %s click', (_, init) => {
    const onClick = vi.fn();
    renderLink({ onClick });
    const notPrevented = fireEvent.click(screen.getByTestId('link'), init);
    expect(onClick).not.toHaveBeenCalled();
    // fireEvent returns false when preventDefault was called
    expect(notPrevented).toBe(true);
  });
});
