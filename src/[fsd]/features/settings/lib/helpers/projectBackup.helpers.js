import { ProjectBackupConstants } from '@/[fsd]/features/settings/lib/constants';

const {
  CHATS_OPTION,
  CHAT_TAG_TYPES,
  PROJECT_ENTITY_TAG_TYPES,
  RESTORE_OPTION_LABELS,
  RESTORE_JOB_STATUS,
  RESTORE_JOB_STORAGE_KEY,
} = ProjectBackupConstants;

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

  if (data?.error === 'restore_in_progress') {
    return 'A restore of this project is already running. Wait for it to finish.';
  }

  if (data?.error === 'restore_capacity_busy') {
    return 'The server is busy with another restore. Try again in a minute.';
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

const MAX_LISTED_MISSING_PATHS = 5;

const listMissingPaths = paths => {
  const listed = paths.slice(0, MAX_LISTED_MISSING_PATHS).join(', ');
  return paths.length > MAX_LISTED_MISSING_PATHS ? `${listed} and more` : listed;
};

export const getSkillFilesSummaryText = summary => {
  const files = summary?.skill_files;
  if (!files?.total) return '';
  if (files.unchecked) return `Skill files: ${files.total} not checked (storage unavailable)`;
  const text = `Skill files: ${files.total} total, ${files.present} present, ${files.uploaded} uploaded, ${files.missing} missing`;
  return files.missing_paths?.length ? `${text} (${listMissingPaths(files.missing_paths)})` : text;
};

export const getRestoreWarningText = summary => {
  if (!summary || summary.dry_run) return '';
  const failedAttachments = summary.attachments?.failed;
  const missingSkillFiles = summary.skill_files?.missing;
  const parts = [
    failedAttachments ? `${failedAttachments} attachment file(s)` : '',
    missingSkillFiles ? `${missingSkillFiles} skill file(s)` : '',
  ].filter(Boolean);
  return parts.length ? `Restore completed. ${parts.join(' and ')} could not be restored.` : '';
};

// A restore rewrites the project's chat templates and, with chats, everything the chat pages show
export const getRestoreInvalidatedTags = (error, args, chatTemplatesTag) => {
  const { projectId, dryRun, inspect, restoreChats } = args || {};
  if (error || dryRun || inspect) return [];
  const tags = [{ type: chatTemplatesTag, id: projectId }, ...PROJECT_ENTITY_TAG_TYPES];
  if (restoreChats && restoreChats !== CHATS_OPTION.none) tags.push(...CHAT_TAG_TYPES);
  return tags;
};

export const isRestoreJobFinished = job =>
  job?.status === RESTORE_JOB_STATUS.done || job?.status === RESTORE_JOB_STATUS.failed;

// A failed job carries the body a synchronous restore answered with; it is
// shaped like an RTK Query error so the dialog handles both the same way
export const getRestoreJobError = job => ({ status: job?.status_code ?? 500, data: job });

const restoreJobKey = projectId => `${RESTORE_JOB_STORAGE_KEY}.${projectId}`;

// The running restore of a project survives closing the dialog or reloading the page
export const saveRestoreJob = (projectId, job) => {
  try {
    sessionStorage.setItem(restoreJobKey(projectId), JSON.stringify(job));
  } catch {
    // storage unavailable: polling just does not resume after a reload
  }
};

export const loadRestoreJob = projectId => {
  try {
    const value = sessionStorage.getItem(restoreJobKey(projectId));
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const clearRestoreJob = projectId => {
  try {
    sessionStorage.removeItem(restoreJobKey(projectId));
  } catch {
    // nothing to clear
  }
};
