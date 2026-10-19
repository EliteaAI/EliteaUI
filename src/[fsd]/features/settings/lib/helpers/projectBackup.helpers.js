import { ProjectBackupConstants } from '@/[fsd]/features/settings/lib/constants';

const { CHATS_OPTION, CHAT_TAG_TYPES, RESTORE_OPTION_LABELS } = ProjectBackupConstants;

export const formatCount = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

export const formatSize = bytes => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};

// The backend phrases restore errors for API clients (field names such as
// allow_project_mismatch, codes such as access_denied); translate the ones the
// dialog can trigger into the wording of its own controls
export const getRestoreErrorMessage = error => {
  const data = error?.data;

  // The artifact is what the dialog needs to offer the checkbox; the parameter
  // name in the text is a fallback in case the payload shape changes
  if (error?.status === 409 && (data?.artifact || data?.error?.includes('allow_project_mismatch'))) {
    return `This backup was taken from another project. Check "${RESTORE_OPTION_LABELS.allowMismatch}" to restore it into this project.`;
  }

  if (data?.error === 'access_denied') {
    return 'You do not have permission to restore data into this project.';
  }

  const message = data?.error ?? error?.error ?? 'Restore failed.';
  return data?.detail ? `${message}: ${data.detail}` : message;
};

// Chats are restored by default when the backup carries them, with their files when it has them
export const getDefaultRestoreChats = artifact => {
  const included = artifact?.chats_included;
  if (!included || included === CHATS_OPTION.none) return CHATS_OPTION.none;
  if (included === CHATS_OPTION.withAttachments && artifact?.has_attachment_files) {
    return CHATS_OPTION.withAttachments;
  }
  return CHATS_OPTION.withoutAttachments;
};

export const getChatsSummaryText = summary => {
  const chats = summary?.chats;
  if (!chats) return '';
  const parts = [`Chats: ${chats.restored} restored, ${chats.skipped} skipped (already exist)`];
  const attachments = summary.attachments;
  if (attachments?.total) {
    const restored =
      attachments.linked > 0 ? `${attachments.linked} linked` : `${attachments.uploaded ?? 0} uploaded`;
    parts.push(`Attachments: ${restored}, ${attachments.failed} failed`);
  }
  return parts.join(' · ');
};

// A restore rewrites the project's chat templates and, with chats, everything the chat pages show
export const getRestoreInvalidatedTags = (error, args, chatTemplatesTag) => {
  const { projectId, dryRun, inspect, restoreChats } = args || {};
  if (error || dryRun || inspect) return [];
  const tags = [{ type: chatTemplatesTag, id: projectId }];
  if (restoreChats && restoreChats !== CHATS_OPTION.none) tags.push(...CHAT_TAG_TYPES);
  return tags;
};
