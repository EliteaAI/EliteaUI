// @vitest-environment jsdom
import { act } from 'react';

import { MemoryRouter } from 'react-router-dom';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { ThemeProvider, createTheme } from '@mui/material';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import lightPalette from '@/lightPalette';

import ScheduleRunNotice from '../ScheduleRunNotice';

const PROJECT_ID = 5;
const AGENT_ID = 11;

const mocks = vi.hoisted(() => ({ handler: null, eventName: null }));

vi.mock('@/[fsd]/features/auth/lib/hooks', () => ({
  useSocket: (eventName, handler) => {
    mocks.eventName = eventName;
    mocks.handler = handler;
  },
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => PROJECT_ID,
}));

const theme = createTheme({ palette: lightPalette });
const participants = [{ entity_name: 'application', entity_meta: { id: AGENT_ID, project_id: PROJECT_ID } }];
const event = (extra = {}) => ({
  schedule_id: 1,
  run_id: 2,
  status: 'success',
  entity_id: AGENT_ID,
  conversation_id: 77,
  ...extra,
});

const ui = (conversationId = 1, list = participants) => (
  <ThemeProvider theme={theme}>
    <MemoryRouter>
      <ScheduleRunNotice
        conversationId={conversationId}
        participants={list}
      />
    </MemoryRouter>
  </ThemeProvider>
);

const emit = payload => act(() => mocks.handler(payload));

describe('EL-7011 ScheduleRunNotice', () => {
  beforeEach(() => {
    mocks.handler = null;
  });
  afterEach(() => cleanup());

  it('R1.1 EL-7011 shows a Success notice with an icon for a participant agent', () => {
    render(ui());
    emit(event());

    const notice = screen.getByRole('status');
    expect(mocks.eventName).toBe('schedule_run_finished');
    expect(notice).toHaveTextContent('Success');
    expect(notice.previousElementSibling.tagName.toLowerCase()).toBe('svg');
  });

  it('R1.2 EL-7011 shows a Failed notice with an icon for a participant agent', () => {
    render(ui());
    emit(event({ status: 'failed' }));

    const notice = screen.getByRole('status');
    expect(notice).toHaveTextContent('Failed');
    expect(notice.previousElementSibling.tagName.toLowerCase()).toBe('svg');
  });

  it('R1.3 EL-7011 replaces the notice when a newer event matches', () => {
    render(ui());
    emit(event());
    emit(event({ status: 'failed' }));

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Failed');
  });

  it.each(['running', 'queued', undefined])('R1.4 EL-7011 ignores the status %s', status => {
    render(ui());
    emit(event({ status }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('R1.4 EL-7011 keeps the shown notice when a later event has an unknown status', () => {
    render(ui());
    emit(event());
    emit(event({ status: 'running' }));

    expect(screen.getByRole('status')).toHaveTextContent('Success');
  });

  it('R3.3 EL-7011 ignores an event for another agent', () => {
    render(ui());
    emit(event({ entity_id: 999 }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('R3.3 EL-7011 ignores an event for another project', () => {
    render(ui());
    emit(event({ project_id: PROJECT_ID + 1 }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('R2.1 EL-7011 links Open run to the run history of the agent', () => {
    render(ui());
    emit(event());

    expect(screen.getByRole('link', { name: 'Open run' })).toHaveAttribute(
      'href',
      `/agents/all/${AGENT_ID}/history?history_run_id=77`,
    );
  });

  it('links Open run to the pipeline run history for a pipeline participant', () => {
    const pipeline = [
      {
        entity_name: 'application',
        entity_meta: { id: AGENT_ID, project_id: PROJECT_ID },
        entity_settings: { agent_type: 'pipeline' },
      },
    ];
    render(ui(1, pipeline));
    emit(event());

    expect(screen.getByRole('link', { name: 'Open run' })).toHaveAttribute(
      'href',
      `/pipelines/all/${AGENT_ID}/history?history_run_id=77`,
    );
  });

  it('R2.2 EL-7011 shows no link without conversation_id', () => {
    render(ui());
    emit(event({ conversation_id: undefined }));

    expect(screen.getByRole('status')).toHaveTextContent('Success');
    expect(screen.queryByRole('link', { name: 'Open run' })).not.toBeInTheDocument();
  });

  it('R3.4 EL-7011 hides the notice when the user closes it', () => {
    render(ui());
    emit(event());
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notice' }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('R3.4 EL-7011 clears the notice when the conversation changes', () => {
    const { rerender } = render(ui(1));
    emit(event());
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(ui(2));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
