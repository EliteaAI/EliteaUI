// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { ChatParticipantType } from '@/common/constants';
import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ParticipantWarning from '../ParticipantWarning';

vi.mock('@/[fsd]/features/mcp', () => ({ McpLogInLink: () => null }));
vi.mock('@/[fsd]/features/openapi', () => ({ OpenApiLogInLink: () => null }));
vi.mock('@/[fsd]/features/sharepoint', () => ({ SharepointLogInLink: () => null }));

const theme = createTheme({ palette: darkPalette });
const TEXT = 'Your Microsoft sign-in is not available to this run. Sign in with Microsoft again, then retry.';

const renderWarning = props =>
  render(
    <ThemeProvider theme={theme}>
      <ParticipantWarning
        hasMisconfigurationErrors
        participant={{ entity_name: ChatParticipantType.Toolkits, entity_settings: {} }}
        isToolkitParticipant
        handleEditClick={vi.fn()}
        blockedToolkitNames={[]}
        {...props}
      />
    </ThemeProvider>,
  );

describe('ParticipantWarning governed refusal (#7281)', () => {
  afterEach(() => cleanup());

  it('says what governance refused, with its code, instead of a misconfiguration', () => {
    renderWarning({ governedRefusal: { message: TEXT, code: 'DENIED_ASSERTION_UNAVAILABLE' } });

    expect(screen.getByText(TEXT)).toBeInTheDocument();
    expect(screen.getByTestId('participant-refusal-code-chip')).toHaveTextContent(
      'DENIED_ASSERTION_UNAVAILABLE',
    );
    expect(screen.queryByText(/Misconfiguration errors found/)).not.toBeInTheDocument();
  });

  it('keeps the misconfiguration notice for a real misconfiguration', () => {
    renderWarning({});

    expect(screen.getByText(/Misconfiguration errors found/)).toBeInTheDocument();
    expect(screen.queryByTestId('participant-refusal-code-chip')).not.toBeInTheDocument();
  });
});

describe('ParticipantWarning connection notice (#7585)', () => {
  afterEach(() => cleanup());

  const SIGN_IN = 'Dataverse child: Sign in to Dataverse to connect this credential.';

  it('names the sign-in instead of a misconfiguration and keeps the way to the participant', () => {
    const handleEditClick = vi.fn();
    renderWarning({
      connectionNotice: { message: SIGN_IN, requiresAuthorization: true },
      isToolkitParticipant: false,
      participant: { entity_name: ChatParticipantType.Applications, entity_settings: {} },
      handleEditClick,
    });

    expect(screen.getByText(SIGN_IN, { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(/credential\.\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Misconfiguration errors found/)).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Check the agent' }).click();
    expect(handleEditClick).toHaveBeenCalledTimes(1);
  });

  it('lets a governed refusal win over a connection notice', () => {
    renderWarning({
      governedRefusal: { message: TEXT, code: 'DENIED_ASSERTION_UNAVAILABLE' },
      connectionNotice: { message: SIGN_IN, requiresAuthorization: true },
    });

    expect(screen.getByText(TEXT)).toBeInTheDocument();
    expect(screen.queryByText(SIGN_IN, { exact: false })).not.toBeInTheDocument();
  });
});

describe('ParticipantWarning connection notice punctuation (#7585)', () => {
  afterEach(() => cleanup());

  it('ends a connection error without punctuation as a sentence before the button', () => {
    renderWarning({
      connectionNotice: {
        message: 'Authentication failed: Invalid credentials',
        requiresAuthorization: false,
      },
      isToolkitParticipant: false,
      participant: { entity_name: ChatParticipantType.Applications, entity_settings: {} },
    });

    expect(
      screen.getByText('Authentication failed: Invalid credentials.', { exact: false }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/credentials\.\./)).not.toBeInTheDocument();
  });
});
