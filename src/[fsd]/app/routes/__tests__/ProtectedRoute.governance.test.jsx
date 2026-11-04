// @vitest-environment jsdom
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from '@/common/constants';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ProtectedRoute from '../ProtectedRoute';

// the governance route opens for any governance permission and sends everyone else to Applications

vi.mock('@/pages/LoadingPage', () => ({ default: () => <div>loading</div> }));
vi.mock('@/routes', () => ({ default: { Applications: '/applications' } }));

const GOVERNANCE = [
  PERMISSIONS.governance.bindingsView,
  PERMISSIONS.governance.mandatesView,
  PERMISSIONS.governance.credentialsView,
  PERMISSIONS.governance.request,
];

const renderRoute = permissions => {
  const store = configureStore({ reducer: { user: (state = { permissions }) => state } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/governance']}>
        <Routes>
          <Route
            path="/governance"
            element={
              <ProtectedRoute requiredPermissions={GOVERNANCE}>
                <div>governance page</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={<div>applications page</div>}
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

describe('governance route guard', () => {
  afterEach(cleanup);

  it('sends a user without a governance permission to Applications', () => {
    renderRoute([PERMISSIONS.schedules.create]);

    expect(screen.getByText('applications page')).toBeInTheDocument();
    expect(screen.queryByText('governance page')).not.toBeInTheDocument();
  });

  it.each(GOVERNANCE)('opens the page for %s', permission => {
    renderRoute([permission]);

    expect(screen.getByText('governance page')).toBeInTheDocument();
  });
});
