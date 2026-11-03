// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatHelpers } from '@/[fsd]/features/chat/lib/helpers';
import { cleanup, render, screen } from '@testing-library/react';

import ApplicationAnswerHeader from '../ApplicationAnswerHeader';

vi.mock('@/[fsd]/features/chat/participants/lib/hooks', () => ({
  useParticipantEntityIcon: participant => ({ iconOf: participant?.entity_name }),
  useParticipantName: participant => participant?.meta?.name || 'Elitea',
}));
vi.mock('@/[fsd]/shared/ui/icon', () => ({
  EntityIcon: ({ icon, entityType, showBackgroundColor }) => (
    <div
      data-testid="entity-icon"
      data-icon-of={icon?.iconOf}
      data-entity-type={entityType}
      data-background={String(showBackgroundColor)}
    />
  ),
}));
vi.mock('@/components/Chat/CreatedTimeInfo', () => ({ default: () => null }));

const DUMMY = { id: 2, entity_name: 'dummy', entity_meta: {}, meta: { name: 'EliteA' } };

const renderHeader = importedAuthor =>
  render(
    <ApplicationAnswerHeader
      verticalMode
      participant={DUMMY}
      participantName={importedAuthor?.name}
      importedAuthorParticipant={ChatHelpers.getImportedAuthorParticipant(importedAuthor)}
      messageId="m1"
      styles={{}}
    />,
  );

describe('answer header of a deleted participant (#7332)', () => {
  afterEach(() => cleanup());

  it('shows the default skill icon and name of a deleted skill', () => {
    renderHeader({ entity_name: 'skill', name: 'test' });

    const icon = screen.getByTestId('entity-icon');
    expect(icon.dataset).toMatchObject({ iconOf: 'skill', entityType: 'skill', background: 'true' });
    expect(screen.getByText('test')).toBeTruthy();
  });

  it('shows the pipeline icon of a deleted pipeline', () => {
    renderHeader({ entity_name: 'application', name: 'flow', agent_type: 'pipeline' });

    expect(screen.getByTestId('entity-icon').dataset.entityType).toBe('pipeline');
  });

  it('keeps the system sender for a dummy message nobody authored', () => {
    renderHeader(undefined);

    const icon = screen.getByTestId('entity-icon');
    expect(icon.dataset).toMatchObject({ iconOf: 'dummy', entityType: 'dummy', background: 'false' });
    expect(screen.getByText('EliteA')).toBeTruthy();
  });
});
