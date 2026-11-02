// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import TokenScopeFields from '../TokenScopeFields';

const projectList = vi.hoisted(() => vi.fn());
vi.mock('@/api/project', async importOriginal => ({
  ...(await importOriginal()),
  useProjectListQuery: projectList,
}));
vi.mock('@/[fsd]/shared/ui/select', () => ({
  SingleSelect: props => (
    <select
      data-testid={props['data-testid']}
      multiple
      value={props.value.map(String)}
      onChange={event =>
        props.onChange({ target: { value: [...event.target.selectedOptions].map(o => Number(o.value)) } })
      }
    >
      {props.options.map(option => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

const theme = createTheme({ palette: lightPalette });

const renderFields = props =>
  render(
    <ThemeProvider theme={theme}>
      <TokenScopeFields
        restricted={false}
        projects={[]}
        operations={['run']}
        error=""
        onToggle={vi.fn()}
        onProjectsChange={vi.fn()}
        onOperationsChange={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

describe('TokenScopeFields (#7336)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectList.mockReturnValue({ data: [{ id: 5, name: 'project_user_9' }] });
  });
  afterEach(() => cleanup());

  it('is collapsed by default and asks for no projects', () => {
    const onToggle = vi.fn();
    renderFields({ onToggle });
    expect(screen.queryByTestId('create-personal-token-scope')).not.toBeInTheDocument();
    expect(projectList).toHaveBeenCalledWith(undefined, { skip: true });
    fireEvent.click(screen.getByTestId('create-personal-token-restrict-toggle'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('expanded, offers the user projects and the operations, run checked', () => {
    const onProjectsChange = vi.fn();
    const onOperationsChange = vi.fn();
    renderFields({ restricted: true, onProjectsChange, onOperationsChange });
    expect(projectList).toHaveBeenCalledWith(undefined, { skip: false });
    expect(screen.getByTestId('create-personal-token-scope-run')).toBeChecked();
    expect(screen.getByTestId('create-personal-token-scope-build')).not.toBeChecked();
    expect(screen.getByTestId('create-personal-token-scope-hint')).toHaveTextContent('90 days');

    const select = screen.getByTestId('create-personal-token-scope-projects');
    select.options[0].selected = true;
    fireEvent.change(select);
    expect(onProjectsChange).toHaveBeenCalledWith([5]);
    fireEvent.click(screen.getByTestId('create-personal-token-scope-build'));
    expect(onOperationsChange).toHaveBeenCalledWith(['run', 'build']);
    fireEvent.click(screen.getByTestId('create-personal-token-scope-run'));
    expect(onOperationsChange).toHaveBeenCalledWith([]);
  });

  it('shows why the scope cannot be used', () => {
    renderFields({ restricted: true, error: 'Select at least one project' });
    expect(screen.getByTestId('create-personal-token-scope-hint')).toHaveTextContent(
      'Select at least one project',
    );
  });
});
