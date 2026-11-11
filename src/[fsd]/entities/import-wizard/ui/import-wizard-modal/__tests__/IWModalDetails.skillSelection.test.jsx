// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import IWModalDetails from '../IWModalDetails';

const state = vi.hoisted(() => ({
  values: undefined,
  setFieldValue: undefined,
  limit: 10,
  limitQuery: undefined,
}));

vi.mock('formik', () => ({
  useFormikContext: () => ({ values: state.values, setFieldValue: state.setFieldValue }),
}));
vi.mock('@/[fsd]/entities/import-wizard/api', () => ({
  useSkillsLimitsQuery: (args, options) => {
    state.limitQuery(args, options);
    return { data: options?.skip ? undefined : { max_skills_per_agent: state.limit } };
  },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 7 }));
vi.mock('../IWModalEntityCard', () => ({
  default: ({ entity, selection }) => (
    <div data-testid={`card-${entity.import_uuid}`}>
      {selection && (
        <input
          type="checkbox"
          data-testid={`select-${entity.import_uuid}`}
          checked={selection.checked}
          onChange={event => selection.onChange(event.target.checked)}
        />
      )}
      {entity.errorMessages?.map(message => (
        <div
          key={message}
          data-testid={`error-${entity.import_uuid}`}
        >
          {message}
        </div>
      ))}
    </div>
  ),
}));

const buildValues = skillsCount => ({
  selectedProject: { id: 5 },
  importItems: [
    {
      entity: 'agents',
      import_uuid: 'agent-1',
      isSelected: true,
      name: 'agent',
      versions: [
        {
          name: 'base',
          isSelected: true,
          skills: Array.from({ length: skillsCount }, (_, i) => ({ import_uuid: `skill-${i}` })),
        },
      ],
    },
    ...Array.from({ length: skillsCount }, (_, i) => ({
      entity: 'skills',
      import_uuid: `skill-${i}`,
      isSelected: true,
      name: `skill-${i}`,
      versions: [{ name: 'base' }],
    })),
  ],
});

const renderDetails = () =>
  render(
    <ThemeProvider theme={createTheme()}>
      <IWModalDetails isForking />
    </ThemeProvider>,
  );

describe('IWModalDetails skill selection', () => {
  beforeEach(() => {
    state.setFieldValue = vi.fn();
    state.limit = 10;
    state.limitQuery = vi.fn();
  });
  afterEach(() => cleanup());

  it('shows the limit error on the agent and the selected count when over the limit', () => {
    state.values = buildValues(12);

    renderDetails();

    expect(screen.getByTestId('error-agent-1')).toHaveTextContent('Deselect at least 2');
    expect(screen.getByTestId('agent-import-skills-summary')).toHaveTextContent('12 of 12 skills selected');
    expect(screen.getByTestId('agent-import-skills-summary')).toHaveTextContent('at most 10');
  });

  it('shows no error when the selected skills fit the limit', () => {
    state.values = buildValues(10);

    renderDetails();

    expect(screen.queryByTestId('error-agent-1')).not.toBeInTheDocument();
  });

  it('deselecting a skill writes isSelected=false on that skill item', () => {
    state.values = buildValues(12);

    renderDetails();
    fireEvent.click(screen.getByTestId('select-skill-3'));

    // importItems[0] is the agent, so skill-3 sits at index 4.
    expect(state.setFieldValue).toHaveBeenCalledWith('importItems[4].isSelected', false);
  });

  it('counts only the still selected skills', () => {
    state.values = buildValues(12);
    state.values.importItems[1].isSelected = false;
    state.values.importItems[2].isSelected = false;

    renderDetails();

    expect(screen.getByTestId('agent-import-skills-summary')).toHaveTextContent('10 of 12 skills selected');
    expect(screen.queryByTestId('error-agent-1')).not.toBeInTheDocument();
  });

  it('shows the limit error in the fork dialog before a target project is picked', () => {
    state.values = { ...buildValues(12), selectedProject: undefined };

    renderDetails();

    // The limit is platform-wide, so the current project (7) is used to read it.
    expect(state.limitQuery).toHaveBeenCalledWith({ projectId: 7 }, { skip: false });
    expect(screen.getByTestId('error-agent-1')).toHaveTextContent('Deselect at least 2');
  });

  it('reads the limit through the picked target project once there is one', () => {
    state.values = buildValues(12);

    renderDetails();

    expect(state.limitQuery).toHaveBeenCalledWith({ projectId: 5 }, { skip: false });
  });
});
