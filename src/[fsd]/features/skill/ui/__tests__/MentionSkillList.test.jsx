// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import MentionSkillList from '../MentionSkillList';

vi.mock('@/[fsd]/shared/ui', () => ({
  Mention: {
    MentionToolItem: props => <div data-testid={props.testId}>{props.label}</div>,
  },
}));
vi.mock('@/assets/skill-icon.svg?react', () => ({ default: () => null }));
vi.mock('@/components/EliteAImage', () => ({ default: () => null }));

const renderList = filteredItems =>
  render(
    <ThemeProvider
      theme={createTheme({
        palette: { border: { lines: '#ccc' }, background: { default: { secondary: '#fff' } } },
      })}
    >
      <MentionSkillList
        phase="items"
        filteredItems={filteredItems}
        committedMentions={[]}
        highlightedIndex={0}
        onSelectItem={vi.fn()}
        onClose={vi.fn()}
      />
    </ThemeProvider>,
  );

describe('MentionSkillList groups', () => {
  afterEach(() => cleanup());

  it('heads the attached and the chat skills with their group names', () => {
    renderList([
      { name: 'auditor', group: 'attached' },
      { name: 'writer', group: 'attached' },
      { name: 'reviewer', group: 'chat' },
    ]);

    expect(screen.getByTestId('skill-mention-group-attached')).toHaveTextContent('Attached to agent');
    expect(screen.getByTestId('skill-mention-group-chat')).toHaveTextContent('Skills in this chat');
    expect(screen.getAllByTestId(/^skill-mention-(group|item)-/).map(node => node.dataset.testid)).toEqual([
      'skill-mention-group-attached',
      'skill-mention-item-auditor',
      'skill-mention-item-writer',
      'skill-mention-group-chat',
      'skill-mention-item-reviewer',
    ]);
  });

  it('shows no headings for a single group', () => {
    renderList([{ name: 'reviewer', group: 'chat' }, { name: 'writer' }]);

    expect(screen.queryByTestId('skill-mention-group-chat')).not.toBeInTheDocument();
  });

  it('shows the empty message it is given, defaulting to the agent wording', () => {
    const { rerender } = renderList([]);
    expect(screen.getByTestId('skill-mention-list-empty')).toHaveTextContent(
      'No skills attached to this agent',
    );

    rerender(
      <ThemeProvider
        theme={createTheme({
          palette: { border: { lines: '#ccc' }, background: { default: { secondary: '#fff' } } },
        })}
      >
        <MentionSkillList
          phase="items"
          filteredItems={[]}
          committedMentions={[]}
          highlightedIndex={0}
          onSelectItem={vi.fn()}
          onClose={vi.fn()}
          emptyLabel="No skills in this chat"
        />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('skill-mention-list-empty')).toHaveTextContent('No skills in this chat');
  });
});
