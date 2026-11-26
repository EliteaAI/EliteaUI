// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import AgentVersionSelect from '../AgentVersionSelect';

const SWARM_META = { internal_tools: ['swarm'] };

const mocks = vi.hoisted(() => ({ versions: [] }));

vi.mock('@/[fsd]/features/pipelines/tool-picker/lib/hooks/useIsVersionLocked.hooks', () => ({
  useIsVersionLocked: () => false,
}));
vi.mock('@/[fsd]/features/pipelines/tool-picker/lib/hooks/usePipelineAttachments.hooks', () => ({
  usePipelineAttachments: () => ({ setApplicationVersion: vi.fn() }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 406 }));
vi.mock('@/api/applications', () => ({
  useApplicationDetailsQuery: () => ({ data: { versions: mocks.versions }, isFetching: false }),
}));
vi.mock('@/[fsd]/shared/ui/select', () => ({
  SingleSelect: props => (
    <div data-testid="single-select">
      <span data-testid="helper-text">{props.helperText}</span>
      <span data-testid="shows-descriptions">{String(Boolean(props.showOptionDescription))}</span>
      <span data-testid="has-error">{String(Boolean(props.error))}</span>
      {props.options.map(option => (
        <span
          key={option.value}
          data-testid={`option-${option.value}`}
          data-disabled={String(Boolean(option.disabled))}
          data-description={option.description}
        >
          {option.label}
        </span>
      ))}
    </div>
  ),
}));

const renderSelect = versionId =>
  render(
    <AgentVersionSelect tool={{ settings: { application_id: 5, application_version_id: versionId } }} />,
  );

describe('AgentVersionSelect', () => {
  beforeEach(() => {
    mocks.versions = [
      { id: 1, name: 'base', meta: {}, created_at: '2026-11-01' },
      { id: 2, name: 'v2', meta: SWARM_META, created_at: '2026-11-02' },
    ];
  });

  afterEach(() => cleanup());

  it('lists a Swarm version but disables it', () => {
    renderSelect(1);

    expect(screen.getByTestId('option-2')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByTestId('option-1')).toHaveAttribute('data-disabled', 'false');
    // the reason only renders when the select is asked to show option descriptions
    expect(screen.getByTestId('option-2')).toHaveAttribute(
      'data-description',
      expect.stringMatching(/Swarm Mode/),
    );
    expect(screen.getByTestId('shows-descriptions')).toHaveTextContent('true');
    expect(screen.getByTestId('has-error')).toHaveTextContent('false');
    expect(screen.getByTestId('helper-text')).toBeEmptyDOMElement();
  });

  it('disables the pinned version too when Swarm Mode was enabled after it was picked, and warns', () => {
    renderSelect(2);

    expect(screen.getByTestId('option-2')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByTestId('has-error')).toHaveTextContent('true');
    expect(screen.getByTestId('helper-text')).toHaveTextContent(/Swarm Mode/);
  });

  it('still reports a pinned version that no longer exists', () => {
    renderSelect(99);

    expect(screen.getByTestId('has-error')).toHaveTextContent('true');
    expect(screen.getByTestId('helper-text')).toHaveTextContent(/no longer exists/);
  });
});
