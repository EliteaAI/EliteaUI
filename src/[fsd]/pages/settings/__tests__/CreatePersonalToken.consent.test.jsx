// @vitest-environment jsdom
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import * as OwnerConsentConstants from '@/[fsd]/features/owner-consent/lib/constants/ownerConsent.constants';
import * as OwnerConsentHelpers from '@/[fsd]/features/owner-consent/lib/helpers/ownerConsent.helpers';
import * as TokenScopeConstants from '@/[fsd]/features/settings/lib/constants/tokenScope.constants';
import * as TokenScopeHelpers from '@/[fsd]/features/settings/lib/helpers/tokenScope.helpers';
import { store } from '@/[fsd]/shared/config';
import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import CreatePersonalToken from '../CreatePersonalToken';

// The consent checkbox of the token creation flow (EL-7337): shown only for a restricted token where the platform
// allows it and the account is linked; on Generate the consent is given for the created token's id, and a refused
// consent leaves the token and says why.

const m = vi.hoisted(() => ({
  status: vi.fn(),
  create: vi.fn(),
  consent: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal()),
  useNavigate: () => vi.fn(),
}));
vi.mock('@/hooks/useNavBlocker', () => ({ default: () => undefined }));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useToast: () => ({ toastError: m.toastError, toastSuccess: vi.fn() }),
}));
vi.mock('@/api/auth', async importOriginal => ({
  ...(await importOriginal()),
  useTokenCreateMutation: () => [m.create, { isLoading: false }],
  useTokenListQuery: () => ({ refetch: vi.fn() }),
}));
vi.mock('@/[fsd]/features/owner-consent', async () => ({
  OwnerConsentConstants,
  OwnerConsentHelpers,
  ConsentCredentialPicker: (await import('@/[fsd]/features/owner-consent/ui/ConsentCredentialPicker'))
    .default,
  useGetOwnerConsentStatusQuery: (...args) => m.status(...args),
  useTokenConsentActionMutation: () => [m.consent],
}));
vi.mock('@/[fsd]/shared/ui/select', () => ({
  SingleSelect: props => (
    <select
      data-testid={props['data-testid']}
      multiple
      value={props.value}
      onChange={event =>
        props.onChange({ target: { value: [...event.target.selectedOptions].map(o => o.value) } })
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
vi.mock('@/[fsd]/features/settings', () => ({
  TokenScopeConstants,
  TokenScopeHelpers,
  DrawerPage: props => <div>{props.children}</div>,
  DrawerPageHeader: props => <div>{props.extraContent}</div>,
  GeneratedTokenDialog: props => (props.open ? <div data-testid="generated-token-dialog" /> : null),
  // the scope block, as a restricted token with project 5 and run
  TokenScopeFields: props => (
    <div>
      <button
        type="button"
        data-testid="restrict"
        onClick={props.onToggle}
      />
      <button
        type="button"
        data-testid="pick-project"
        onClick={() => props.onProjectsChange([5])}
      />
    </div>
  ),
}));

const theme = createTheme({ palette: lightPalette });
const renderPage = () =>
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <CreatePersonalToken />
        </ThemeProvider>
      </MemoryRouter>
    </Provider>,
  );

const fillRestricted = () => {
  fireEvent.change(screen.getByTestId('create-personal-token-name-input'), { target: { value: 'mcp' } });
  fireEvent.click(screen.getByTestId('restrict'));
  fireEvent.click(screen.getByTestId('pick-project'));
};

const CANDIDATES = [
  { project_id: 5, credential_ref: 'aaaaaaaa-0000-4000-8000-000000000001', title: 'obo-sharepoint' },
  { project_id: 5, credential_ref: 'aaaaaaaa-0000-4000-8000-000000000002', title: 'obo-sharepoint-team' },
];

// the status without projects answers allowed/linked; with projects, the credentials a consent may name
const statusWith = (base, candidates = CANDIDATES) =>
  m.status.mockImplementation(args => ({
    data: args?.projects ? { ...base, candidates } : base,
    currentData: args?.projects ? { ...base, candidates } : base,
    isFetching: false,
  }));

describe('CreatePersonalToken consent (EL-7337)', () => {
  beforeEach(() => {
    m.create.mockResolvedValue({ data: { id: 76, name: 'mcp', token: 'not-a-real-token-value' } });
    m.consent.mockResolvedValue({ data: { ok: true } });
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('offers the checkbox only for a restricted token, where allowed, to a linked account', () => {
    statusWith({ allowed: true, linked: true });
    renderPage();
    expect(screen.queryByTestId('create-personal-token-act-with-sign-in')).toBeNull(); // not restricted yet
    fillRestricted();
    expect(screen.getByTestId('create-personal-token-act-with-sign-in')).toBeInTheDocument();
    cleanup();
    for (const base of [
      { allowed: false, linked: true },
      { allowed: true, linked: false },
    ]) {
      statusWith(base);
      renderPage();
      fillRestricted();
      expect(screen.queryByTestId('create-personal-token-act-with-sign-in')).toBeNull();
      expect(screen.queryByTestId('create-personal-token-no-delegated-credentials')).toBeNull();
      cleanup();
    }
  });

  it('says there is nothing to consent to when the projects hold no delegated credential', () => {
    statusWith({ allowed: true, linked: true }, []);
    renderPage();
    fillRestricted();
    expect(screen.queryByTestId('create-personal-token-act-with-sign-in')).toBeNull();
    expect(screen.getByTestId('create-personal-token-no-delegated-credentials')).toHaveTextContent(
      'No delegated credentials are set up in these projects yet; ask your project operator.',
    );
  });

  it('names nothing by default, needs at least one credential, and consents for the picked ones', async () => {
    statusWith({ allowed: true, linked: true });
    renderPage();
    fillRestricted();
    fireEvent.click(screen.getByTestId('create-personal-token-act-with-sign-in'));
    const picker = screen.getByTestId('create-personal-token-consent-credentials');
    expect([...picker.selectedOptions]).toEqual([]);
    expect(screen.getByTestId('create-personal-token-generate-button')).toBeDisabled();
    picker.options[1].selected = true;
    fireEvent.change(picker);
    expect(screen.getByTestId('create-personal-token-generate-button')).not.toBeDisabled();
    fireEvent.click(screen.getByTestId('create-personal-token-generate-button'));
    await waitFor(() =>
      expect(m.consent).toHaveBeenCalledWith({
        tokenId: 76,
        action: 'consent',
        credentials: [{ project_id: 5, credential_ref: CANDIDATES[1].credential_ref }],
      }),
    );
    expect(m.create.mock.calls[0][0]).toMatchObject({ scope_projects: [5], scope_operations: ['run'] });
    expect(await screen.findByTestId('generated-token-dialog')).toBeInTheDocument();
  });

  it('asks nothing when not ticked, and a refused consent leaves the token and says why', async () => {
    statusWith({ allowed: true, linked: true });
    renderPage();
    fillRestricted();
    fireEvent.click(screen.getByTestId('create-personal-token-generate-button'));
    expect(await screen.findByTestId('generated-token-dialog')).toBeInTheDocument();
    expect(m.consent).not.toHaveBeenCalled();
    cleanup();
    m.consent.mockResolvedValue({
      error: { status: 409, data: { error: 'Your Microsoft sign-in is not available.' } },
    });
    renderPage();
    fillRestricted();
    fireEvent.click(screen.getByTestId('create-personal-token-act-with-sign-in'));
    const picker = screen.getByTestId('create-personal-token-consent-credentials');
    picker.options[0].selected = true;
    fireEvent.change(picker);
    fireEvent.click(screen.getByTestId('create-personal-token-generate-button'));
    expect(await screen.findByTestId('generated-token-dialog')).toBeInTheDocument(); // the token exists
    expect(m.toastError).toHaveBeenCalled();
  });
});
