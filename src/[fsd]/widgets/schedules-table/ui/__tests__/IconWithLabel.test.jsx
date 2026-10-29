// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, screen } from '@testing-library/react';

import IconWithLabel from '../IconWithLabel';
import { renderWithTheme } from './_testHelpers';

await vi.hoisted(async () => {
  const { installGlobalStubs } = await import('./_testHelpers');
  installGlobalStubs();
});

vi.mock('@/[fsd]/shared/ui/icon/EntityTypeIcon', () => ({
  default: ({ type }) => <span data-testid={`icon-${type}`} />,
}));

describe('IconWithLabel', () => {
  afterEach(cleanup);

  it('names the icon after the entity type and shows the label', () => {
    renderWithTheme(
      <IconWithLabel
        type="pipeline"
        label="Report pipeline"
      />,
    );
    expect(screen.getByRole('img', { name: 'Pipeline' })).toBeInTheDocument();
    expect(screen.getByText('Report pipeline')).toBeInTheDocument();
  });

  it('falls back to the raw type for an unknown entity type', () => {
    renderWithTheme(
      <IconWithLabel
        type="toolkit"
        label="Tools"
      />,
    );
    expect(screen.getByRole('img', { name: 'toolkit' })).toBeInTheDocument();
  });
});
