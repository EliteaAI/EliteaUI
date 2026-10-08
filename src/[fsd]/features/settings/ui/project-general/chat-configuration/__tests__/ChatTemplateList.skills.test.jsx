// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { PUBLIC_PROJECT_ID } from '@/common/constants';
import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import ChatParticipantIcon from '../ChatParticipantIcon';
import ChatTemplateList from '../ChatTemplateList';

vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));

vi.mock('@/components/EntityIcon', () => ({
  default: ({ entityType, icon }) => (
    <span data-testid={icon ? 'circle-icon-custom' : `circle-icon-${entityType}`} />
  ),
  EntityTypeIcon: ({ type }) => <span data-testid={`type-icon-${type}`} />,
}));
vi.mock('@/common/toolkitUtils', () => ({
  getToolIconByType: (type, theme, { isMCP }) => (
    <span data-testid={`toolkit-icon-${type || 'generic'}-${isMCP}`} />
  ),
}));

const theme = createTheme({ palette: lightPalette });
const withTheme = node => <ThemeProvider theme={theme}>{node}</ThemeProvider>;

afterEach(cleanup);

describe('ChatTemplateList with skills', () => {
  it('shows the skill icon and counts skills on the template card', () => {
    const templates = [
      {
        id: 1,
        name: 'Review',
        is_default: true,
        participants: [
          { id: 3, entity_name: 'application', project_id: 2 },
          { id: 8, entity_name: 'skill', project_id: 2 },
          { id: 8, entity_name: 'skill', project_id: PUBLIC_PROJECT_ID },
        ],
      },
    ];
    render(withTheme(<ChatTemplateList templates={templates} />));

    const row = screen.getByTestId('template-row-1');
    expect(within(row).getByText('3 participants')).toBeInTheDocument();
    expect(within(row).getByTestId('type-icon-application')).toBeInTheDocument();
    expect(within(row).getByTestId('type-icon-skill')).toBeInTheDocument();
  });
});

describe('ChatParticipantIcon', () => {
  it('gives an untyped toolkit the generic toolkit icon instead of the skill icon', () => {
    render(withTheme(<ChatParticipantIcon participant={{ entity_name: 'toolkit', toolkit_type: null }} />));

    expect(screen.getByTestId('toolkit-icon-generic-false')).toBeInTheDocument();
    expect(screen.queryByTestId('type-icon-skill')).not.toBeInTheDocument();
  });

  it('draws a template skill with the skill icon in chips and options', () => {
    const skill = { entity_name: 'skill', project_id: 2 };
    render(withTheme(<ChatParticipantIcon participant={skill} />));
    render(
      withTheme(
        <ChatParticipantIcon
          participant={skill}
          withBackground
        />,
      ),
    );

    expect(screen.getByTestId('type-icon-skill')).toBeInTheDocument();
    expect(screen.getByTestId('circle-icon-skill')).toBeInTheDocument();
  });
});
