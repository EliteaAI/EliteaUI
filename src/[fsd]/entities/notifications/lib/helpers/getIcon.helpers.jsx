import { NotificationType } from '@/common/constants';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import CommentIcon from '@/components/Icons/CommentIcon';
import ErrorIcon from '@/components/Icons/ErrorIcon';
import HeartIcon from '@/components/Icons/HeartIcon';
import MedalIcon from '@/components/Icons/MedalIcon';
import RemoveIcon from '@/components/Icons/RemoveIcon';
import SuccessIcon from '@/components/Icons/SuccessIcon';
import TrophyOutlinedIcon from '@/components/Icons/TrophyOutlinedIcon';

export const getIcon = (type, theme, notification) => {
  switch (type) {
    case NotificationType.PromptModeratorApproval:
    case NotificationType.AuthorApproval:
    case NotificationType.ModeratorApprovalOfVersion:
    case NotificationType.PromptOfSomeProjectWasPublished:
    case NotificationType.NewPromptVersionOfSomeProjectWasPublished:
    case NotificationType.ChatUserAdded:
    case NotificationType.ChatUserMentioned:
    case NotificationType.PrivateProjectCreated:
    case NotificationType.ModerationApproved:
      return <SuccessIcon fill={theme.palette.icon.success} />;

    case NotificationType.IndexDataChanged:
      return notification?.meta?.error && notification.meta.error.trim() ? (
        <ErrorIcon
          fill={theme.palette.icon.error}
          size={16}
        />
      ) : (
        <SuccessIcon fill={theme.palette.icon.success} />
      );

    case NotificationType.PromptHasAddedToSomeProject:
    case NotificationType.NewPromptVersionOfSomeProjectWasCreated:
    case NotificationType.UserWasAddedToSomeProjectAsTeammate:
      return <SuccessIcon fill={theme.palette.icon.tips} />;

    case NotificationType.PromptModeratorReject:
    case NotificationType.ModeratorUnpublish:
    case NotificationType.AgentUnpublished:
    case NotificationType.AuthorReject:
    case NotificationType.ModeratorRejectOfVersion:
    case NotificationType.PromptOfSomeProjectWasRejected:
    case NotificationType.NewPromptVersionOfSomeProjectWasRejected:
    case NotificationType.ModerationRejected:
      return <RemoveIcon fill={theme.palette.icon.error} />;

    case NotificationType.TokenIsExpired:
    case NotificationType.SpendingLimitIsExpired:
      return (
        <ErrorIcon
          fill={theme.palette.icon.error}
          size={16}
        />
      );

    case NotificationType.TokenExpiring:
    case NotificationType.SpendingLimitExpiring:
    case NotificationType.BucketExpirationWarning:
    case NotificationType.PersonalAccessTokenExpiring:
    case NotificationType.BudgetThresholdReached:
    case NotificationType.MemberBudgetThresholdReached:
      return (
        <AttentionIcon
          fill={theme.palette.icon.attention}
          size={16}
        />
      );

    case NotificationType.BudgetLimitReached:
    case NotificationType.MemberBudgetLimitReached:
      return (
        <ErrorIcon
          fill={theme.palette.icon.error}
          size={16}
        />
      );

    case NotificationType.Rates:
      return (
        <HeartIcon
          fill={theme.palette.icon.tips}
          size={16}
        />
      );

    case NotificationType.Comments:
      return (
        <CommentIcon
          fill={theme.palette.icon.tips}
          size={16}
        />
      );

    case NotificationType.RewardNewLevel:
      return (
        <MedalIcon
          fill={theme.palette.icon.success}
          size={16}
        />
      );

    case NotificationType.RewardBadgeToPrompt:
      return (
        <TrophyOutlinedIcon
          fill={theme.palette.icon.success}
          size={16}
        />
      );

    default:
      return null;
  }
};
