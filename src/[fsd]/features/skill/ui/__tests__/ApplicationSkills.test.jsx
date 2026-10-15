// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ApplicationSkills from '../ApplicationSkills';

const query = vi.hoisted(() => ({ data: undefined }));

vi.mock('formik', () => ({
  useFormikContext: () => ({ values: { id: 1, version_details: { id: 10, status: 'draft' } } }),
}));
vi.mock('@/[fsd]/features/skill/api', () => ({
  useGetApplicationSkillsQuery: () => ({ data: query.data }),
}));
vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 2 }));
vi.mock('@/[fsd]/shared/ui/accordion/BasicAccordion', () => ({
  default: ({ items }) => (
    <div>
      {items.map(item => (
        <div key={item.title}>{item.content}</div>
      ))}
    </div>
  ),
}));
vi.mock('@/[fsd]/shared/ui/input/SimpleSearchBar', () => ({
  default: props => (
    <input
      data-testid={props['data-testid']}
      value={props.searchQuery}
      onChange={event => props.onSearchChange(event.target.value)}
    />
  ),
}));
vi.mock('../SkillCard.jsx', () => ({
  default: ({ skill }) => <div data-testid="attached-skill">{skill.name}</div>,
}));
vi.mock('../SkillMenu.jsx', () => ({
  default: ({ disabled }) => (
    <button
      data-testid="add-skill"
      disabled={disabled}
    />
  ),
}));

const skills = count =>
  Array.from({ length: count }, (_, index) => ({
    skill_id: index + 1,
    name: `skill-${index + 1}`,
    description: index === 0 ? 'Use when triaging invoices.' : `Use when case ${index + 1}.`,
  }));

const renderSkills = () =>
  render(
    <ThemeProvider theme={createTheme({ palette: { background: { default: { tertiary: '#fff' } } } })}>
      <ApplicationSkills />
    </ThemeProvider>,
  );

describe('ApplicationSkills with a large skill library', () => {
  beforeEach(() => {
    query.data = undefined;
  });
  afterEach(() => cleanup());

  it('counts against the maximum the API reports', () => {
    query.data = { skills: skills(12), max_skills: 50 };
    renderSkills();

    expect(screen.getByTestId('agent-skills-counter')).toHaveTextContent('12/50 skills added.');
    expect(screen.getByTestId('add-skill')).not.toBeDisabled();
  });

  it('falls back to 50 when the API omits the maximum', () => {
    query.data = { skills: skills(3) };
    renderSkills();

    expect(screen.getByTestId('agent-skills-counter')).toHaveTextContent('3/50 skills added.');
  });

  it('disables adding at the configured limit', () => {
    query.data = { skills: skills(50), max_skills: 50 };
    renderSkills();

    expect(screen.getByTestId('agent-skills-counter')).toHaveTextContent('50/50 skills added.');
    expect(screen.getByTestId('add-skill')).toBeDisabled();
  });

  it('has no search for a short list', () => {
    query.data = { skills: skills(8), max_skills: 50 };
    renderSkills();

    expect(screen.queryByTestId('agent-skills-search')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('attached-skill')).toHaveLength(8);
  });

  it('filters a long list by name or description', () => {
    query.data = { skills: skills(50), max_skills: 50 };
    renderSkills();

    fireEvent.change(screen.getByTestId('agent-skills-search'), { target: { value: 'INVOICES' } });
    expect(screen.getAllByTestId('attached-skill').map(node => node.textContent)).toEqual(['skill-1']);

    fireEvent.change(screen.getByTestId('agent-skills-search'), { target: { value: 'skill-4' } });
    expect(screen.getAllByTestId('attached-skill').map(node => node.textContent)).toEqual([
      'skill-4',
      'skill-40',
      'skill-41',
      'skill-42',
      'skill-43',
      'skill-44',
      'skill-45',
      'skill-46',
      'skill-47',
      'skill-48',
      'skill-49',
    ]);

    fireEvent.change(screen.getByTestId('agent-skills-search'), { target: { value: 'nothing-like-it' } });
    expect(screen.queryByTestId('attached-skill')).not.toBeInTheDocument();
    expect(screen.getByTestId('agent-skills-search-empty')).toBeInTheDocument();
  });

  it('starts with an empty search when the list grows past the threshold again', () => {
    // A fresh style object per render gets past memo without remounting, so local state survives.
    const renderWith = (count, mount) => {
      query.data = { skills: skills(count), max_skills: 50 };
      return mount(
        <ThemeProvider theme={createTheme({ palette: { background: { default: { tertiary: '#fff' } } } })}>
          <ApplicationSkills style={{}} />
        </ThemeProvider>,
      );
    };
    const { rerender } = renderWith(12, render);
    fireEvent.change(screen.getByTestId('agent-skills-search'), { target: { value: 'INVOICES' } });
    expect(screen.getAllByTestId('attached-skill')).toHaveLength(1);

    renderWith(8, rerender);
    expect(screen.queryByTestId('agent-skills-search')).not.toBeInTheDocument();
    renderWith(12, rerender);

    expect(screen.getByTestId('agent-skills-search').value).toBe('');
    expect(screen.getAllByTestId('attached-skill')).toHaveLength(12);
  });
});
