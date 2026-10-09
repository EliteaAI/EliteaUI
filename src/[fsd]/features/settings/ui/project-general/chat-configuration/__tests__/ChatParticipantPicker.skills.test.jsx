// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';
import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChatParticipantPicker from '../ChatParticipantPicker';

vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));

const fetchState = vi.hoisted(() => ({ requestedTypes: [], participants: [] }));

vi.mock('@/hooks/chat/useParticipants', () => ({
  default: ({ types }) => {
    fetchState.requestedTypes.push(types);
    return {
      participants: fetchState.participants,
      isFetching: false,
      isFirstPageFetching: false,
      onLoadMore: vi.fn(),
    };
  },
}));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useIsMcpVisible: () => true,
}));
vi.mock('@/components/EntityIcon', () => ({
  default: ({ entityType }) => <span data-testid={`option-icon-${entityType}`} />,
  EntityTypeIcon: ({ type }) => <span data-testid={`chip-icon-${type}`} />,
}));

const ownSkill = { id: 8, name: 'Reviewer', project_id: 2, participantType: ChatParticipantType.Skills };
const catalogSkill = {
  id: 8,
  name: 'Release notes',
  project_id: PUBLIC_PROJECT_ID,
  participantType: ChatParticipantType.Skills,
};
const agent = { id: 3, name: 'Agent', project_id: 2, participantType: ChatParticipantType.Applications };

const theme = createTheme({ palette: lightPalette });

const renderPicker = (participants = []) => {
  const onChange = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <ChatParticipantPicker
        participants={participants}
        onChange={onChange}
      />
    </ThemeProvider>,
  );
  return onChange;
};

const openSkillsTab = async () => {
  await userEvent.click(screen.getByTestId('chat-template-participants-input'));
  await userEvent.click(screen.getByTestId('chat-participant-tab-skills'));
};

beforeEach(() => {
  fetchState.requestedTypes = [];
  fetchState.participants = [agent, ownSkill, catalogSkill];
});
afterEach(cleanup);

describe('ChatParticipantPicker Skills tab', () => {
  it('lists own and Catalog skills with skill icons and a Catalog badge', async () => {
    renderPicker();
    await openSkillsTab();

    expect(fetchState.requestedTypes.at(-1)).toEqual([ChatParticipantType.Skills]);
    const options = screen.getAllByRole('option');
    expect(options.map(option => option.textContent)).toEqual(['Reviewer', 'Release notesCatalog']);
    expect(within(options[0]).getByTestId('option-icon-skill')).toBeInTheDocument();
  });

  it('adds a Catalog skill as a skill entry of the public project', async () => {
    const onChange = renderPicker();
    await openSkillsTab();
    await userEvent.click(screen.getByRole('option', { name: /Release notes/ }));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 8,
        name: 'Release notes',
        entity_name: 'skill',
        project_id: PUBLIC_PROJECT_ID,
      }),
    ]);
  });

  it('shows a chosen Catalog skill as a chip with the skill icon and the Catalog badge', () => {
    renderPicker([{ id: 8, name: 'Release notes', entity_name: 'skill', project_id: PUBLIC_PROJECT_ID }]);

    const chip = screen.getByText('Release notes').closest('.MuiChip-root');
    expect(within(chip).getByTestId('chip-icon-skill')).toBeInTheDocument();
    expect(within(chip).getByText('Catalog')).toBeInTheDocument();
  });

  it('does not add a skill that is already in the template', async () => {
    const chosen = { id: 8, name: 'Reviewer', entity_name: 'skill', project_id: 2 };
    const onChange = renderPicker([chosen]);
    await openSkillsTab();

    expect(screen.getByRole('option', { name: 'Reviewer' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('option', { name: 'Reviewer' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
