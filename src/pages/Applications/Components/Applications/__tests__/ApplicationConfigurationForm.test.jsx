// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ViewMode } from '@/common/constants.js';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ApplicationConfigurationForm from '../ApplicationConfigurationForm';

const stub = vi.hoisted(() => id => Object.assign(() => <div data-testid={id} />, { displayName: id }));

vi.mock('formik', () => ({ useFormikContext: () => ({ initialValues: { name: 'Saved' } }) }));
vi.mock('@/[fsd]/features/agent/ui/agent-details/configurations', () => ({
  AgentInput: { InstructionsInput: stub('instructions'), WelcomeMessageInput: stub('welcome') },
  ApplicationTools: stub('tools'),
}));
vi.mock('@/[fsd]/features/agent/ui/agent-details/configurations/ApplicationAdvanceSettings', () => ({
  default: stub('advanced'),
}));
vi.mock('@/[fsd]/features/agent/ui/agent-details/configurations/ApplicationEditorNotes', () => ({
  default: stub('notes'),
}));
vi.mock('@/[fsd]/features/skill/ui', () => ({ ApplicationSkills: stub('skills') }));
vi.mock('@/[fsd]/widgets/entity-schedules-section', () => ({
  EntitySchedulesSection: ({ isChatView }) => <div data-testid="schedules">{String(isChatView)}</div>,
}));
vi.mock('@/components/ApplicationVariables.jsx', () => ({ default: stub('variables') }));
vi.mock('@/components/ConversationStarters', () => ({ default: stub('starters') }));
vi.mock('@/pages/Applications/Components/Applications/ApplicationEditForm', () => ({
  default: stub('edit-form'),
}));
vi.mock('@/pages/Applications/Components/Applications/ApplicationInformation', () => ({
  default: stub('information'),
}));

const order = () => screen.getAllByTestId(/^(starters|schedules|advanced)$/).map(node => node.dataset.testid);

describe('ApplicationConfigurationForm EL-7011 section order', () => {
  afterEach(cleanup);

  it('R1.1 EL-7011: Schedules follows Chat starters and precedes Advanced', () => {
    render(
      <ApplicationConfigurationForm
        viewMode={ViewMode.Owner}
        applicationId={1}
      />,
    );
    expect(order()).toEqual(['starters', 'schedules', 'advanced']);
  });

  it('R1.3 EL-7011: passes isChatView so the chat shows no Schedules section', () => {
    render(
      <ApplicationConfigurationForm
        viewMode={ViewMode.Owner}
        applicationId={1}
        isChatView
      />,
    );
    expect(screen.getByTestId('schedules')).toHaveTextContent('true');
  });
});
