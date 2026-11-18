// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { ChatParticipantType } from '@/common/constants';
import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ParticipantAttentionCard, { participantAttentionCardStyles } from '../ParticipantAttentionCard';

vi.mock('@/[fsd]/shared/ui/icon', () => ({ EntityIcon: () => null }));
vi.mock('../../participant-actions/ParticipantActions', () => ({ default: () => null }));
vi.mock('../ParticipantWarning', () => ({ default: () => null }));

const theme = createTheme({ palette: darkPalette });

const renderCard = (status, onClickHandler) =>
  render(
    <ThemeProvider theme={theme}>
      <ParticipantAttentionCard
        participant={{ entity_name: ChatParticipantType.Applications, entity_meta: {} }}
        isActive={false}
        displayName="Parent agent"
        status={{ hasMisconfigurationErrors: true, ...status }}
        onClickHandler={onClickHandler}
        styles={participantAttentionCardStyles({ isActive: false, maxWidth: '100%' })}
      />
    </ThemeProvider>,
  );

describe('ParticipantAttentionCard selection (#7585)', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('lets a deselected sign-in-only participant be selected again', () => {
    const onClickHandler = vi.fn();
    renderCard({ signInOnly: true }, onClickHandler);

    fireEvent.click(screen.getByText('Parent agent'));

    expect(onClickHandler).toHaveBeenCalledTimes(1);
  });

  it('keeps a misconfigured participant unselectable', () => {
    const onClickHandler = vi.fn();
    renderCard({ signInOnly: false }, onClickHandler);

    fireEvent.click(screen.getByText('Parent agent'));

    expect(onClickHandler).not.toHaveBeenCalled();
  });
});
