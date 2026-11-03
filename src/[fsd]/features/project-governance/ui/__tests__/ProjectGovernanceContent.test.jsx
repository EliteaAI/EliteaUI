// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import ProjectGovernanceContent from '../ProjectGovernanceContent';

vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);
const api = vi.hoisted(() => ({
  bindings: vi.fn(),
  references: vi.fn(),
  grants: vi.fn(),
  mandates: vi.fn(),
  bindingAction: vi.fn(),
  referenceAction: vi.fn(),
  grantAction: vi.fn(),
  mandateAction: vi.fn(),
  permissions: new Set(),
  toast: { toastSuccess: vi.fn(), toastError: vi.fn(), toastInfo: vi.fn() },
}));
vi.mock('@/[fsd]/features/project-governance/api/projectGovernanceApi', () => ({
  useGetProjectBindingsQuery: (...args) => api.bindings(...args),
  useGetProjectReferencesQuery: (...args) => api.references(...args),
  useGetProjectGrantsQuery: (...args) => api.grants(...args),
  useGetProjectMandatesQuery: (...args) => api.mandates(...args),
  useProjectBindingActionMutation: () => [api.bindingAction, { isLoading: false }],
  useProjectReferenceActionMutation: () => [api.referenceAction, { isLoading: false }],
  useProjectGrantActionMutation: () => [api.grantAction, { isLoading: false }],
  useProjectMandateActionMutation: () => [api.mandateAction, { isLoading: false }],
}));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useToast: () => api.toast,
  useSelectedProjectId: () => 12,
  useGetWindowWidth: () => ({ windowWidth: 1400 }),
  useAutoBlur: () => () => {},
  useTextOverflow: () => ({ textRef: { current: null }, isOverflowing: false }),
}));
vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({ useToast: () => api.toast }));
vi.mock('@/[fsd]/shared/ui/select', () => ({
  SingleSelect: props => (
    <select
      data-testid={props['data-testid']}
      multiple={props.multiple}
      value={props.value}
      onChange={event =>
        props.onChange({
          target: {
            value: props.multiple
              ? [...event.target.selectedOptions].map(o => Number(o.value))
              : event.target.value,
          },
        })
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
vi.mock('@/api/admin', () => ({
  useUserListQuery: () => ({
    data: {
      rows: [
        { id: 5, email: 'member@x' },
        { id: 8, email: 'other@x' },
      ],
    },
  }),
}));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: permission => !permission || api.permissions.has(permission) }),
}));
vi.mock('react-redux', async importOriginal => ({
  ...(await importOriginal()),
  useSelector: selector => selector({ user: { id: 9 }, settings: {} }),
}));
vi.mock('@/[fsd]/features/settings/ui/drawer-page', () => ({
  DrawerPageHeader: props => (
    <div>
      {props.title}
      {props.extraContent}
    </div>
  ),
  DrawerPageBody: props => <div>{props.children}</div>,
}));

const theme = createTheme({ palette: lightPalette });
const wrap = () =>
  render(
    <ThemeProvider theme={theme}>
      <ProjectGovernanceContent />
    </ThemeProvider>,
  );
const list = rows => ({ data: { total: rows.length, rows }, isLoading: false, isError: false });
const ADMIN = [
  'governance.bindings.view',
  'governance.bindings.manage',
  'governance.bindings.approve',
  'credentials.view',
  'credentials.manage',
  'credentials.approve',
  'governance.mandates.view',
];
const PENDING_GRANT = {
  id: 'g1',
  state: 'pending_approval',
  created_at: '2026-11-03T09:00:00',
  created_by: { id: 5, email: 'member@x' },
  credential: { configuration_title: 'jira-cred' },
  subject: { user: { id: 5, email: 'member@x' } },
  binding: { application_name: 'Agent', version_name: 'base' },
  toolkit: { name: 'jira' },
  escalated: false,
};

describe('project governance view (EL-7269)', () => {
  beforeEach(() => {
    api.permissions = new Set(ADMIN);
    api.bindings.mockReturnValue(
      list([
        {
          id: 'b1',
          state: 'pending_approval',
          created_at: '2026-11-03T10:00:00',
          created_by: { id: 9 },
          escalated: true,
          application: { name: 'Agent' },
          version: { name: 'base' },
        },
      ]),
    );
    api.references.mockReturnValue(list([]));
    api.grants.mockReturnValue(list([PENDING_GRANT]));
    api.mandates.mockReturnValue(list([]));
    api.grantAction.mockReturnValue({ unwrap: () => Promise.resolve({ ok: true, state: 'active' }) });
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('lists everything waiting in the project, oldest first, and marks what needs a platform operator', () => {
    wrap();
    const names = screen.getAllByTestId('governance-row-name').map(node => node.textContent);
    expect(names).toEqual(['jira-cred for member@x', 'Agent base']);
    expect(screen.getByTestId('governance-escalated-binding:b1')).toHaveTextContent(
      'Needs a platform operator',
    );
    expect(api.grants).toHaveBeenCalledWith({ projectId: 12 }, expect.objectContaining({ skip: false }));
  });

  it("keeps the approval of the admin who asked for it disabled, and approves another member's grant", async () => {
    wrap();
    expect(screen.getByTestId('governance-action-activate-b1')).toBeDisabled();
    fireEvent.click(screen.getByTestId('governance-action-approve-g1'));
    fireEvent.change(screen.getByTestId('governance-approve-ref'), { target: { value: 'CHG-1' } });
    fireEvent.change(screen.getByTestId('governance-approve-policy'), { target: { value: 'rev-1' } });
    fireEvent.click(screen.getByTestId('governance-approve-submit'));
    await waitFor(() =>
      expect(api.grantAction).toHaveBeenCalledWith({
        projectId: 12,
        grantId: 'g1',
        action: 'approve',
        approval_ref: 'CHG-1',
        policy_revision: 'rev-1',
      }),
    );
    await waitFor(() => expect(api.toast.toastSuccess).toHaveBeenCalled());
  });

  it('reads only what the admin may see and hides actions the admin may not take', () => {
    api.permissions = new Set(['credentials.view']);
    wrap();
    expect(api.bindings).toHaveBeenCalledWith({ projectId: 12 }, expect.objectContaining({ skip: true }));
    expect(screen.queryByTestId('governance-action-approve-g1')).toBeNull();
  });

  it('asks once more before taking something out of use', async () => {
    api.grants.mockReturnValue(list([{ ...PENDING_GRANT, state: 'active' }]));
    wrap();
    fireEvent.click(screen.getByText('Grants'));
    fireEvent.click(screen.getByTestId('governance-action-revoke-g1'));
    expect(api.grantAction).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('governance-confirm-revoke-g1'));
    await waitFor(() =>
      expect(api.grantAction).toHaveBeenCalledWith({ projectId: 12, grantId: 'g1', action: 'revoke' }),
    );
  });

  it('grants the same use to a project role with the approval (batch granting)', async () => {
    wrap();
    fireEvent.click(screen.getByTestId('governance-action-approve-g1'));
    fireEvent.change(screen.getByTestId('governance-approve-ref'), { target: { value: 'CHG-1' } });
    fireEvent.change(screen.getByTestId('governance-approve-policy'), { target: { value: 'rev-1' } });
    fireEvent.change(screen.getByTestId('governance-also-grant-role'), { target: { value: 'editor' } });
    fireEvent.click(screen.getByTestId('governance-approve-submit'));
    await waitFor(() =>
      expect(api.grantAction).toHaveBeenCalledWith(expect.objectContaining({ also_grant_role: 'editor' })),
    );
    // the member who asked is not offered again
    expect(screen.queryByText('member@x', { selector: 'option' })).toBeNull();
  });
});
