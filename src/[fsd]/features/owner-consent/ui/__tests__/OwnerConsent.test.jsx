// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleMandateConsent from '../ScheduleMandateConsent';
import TokenConsentInline from '../TokenConsentInline';

const api = vi.hoisted(() => ({
  status: vi.fn(),
  mandates: vi.fn(),
  tokenAction: vi.fn(),
  mandateAction: vi.fn(),
}));
vi.mock('@/[fsd]/features/owner-consent/api/ownerConsentApi', () => ({
  useGetOwnerConsentStatusQuery: (...args) => api.status(...args),
  useGetMyMandatesQuery: (...args) => api.mandates(...args),
  useTokenConsentActionMutation: () => [api.tokenAction, { isLoading: false }],
  useMandateConsentActionMutation: () => [api.mandateAction, { isLoading: false }],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useToast: () => ({ toastSuccess: vi.fn(), toastError: vi.fn() }),
  useSelectedProjectId: () => 5,
}));

const theme = createTheme({ palette: lightPalette });
const wrap = node => render(<ThemeProvider theme={theme}>{node}</ThemeProvider>);
const TOKEN = { id: 76, expires: '2099-01-01T00:00:00', scope_projects: [5], scope_operations: ['run'] };

describe('owner consent (EL-7337)', () => {
  beforeEach(() => {
    api.tokenAction.mockResolvedValue({ data: { ok: true } });
    api.mandateAction.mockResolvedValue({ data: { ok: true } });
    api.mandates.mockReturnValue({ data: undefined });
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows nothing in the token list where the platform does not allow it', () => {
    api.status.mockReturnValue({ data: { allowed: false, linked: true, consents: {} } });
    wrap(<TokenConsentInline token={TOKEN} />);
    expect(screen.queryByTestId('token-consent')).toBeNull();
  });

  it('offers consent for a restricted live token of a linked owner and gives it', () => {
    api.status.mockReturnValue({ data: { allowed: true, linked: true, consents: {} } });
    wrap(<TokenConsentInline token={TOKEN} />);
    fireEvent.click(screen.getByTestId('token-consent-give'));
    expect(api.tokenAction).toHaveBeenCalledWith({ tokenId: 76, action: 'consent' });
  });

  it('offers no consent for an unrestricted token or an unlinked owner', () => {
    api.status.mockReturnValue({ data: { allowed: true, linked: true, consents: {} } });
    wrap(<TokenConsentInline token={{ id: 1, expires: null }} />);
    expect(screen.queryByTestId('token-consent')).toBeNull();
    cleanup();
    api.status.mockReturnValue({ data: { allowed: true, linked: false, consents: {} } });
    wrap(<TokenConsentInline token={TOKEN} />);
    expect(screen.queryByTestId('token-consent')).toBeNull();
  });

  it('shows a given consent with the sign-out sentence and withdraws it', () => {
    api.status.mockReturnValue({
      data: { allowed: true, linked: true, consents: { 76: '2026-11-02T12:00:00' } },
    });
    wrap(<TokenConsentInline token={TOKEN} />);
    expect(screen.getByTestId('token-consent')).toHaveTextContent(
      'Signing out does not end it; withdraw here.',
    );
    fireEvent.click(screen.getByTestId('token-consent-withdraw'));
    expect(api.tokenAction).toHaveBeenCalledWith({ tokenId: 76, action: 'withdraw' });
  });

  it("shows the owner's mandate consent on their schedule card and asks nothing for another owner's", () => {
    api.status.mockReturnValue({ data: { allowed: false, mandates: true } });
    api.mandates.mockReturnValue({
      data: {
        rows: [
          {
            id: 'm1',
            version: { id: 70 },
            state: 'active',
            identity_source: 'owner_delegated',
            consented: false,
          },
        ],
      },
    });
    wrap(
      <ScheduleMandateConsent
        versionId={70}
        isOwner
      />,
    );
    fireEvent.click(screen.getByTestId('schedule-mandate-consent-give'));
    expect(api.mandateAction).toHaveBeenCalledWith({ projectId: 5, mandateId: 'm1', action: 'consent' });
    cleanup();
    api.mandates.mockClear();
    wrap(
      <ScheduleMandateConsent
        versionId={70}
        isOwner={false}
      />,
    );
    expect(screen.queryByTestId('schedule-mandate-consent')).toBeNull();
    expect(api.mandates).toHaveBeenCalledWith({ projectId: 5 }, expect.objectContaining({ skip: true }));
  });

  it('withdraws a mandate consent from the schedule card', () => {
    api.status.mockReturnValue({ data: { mandates: true } });
    api.mandates.mockReturnValue({
      data: {
        rows: [
          {
            id: 'm1',
            version: { id: 70 },
            state: 'active',
            identity_source: 'owner_delegated',
            consented: true,
          },
        ],
      },
    });
    wrap(
      <ScheduleMandateConsent
        versionId={70}
        isOwner
      />,
    );
    fireEvent.click(screen.getByTestId('schedule-mandate-consent-withdraw'));
    expect(api.mandateAction).toHaveBeenCalledWith({
      projectId: 5,
      mandateId: 'm1',
      action: 'withdraw_consent',
    });
  });
});
