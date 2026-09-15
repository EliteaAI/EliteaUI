// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import SecretExternalAccessCell from '../SecretExternalAccessCell';

// The real tooltip only renders its title on hover, so it is flattened into an attribute.
vi.mock('@/ComponentsLib/Tooltip.jsx', () => ({
  default: ({ title, children }) => <div data-tooltip={title}>{children}</div>,
}));

vi.mock('@/[fsd]/shared/ui', () => ({
  Switch: {
    BaseSwitch: ({ checked, disabled, ...rest }) => (
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        {...rest}
      />
    ),
  },
}));

const renderCell = props =>
  render(
    <SecretExternalAccessCell
      row={{ id: 'existing-TOKEN', name: 'TOKEN' }}
      {...props}
    />,
  );

const tooltip = () => screen.getByTestId('secret-row-external-access-toggle').closest('[data-tooltip]');

describe('SecretExternalAccessCell', () => {
  afterEach(() => cleanup());

  it('explains what sharing does when the toggle is usable', () => {
    renderCell();

    expect(tooltip()).toHaveAttribute(
      'data-tooltip',
      expect.stringContaining('read this secret on your behalf'),
    );
    expect(screen.getByTestId('secret-row-external-access-toggle')).toBeEnabled();
  });

  it('blames the missing permission only when the permission is actually missing', () => {
    renderCell({ canEdit: false });

    expect(tooltip()).toHaveAttribute('data-tooltip', 'You do not have permission to change secret sharing.');
  });

  it('asks an editor to finish editing rather than claiming they lack permission', () => {
    renderCell({ canEdit: true, isRowEditing: true });

    expect(tooltip()).toHaveAttribute('data-tooltip', 'Save or cancel your changes to update sharing.');
    expect(screen.getByTestId('secret-row-external-access-toggle')).toBeDisabled();
  });

  it('reports a platform-managed secret ahead of every other reason', () => {
    renderCell({ row: { id: 'existing-TOKEN', name: 'TOKEN', is_default: true }, canEdit: false });

    expect(tooltip()).toHaveAttribute('data-tooltip', 'Platform-managed secrets cannot be shared.');
  });

  it('locks the toggle while its own request is in flight', () => {
    renderCell({ isPending: true });

    expect(screen.getByTestId('secret-row-external-access-toggle')).toBeDisabled();
  });
});
