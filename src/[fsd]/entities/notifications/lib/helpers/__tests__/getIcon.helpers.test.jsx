import { describe, expect, it } from 'vitest';

import { NotificationType } from '@/common/constants';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import ErrorIcon from '@/components/Icons/ErrorIcon';
import InfoIcon from '@/components/Icons/InfoIcon';
import SuccessIcon from '@/components/Icons/SuccessIcon';

import { getIcon } from '../getIcon.helpers';

const theme = {
  palette: {
    status: { published: '#0f0', rejected: '#f00', onModeration: '#fa0' },
    icon: { tips: '#00f' },
  },
};

describe('getIcon for schedule notifications', () => {
  it('shows the error icon for failed, expired and disabled schedules', () => {
    for (const type of [
      NotificationType.ScheduleRunFailed,
      NotificationType.ScheduleApprovalExpired,
      NotificationType.ScheduleExpired,
      NotificationType.ScheduleDisabled,
    ]) {
      expect(getIcon(type, theme).type).toBe(ErrorIcon);
    }
  });

  it('shows the warning icon when approval is needed', () => {
    expect(getIcon(NotificationType.ScheduleApprovalNeeded, theme).type).toBe(AttentionIcon);
  });

  it('shows the success icon for a successful run', () => {
    expect(getIcon(NotificationType.ScheduleRunSucceeded, theme).type).toBe(SuccessIcon);
  });

  it('shows the info icon for admin edit and owner change', () => {
    for (const type of [NotificationType.ScheduleEditedByAdmin, NotificationType.ScheduleOwnerChanged]) {
      expect(getIcon(type, theme).type).toBe(InfoIcon);
    }
  });
});
