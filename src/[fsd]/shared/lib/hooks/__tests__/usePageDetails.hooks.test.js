// @vitest-environment jsdom
import { createElement } from 'react';

import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { usePageDetails } from '../usePageDetails.hooks';

vi.mock('../useSelectedProject.hooks', () => ({ useSelectedProjectId: () => 1 }));

const pageTypeAt = path =>
  renderHook(() => usePageDetails(), {
    wrapper: ({ children }) => createElement(MemoryRouter, { initialEntries: [path] }, children),
  }).result.current.pageType;

describe('usePageDetails schedule routes', () => {
  it.each([
    '/settings/schedules/create',
    '/settings/schedules/5',
    '/agents/schedules/3/schedules/create',
    '/agents/schedules/3/schedules/7',
    '/pipelines/schedules/3/schedules/create',
    '/pipelines/schedules/3/schedules/7',
  ])('reports ScheduleDetails for %s', path => {
    expect(pageTypeAt(path)).toBe('ScheduleDetails');
  });

  // #7405: a project switch or Back from a webhook page returns to Webhooks, not Schedules
  it.each([
    '/settings/webhooks/create',
    '/settings/webhooks/5',
    '/agents/all/3/webhooks/create',
    '/agents/all/3/webhooks/7',
    '/pipelines/all/3/webhooks/create',
    '/pipelines/all/3/webhooks/7',
  ])('reports WebhookDetails for %s', path => {
    expect(pageTypeAt(path)).toBe('WebhookDetails');
  });
});
