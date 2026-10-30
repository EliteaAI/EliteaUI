// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleRunSignIn from '../ScheduleRunSignIn';

const mocks = vi.hoisted(() => ({
  metadata: { authServers: ['https://auth.example'], toolkitId: 12 },
  toastSuccess: vi.fn(),
  modalProps: null,
}));

vi.mock('@/[fsd]/features/chat', () => ({
  getToolkitAuthorizationContext: () => ({ toolkitName: 'GitHub' }),
}));
vi.mock('@/[fsd]/features/mcp', () => ({
  extractMcpAuthMetadata: () => mocks.metadata,
  McpAuthModal: props => {
    mocks.modalProps = props;
    return <div data-testid="mcp-auth-modal">{props.title}</div>;
  },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 5,
  useToast: () => ({ toastSuccess: mocks.toastSuccess }),
}));

const authAction = {
  toolMeta: { server_url: 'https://mcp.example', toolkit_type: 'mcp' },
  toolOutputs: { server_url: 'https://mcp.example' },
};
const signInButton = () => screen.getByTestId('schedule-run-sign-in');

describe('ScheduleRunSignIn', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.metadata = { authServers: ['https://auth.example'], toolkitId: 12 };
  });

  it('opens the sign-in window with the toolkit title', () => {
    render(<ScheduleRunSignIn authAction={authAction} />);

    fireEvent.click(signInButton());

    expect(screen.getByTestId('mcp-auth-modal')).toHaveTextContent('Toolkit Authorization — GitHub');
    expect(mocks.modalProps).toMatchObject({ projectId: 5, toolkitId: 12, toolkitType: 'mcp' });
  });

  it('shows the success message and closes the window after a successful sign-in', () => {
    render(<ScheduleRunSignIn authAction={authAction} />);
    fireEvent.click(signInButton());

    act(() => mocks.modalProps.onClose(true));

    expect(mocks.toastSuccess).toHaveBeenCalledWith('Successful authentication!');
    expect(screen.queryByTestId('mcp-auth-modal')).not.toBeInTheDocument();
  });

  it('closes the window on cancel without a message', () => {
    render(<ScheduleRunSignIn authAction={authAction} />);
    fireEvent.click(signInButton());

    act(() => mocks.modalProps.onCancel());

    expect(screen.queryByTestId('mcp-auth-modal')).not.toBeInTheDocument();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it('does not open the window when the button is disabled', () => {
    render(
      <ScheduleRunSignIn
        authAction={authAction}
        disabled
      />,
    );

    fireEvent.click(signInButton());

    expect(signInButton()).toBeDisabled();
    expect(screen.queryByTestId('mcp-auth-modal')).not.toBeInTheDocument();
  });

  it('disables the button when the sign-in metadata is missing', () => {
    mocks.metadata = null;
    render(<ScheduleRunSignIn authAction={authAction} />);

    fireEvent.click(signInButton());

    expect(signInButton()).toBeDisabled();
    expect(screen.queryByTestId('mcp-auth-modal')).not.toBeInTheDocument();
  });
});
